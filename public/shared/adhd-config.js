/**
 * ADHD Gold Template — Config 주입 (LIVE)
 * Boston Neuromind LLC · 2026-06-02
 * ============================================================================
 * 복사 절차 = 이 파일 1개만 교체. 코드(adhd-db.js / patient-data.js)는 무수정.
 *   ADHD repo clone → prefix rename → 새 Supabase 프로젝트 → 이 config 값 교체
 *
 * 봇 전용 Supabase 프로젝트(zatj/sepier 공유 ❌). anon(publishable) 키는 공개키라
 * 클라이언트 노출 정상 — 격리는 RLS(adhd_current_org)가 담당. service_role 커밋 ❌.
 *
 * 로드 순서 (각 HTML <head>):
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="./adhd-config.js"></script>   ← 이 파일 (복사 시 교체)
 *   <script src="./adhd-db.js"></script>        ← DAL (무수정)
 *   <script src="./patient-data.js"></script>   ← 평가 조회 (ADHD_CONFIG 소비)
 * ============================================================================
 */

// ── 봇별 고유 값 (복사 시 교체하는 유일한 곳) ───────────────────────────────
window.ADHD_CONFIG = {
  // 이 봇 전용 Supabase 프로젝트 (learning-adhd — learning 도메인 전용, 원본 rjgk와 데이터 완전 격리)
  url:        'https://sepierapapsansprurpr.supabase.co',
  anonKey:    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcGllcmFwYXBzYW5zcHJ1cnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTkxMDksImV4cCI6MjA5NTgzNTEwOX0.U1dPGHz7g1TjwFS56GVdPjzbzH6Ryc87C28YM9GP1z8',

  // 봇 정체성 — 복사 시 증상만 바꿈 (Depression봇은 'Depression' 등)
  symptom:    'ADHD',
  tablePrefix:'adhd_',          // 11봇 복사 시 prefix rename과 일치
  hue:        '#4A90C2',        // Calm Blue (learning 확정톤; Depression봇 등은 각자 hue)

  // 판매 모델: 'consumer'(셀프호스트 단일org) | 'professional'(SaaS 클리닉 테넌트)
  deployMode: 'consumer',

  // 백엔드 API 베이스 — learning은 자체 Next.js api/ 보유 → '' (상대경로). 정적 분과(attention/peak)는 이 값을 learning 도메인으로 둠.
  apiBase:    '',
  edgeBase:   'https://sepierapapsansprurpr.supabase.co/functions/v1',

  // 환자 매직링크 착지 경로(origin 기준) — symptom 환자는 symptomcatcher 진입점으로. 미설정 시 '/'(홈) 폴백.
  portalPath: '/symptomcatcher.html',

  // i18n (4원칙, 기본 en) — bnm-lang-sync.js와 동일 기조
  defaultLang:'en'
};

// ── 세션(로그인 후 채워짐) — trackcatcher TC_SESSION 대응 ────────────────────
// adhd-auth.js(=TCAuth signup/login 이식, ③단계)가 로그인 성공 시 채움.
// RLS는 auth.uid()로 동작하므로 organization_id는 표시/분기용. DAL 쿼리는
// 클라이언트가 .eq('organization_id', ...) 강제할 수도(방어적), RLS가 1차 차단.
window.ADHD_SESSION = window.ADHD_SESSION || {
  organization_id: null,
  user_id:         null,        // adhd_users.id
  auth_user_id:    null,        // auth.users.id
  role:            null,
  self_client_id:  null         // consumer 본인 client (is_self=true)
};
