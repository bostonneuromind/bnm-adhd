/**
 * ADHD Gold Template — DB Layer (DAL) v1.0
 * Boston Neuromind LLC · 2026-06-02
 * ============================================================================
 * trackcatcher js/tc-db.js 미러 (재발명 ❌). 차이:
 *   - CONFIG  = window.ADHD_CONFIG   (TC_CONFIG 대응; key는 anonKey)
 *   - SESSION = window.ADHD_SESSION  (TC_SESSION 대응; organization_id 스코핑)
 *   - 테이블: zatj patients → adhd_clients, adhd_sessions → adhd_assessments
 *   - 점수: 0~1 정규화 스케일 유지 (현 코드 호환 — *120 변환 ❌)
 *   - localStorage 폴백: 훈련 데이터(goals/habits/habit_completions/sessions/baseline)는
 *     Supabase write-through + bnm_adhd_* 캐시 미러 → 오프라인/무신호 시 ClientDataLoader가
 *     계속 읽음(완전 제거 ❌, 강등 유지). 캐시 키는 client_code(cid) 기준.
 *
 * 로그인(③단계 adhd-auth) 전에는 RLS(adhd_current_org)가 anon read를 0행으로 막음 →
 * Supabase 경로는 빈 결과, 로컬 캐시 폴백으로 동작. 정상(설계대로). DAL은 ③ 준비 완료.
 *
 * 의존: window.supabase (supabase-js@2 CDN 글로벌 빌드) — adhd-config.js 다음 로드.
 * ============================================================================
 */
