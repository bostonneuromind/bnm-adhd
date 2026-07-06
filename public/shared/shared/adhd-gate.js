// ============================================================================
// adhd-gate.js — ADHD Catcher 진입 게이트 (로그인 필수)
// track/adhd.html viewAuth 퍼널 이식. 결제 placeholder ❌ (Auth 게이트만).
// 동작(자동, DOMContentLoaded):
//   1) 풀스크린 오버레이로 페이지 가림(미인증 사용 차단)
//   2) AdhdAuth.getUser()+isVerified
//      - 미검증 → 로그인/가입 퍼널 렌더(오버레이 안). 로그인 성공 → reload
//      - 검증   → AdhdSession.ensure()(adhd_signup RPC) → consumer cid=self_client_id를
//                 URL ?cid + #client-id에 강제(URL 변조 무력화) → 오버레이 제거(페이지 진행)
// 의존: AdhdAuth(adhd-auth.js), AdhdSession(adhd-session.js), ADHD_DB, ADHD_CONFIG.
// 노출: window.AdhdGate = { require }
// ※ bnm1# 임상 dashboard(임상가용)는 이 게이트 미적용 — 소비자 9페이지만.
// ============================================================================
(function () {
  'use strict';

  const ACCENT = (window.ADHD_CONFIG && window.ADHD_CONFIG.hue) || '#6366F1';
  const $ = (s, r) => (r || document).querySelector(s);
  const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const isKo = () => (document.body && document.body.dataset && document.body.dataset.lang === 'ko');

  function injectStyle() {
    if (document.getElementById('adhd-gate-style')) return;
    const st = document.createElement('style');
    st.id = 'adhd-gate-style';
    st.textContent = `
      /* 자급자족 ko-text/en-text 스왑 — t() 듀얼span이 호스트 CSS(.ko-text 규칙) 없는 페이지에서도 단일언어 렌더(한+영 섞임 방지) */
      #adhd-gate-overlay .ko-text{display:none}#adhd-gate-overlay .en-text{display:none}
      body[data-lang="ko"] #adhd-gate-overlay .ko-text{display:inline}
      body[data-lang="en"] #adhd-gate-overlay .en-text{display:inline}
      #adhd-gate-overlay{position:fixed;inset:0;z-index:99999;background:#F8FAFC;
        display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit}
      #adhd-gate-overlay .ag-card{background:#fff;border:1px solid #E5E7EB;border-radius:18px;
        max-width:412px;width:100%;padding:30px 28px;box-shadow:0 20px 50px rgba(15,23,42,.12);max-height:90vh;overflow-y:auto}
      #adhd-gate-overlay h2{font-size:1.4em;font-weight:800;color:#111827;margin:0 0 4px}
      #adhd-gate-overlay .ag-sub{color:#6B7280;font-size:1em;margin-bottom:18px}
      #adhd-gate-overlay .ag-tabs{display:flex;gap:6px;margin-bottom:18px;background:#F3F4F6;border-radius:11px;padding:4px}
      #adhd-gate-overlay .ag-tabs button{flex:1;padding:10px;border:none;background:transparent;
        border-radius:8px;font-family:inherit;font-weight:700;color:#6B7280;cursor:pointer;font-size:1em}
      #adhd-gate-overlay .ag-tabs button.on{background:#fff;color:#111827;box-shadow:0 1px 3px rgba(15,23,42,.1)}
      #adhd-gate-overlay .ag-field{margin-bottom:13px}
      #adhd-gate-overlay .ag-field label{display:block;font-size:.92em;font-weight:700;color:#374151;margin-bottom:5px}
      #adhd-gate-overlay .ag-field input{width:100%;box-sizing:border-box;min-height:44px;padding:11px 12px;
        border:1px solid #D1D5DB;border-radius:10px;font-family:inherit;font-size:16px;line-height:1.4;color:#111827;background:#fff}
      #adhd-gate-overlay .ag-field input:focus{outline:none;border-color:${ACCENT};box-shadow:0 0 0 3px rgba(74,144,194,.16)}
      #adhd-gate-overlay .ag-radios{display:flex;gap:8px;margin-bottom:13px}
      #adhd-gate-overlay .ag-radio{flex:1;display:flex;align-items:center;justify-content:center;
        padding:13px 8px;border:1px solid #D1D5DB;border-radius:10px;cursor:pointer;font-size:1em;
        font-weight:700;color:#6B7280;background:#fff;text-align:center;user-select:none}
      #adhd-gate-overlay .ag-radio.on{border-color:${ACCENT};background:#EEF5FB;color:#111827;box-shadow:inset 0 0 0 1px ${ACCENT}}
      #adhd-gate-overlay .ag-radio input{display:none}
      #adhd-gate-overlay .ag-pwwrap{position:relative}
      #adhd-gate-overlay .ag-pwwrap input{padding-right:58px}
      #adhd-gate-overlay .ag-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);
        background:none;border:none;color:#6B7280;font-size:.82em;font-weight:700;cursor:pointer;font-family:inherit;padding:6px 8px}
      #adhd-gate-overlay .ag-rules{list-style:none;margin:2px 0 12px;padding:0;display:flex;flex-wrap:wrap;gap:3px 14px}
      #adhd-gate-overlay .ag-rules li{font-size:.85em;color:#9CA3AF;display:flex;align-items:center;gap:4px}
      #adhd-gate-overlay .ag-rules li::before{content:'○';font-size:.85em}
      #adhd-gate-overlay .ag-rules li.ok{color:#15803D}
      #adhd-gate-overlay .ag-rules li.ok::before{content:'✓'}
      #adhd-gate-overlay .ag-warn{font-size:.85em;color:#DC2626;margin:-6px 0 10px;min-height:1em}
      #adhd-gate-overlay .ag-btn{width:100%;min-height:46px;border:none;border-radius:100px;background:${ACCENT};
        color:#fff;font-family:inherit;font-weight:800;font-size:1em;cursor:pointer;margin-top:4px}
      #adhd-gate-overlay .ag-btn[disabled]{opacity:.55;cursor:default}
      #adhd-gate-overlay .ag-msg{font-size:.92em;color:#6B7280;margin-top:12px;min-height:1.2em;line-height:1.5}
      #adhd-gate-overlay .ag-resetwrap{text-align:center;margin-top:14px;padding-top:12px;border-top:1px solid #F1F3F5}
      #adhd-gate-overlay .ag-link{background:none;border:none;color:${ACCENT};font-family:inherit;
        font-size:.95em;font-weight:700;cursor:pointer;padding:0;text-decoration:underline}
      #adhd-gate-overlay .ag-spin{color:#6B7280;font-size:.95em;text-align:center}
    `;
    document.head.appendChild(st);
  }

  function overlay() {
    let o = document.getElementById('adhd-gate-overlay');
    if (!o) {
      injectStyle();
      o = document.createElement('div');
      o.id = 'adhd-gate-overlay';
      o.innerHTML = '<div class="ag-card"><div class="ag-spin">…</div></div>';
      (document.body || document.documentElement).appendChild(o);
    }
    return o;
  }
  function removeOverlay() { const o = document.getElementById('adhd-gate-overlay'); if (o) o.remove(); }

  const t = (ko, en) => `<span class="ko-text">${ko}</span><span class="en-text">${en}</span>`;
  const errHtml = (m) => '<span style="color:#DC2626">' + m + '</span>';

  const pwRules = (pw) => ({
    len: (pw || '').length >= 8,
    num: /[0-9]/.test(pw || ''),
    sym: /[^A-Za-z0-9]/.test(pw || ''),
  });

  function ageFromDob(dob) {
    if (!dob) return null;
    try {
      const b = new Date(dob), now = new Date();
      let a = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
      return a;
    } catch (e) { return null; }
  }

  // ── 동의문(연구·임상 동의서 14조항) — bostonneuromind/consent.html 원문 이식 ──
  const CONSENT_PLATFORMS_EN = 'bostonneuromind.com, neurocatchers.com, talkcatcher.com, modalitycatcher.com (incl. decision/learning sub-platforms) and future platforms';
  const CONSENT_PLATFORMS_KO = 'bostonneuromind.com, neurocatchers.com, talkcatcher.com, modalitycatcher.com (decision/learning 하위 플랫폼 포함) 및 향후 추가 플랫폼';
  const CONSENT_DATA_TYPES = ['survey', 'qEEG', 'HRV', 'ERP', 'typing_dynamics', 'ai_conversation', 'assessment_differential', 'future'];
  const CONSENT_EN = `
<h3>1. Consenting Institution &amp; Parties</h3><p>This consent is between Boston Neuromind LLC (Canton, Massachusetts) and the participant — or, for a minor, the parent/legal guardian acting on the minor's behalf.</p>
<h3>2. Nature of Service</h3><p>Services are wellness and educational in nature, led by BCN- and PhD-credentialed staff. They are <strong>not medical care</strong> and do not constitute a medical diagnosis or treatment.</p>
<h3>3. Data Collected</h3><p>We may collect: survey responses, qEEG, HRV, ERP, typing dynamics, AI-conversation logs, assessment/differential outputs, and similar data introduced in the future.</p>
<h3>4. Scope of Use</h3><p>Data may be used across Boston Neuromind and all of its current and future platforms — ${CONSENT_PLATFORMS_EN}.</p>
<h3>5. Benefits</h3><p>Personalized insights into cognitive, emotional, and behavioral patterns, and contribution to the improvement of these services.</p>
<h3>6. Risks &amp; Limitations</h3><p>Risks are minimal (e.g., mild fatigue during measurement). Outputs are <strong>not a medical diagnosis</strong> and must not replace professional medical or mental-health care.</p>
<h3>7. Voluntariness</h3><p>Participation is entirely voluntary. You may decline any part without coercion, retaliation, or penalty.</p>
<h3>8. Right to Withdraw</h3><p>You may withdraw at any time, verbally or in writing, without penalty.</p>
<h3>9. Confidentiality &amp; HIPAA</h3><p>Your information is kept confidential and protected under HIPAA-aligned safeguards. It is not disclosed to third parties except as required by law.</p>
<h3>10. AI Conversation Processors</h3><p>AI-conversation features may be processed by third-party providers (e.g., Anthropic). Such providers may retain data per their own policies for a limited period.</p>
<h3>11. Retention &amp; Destruction</h3><p>Data is retained for the consent period and securely destroyed thereafter, or within 30 days of a withdrawal request.</p>
<h3>12. Validity &amp; Renewal</h3><p>This consent is valid for one (1) year from the date of signing and is renewable.</p>
<h3>13. Minor — Parent/Guardian Proxy Consent</h3><p>For a minor, the parent/legal guardian provides legally authorized consent on the minor's behalf.</p>
<h3>14. Contact</h3><p>Questions: bostonneuromind@gmail.com · Boston Neuromind LLC, Canton, Massachusetts.</p>`;
  const CONSENT_KO = `
<h3>1. 동의 기관 및 주체</h3><p>본 동의는 Boston Neuromind LLC(매사추세츠 Canton)와 참여자 — 미성년자의 경우 미성년자를 대리하는 부모/법정 보호자 — 사이에 체결됩니다.</p>
<h3>2. 서비스의 성격</h3><p>본 서비스는 BCN·PhD 자격 인력이 제공하는 웰니스·교육 목적의 서비스로, <strong>의료 행위가 아니며</strong> 의학적 진단이나 치료를 구성하지 않습니다.</p>
<h3>3. 수집 데이터</h3><p>설문 응답, qEEG, HRV, ERP, 타이핑 다이내믹스, AI 대화 기록, 평가·감별 결과 및 향후 도입되는 유사 데이터를 수집할 수 있습니다.</p>
<h3>4. 사용 범위</h3><p>데이터는 Boston Neuromind 및 현재·향후의 모든 플랫폼 — ${CONSENT_PLATFORMS_KO} — 에서 사용될 수 있습니다.</p>
<h3>5. 이익</h3><p>인지·정서·행동 패턴에 대한 개인화된 통찰과 본 서비스 개선에의 기여.</p>
<h3>6. 위험 및 한계</h3><p>위험은 최소 수준(예: 측정 중 경미한 피로)입니다. 결과물은 <strong>의학적 진단이 아니며</strong> 전문 의료·정신건강 서비스를 대체하지 않습니다.</p>
<h3>7. 자발성</h3><p>참여는 전적으로 자발적입니다. 강압·보복·처벌 없이 어떤 부분이든 거부할 수 있습니다.</p>
<h3>8. 철회권</h3><p>언제든지 구두 또는 서면으로 불이익 없이 철회할 수 있습니다.</p>
<h3>9. 비밀유지 및 HIPAA</h3><p>귀하의 정보는 비밀로 유지되며 HIPAA에 준한 보호 조치를 받습니다. 법률상 요구되는 경우를 제외하고 제3자에게 공개되지 않습니다.</p>
<h3>10. AI 대화 처리자</h3><p>AI 대화 기능은 제3자 제공자(예: Anthropic)에 의해 처리될 수 있으며, 해당 제공자는 자체 정책에 따라 일정 기간 데이터를 보관할 수 있습니다.</p>
<h3>11. 보관기간 및 파기</h3><p>데이터는 동의 유효기간 동안 보관되며 이후 안전하게 파기되거나, 철회 요청 시 30일 이내 삭제됩니다.</p>
<h3>12. 유효기간 및 갱신</h3><p>본 동의는 서명일로부터 1년간 유효하며 갱신할 수 있습니다.</p>
<h3>13. 미성년자 — 보호자 법정대리 동의</h3><p>미성년자의 경우 부모/법정 보호자가 미성년자를 대리하여 법적으로 유효한 동의를 제공합니다.</p>
<h3>14. 문의</h3><p>문의: bostonneuromind@gmail.com · Boston Neuromind LLC, 매사추세츠 Canton.</p>`;

  // 동의 게이트 화면 — ensure 후 self_client_id 확보된 시점에 호출(require). 저장=waeh adhd_consent.
  // ── 게이트 공통 언어 토글 — 오버레이가 페이지 토글(z100)을 덮으므로(z99999) 자체 토글 필요.
  //    bnmSetLang으로 body data-lang 변경 + _lastRender()로 현재 화면 재렌더(t() span + isKo() 분기 전부 갱신).
  let _lastRender = null;
  function langToggleHtml() {
    const ko = isKo();
    const base = 'border:1px solid #E5E7EB;border-radius:8px;padding:4px 9px;font-family:inherit;font-weight:700;font-size:.72em;cursor:pointer;line-height:1';
    const on = 'background:' + ACCENT + ';color:#fff;border-color:' + ACCENT;
    const off = 'background:#fff;color:#6B7280';
    return '<div class="ag-langtog" style="display:flex;gap:4px;flex:none">' +
      '<button type="button" data-lang="ko" style="' + base + ';' + (ko ? on : off) + '">KO</button>' +
      '<button type="button" data-lang="en" style="' + base + ';' + (ko ? off : on) + '">EN</button></div>';
  }
  function headerHtml(titleHtml) {
    return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:4px">' +
      '<h2 style="margin:0">' + titleHtml + '</h2>' + langToggleHtml() + '</div>';
  }
  function wireLangToggle(card) {
    card.querySelectorAll('.ag-langtog button').forEach(function (b) {
      b.onclick = function () {
        const lang = b.getAttribute('data-lang');
        if (window.bnmSetLang) { try { window.bnmSetLang(lang); } catch (e) {} }
        else { try { document.body.setAttribute('data-lang', lang); } catch (e) {} }
        if (typeof _lastRender === 'function') _lastRender();
      };
    });
  }

  function viewConsent(ctx) {
    ctx = ctx || {};
    _lastRender = function () { viewConsent(ctx); };
    const card = $('#adhd-gate-overlay .ag-card');
    const age = ageFromDob(ctx.dob);
    let ctype = (age != null && age < 18) ? 'minor' : 'adult'; // 생년월일로 기본값 자동
    let sigmode = 'onsite';                                    // 미성년 서명 방식(현장/이메일), 기본 현장
    const clauses = isKo() ? CONSENT_KO : CONSENT_EN;

    card.innerHTML = `
      ${headerHtml(t('연구·임상 동의서', 'Research & Clinical Consent'))}
      <div class="ag-sub">Boston Neuromind LLC · Canton, MA</div>
      <div class="ag-field"><label>${t('동의 유형', 'Consent type')}</label>
        <div class="ag-radios" id="cType">
          <label class="ag-radio ${ctype === 'adult' ? 'on' : ''}" data-ct="adult"><input type="radio" name="cType" value="adult" ${ctype === 'adult' ? 'checked' : ''}>${t('본인 (성인)', 'Myself (adult)')}</label>
          <label class="ag-radio ${ctype === 'minor' ? 'on' : ''}" data-ct="minor"><input type="radio" name="cType" value="minor" ${ctype === 'minor' ? 'checked' : ''}>${t('미성년 (보호자)', 'Minor (guardian)')}</label>
        </div>
      </div>
      <div class="ag-field" id="cSigModeWrap" style="display:none"><label>${t('서명 방식', 'Signing method')}</label>
        <div class="ag-radios" id="cSigMode">
          <label class="ag-radio on" data-sm="onsite"><input type="radio" name="cSigMode" value="onsite" checked>${t('지금 서명 (현장)', 'Sign now (in person)')}</label>
          <label class="ag-radio" data-sm="email"><input type="radio" name="cSigMode" value="email">${t('이메일로 보내기', 'Send by email')}</label>
        </div>
      </div>
      <div style="max-height:210px;overflow-y:auto;border:1px solid #E5E7EB;border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:.84em;line-height:1.55;color:#374151;background:#FAFBFC">${clauses}</div>
      <div style="border:1px solid #FCD34D;background:#FFFBEB;border-radius:10px;padding:11px 13px;margin-bottom:12px;font-size:.84em;line-height:1.55;color:#92400E">
        <div style="font-weight:600;margin-bottom:4px">${t('ℹ️ 시작하기 전에', 'ℹ️ Before you begin')}</div>
        <div>${t('본 도구는 연구 문헌에 기반한 교육용 스크리닝 도구입니다. 의학적 진단이나 치료가 아니며, 자격을 갖춘 임상 전문가의 평가를 대체하지 않습니다.<br>• 결과는 전문가와 상의해볼 만한 영역을 알려줄 뿐입니다<br>• 낮은 점수가 어떤 상태의 부재를 보장하지 않습니다<br>• 높은 점수가 어떤 상태의 존재를 확정하지 않습니다<br>• 이 도구 사용으로 치료자–환자 관계가 형성되지 않습니다<br>• 사용자가 만 18세 미만인 경우, 본 동의는 부모 또는 법정 보호자가 자녀를 대신해 제공하며 보호자가 위 내용을 읽고 이해했음을 확인합니다', 'This tool is a research-based educational screening tool. It is not a medical diagnosis or treatment, and does not replace evaluation by a qualified clinical professional.<br>• Results may point to areas worth discussing with a professional<br>• A low score does not guarantee the absence of a condition<br>• A high score does not confirm the presence of a condition<br>• Using this tool does not create a therapist–patient relationship<br>• If the user is under 18, this consent is provided by a parent or legal guardian on the child\'s behalf, who confirms they have read and understood the above')}</div>
        <div style="margin-top:6px">${t('⚠️ 위기 상황이면: 988로 전화·문자, 또는 741741에 HOME 문자.', '⚠️ In crisis? Call or text 988, or text HOME to 741741.')}</div>
      </div>
      <label style="display:flex;align-items:flex-start;gap:8px;font-size:.92em;color:#374151;margin-bottom:12px;cursor:pointer">
        <input type="checkbox" id="cAgree" style="margin-top:3px;width:auto;min-height:auto">
        <span>${t('위 내용을 읽었고 동의합니다.', 'I have read and agree to the above.')}</span></label>
      <div id="cOnsite">
        <div class="ag-field" id="cgNameWrap" style="display:none"><label>${t('보호자 성명', 'Guardian name')}</label><input id="cgName" type="text" autocomplete="name"></div>
        <div class="ag-field" id="cgEmailWrap" style="display:none"><label>${t('보호자 이메일', 'Guardian email')}</label><input id="cgOnsiteEmail" type="email" placeholder="you@example.com" autocomplete="email"></div>
        <div class="ag-field"><label>${t('서명', 'Signature')}</label>
          <canvas id="cSig" style="width:100%;height:150px;border:1px solid #D1D5DB;border-radius:10px;background:#fff;touch-action:none;cursor:crosshair;display:block"></canvas>
          <button type="button" class="ag-link" id="cClear" style="margin-top:6px">${t('서명 지우기', 'Clear signature')}</button></div>
        <button class="ag-btn" id="cBtn">${t('동의하고 시작 →', 'Agree and continue →')}</button>
      </div>
      <div id="cEmail" style="display:none">
        <div class="ag-field"><label>${t('보호자 이메일', 'Guardian email')}</label><input id="cgEmail" type="email" placeholder="you@example.com" autocomplete="email"></div>
        <button class="ag-btn" id="cSendEmail">${t('보호자에게 동의 요청 발송 →', 'Send consent request to guardian →')}</button>
      </div>
      <div class="ag-msg" id="agMsg"></div>`;

    wireLangToggle(card);

    // 표시 토글 — 한 번에 한 경로만(현장 canvas vs 이메일 발송).
    function applyMode() {
      const minor = ctype === 'minor';
      const email = minor && sigmode === 'email';
      $('#cSigModeWrap', card).style.display = minor ? 'block' : 'none';
      $('#cgNameWrap', card).style.display = minor ? 'block' : 'none';
      $('#cgEmailWrap', card).style.display = minor ? 'block' : 'none';
      $('#cOnsite', card).style.display = email ? 'none' : 'block';
      $('#cEmail', card).style.display = email ? 'block' : 'none';
    }

    card.querySelectorAll('#cType .ag-radio').forEach(r => {
      r.onclick = () => {
        card.querySelectorAll('#cType .ag-radio').forEach(x => x.classList.remove('on'));
        r.classList.add('on');
        const inp = r.querySelector('input'); if (inp) inp.checked = true;
        ctype = r.getAttribute('data-ct');
        applyMode();
      };
    });
    card.querySelectorAll('#cSigMode .ag-radio').forEach(r => {
      r.onclick = () => {
        card.querySelectorAll('#cSigMode .ag-radio').forEach(x => x.classList.remove('on'));
        r.classList.add('on');
        const inp = r.querySelector('input'); if (inp) inp.checked = true;
        sigmode = r.getAttribute('data-sm');
        applyMode();
      };
    });
    applyMode();

    // 이메일 경로 — consent_send 발송(현장 canvas와 별도). 무음실패 정직화(502→실패 표시).
    const sendBtn = $('#cSendEmail', card);
    if (sendBtn) sendBtn.onclick = async () => {
      const k = isKo(); const msg = $('#agMsg', card);
      const pe = ($('#cgEmail', card).value || '').trim().toLowerCase();
      if (!emailRe.test(pe)) { $('#cgEmail', card).focus(); msg.innerHTML = errHtml(k ? '보호자 이메일을 먼저 입력해주세요.' : 'Enter the guardian email first.'); return; }
      sendBtn.disabled = true;
      try {
        const res = await fetch((((window.ADHD_CONFIG||{}).edgeBase) || '') + '/consent_send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': ((window.ADHD_CONFIG||{}).anonKey) || '',
            'authorization': 'Bearer ' + (((window.ADHD_CONFIG||{}).anonKey) || '')
          },
          body: JSON.stringify({ client_id: ctx.clientId, parent_email: pe, lang: document.body.dataset.lang })
        });
        const data = await res.json().catch(() => ({}));
        sendBtn.disabled = false;
        if (!res.ok || data.ok === false || data.error) {
          msg.innerHTML = errHtml(k ? '메일 발송 실패 — 다시 시도하거나 관리자에게 문의하세요.' : 'Email failed — retry or contact admin.');
          return;
        }
        msg.innerHTML = t('보호자 메일로 발송했어요. 보호자가 서명하면 진입됩니다.', 'Sent to guardian. You can enter after they sign.');
      } catch (e) {
        sendBtn.disabled = false;
        msg.innerHTML = errHtml(k ? '메일 발송 실패 — 다시 시도하거나 관리자에게 문의하세요.' : 'Email failed — retry or contact admin.');
      }
    };

    // canvas 서명 (consent.html 패턴 이식) — 기본 현장모드라 init 시 cOnsite 표시 = 정상 사이즈.
    const canvas = $('#cSig', card), cx = canvas.getContext('2d');
    let drawing = false, hasSig = false;
    (function sizeCanvas() {
      const ratio = window.devicePixelRatio || 1, rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
      cx.scale(ratio, ratio); cx.lineWidth = 2; cx.lineCap = 'round'; cx.strokeStyle = '#1F2225';
    })();
    const cpos = (e) => { const r = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return { x: p.clientX - r.left, y: p.clientY - r.top }; };
    const cstart = (e) => { drawing = true; const p = cpos(e); cx.beginPath(); cx.moveTo(p.x, p.y); e.preventDefault(); };
    const cmove = (e) => { if (!drawing) return; const p = cpos(e); cx.lineTo(p.x, p.y); cx.stroke(); hasSig = true; e.preventDefault(); };
    const cend = () => { drawing = false; };
    canvas.addEventListener('mousedown', cstart);
    canvas.addEventListener('mousemove', cmove);
    canvas.addEventListener('mouseup', cend);
    canvas.addEventListener('mouseleave', cend);
    canvas.addEventListener('touchstart', cstart, { passive: false });
    canvas.addEventListener('touchmove', cmove, { passive: false });
    canvas.addEventListener('touchend', cend);
    $('#cClear', card).onclick = () => { cx.clearRect(0, 0, canvas.width, canvas.height); hasSig = false; };

    // 현장 서명 → saveConsent(onsite). 무손상.
    $('#cBtn', card).onclick = async () => {
      const k = isKo(); const msg = $('#agMsg', card);
      const consent_type = ctype;
      let signer_name = '', parent_email = null;
      if (consent_type === 'minor') {
        signer_name = ($('#cgName', card).value || '').trim();
        if (!signer_name) { $('#cgName', card).focus(); msg.innerHTML = errHtml(k ? '보호자 성명을 입력해주세요.' : 'Guardian name required.'); return; }
        // 현장 서명이어도 보호자 이메일을 동의 기록에 저장(신원/연락 증거).
        const em = $('#cgOnsiteEmail', card);
        parent_email = (em ? em.value : '').trim().toLowerCase() || null;
        if (!emailRe.test(parent_email || '')) { if (em) em.focus(); msg.innerHTML = errHtml(k ? '유효한 보호자 이메일을 입력해주세요.' : 'Valid guardian email required.'); return; }
      } else {
        signer_name = ctx.name || 'self';
      }
      if (!$('#cAgree', card).checked) { msg.innerHTML = errHtml(k ? '동의 체크가 필요합니다.' : 'Please check the agreement.'); return; }
      if (!hasSig) { msg.innerHTML = errHtml(k ? '서명이 필요합니다.' : 'Signature required.'); return; }
      if (!window.ADHD_DB || !window.ADHD_DB.saveConsent) { msg.innerHTML = errHtml(k ? '저장 모듈이 준비되지 않았어요.' : 'Save module not ready.'); return; }
      const btn = $('#cBtn', card); btn.disabled = true;
      try {
        const expires = new Date(); expires.setFullYear(expires.getFullYear() + 1);
        await window.ADHD_DB.saveConsent({
          client_id: ctx.clientId,
          consent_type: consent_type,
          signer_name: signer_name,
          parent_email: parent_email,
          signature: canvas.toDataURL('image/png'),
          sign_method: 'canvas',
          consent_version: 'v1',
          data_types: CONSENT_DATA_TYPES,
          scope: 'all_platforms',
          expires_at: expires.toISOString()
        });
        require(); // 동의 저장됨 → 정상 흐름 재개(enforceCid → removeOverlay)
      } catch (e) {
        btn.disabled = false;
        msg.innerHTML = errHtml((isKo() ? '저장 실패: ' : 'Save failed: ') + (e && e.message ? e.message : ''));
      }
    };
  }

  // 보호자 동의 토큰 화면 — 비로그인 보호자가 메일 링크로 진입(consent_sign). 통과 없음(보호자 전용).
  function viewConsentToken(token) {
    _lastRender = function () { viewConsentToken(token); };
    const card = $('#adhd-gate-overlay .ag-card');
    const clauses = isKo() ? CONSENT_KO : CONSENT_EN;

    card.innerHTML = `
      ${headerHtml(t('보호자 동의 서명', 'Guardian Consent Signature'))}
      <div class="ag-sub">Boston Neuromind LLC · Canton, MA</div>
      <div class="ag-field"><label>${t('보호자 성명', 'Guardian name')}</label><input id="ctName" type="text" autocomplete="name"></div>
      <div class="ag-field"><label>${t('보호자 이메일 (선택)', 'Guardian email (optional)')}</label><input id="ctEmail" type="email" placeholder="you@example.com" autocomplete="email"></div>
      <div style="max-height:210px;overflow-y:auto;border:1px solid #E5E7EB;border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:.84em;line-height:1.55;color:#374151;background:#FAFBFC">${clauses}</div>
      <div style="border:1px solid #FCD34D;background:#FFFBEB;border-radius:10px;padding:11px 13px;margin-bottom:12px;font-size:.84em;line-height:1.55;color:#92400E">
        <div style="font-weight:600;margin-bottom:4px">${t('ℹ️ 시작하기 전에', 'ℹ️ Before you begin')}</div>
        <div>${t('본 도구는 연구 문헌에 기반한 교육용 스크리닝 도구입니다. 의학적 진단이나 치료가 아니며, 자격을 갖춘 임상 전문가의 평가를 대체하지 않습니다.<br>• 결과는 전문가와 상의해볼 만한 영역을 알려줄 뿐입니다<br>• 낮은 점수가 어떤 상태의 부재를 보장하지 않습니다<br>• 높은 점수가 어떤 상태의 존재를 확정하지 않습니다<br>• 이 도구 사용으로 치료자–환자 관계가 형성되지 않습니다<br>• 사용자가 만 18세 미만인 경우, 본 동의는 부모 또는 법정 보호자가 자녀를 대신해 제공하며 보호자가 위 내용을 읽고 이해했음을 확인합니다', 'This tool is a research-based educational screening tool. It is not a medical diagnosis or treatment, and does not replace evaluation by a qualified clinical professional.<br>• Results may point to areas worth discussing with a professional<br>• A low score does not guarantee the absence of a condition<br>• A high score does not confirm the presence of a condition<br>• Using this tool does not create a therapist–patient relationship<br>• If the user is under 18, this consent is provided by a parent or legal guardian on the child\'s behalf, who confirms they have read and understood the above')}</div>
        <div style="margin-top:6px">${t('⚠️ 위기 상황이면: 988로 전화·문자, 또는 741741에 HOME 문자.', '⚠️ In crisis? Call or text 988, or text HOME to 741741.')}</div>
      </div>
      <label style="display:flex;align-items:flex-start;gap:8px;font-size:.92em;color:#374151;margin-bottom:12px;cursor:pointer">
        <input type="checkbox" id="ctAgree" style="margin-top:3px;width:auto;min-height:auto">
        <span>${t('부모/보호자로서 위 내용을 읽었고 자녀의 참여에 동의합니다.', 'As parent/guardian, I have read and consent to my child participating.')}</span></label>
      <div class="ag-field"><label>${t('서명', 'Signature')}</label>
        <canvas id="ctSig" style="width:100%;height:150px;border:1px solid #D1D5DB;border-radius:10px;background:#fff;touch-action:none;cursor:crosshair;display:block"></canvas>
        <button type="button" class="ag-link" id="ctClear" style="margin-top:6px">${t('서명 지우기', 'Clear signature')}</button></div>
      <button class="ag-btn" id="ctBtn">${t('동의하고 서명 →', 'Agree and sign →')}</button>
      <div class="ag-msg" id="agMsg"></div>`;

    wireLangToggle(card);

    // canvas 서명 (consent.html 패턴 재사용)
    const canvas = $('#ctSig', card), cx = canvas.getContext('2d');
    let drawing = false, hasSig = false;
    (function sizeCanvas() {
      const ratio = window.devicePixelRatio || 1, rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
      cx.scale(ratio, ratio); cx.lineWidth = 2; cx.lineCap = 'round'; cx.strokeStyle = '#1F2225';
    })();
    const cpos = (e) => { const r = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return { x: p.clientX - r.left, y: p.clientY - r.top }; };
    const cstart = (e) => { drawing = true; const p = cpos(e); cx.beginPath(); cx.moveTo(p.x, p.y); e.preventDefault(); };
    const cmove = (e) => { if (!drawing) return; const p = cpos(e); cx.lineTo(p.x, p.y); cx.stroke(); hasSig = true; e.preventDefault(); };
    const cend = () => { drawing = false; };
    canvas.addEventListener('mousedown', cstart);
    canvas.addEventListener('mousemove', cmove);
    canvas.addEventListener('mouseup', cend);
    canvas.addEventListener('mouseleave', cend);
    canvas.addEventListener('touchstart', cstart, { passive: false });
    canvas.addEventListener('touchmove', cmove, { passive: false });
    canvas.addEventListener('touchend', cend);
    $('#ctClear', card).onclick = () => { cx.clearRect(0, 0, canvas.width, canvas.height); hasSig = false; };

    $('#ctBtn', card).onclick = async () => {
      const k = isKo(); const msg = $('#agMsg', card);
      const signer_name = ($('#ctName', card).value || '').trim();
      const parent_email = ($('#ctEmail', card).value || '').trim().toLowerCase();
      if (!signer_name) { $('#ctName', card).focus(); msg.innerHTML = errHtml(k ? '보호자 성명을 입력해주세요.' : 'Guardian name required.'); return; }
      if (!$('#ctAgree', card).checked) { msg.innerHTML = errHtml(k ? '동의 체크가 필요합니다.' : 'Please check the agreement.'); return; }
      if (!hasSig) { msg.innerHTML = errHtml(k ? '서명이 필요합니다.' : 'Signature required.'); return; }
      const btn = $('#ctBtn', card); btn.disabled = true;
      try {
        const res = await fetch((((window.ADHD_CONFIG||{}).edgeBase) || '') + '/consent_sign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': ((window.ADHD_CONFIG||{}).anonKey) || '',
            'authorization': 'Bearer ' + (((window.ADHD_CONFIG||{}).anonKey) || '')
          },
          body: JSON.stringify({
            token: token,
            signature: canvas.toDataURL('image/png'),
            signer_name: signer_name,
            consent_type: 'minor',
            parent_email: parent_email || null,
            data_types: CONSENT_DATA_TYPES
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) throw new Error(data.error || ('HTTP ' + res.status));
        card.innerHTML = `<h2>${t('동의 완료', 'Consent complete')}</h2>` +
          `<div class="ag-sub">${t('감사합니다. 자녀가 이제 이용할 수 있습니다.', 'Thank you. Your child can now continue.')}</div>`;
      } catch (e) {
        btn.disabled = false;
        msg.innerHTML = errHtml((isKo() ? '제출 실패: ' : 'Submit failed: ') + (e && e.message ? e.message : ''));
      }
    };
  }

  function viewAuth(mode, notice, ctx) {
    if (mode === 'consent') { return viewConsent(ctx); }
    mode = mode || 'signup';
    _lastRender = function () { viewAuth(mode, notice, ctx); };
    const card = $('#adhd-gate-overlay .ag-card');
    const ko0 = isKo();
    const needsRules = (mode === 'signup' || mode === 'recovery');

    const pwField = (id, koLbl, enLbl, ac) =>
      `<div class="ag-field"><label>${t(koLbl, enLbl)}</label><div class="ag-pwwrap">` +
      `<input id="${id}" type="password" placeholder="••••••••" autocomplete="${ac}">` +
      `<button type="button" class="ag-eye" data-eye="${id}">${ko0 ? '표시' : 'Show'}</button></div></div>`;

    const tabs = (mode === 'recovery') ? '' : `
      <div class="ag-tabs">
        <button id="agLogin" class="${mode === 'login' ? 'on' : ''}">${t('로그인', 'Log in')}</button>
        <button id="agSignup" class="${mode === 'signup' ? 'on' : ''}">${t('회원가입', 'Sign up')}</button>
      </div>`;

    const typeAndDob = (mode === 'signup') ? `
      <div class="ag-field"><label>${t('계정 유형', 'Account type')}</label>
        <div class="ag-radios" id="agTypeWrap">
          <label class="ag-radio on" data-type="consumer"><input type="radio" name="agType" value="consumer" checked>${t('일반 고객', 'Individual')}</label>
          <label class="ag-radio" data-type="professional"><input type="radio" name="agType" value="professional">${t('임상가', 'Clinician')}</label>
        </div>
      </div>
      <div class="ag-field"><label>${t('생년월일', 'Date of birth')}</label><input id="agDob" type="date"></div>` : '';

    const emailSection = (mode === 'recovery') ? '' :
      `<div class="ag-field"><label>Email</label><input id="agEmail" type="email" placeholder="you@example.com" autocomplete="email"></div>`;

    const pwSection = (mode === 'login')
      ? pwField('agPw', '비밀번호', 'Password', 'current-password')
      : (mode === 'signup'
          ? pwField('agPw', '비밀번호', 'Password', 'new-password') + pwField('agPw2', '비밀번호 확인', 'Confirm password', 'new-password')
          : pwField('agPw', '새 비밀번호', 'New password', 'new-password') + pwField('agPw2', '비밀번호 확인', 'Confirm password', 'new-password'));

    const rulesBlock = needsRules ? `
      <ul class="ag-rules">
        <li id="agRuleLen">${t('8자 이상', 'At least 8 characters')}</li>
        <li id="agRuleNum">${t('숫자 1개 이상 포함', 'At least 1 number')}</li>
        <li id="agRuleSym">${t('특수문자 1개 이상 포함 (예: ! @ # $ % ^ &amp; *)', 'At least 1 symbol (e.g. ! @ # $ % ^ &amp; *)')}</li>
      </ul>
      <div class="ag-warn" id="agWarn"></div>` : '';

    const btnLabel = mode === 'signup' ? t('가입하고 계속 →', 'Create account →')
      : mode === 'recovery' ? t('비밀번호 변경', 'Change password')
      : t('로그인 →', 'Log in →');

    const defMsg = mode === 'signup' ? t('가입 후 확인 메일의 링크를 눌러야 로그인됩니다.', 'After signing up, click the link in your email to enable login.')
      : mode === 'recovery' ? t('새 비밀번호를 입력하고 확인하세요.', 'Enter and confirm your new password.')
      : '';

    const resetLink = (mode === 'login')
      ? `<div class="ag-resetwrap"><button class="ag-link" id="agReset">${t('비밀번호를 잊으셨나요? 재설정', 'Forgot password? Reset')}</button></div>` : '';

    card.innerHTML = `
      ${headerHtml(mode === 'recovery' ? t('새 비밀번호 설정', 'Set new password') : 'Learning Training')}
      <div class="ag-sub">${mode === 'recovery' ? t('새 비밀번호를 입력하세요', 'Enter your new password') : t('로그인하고 시작하세요', 'Log in to continue')}</div>
      ${tabs}
      ${typeAndDob}
      ${emailSection}
      ${pwSection}
      ${rulesBlock}
      <button class="ag-btn" id="agBtn">${btnLabel}</button>
      <div class="ag-msg" id="agMsg">${notice || defMsg}</div>
      ${resetLink}`;

    wireLangToggle(card);

    if (mode !== 'recovery') {
      $('#agSignup', card).onclick = () => viewAuth('signup');
      $('#agLogin', card).onclick = () => viewAuth('login');
    }

    // 계정유형 라디오 — 클릭 시 강조 토글
    if (mode === 'signup') {
      card.querySelectorAll('.ag-radio').forEach(r => {
        r.onclick = () => {
          card.querySelectorAll('.ag-radio').forEach(x => x.classList.remove('on'));
          r.classList.add('on');
          const inp = r.querySelector('input'); if (inp) inp.checked = true;
        };
      });
    }

    // 비번 보기 토글
    card.querySelectorAll('.ag-eye').forEach(btn => {
      btn.onclick = () => {
        const inp = $('#' + btn.getAttribute('data-eye'), card); if (!inp) return;
        const show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        btn.textContent = show ? (isKo() ? '숨김' : 'Hide') : (isKo() ? '표시' : 'Show');
      };
    });

    // 실시간 규칙 + 불일치 경고
    if (needsRules) {
      const updRules = () => {
        const pw = ($('#agPw', card) || {}).value || '';
        const pw2 = ($('#agPw2', card) || {}).value || '';
        const r = pwRules(pw);
        const set = (id, ok) => { const el = $('#' + id, card); if (el) el.classList.toggle('ok', ok); };
        set('agRuleLen', r.len); set('agRuleNum', r.num); set('agRuleSym', r.sym);
        const warn = $('#agWarn', card);
        if (warn) warn.textContent = (pw2 && pw !== pw2) ? (isKo() ? '비밀번호가 일치하지 않아요.' : 'Passwords do not match.') : '';
      };
      const p1 = $('#agPw', card), p2 = $('#agPw2', card);
      if (p1) p1.addEventListener('input', updRules);
      if (p2) p2.addEventListener('input', updRules);
    }

    const submit = async () => {
      const ko = isKo();
      const msg = $('#agMsg', card);
      const pw = ($('#agPw', card) || {}).value || '';
      const pw2 = ($('#agPw2', card) || {}).value || '';

      // ── recovery: 새 비밀번호 설정(막다른 길 뚫는 핵심) ──
      if (mode === 'recovery') {
        const r = pwRules(pw);
        if (!(r.len && r.num && r.sym)) { msg.innerHTML = errHtml(ko ? '비밀번호 규칙을 모두 충족해주세요.' : 'Password must meet all rules.'); return; }
        if (pw !== pw2) { $('#agPw2', card).focus(); msg.innerHTML = errHtml(ko ? '비밀번호가 일치하지 않아요.' : 'Passwords do not match.'); return; }
        if (!window.AdhdAuth || !window.AdhdAuth.configured()) { msg.innerHTML = errHtml(ko ? '인증이 아직 설정되지 않았어요.' : 'Auth is not configured yet.'); return; }
        const btn = $('#agBtn', card); btn.disabled = true;
        const { error } = await window.AdhdAuth.updatePassword(pw);
        btn.disabled = false;
        if (error) { msg.innerHTML = errHtml(error.message); return; }
        try { sessionStorage.removeItem('adhd_recovery'); } catch (e) {}
        viewAuth('login', t('비밀번호를 변경했어요. 새 비밀번호로 로그인하세요.', 'Password changed. Log in with your new password.'));
        return;
      }

      // ── signup / login 공통: 이메일 + 비번 8자 ──
      const email = $('#agEmail', card).value.trim().toLowerCase();
      if (!emailRe.test(email)) { $('#agEmail', card).focus(); msg.innerHTML = errHtml(ko ? '유효한 이메일을 입력해주세요.' : 'A valid email is required.'); return; }
      if (!pw || pw.length < 8) { $('#agPw', card).focus(); msg.innerHTML = errHtml(ko ? '비밀번호는 8자 이상이어야 해요.' : 'Password must be at least 8 characters.'); return; }

      if (mode === 'signup') {
        const r = pwRules(pw);
        if (!(r.len && r.num && r.sym)) { msg.innerHTML = errHtml(ko ? '비밀번호 규칙을 모두 충족해주세요.' : 'Password must meet all rules.'); return; }
        if (pw !== pw2) { $('#agPw2', card).focus(); msg.innerHTML = errHtml(ko ? '비밀번호가 일치하지 않아요.' : 'Passwords do not match.'); return; }
        const dob = $('#agDob', card) ? $('#agDob', card).value : '';
        if (!dob) { $('#agDob', card).focus(); msg.innerHTML = errHtml(ko ? '생년월일을 입력해주세요.' : 'Date of birth required.'); return; }
        const typeEl = card.querySelector('input[name="agType"]:checked');
        const deployMode = typeEl ? typeEl.value : 'consumer';
        if (!window.AdhdAuth || !window.AdhdAuth.configured()) { msg.innerHTML = errHtml(ko ? '인증이 아직 설정되지 않았어요.' : 'Auth is not configured yet.'); return; }
        const btn = $('#agBtn', card); btn.disabled = true;
        const { data, error } = await window.AdhdAuth.signUp({ email, password: pw, lang: document.body.dataset.lang, deployMode: deployMode, dob: dob });
        btn.disabled = false;
        if (error) { msg.innerHTML = errHtml(error.message); return; }
        if (data && data.session) { if (window.AdhdGate && window.AdhdGate.require) { AdhdGate.require(); return; } window.location.reload(); return; } // 확인 OFF → 즉시 세션 (가입 즉시 require()=동의 인라인 캡처, 게이트 없으면 reload 폴백)
        viewAuth('login', t(email + ' 로 확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 완료돼요. 그다음 여기서 로그인하세요.',
                            'We sent a confirmation link to ' + email + '. Click it to finish signing up, then log in here.'));
        return;
      }

      // login
      if (!window.AdhdAuth || !window.AdhdAuth.configured()) { msg.innerHTML = errHtml(ko ? '인증이 아직 설정되지 않았어요.' : 'Auth is not configured yet.'); return; }
      const btn = $('#agBtn', card); btn.disabled = true;
      const { error } = await window.AdhdAuth.signIn({ email, password: pw });
      btn.disabled = false;
      if (error) {
        const notConfirmed = /not confirmed|confirm/i.test(error.message || '');
        msg.innerHTML = errHtml(notConfirmed
          ? (ko ? '이메일 검증이 아직 안 됐어요. 메일의 링크를 먼저 눌러주세요.' : 'Email not verified yet — click the link in your email first.')
          : (ko ? '이메일 또는 비밀번호가 맞지 않아요.' : 'Email or password is incorrect.'));
        return;
      }
      window.location.reload();
    };
    $('#agBtn', card).onclick = submit;
    const lastPw = $('#agPw2', card) || $('#agPw', card);
    if (lastPw) lastPw.addEventListener('keypress', e => { if (e.key === 'Enter') submit(); });

    const reset = $('#agReset', card);
    if (reset) reset.onclick = async () => {
      const ko = isKo(); const email = $('#agEmail', card).value.trim().toLowerCase();
      if (!emailRe.test(email)) { $('#agMsg', card).innerHTML = errHtml(ko ? '재설정할 이메일을 입력해주세요.' : 'Enter your email to reset.'); return; }
      await window.AdhdAuth.resetPassword(email);
      $('#agMsg', card).innerHTML = t('재설정 메일을 보냈어요. 메일의 링크를 누르세요.', 'Reset email sent. Click the link in your email.');
    };
  }

  // consumer cid=self_client_id를 URL ?cid + #client-id에 강제. 변경 시 1회 reload.
  function enforceCid(desired) {
    const el = document.getElementById('client-id');
    const params = new URLSearchParams(window.location.search);
    const needsCid = !!el || params.has('cid');
    if (!needsCid || !desired) return false;
    if (el) el.value = desired;
    if (params.get('cid') === desired) return false;
    const u = new URL(window.location.href);
    u.searchParams.set('cid', desired);
    history.replaceState(null, '', u.toString());
    const FLAG = 'adhd_cid_fixed';
    if (sessionStorage.getItem(FLAG) === desired) return false; // 루프 방지
    sessionStorage.setItem(FLAG, desired);
    return true; // reload 신호
  }

  // Supabase 비번재설정 링크는 #...type=recovery 로 복귀. 처리 후 해시가 사라질 수
  // 있어 sessionStorage 플래그로 유지(updatePassword 성공 시 제거).
  function isRecovery() {
    try {
      const h = (window.location.hash || '').toLowerCase();
      const q = (window.location.search || '').toLowerCase();
      if (h.indexOf('type=recovery') !== -1 || q.indexOf('type=recovery') !== -1) return true;
      return sessionStorage.getItem('adhd_recovery') === '1';
    } catch (e) { return false; }
  }
  function consentTokenFromUrl() {
    try { return new URLSearchParams(window.location.search).get('consent_token') || null; } catch (e) { return null; }
  }

  async function require() {
    overlay();
    if (!window.AdhdAuth || !window.AdhdAuth.configured()) {
      $('#adhd-gate-overlay .ag-card').innerHTML =
        '<div class="ag-spin">' + (isKo() ? '인증 설정 로딩 중…' : 'Loading auth…') + '</div>';
      return false;
    }
    // recovery 우선: 로그인 세션이 잡혀도 비번변경 화면으로 보냄(막다른 길 방지).
    if (isRecovery()) {
      try { sessionStorage.setItem('adhd_recovery', '1'); } catch (e) {}
      viewAuth('recovery');
      return false;
    }
    // 보호자 동의 토큰 — 비로그인 보호자가 메일 링크(?consent_token=)로 진입. 인증 체크보다 앞.
    const ctoken = consentTokenFromUrl();
    if (ctoken) { viewConsentToken(ctoken); return false; }
    const user = await window.AdhdAuth.getUser();
    if (!user || !window.AdhdAuth.isVerified(user)) {
      // ?admin=1 (admin-beta-list 진입): 가입 탭 대신 로그인 탭 + 관리자 안내
      const fromAdmin = new URLSearchParams(window.location.search).get('admin') === '1';
      if (fromAdmin) viewAuth('login', t('관리자 계정으로 로그인하세요.', 'Log in with your admin account.'));
      else viewAuth('login'); // 신규 포함 로그인 먼저 — 가입은 탭으로 전환
      return false;
    }
    // 검증됨 → 세션 보장
    const session = window.AdhdSession ? await window.AdhdSession.ensure() : null;
    if (!session) {
      $('#adhd-gate-overlay .ag-card').innerHTML = errHtml(isKo()
        ? '세션 초기화 실패. 새로고침하거나 다시 로그인하세요.'
        : 'Session init failed. Refresh or log in again.');
      return false;
    }
    // admin/owner는 cid 강제 skip(전체 학생 자유 조회). 학생 분기는 무변경.
    const isAdmin = session.role === 'admin' || session.role === 'owner';
    // ★ 동의 게이트 — 성인 전원 받음(owner=임상가 포함, 성인 회원). super/admin(운영자, 환자 아님)만 면제.
    //   ★ cid 강제(isAdmin)와 분리: owner는 동의 받되 전체 조회 권한은 유지(아래 cid 블록은 isAdmin 그대로).
    //   self_client_id가 client_code일 수 있어 실제 adhd_clients.id(uuid)로 해석(consent_send/saveConsent가
    //   adhd_consent.client_id에 uuid를 넣어야 함 — 비-uuid면 Postgres uuid 캐스팅 500). 현장·이메일 동시 해결.
    const isConsentExempt = session.role === 'admin' || session.role === 'super';
    if (!isConsentExempt && session.self_client_id && window.ADHD_DB) {
      let clientRow = null;
      try { clientRow = await window.ADHD_DB.getClient(session.self_client_id); } catch (e) {}
      if (!clientRow && window.ADHD_DB.getClientByCode) {
        try { clientRow = await window.ADHD_DB.getClientByCode(session.self_client_id); } catch (e) {}
      }
      const realId = (clientRow && clientRow.id) || session.self_client_id;
      let consent = null;
      try { consent = window.ADHD_DB.getConsent ? await window.ADHD_DB.getConsent(realId) : null; } catch (e) {}
      if (!consent) {
        const dob = clientRow ? clientRow.date_of_birth : null;
        const name = clientRow ? clientRow.full_name : null;
        viewAuth('consent', null, { clientId: realId, dob: dob, name: name });
        return false;
      }
    }
    if (!isAdmin && session.self_client_id && enforceCid(session.self_client_id)) {
      window.location.reload();
      return false;
    }
    removeOverlay();
    return true;
  }

  window.AdhdGate = { require: require };

  // 다른 탭에서 로그인/로그아웃 시 반영 + PASSWORD_RECOVERY 이벤트 → recovery 화면
  if (window.AdhdAuth && window.AdhdAuth.configured()) {
    window.AdhdAuth.onChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        try { sessionStorage.setItem('adhd_recovery', '1'); } catch (e) {}
        overlay(); viewAuth('recovery'); return;
      }
      if (document.getElementById('adhd-gate-overlay')) require();
    });
  }

  if (!window.ADHD_GATE_MANUAL) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', require);
    } else {
      require();
    }
  }
})();
