// ============================================================================
// adhd-auth.js — ADHD Catcher 인증 (Supabase Auth, 클라이언트)
// track/tc-auth.js 미러 (재발명 ❌). 차이: 공유 sepier 프로젝트 ❌ →
//   window.ADHD_CONFIG(=adhdcatcher 전용 프로젝트)의 url/anonKey 사용.
//   auth + data + RLS가 한 프로젝트 → 봇별 독립 auth 풀.
// 의존: @supabase/supabase-js@2 (window.supabase) + adhd-config.js 먼저 로드.
// 노출: window.AdhdAuth
//
// ⚠️ 대시보드 설정(Confirm email ON/OFF, Redirect allowlist, SMTP)은 코드 밖 —
//   adhdcatcher 콘솔에서 확인(③ 콘솔: 가입 ON / Email ON / Confirm email ON 완료).
// ============================================================================
(function () {
  'use strict';

  const CFG = window.ADHD_CONFIG || {};
  const URL = CFG.url || '';
  const KEY = CFG.anonKey || CFG.key || '';

  let _client = null;

  function configured() {
    return !!(URL && KEY && window.supabase && window.supabase.createClient);
  }
  function client() {
    if (!configured()) return null;
    if (!_client) _client = window.supabase.createClient(URL, KEY);
    return _client;
  }
  function redirectTo() {
    // attention: /adhd-training/ 허브 없음 → 홈('/')으로 복귀. 홈이 adhd-gate 미리로드해 recovery/consent_token 처리.
    try { return (window.location.origin || '') + '/'; } catch (e) { return '/'; }
  }
  const NOT_CONFIGURED = { error: { message: 'NOT_CONFIGURED' } };

  async function signUp({ name, email, password, lang, deployMode, dob }) {
    const c = client(); if (!c) return NOT_CONFIGURED;
    return await c.auth.signUp({
      email: email, password: password,
      options: {
        data: {
          display_name: name || '',
          language: lang || (CFG.defaultLang || 'en'),
          // adhd_signup RPC 인정값 = 'professional'(→org_kind professional·role owner) / 'consumer'(→role consumer). 그 외 전부 consumer.
          deploy_mode: (deployMode === 'professional' ? 'professional' : 'consumer'),
          // DOB는 user_metadata로 운반 → ensure가 self_client 생성 후 adhd_clients.date_of_birth 백필(성인/미성년 자동판별용).
          date_of_birth: (dob || null),
        },
        emailRedirectTo: redirectTo(),
      },
    });
  }
  async function signIn({ email, password }) {
    const c = client(); if (!c) return NOT_CONFIGURED;
    return await c.auth.signInWithPassword({ email: email, password: password });
  }
  async function signOut() { const c = client(); if (c) { try { await c.auth.signOut(); } catch (e) {} } }
  async function resetPassword(email) {
    const c = client(); if (!c) return NOT_CONFIGURED;
    return await c.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() });
  }
  async function updatePassword(password) {
    const c = client(); if (!c) return NOT_CONFIGURED;
    return await c.auth.updateUser({ password: password });
  }
  async function resendVerification(email) {
    const c = client(); if (!c) return NOT_CONFIGURED;
    try { return await c.auth.resend({ type: 'signup', email: email, options: { emailRedirectTo: redirectTo() } }); }
    catch (e) { return { error: { message: String(e && e.message || e) } }; }
  }
  async function getUser() {
    const c = client(); if (!c) return null;
    try { const { data } = await c.auth.getUser(); return data ? data.user : null; } catch (e) { return null; }
  }
  async function getSession() {
    const c = client(); if (!c) return null;
    try { const { data } = await c.auth.getSession(); return data ? data.session : null; } catch (e) { return null; }
  }
  function onChange(cb) {
    const c = client(); if (!c) return;
    try { c.auth.onAuthStateChange((event, session) => cb(event, session)); } catch (e) {}
  }
  function isVerified(user) { return !!(user && (user.email_confirmed_at || user.confirmed_at)); }

  window.AdhdAuth = {
    configured: configured, client: client,
    signUp: signUp, signIn: signIn, signOut: signOut,
    resetPassword: resetPassword, updatePassword: updatePassword, resendVerification: resendVerification,
    getUser: getUser, getSession: getSession, onChange: onChange, isVerified: isVerified,
    project: URL,
  };
})();