(function(){
  'use strict';
  const CONFIG = window.ADHD_CONFIG || {};
  let client = null;

  function getClient() {
    if (client) return client;
    const key = CONFIG.anonKey || CONFIG.key;
    if (!CONFIG.url || !key) throw new Error('[ADHD_DB] ADHD_CONFIG.url and anonKey must be set');
    if (!window.supabase) throw new Error('[ADHD_DB] Supabase JS SDK not loaded (supabase-js@2 CDN)');
    client = window.supabase.createClient(CONFIG.url, key);
    return client;
  }

  // organization_id — 로그인 세션에서. 없으면 (③단계 전) 명시 에러.
  function orgId() {
    const o = window.ADHD_SESSION && window.ADHD_SESSION.organization_id;
    if (!o) throw new Error('[ADHD_DB] No organization selected. Login required (③단계 adhd-auth).');
    return o;
  }
  function orgIdOrNull() {
    return (window.ADHD_SESSION && window.ADHD_SESSION.organization_id) || null;
  }
  function currentUserId() {
    return (window.ADHD_SESSION && window.ADHD_SESSION.user_id) || null;
  }

  // ── localStorage 폴백 캐시 (ClientDataLoader와 동일 키: bnm_<prefix>_<type>_<cid>) ──
  const PREFIX = String(CONFIG.tablePrefix || 'adhd_').replace(/_$/, '');  // 'adhd'
  function _ck(type, cid)      { return `bnm_${PREFIX}_${type}_${cid}`; }
  function _baseCk(cid, aid)   { return `bnm_${PREFIX}_baseline_${cid}_${aid}`; }
  function cacheGet(type, cid, def) {
    try { const r = localStorage.getItem(_ck(type, cid)); return r ? JSON.parse(r) : def; }
    catch (e) { return def; }
  }
  function cacheSet(type, cid, val) {
    try { localStorage.setItem(_ck(type, cid), JSON.stringify(val)); } catch (e) {}
  }

  // ============ ORGANIZATIONS (signup/③단계용) ============
  async function getOrganizationBySlug(slug) {
    const c = getClient();
    const { data, error } = await c.from('adhd_organizations').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function createOrganization(data) {
    const c = getClient();
    const { data: row, error } = await c.from('adhd_organizations').insert({
      name:          data.name,
      slug:          data.slug || String(data.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      org_kind:      data.org_kind || CONFIG.deployMode || 'consumer',
      email_domain:  data.email_domain || null,
      primary_color: data.primary_color || CONFIG.hue || '#6366F1',
      plan_tier:     data.plan_tier || 'trial',
      max_clinicians:data.max_clinicians ?? 1,
      max_clients:   data.max_clients ?? 1,
      billing_email: data.billing_email || null,
      contact_name:  data.contact_name || null
    }).select().single();
    if (error) throw error;
    return row;
  }

  // ============ USERS ============
  async function getUserByEmail(email, organizationId) {
    const c = getClient();
    const q = organizationId || orgId();
    const { data, error } = await c.from('adhd_users').select('*')
      .eq('organization_id', q).eq('email', email).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function createUser(data) {
    const c = getClient();
    const { data: row, error } = await c.from('adhd_users').insert({
      organization_id: data.organization_id || orgId(),
      auth_user_id:    data.auth_user_id || null,
      email:           data.email,
      full_name:       data.full_name || null,
      role:            data.role || 'clinician',
      credentials:     data.credentials || null,
      preferred_lang:  data.preferred_lang || CONFIG.defaultLang || 'en',
      status:          'active'
    }).select().single();
    if (error) throw error;
    return row;
  }

  // ============ CLIENTS (zatj patients 대체) ============
  async function listClients(limit = 200) {
    const c = getClient();
    const { data, error } = await c.from('adhd_clients').select('*')
      .eq('organization_id', orgId())
      .order('updated_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  }
  // [STEP3 환자게시판] 권한 필터 + 페이지네이션 환자 목록. (기존 listClients는 무변경)
  // role: clinician → primary_clinician_id=userId(자기 환자만, 앱레벨 격리) / consumer → id=clientId(본인) / admin·allOrg → org 전체.
  // 반환 { rows, total, page, per }. select=이름/생년월일/성별/상태/코드.
  async function listClientsPaged(q) {
    q = q || {};
    const c = getClient();
    const per = 10;
    const page = Math.max(0, parseInt(q.page, 10) || 0);
    const cols = 'id,full_name,date_of_birth,created_at,updated_at,registered_by,self_user_id,is_self,self_login_enabled,source_site';
    let sel = c.from('adhd_clients').select(cols, { count: 'exact' });
    let org = null;
    if (!q.allOrg) {                                   // 슈퍼(전체조회) 외 org 격리
      org = orgIdOrNull(); if (!org) return { rows: [], total: 0, page, per };
      sel = sel.eq('organization_id', org);
    }
    if (q.role === 'clinician' && q.userId) sel = sel.eq('registered_by', q.userId);   // 임상가=자기 환자만(앱레벨)
    else if (q.role === 'consumer' && q.clientId) sel = sel.eq('id', q.clientId);             // 일반=본인
    if (q.dept) {   // [STEP3-B 세션단위] dept 미저장(환자는 LD/LE 둘 다 가능) → 그 dept로 QEEG 분석한 환자만 거름(adhd_qeeg_results.dept 기준). 없으면 전체.
      let qq = c.from('adhd_qeeg_results').select('client_id').eq('dept', q.dept);
      if (org) qq = qq.eq('organization_id', org);
      const { data: qr } = await qq;
      const ids = Array.from(new Set((qr || []).map(function (r) { return r.client_id; }).filter(Boolean)));
      if (!ids.length) return { rows: [], total: 0, page, per };
      sel = sel.in('id', ids);
    }
    sel = sel.order('updated_at', { ascending: false }).range(page * per, page * per + per - 1);
    const { data, error, count } = await sel;
    if (error) { console.warn('[ADHD_DB] listClientsPaged:', error.message); return { rows: [], total: 0, page, per }; }
    return { rows: data || [], total: count || 0, page, per };
  }
  async function getClient_(id) {
    const c = getClient();
    const { data, error } = await c.from('adhd_clients').select('*')
      .eq('organization_id', orgId()).eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function getClientByCode(code) { return null; /* [listcols] client_code 스키마 없음 폐기 — 호출부(adhd-gate/session) catch 폴백 무해 */
    const c = getClient();
    const { data, error } = await c.from('adhd_clients').select('*')
      .eq('organization_id', orgId()).ilike('client_code', code).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function createClient(data) {
    const c = getClient();
    const { data: row, error } = await c.from('adhd_clients').insert({
      organization_id:      orgId(),
      client_code:          data.client_code || null,
      first_name:           data.first_name,
      last_name:            data.last_name || null,
      date_of_birth:        data.date_of_birth || null,
      gender:               data.gender || null,
      email:                data.email || null,
      preferred_lang:       data.preferred_lang || CONFIG.defaultLang || 'en',
      is_self:              data.is_self || false,
      self_user_id:         data.self_user_id || null,
      primary_clinician_id: data.primary_clinician_id || currentUserId(),
      federation_key:       data.federation_key || null,   // 연합: 옵트인, 기본 NULL
      status:               'active'
    }).select().single();
    if (error) throw error;
    return row;
  }
  async function updateClient(id, patch) {
    const c = getClient();
    const { data, error } = await c.from('adhd_clients')
      .update(patch).eq('id', id).eq('organization_id', orgId()).select().single();
    if (error) throw error;
    return data;
  }

  // ============ CONSENT (adhd_consent — 동의 게이트, learning 패리티) ============
  async function saveConsent(data) {
    const c = getClient();
    const { data: row, error } = await c.from('adhd_consent').insert({
      organization_id: orgId(),
      client_id:       data.client_id,
      consent_type:    data.consent_type,
      signer_name:     data.signer_name,
      parent_email:    data.parent_email || null,
      signature:       data.signature,
      sign_method:     data.sign_method || 'canvas',
      consent_version: data.consent_version,
      data_types:      data.data_types || null,
      scope:           data.scope || 'all_platforms',
      expires_at:      data.expires_at || null
    }).select().single();
    if (error) throw error;
    return row;
  }
  async function getConsent(client_id) {
    const c = getClient();
    const { data, error } = await c.from('adhd_consent').select('id,expires_at,signed_at')
      .eq('organization_id', orgId()).eq('client_id', client_id)
      .order('signed_at', { ascending: false }).limit(1);
    if (error) throw error;
    if (!data || !data.length) return null;
    const rec = data[0];
    if (rec.expires_at && new Date(rec.expires_at) < new Date()) return null;
    return rec;
  }

  // ============ ASSESSMENTS (zatj adhd_sessions 대체, 0~1 스케일) ============
  async function createAssessment(data) {
    const c = getClient();
    const { data: row, error } = await c.from('adhd_assessments').insert({
      organization_id:     orgId(),
      client_id:           data.client_id,
      symptom:             data.symptom || CONFIG.symptom || 'ADHD',
      assessment_id:       data.assessment_id || 'ASRS_v1_1',
      session_date:        data.session_date || new Date().toISOString().slice(0, 10),
      total_score:         data.total_score ?? null,          // 0~1
      inattention_score:   data.inattention_score ?? null,    // 0~1
      hyperactivity_score: data.hyperactivity_score ?? null,  // 0~1
      subtype:             data.subtype || null,
      criteria_met_count:  data.criteria_met_count ?? null,   // x/18
      raw:                 data.raw || null
    }).select().single();
    if (error) throw error;
    return row;
  }
  async function getLatestAssessment(clientId) {
    const c = getClient();
    const { data, error } = await c.from('adhd_assessments').select('*')
      .eq('organization_id', orgId()).eq('client_id', clientId)
      .order('session_date', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function listAssessments(clientId) {
    const c = getClient();
    const { data, error } = await c.from('adhd_assessments').select('*')
      .eq('organization_id', orgId()).eq('client_id', clientId)
      .order('session_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // ============ QEEG RESULTS (STEP2: AI/계산 분석 영속 — dept 컬럼 5사이트 공존, HIPAA-ready RLS) ============
  // 미로그인(org null) 또는 필수 누락 시 no-op(null) — qeeg는 로그아웃 상태서도 동작(세션캐시만).
  async function saveQeegResult(data) {
    const org = orgIdOrNull(); if (!org || !data || !data.dept) return null;
    const c = getClient();
    const { data: row, error } = await c.from('adhd_qeeg_results').insert({
      organization_id: org,
      client_id:       data.client_id || null,
      created_by:      currentUserId(),
      dept:            data.dept,
      framework:       data.framework || null,
      domain:          data.domain || null,
      qeeg_hash:       data.qeeg_hash || '',
      age:             data.age ?? null,
      sex:             data.sex || null,
      calc_nf:         data.calc_nf || null,
      ai_deep:         data.ai_deep || null,
      ai_nf:           data.ai_nf || null,
      ai_lang:         data.ai_lang || null,
      qeeg_data:       data.qeeg_data || null,
      source_meta:     data.source_meta || null
    }).select().single();
    if (error) { console.warn('[ADHD_DB] saveQeegResult:', error.message); return null; }
    return row;
  }
  // 복원 조회 = STEP1 cacheKey 정합 (dept+framework+domain+qeeg_hash[+client_id]) 최신 1행.
  async function getQeegResult(q) {
    const org = orgIdOrNull(); if (!org || !q || !q.dept) return null;
    const c = getClient();
    let sel = c.from('adhd_qeeg_results').select('*')
      .eq('organization_id', org).eq('dept', q.dept).eq('qeeg_hash', q.qeeg_hash || '');
    if (q.framework != null) sel = sel.eq('framework', q.framework);
    if (q.domain != null) sel = sel.eq('domain', q.domain);
    if (q.client_id) sel = sel.eq('client_id', q.client_id);
    const { data, error } = await sel.order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) { console.warn('[ADHD_DB] getQeegResult:', error.message); return null; }
    return data;
  }
  // [STEP3 게시판] 목록 조회 — dept 필터 + 페이지네이션(10/page, created_at desc).
  // 권한: role='consumer' → 본인(clientId=self_client_id)만 / clinician·admin → org 격리(RLS 그대로) / allOrg=true → 전체(슈퍼관리자, org 무관).
  // 반환 { rows, total, page, per } — total로 하단 페이지번호 계산.
  async function listQeegResults(q) {
    q = q || {};
    const c = getClient();
    const per = 10;
    const page = Math.max(0, parseInt(q.page, 10) || 0);
    const cols = 'id,created_at,client_id,dept,framework,domain,age,sex,calc_nf,ai_deep,ai_nf,ai_lang,qeeg_data,source_meta';
    let sel = c.from('adhd_qeeg_results').select(cols, { count: 'exact' });
    if (!q.allOrg) {                                   // 슈퍼(전체조회) 외에는 org 격리
      const org = orgIdOrNull(); if (!org) return { rows: [], total: 0, page, per };
      sel = sel.eq('organization_id', org);
    }
    if (q.dept) sel = sel.eq('dept', q.dept);          // dept 분리(복사 자동)
    if (q.clientId) sel = sel.eq('client_id', q.clientId);   // [STEP3-2] clientId 주면 그 환자만 — 임상가 환자클릭 + consumer 본인(self_client_id) 둘 다
    sel = sel.order('created_at', { ascending: false }).range(page * per, page * per + per - 1);
    const { data, error, count } = await sel;
    if (error) { console.warn('[ADHD_DB] listQeegResults:', error.message); return { rows: [], total: 0, page, per }; }
    return { rows: data || [], total: count || 0, page, per };
  }

  // ============ BASELINES (v2 assessment_baselines) ============
  async function getActiveBaseline(clientId, assessmentId) {
    const c = getClient();
    const { data, error } = await c.from('adhd_baselines').select('*')
      .eq('organization_id', orgId()).eq('client_id', clientId)
      .eq('assessment_id', assessmentId).eq('is_active', true)
      .order('measured_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function createBaseline(data, cacheCid) {
    const c = getClient();
    let row = null, err = null;
    try {
      const res = await c.from('adhd_baselines').insert({
        organization_id: orgId(),
        client_id:       data.client_id,
        assessment_id:   data.assessment_id,
        symptom:         data.symptom || CONFIG.symptom || 'ADHD',
        baseline_score:  data.baseline_score,
        current_score:   data.current_score ?? null,
        is_active:       data.is_active !== false
      }).select().single();
      if (res.error) err = res.error; else row = res.data;
    } catch (e) { err = e; }
    // 폴백 캐시 미러 (cid+assessment_id 키)
    if (cacheCid && data.assessment_id) {
      try { localStorage.setItem(_baseCk(cacheCid, data.assessment_id), JSON.stringify(row || data)); } catch (e) {}
    }
    if (err && !row) return row || data;  // 오프라인: 로컬만
    return row;
  }

  // ============ GOALS (goal-setting.html 객체 흡수) ============
  async function listGoals(clientId, cacheCid) {
    try {
      const c = getClient();
      const { data, error } = await c.from('adhd_goals').select('*')
        .eq('organization_id', orgId()).eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) return data;
    } catch (e) {}
    return cacheCid ? cacheGet('goals', cacheCid, []) : [];
  }
  async function createGoal(data, cacheCid) {
    const c = getClient();
    const payload = {
      organization_id:    orgId(),
      client_id:          data.client_id,
      assessment_id:      data.assessment_id,
      symptom:            data.symptom || CONFIG.symptom || 'ADHD',
      baseline_score:     data.baseline_score ?? null,
      target_score:       data.target_score,
      goal_mode:          data.goal_mode || 'clinician_set',
      target_weeks:       data.target_weeks ?? 8,
      target_date:        data.target_date || null,
      baseline_date:      data.baseline_date || null,
      daily_minutes_goal: data.daily_minutes_goal ?? 15,
      notes_clinician:    data.notes_clinician || null,
      notes_client:       data.notes_client || null,
      status:             data.status || 'active'
    };
    let row = null;
    try {
      const res = await c.from('adhd_goals').insert(payload).select().single();
      if (!res.error) row = res.data;
    } catch (e) {}
    if (cacheCid) { const arr = cacheGet('goals', cacheCid, []); arr.unshift(row || payload); cacheSet('goals', cacheCid, arr); }
    return row || payload;
  }
  async function updateGoal(id, patch) {
    const c = getClient();
    const { data, error } = await c.from('adhd_goals')
      .update(patch).eq('id', id).eq('organization_id', orgId()).select().single();
    if (error) throw error;
    return data;
  }

  // ============ HABITS + COMPLETIONS (habit-tracker.html) ============
  async function listHabits(clientId, cacheCid) {
    try {
      const c = getClient();
      const { data, error } = await c.from('adhd_habits').select('*')
        .eq('organization_id', orgId()).eq('client_id', clientId)
        .eq('status', 'active').order('sort_order', { ascending: true });
      if (error) throw error;
      if (data) return data;
    } catch (e) {}
    return cacheCid ? cacheGet('habits', cacheCid, []) : [];
  }
  async function createHabit(data, cacheCid) {
    const c = getClient();
    const payload = {
      organization_id: orgId(),
      client_id:       data.client_id,
      habit_name:      data.habit_name,
      emoji:           data.emoji || null,
      target_freq:     data.target_freq || 'daily',
      sort_order:      data.sort_order ?? 0,
      status:          'active'
    };
    let row = null;
    try {
      const res = await c.from('adhd_habits').insert(payload).select().single();
      if (!res.error) row = res.data;
    } catch (e) {}
    if (cacheCid) { const arr = cacheGet('habits', cacheCid, []); arr.push(row || payload); cacheSet('habits', cacheCid, arr); }
    return row || payload;
  }
  async function updateHabit(id, patch) {
    const c = getClient();
    const { data, error } = await c.from('adhd_habits')
      .update(patch).eq('id', id).eq('organization_id', orgId()).select().single();
    if (error) throw error;
    return data;
  }
  async function listHabitCompletions(clientId, cacheCid) {
    try {
      const c = getClient();
      const { data, error } = await c.from('adhd_habit_completions').select('*')
        .eq('organization_id', orgId()).eq('client_id', clientId);
      if (error) throw error;
      if (data) return data;
    } catch (e) {}
    // 캐시는 {habitId: [date,...]} 맵 구조 (ClientDataLoader 호환)
    return cacheCid ? cacheGet('habit_completions', cacheCid, {}) : {};
  }
  async function addHabitCompletion(habitId, clientId, completedOn, cacheCid) {
    const c = getClient();
    const day = completedOn || new Date().toISOString().slice(0, 10);
    let row = null;
    try {
      const res = await c.from('adhd_habit_completions').insert({
        organization_id: orgId(), habit_id: habitId, client_id: clientId, completed_on: day
      }).select().single();
      if (!res.error) row = res.data;
    } catch (e) {}
    if (cacheCid) {
      const map = cacheGet('habit_completions', cacheCid, {});
      if (!Array.isArray(map[habitId])) map[habitId] = [];
      if (map[habitId].indexOf(day) < 0) map[habitId].push(day);
      cacheSet('habit_completions', cacheCid, map);
    }
    return row || { habit_id: habitId, client_id: clientId, completed_on: day };
  }

  // ============ TRAINING SESSIONS (4게임 — localStorage bnm_adhd_sessions_<cid>) ============
  async function listTrainingSessions(clientId, cacheCid) {
    try {
      const c = getClient();
      const { data, error } = await c.from('adhd_training_sessions').select('*')
        .eq('organization_id', orgId()).eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) return data;
    } catch (e) {}
    return cacheCid ? cacheGet('sessions', cacheCid, []) : [];
  }
  async function createTrainingSession(data, cacheCid) {
    const c = getClient();
    const payload = {
      organization_id:    orgId(),
      client_id:          data.client_id,
      goal_id:            data.goal_id || null,
      symptom:            data.symptom || CONFIG.symptom || 'ADHD',
      tool:               data.tool,                     // attention_game|cloze|scenario_scrambling|story_cartoon
      game_id:            data.game_id || null,
      difficulty:         data.difficulty || null,
      score:              data.score ?? null,            // 0~10 공통
      accuracy:           data.accuracy ?? null,
      avg_rt_ms:          data.avg_rt_ms ?? null,
      total_score:        data.total_score ?? null,
      avg_score:          data.avg_score ?? null,
      rank:               data.rank || null,
      tries:              data.tries ?? null,
      hints_used:         data.hints_used ?? null,
      rounds:             data.rounds ?? null,
      correct:            data.correct ?? null,
      wrong:              data.wrong ?? null,
      elapsed_sec:        data.elapsed_sec ?? null,
      user_order:         data.user_order || null,
      estimated_deltas:   data.estimated_deltas || null, // {"ASRS_v1_1": -0.4, ...}
      assessment_targets: data.assessment_targets || null,
      detail:             data.detail || null,
      source_assessment_id: data.source_assessment_id || null,  // 진단→훈련 연결 (connect 01)
      created_at:         data.created_at || undefined   // 클라 타임스탬프 보존 (없으면 DB default)
    };
    let row = null;
    try {
      const res = await c.from('adhd_training_sessions').insert(payload).select().single();
      if (!res.error) row = res.data;
    } catch (e) {}
    if (cacheCid) { const arr = cacheGet('sessions', cacheCid, []); arr.push(row || payload); cacheSet('sessions', cacheCid, arr); }
    return row || payload;
  }
  async function updateTrainingSession(id, patch) {
    const c = getClient();
    const { data, error } = await c.from('adhd_training_sessions')
      .update(patch).eq('id', id).eq('organization_id', orgId()).select().single();
    if (error) throw error;
    return data;
  }

  // ============ ADMIN SETTINGS (org별) ============
  async function getAdminSettings() {
    const c = getClient();
    const { data, error } = await c.from('adhd_admin_settings').select('*')
      .eq('organization_id', orgId()).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function upsertAdminSettings(patch) {
    const c = getClient();
    const { data, error } = await c.from('adhd_admin_settings')
      .upsert({ organization_id: orgId(), ...patch }, { onConflict: 'organization_id' })
      .select().single();
    if (error) throw error;
    return data;
  }

  // ============ WRITE-THROUGH 헬퍼 (게임/목표/습관 페이지용) ============
  // 패턴: 페이지가 기존 localStorage(bnm_adhd_*) 저장을 그대로 유지(회귀 0, 오프라인 폴백),
  // 그 직후 이 헬퍼를 1회 호출 → 로그인(org) 상태면 DB에도 기록, 미로그인이면 조용히 skip.
  // cacheCid를 안 넘기므로(null) DAL 캐시 미러는 끔 — localStorage 포맷은 페이지 소유 그대로.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function wtClientId(cid) {
    if (cid && UUID_RE.test(String(cid).trim())) return String(cid).trim();
    return (window.ADHD_SESSION && window.ADHD_SESSION.self_client_id) || null;  // BNM-001 등 비UUID 입력 방어
  }
  async function wtTrainingSession(cid, session, toolFallback) {
    try {
      if (!orgIdOrNull()) return null;
      const client_id = wtClientId(cid);
      if (!client_id) return null;
      return await createTrainingSession(Object.assign({}, session, {
        client_id: client_id,
        tool: session.tool || toolFallback || null,
        // 진단 도장: attachToTool이 캐시한 최신 진단 id (진단 전 훈련은 null — 정상)
        // 전용 글로벌 우선 — ADHD_SESSION은 게이트 ensure()가 객체째 교체할 수 있음
        source_assessment_id: session.source_assessment_id ||
          window.ADHD_LATEST_ASSESSMENT_ID ||
          (window.ADHD_SESSION && window.ADHD_SESSION.latest_assessment_id) || null
      }), null);
    } catch (e) { console.warn('[ADHD_DB] wtTrainingSession skip:', e && e.message); return null; }
  }
  async function wtTrainingSessionUpdate(id, patch) {
    try {
      if (!orgIdOrNull() || !id) return null;
      return await updateTrainingSession(id, patch);
    } catch (e) { console.warn('[ADHD_DB] wtTrainingSessionUpdate skip:', e && e.message); return null; }
  }
  async function wtGoal(cid, goal) {
    try {
      if (!orgIdOrNull()) return null;
      const client_id = wtClientId(cid);
      if (!client_id) return null;
      return await createGoal(Object.assign({}, goal, { client_id: client_id }), null);
    } catch (e) { console.warn('[ADHD_DB] wtGoal skip:', e && e.message); return null; }
  }
  async function wtBaseline(cid, baseline) {
    try {
      if (!orgIdOrNull()) return null;
      const client_id = wtClientId(cid);
      if (!client_id) return null;
      return await createBaseline(Object.assign({}, baseline, { client_id: client_id }), null);
    } catch (e) { console.warn('[ADHD_DB] wtBaseline skip:', e && e.message); return null; }
  }

  // ── Export ───────────────────────────────────────────────────────────────
  window.ADHD_DB = {
    // sb() = raw Supabase client (rpc/auth 용). getClient(id)는 아래 clients 레코드 조회.
    sb: getClient, orgId, orgIdOrNull, currentUserId,
    // organizations / users (③단계 signup)
    getOrganizationBySlug, createOrganization, getUserByEmail, createUser,
    // clients
    listClients, listClientsPaged, getClient: getClient_, getClientByCode, createClient, updateClient,
    // consent (동의 게이트)
    saveConsent, getConsent,
    // assessments
    createAssessment, getLatestAssessment, listAssessments,
    // qeeg results (STEP2)
    saveQeegResult, getQeegResult, listQeegResults,
    // baselines
    getActiveBaseline, createBaseline,
    // goals
    listGoals, createGoal, updateGoal,
    // habits
    listHabits, createHabit, updateHabit, listHabitCompletions, addHabitCompletion,
    // training sessions
    listTrainingSessions, createTrainingSession, updateTrainingSession,
    // write-through 헬퍼 (게임/목표/습관 — 미로그인 시 no-op)
    wtTrainingSession, wtTrainingSessionUpdate, wtGoal, wtBaseline,
    // admin settings
    getAdminSettings, upsertAdminSettings
  };
})();
