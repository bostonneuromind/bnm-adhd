// ============================================================================
// adhd-session.js — ADHD Catcher 세션 매니저
// trackcatcher js/tc-session.js 대응, 단 진짜 Supabase Auth + adhd_signup RPC 기반.
// 로그인+검증된 유저 → adhd_signup RPC(멱등) 1회 → window.ADHD_SESSION 채움/영속.
//   organization_id / user_id / self_client_id / role
// 의존: window.AdhdAuth(adhd-auth.js) + window.ADHD_DB(adhd-db.js, .sb()) + ADHD_CONFIG.
// 노출: window.AdhdSession = { ensure, current, clear, logout, cid }
//
// RLS(adhd_current_org, SECURITY DEFINER) + adhd_signup(SECURITY DEFINER, 멱등)
// 가 콘솔에 적용된 상태 전제(③ 콘솔 완료).
// ============================================================================
(function () {
  'use strict';

  const CFG = window.ADHD_CONFIG || {};
  const STORAGE_KEY = 'adhd_session';

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return (s && s.organization_id) ? s : null;
    } catch (e) { return null; }
  }
  function save(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
    window.ADHD_SESSION = s;
  }
  function clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    window.ADHD_SESSION = {
      organization_id: null, user_id: null, auth_user_id: null, role: null, self_client_id: null
    };
  }

  // 로그인+검증 완료 후: adhd_signup RPC(멱등)로 org/user/self_client 보장 + 세션 채움.
  // 미로그인/미검증이면 null 반환(게이트가 로그인 퍼널 띄움).
  async function ensure(profile) {
    if (!window.AdhdAuth || !window.AdhdAuth.configured()) return null;
    const user = await window.AdhdAuth.getUser();
    if (!user || !window.AdhdAuth.isVerified(user)) { clear(); return null; }

    // 이미 같은 auth_user로 채워진 세션이면 재호출 생략(멱등이지만 네트워크 절약).
    const cached = load();
    if (cached && cached.auth_user_id === user.id && cached.organization_id) {
      window.ADHD_SESSION = cached;
      return cached;
    }

    if (!window.ADHD_DB || !window.ADHD_DB.sb) return null;
    const sb = window.ADHD_DB.sb();
    const { data, error } = await sb.rpc('adhd_signup', {
      p_full_name:   (profile && profile.full_name) || user.user_metadata?.display_name || null,
      p_lang:        (profile && profile.lang) || CFG.defaultLang || 'en',
      p_deploy_mode: (profile && profile.deploy_mode) || (user.user_metadata && user.user_metadata.deploy_mode) || CFG.deployMode || 'consumer',   // [signup-link] 가입 시 선택한 계정유형(user_metadata) 반영
      p_source_site: CFG.siteKey || null   // [source-site] 가입 사이트 라벨 (RPC p_source_site, DEFAULT NULL 호환)
    });
    if (error || !data) {
      console.warn('[ADHD] adhd_signup RPC failed:', error && error.message);
      return null;
    }
    const session = {
      organization_id: data.organization_id,
      user_id:         data.user_id,
      auth_user_id:    user.id,
      role:            data.role,
      self_client_id:  data.self_client_id || null,
      email:           user.email || null,
      logged_in_at:    new Date().toISOString()
    };
    save(session);

    // DOB 백필 — 가입 시 user_metadata로 운반된 생년월일을 self_client(adhd_clients)에 1회 기록.
    // self_client_id가 client_code일 수 있어 실제 adhd_clients.id(uuid)로 해석 후 update(자동 성인/미성년 판별).
    // RPC는 p_dob를 안 받으므로 여기서 채움. 실패해도 흐름 무영향.
    try {
      const dob = user.user_metadata && user.user_metadata.date_of_birth;
      const FLAG = 'adhd_dob_synced';
      if (dob && session.self_client_id && window.ADHD_DB && window.ADHD_DB.updateClient
          && sessionStorage.getItem(FLAG) !== session.self_client_id) {
        let row = null;
        try { row = await window.ADHD_DB.getClient(session.self_client_id); } catch (e) {}
        if (!row && window.ADHD_DB.getClientByCode) {
          try { row = await window.ADHD_DB.getClientByCode(session.self_client_id); } catch (e) {}
        }
        const realId = (row && row.id) || session.self_client_id;
        await window.ADHD_DB.updateClient(realId, { date_of_birth: dob });
        sessionStorage.setItem(FLAG, session.self_client_id);
      }
    } catch (e) { console.warn('[ADHD] DOB backfill skip:', e && e.message); }

    return session;
  }

  function current() { return window.ADHD_SESSION || load(); }
  // consumer cid = 본인 client(self_client_id). professional은 임상가가 client 선택.
  function cid() { const s = current(); return (s && s.self_client_id) || null; }

  async function logout(redirectUrl) {
    if (window.AdhdAuth) await window.AdhdAuth.signOut();
    clear();
    if (redirectUrl) window.location.href = redirectUrl;
  }

  window.AdhdSession = { ensure, current, clear, logout, cid };

  const existing = load();
  if (existing) window.ADHD_SESSION = existing;
})();
