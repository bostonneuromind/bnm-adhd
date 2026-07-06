/* shared/adhd-consent.js — 단일 정본 동의 컴포넌트 (게이트·임상가 공용)
   본문·데이터유형·서명·영한토글·저장(ADHD_DB.saveConsent) 한 소스.
   window.AdhdConsent.collect({clientId, mode:'minor'|'adult', signerName, parentEmail, lang, title, subtitle, whoLabel, onDone, onCancel}) */
(function () {
  'use strict';
  // ── alex: 아래 3개를 adhd-gate.js의 CONSENT_KO / CONSENT_EN / CONSENT_DATA_TYPES 값으로 그대로 채움 ──
  var TEXT_KO = `
<h3>1. 동의 기관 및 주체</h3><p>본 동의는 Boston Neuromind LLC(매사추세츠 Canton)와 참여자 — 미성년자의 경우 미성년자를 대리하는 부모/법정 보호자 — 사이에 체결됩니다.</p>
<h3>2. 서비스의 성격</h3><p>본 서비스는 BCN·PhD 자격 인력이 제공하는 웰니스·교육 목적의 서비스로, <strong>의료 행위가 아니며</strong> 의학적 진단이나 치료를 구성하지 않습니다.</p>
<h3>3. 수집 데이터</h3><p>설문 응답, qEEG, HRV, ERP, 타이핑 다이내믹스, AI 대화 기록, 평가·감별 결과 및 향후 도입되는 유사 데이터를 수집할 수 있습니다.</p>
<h3>4. 사용 범위</h3><p>데이터는 Boston Neuromind 및 현재·향후의 모든 플랫폼 — bostonneuromind.com, neurocatchers.com, talkcatcher.com, modalitycatcher.com (decision/learning 하위 플랫폼 포함) 및 향후 추가 플랫폼 — 에서 사용될 수 있습니다.</p>
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
  var TEXT_EN = `
<h3>1. Consenting Institution &amp; Parties</h3><p>This consent is between Boston Neuromind LLC (Canton, Massachusetts) and the participant — or, for a minor, the parent/legal guardian acting on the minor's behalf.</p>
<h3>2. Nature of Service</h3><p>Services are wellness and educational in nature, led by BCN- and PhD-credentialed staff. They are <strong>not medical care</strong> and do not constitute a medical diagnosis or treatment.</p>
<h3>3. Data Collected</h3><p>We may collect: survey responses, qEEG, HRV, ERP, typing dynamics, AI-conversation logs, assessment/differential outputs, and similar data introduced in the future.</p>
<h3>4. Scope of Use</h3><p>Data may be used across Boston Neuromind and all of its current and future platforms — bostonneuromind.com, neurocatchers.com, talkcatcher.com, modalitycatcher.com (incl. decision/learning sub-platforms) and future platforms.</p>
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
  var DATA_TYPES = ['survey','qEEG','HRV','ERP','typing_dynamics','ai_conversation','assessment_differential','future']; /* ← 게이트 CONSENT_DATA_TYPES와 일치하는지 확인 */

  var CVID='adhd-consent-overlay';
  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function closeIt(){ var o=document.getElementById(CVID); if(o)o.remove(); }
  function bodyHtml(lang){
    var t = (lang==='en') ? TEXT_EN : TEXT_KO;
    if(t==null) return '<i>(동의 본문 미설정)</i>';
    if(Array.isArray(t)) return t.map(function(c){ return '<p>'+esc(c)+'</p>'; }).join('');
    return /<\/?[a-z][\s\S]*>/i.test(t) ? t : '<div style="white-space:pre-wrap">'+esc(t)+'</div>';
  }
  function setupCanvas(canvas){
    var ctx=canvas.getContext('2d'); ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle='#111827';
    var drawing=false, dirty=false, last=null;
    function pos(e){ var r=canvas.getBoundingClientRect(); var p=(e.touches&&e.touches[0])||e; return {x:(p.clientX-r.left)*(canvas.width/r.width), y:(p.clientY-r.top)*(canvas.height/r.height)}; }
    function start(e){ e.preventDefault(); drawing=true; last=pos(e); }
    function move(e){ if(!drawing)return; e.preventDefault(); var p=pos(e); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p; dirty=true; }
    function end(){ drawing=false; }
    canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); window.addEventListener('mouseup',end);
    canvas.addEventListener('touchstart',start,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); canvas.addEventListener('touchend',end);
    return { isDirty:function(){return dirty;}, clear:function(){ ctx.clearRect(0,0,canvas.width,canvas.height); dirty=false; }, dataUrl:function(){ return canvas.toDataURL('image/png'); } };
  }
  function injectStyle(){
    if(document.getElementById('adhd-consent-style'))return;
    var s=document.createElement('style'); s.id='adhd-consent-style';
    s.textContent='#'+CVID+'{position:fixed;inset:0;background:rgba(20,24,40,.5);display:flex;align-items:center;justify-content:center;z-index:100000;font-family:inherit}'
    +'#'+CVID+' .acn-card{background:#fff;border-radius:16px;width:min(600px,94vw);max-height:90vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:24px;position:relative}'
    +'#'+CVID+' h2{margin:0 0 4px;font-size:20px;color:#1f2937}'
    +'#'+CVID+' .acn-tag{font-size:12px;color:#6b7280;margin-bottom:10px}'
    +'#'+CVID+' .acn-x{position:absolute;top:16px;right:20px;border:none;background:none;font-size:22px;cursor:pointer;color:#9ca3af}'
    +'#'+CVID+' .acn-langrow{display:flex;gap:6px;margin-bottom:10px}'
    +'#'+CVID+' .acn-lang{font-size:12px;border:1px solid #d1d5db;background:#fff;border-radius:999px;padding:4px 12px;cursor:pointer;font-weight:600;color:#374151}'
    +'#'+CVID+' .acn-lang.on{background:#1f2937;color:#fff;border-color:#1f2937}'
    +'#'+CVID+' .acn-who{font-size:14px;font-weight:700;color:#111827;margin:2px 0 10px}'
    +'#'+CVID+' .acn-body{border:1px solid #eee;border-radius:10px;padding:12px;max-height:240px;overflow:auto;font-size:12px;color:#374151;line-height:1.55;margin-bottom:12px}'
    +'#'+CVID+' .acn-body p{margin:0 0 8px}'
    +'#'+CVID+' .acn-agree{display:flex;gap:8px;align-items:center;font-size:13px;color:#111827;margin-bottom:10px}'
    +'#'+CVID+' .acn-field{display:flex;flex-direction:column;font-size:12px;color:#374151;gap:4px;margin-bottom:10px}'
    +'#'+CVID+' .acn-field input{padding:9px 11px;border:1px solid #d1d5db;border-radius:9px;font-size:14px}'
    +'#'+CVID+' .acn-siglabel{font-size:12px;color:#374151;margin-bottom:4px}'
    +'#'+CVID+' .acn-sig{border:1px dashed #cbd5e1;border-radius:9px;width:100%;height:160px;touch-action:none;background:#fafafa}'
    +'#'+CVID+' .acn-sigrow{margin:6px 0 4px}'
    +'#'+CVID+' .acn-sigclear{font-size:12px;border:none;background:none;color:#6b7280;cursor:pointer;text-decoration:underline}'
    +'#'+CVID+' .acn-msg{font-size:12px;color:#2563eb;min-height:16px;margin:6px 0 12px}'
    +'#'+CVID+' .acn-submit{background:#2563eb;color:#fff;border:none;border-radius:9px;padding:10px 16px;font-weight:600;cursor:pointer}'
    +'body[data-lang="en"] #'+CVID+' .ko-text{display:none}'
    +'body[data-lang="ko"] #'+CVID+' .en-text{display:none}';
    document.head.appendChild(s);
  }
  function collect(opts){
    opts=opts||{};
    var DB = window.ADHD_DB;
    if(!DB || typeof DB.saveConsent!=='function'){ alert('동의 저장 모듈(ADHD_DB)이 없습니다.'); return; }
    var minor = (opts.mode==='minor');
    var lang = opts.lang || (window.bnmGetLang ? window.bnmGetLang() : 'en');
    injectStyle(); closeIt();
    var ov=document.createElement('div'); ov.id=CVID;
    ov.innerHTML='<div class="acn-card"><button class="acn-x" aria-label="닫기">&times;</button>'
      + '<h2>'+esc(opts.title||'동의서')+'</h2>'
      + (opts.subtitle?'<div class="acn-tag">'+esc(opts.subtitle)+'</div>':'')
      + '<div class="acn-langrow"><button class="acn-lang" data-l="ko">KO</button><button class="acn-lang" data-l="en">EN</button></div>'
      + (opts.whoLabel?'<div class="acn-who">'+esc(opts.whoLabel)+'</div>':'')
      + '<div class="acn-body" id="acn-body"></div>'
      + '<label class="acn-agree"><input type="checkbox" id="acn-agree"> <span id="acn-agreetx"></span></label>'
      + '<label class="acn-field">'+(minor?'보호자 성명 / Guardian name':'서명자 성명 / Signer name')+'<input type="text" id="acn-signer" value="'+esc(opts.signerName||'')+'"></label>'
      + (minor ? '<button type="button" class="acn-sigclear" id="acn-email-send" style="margin:0 0 10px">▶ <span class="ko-text">보호자에게 이메일로 동의 요청 보내기</span><span class="en-text">Email consent request to guardian</span></button>' : '')
      + (minor?'<label class="acn-field">보호자 이메일(선택) / Guardian email (optional)<input type="email" id="acn-pemail" value="'+esc(opts.parentEmail||'')+'"></label>':'')
      + '<div class="acn-siglabel">서명 / Signature</div>'
      + '<canvas id="acn-sig" class="acn-sig" width="540" height="160"></canvas>'
      + '<div class="acn-sigrow"><button class="acn-sigclear" id="acn-sigclear" type="button">서명 지우기 / Clear</button></div>'
      + '<div class="acn-msg" id="acn-msg"></div>'
      + '<button class="acn-submit" id="acn-submit"></button></div>';
    document.body.appendChild(ov);
    var bodyEl=ov.querySelector('#acn-body');
    function renderLang(l){
      lang=l; bodyEl.innerHTML=bodyHtml(l);
      ov.querySelector('#acn-agreetx').textContent = (l==='en'?'I agree to the above':'위 내용에 동의합니다');
      ov.querySelector('#acn-submit').textContent = (l==='en'?'Submit consent':'동의 제출');
      [].forEach.call(ov.querySelectorAll('.acn-lang'),function(b){ b.classList.toggle('on', b.getAttribute('data-l')===l); });
    }
    renderLang(lang);
    [].forEach.call(ov.querySelectorAll('.acn-lang'),function(b){ b.addEventListener('click',function(){ var l=b.getAttribute('data-l'); if(window.bnmSetLang) window.bnmSetLang(l); renderLang(l); }); });
    function cancel(){ closeIt(); if(typeof opts.onCancel==='function')opts.onCancel(); }
    ov.addEventListener('click',function(e){ if(e.target===ov)cancel(); });
    ov.querySelector('.acn-x').addEventListener('click',cancel);
    var sig=setupCanvas(ov.querySelector('#acn-sig'));
    ov.querySelector('#acn-sigclear').addEventListener('click',function(){ sig.clear(); });
    var emailBtn = ov.querySelector('#acn-email-send');
    if (emailBtn) emailBtn.addEventListener('click', async function () {
      var msg = ov.querySelector('#acn-msg');
      var pe = ov.querySelector('#acn-pemail');
      var email = pe ? (pe.value || '').trim() : '';
      if (!email) { msg.textContent = (lang==='en'?'Enter guardian email first.':'보호자 이메일을 먼저 입력하세요.'); return; }
      var cfg = window.ADHD_CONFIG || {};
      var edge = (cfg.edgeBase || '').replace(/\/+$/, '');
      var anon = cfg.anonKey || '';
      msg.textContent = (lang==='en'?'Sending…':'발송 중…');
      try {
        var r = await fetch(edge + '/consent_send', {
          method: 'POST',
          headers: { 'content-type':'application/json', 'apikey': anon, 'authorization': 'Bearer ' + anon },
          body: JSON.stringify({ client_id: opts.clientId, parent_email: email, lang: lang })
        });
        var j = {}; try { j = await r.json(); } catch (e) {}
        if (!r.ok || !j.ok) { msg.textContent = (lang==='en'?'Send failed: ':'발송 실패: ') + ((j && j.error) || ('HTTP '+r.status)); return; }
        msg.textContent = (lang==='en'?'Sent. The guardian will receive a consent link.':'발송됨. 보호자에게 동의 링크가 전송됩니다.');
        if (typeof opts.onDone === 'function') opts.onDone({ sent: true });
      } catch (e) { msg.textContent = (lang==='en'?'Error: ':'오류: ') + (e.message || e); }
    });
    ov.querySelector('#acn-submit').addEventListener('click',async function(){
      var msg=ov.querySelector('#acn-msg');
      if(!ov.querySelector('#acn-agree').checked){ msg.textContent='동의 체크가 필요합니다. / Please check agreement.'; return; }
      var signer=(ov.querySelector('#acn-signer').value||'').trim();
      var pemail=minor?((ov.querySelector('#acn-pemail').value||'').trim()):'';
      if(!signer){ msg.textContent='성명을 입력하세요. / Enter signer name.'; return; }
      if(!sig.isDirty()){ msg.textContent='서명을 입력하세요. / Please sign.'; return; }
      msg.textContent='제출 중… / Submitting…';
      try{
        var ex=new Date(); ex.setFullYear(ex.getFullYear()+1);
        var res = await DB.saveConsent({
          client_id: opts.clientId, consent_type: minor?'minor':'adult',
          signer_name: signer, parent_email: pemail||null, signature: sig.dataUrl(),
          sign_method:'canvas', consent_version:'v1', data_types: DATA_TYPES,
          scope:'all_platforms', expires_at: ex.toISOString()
        });
        if(res && res.error){ msg.textContent='제출 실패: '+esc(res.error.message||res.error); return; }
        closeIt(); if(typeof opts.onDone==='function') opts.onDone(res);
      }catch(e){ msg.textContent='오류: '+esc(e.message||e); }
    });
  }
  // 보호자가 메일 링크(?consent_token=)로 들어와 서명 → consent_sign Edge 저장 (정본 폼·스타일 재사용)
  function collectByToken(opts){
    opts = opts || {};
    var token = opts.token; if(!token){ alert('유효하지 않은 동의 링크입니다.'); return; }
    var cfg = window.ADHD_CONFIG || {};
    var edge = (cfg.edgeBase || '').replace(/\/+$/,'');
    var anon = cfg.anonKey || '';
    var lang = opts.lang || (window.bnmGetLang ? window.bnmGetLang() : 'en');
    injectStyle(); closeIt();
    var ov = document.createElement('div'); ov.id = CVID;
    ov.innerHTML = '<div class="acn-card"><button class="acn-x" aria-label="close">&times;</button>'
      + '<h2 class="ko-text">보호자 동의</h2><h2 class="en-text">Guardian Consent</h2>'
      + '<div class="acn-tag ko-text">자녀의 뉴로피드백·평가 데이터 수집에 대한 보호자 동의입니다.</div>'
      + '<div class="acn-tag en-text">Guardian consent for your child’s neurofeedback & assessment data.</div>'
      + '<div class="acn-langrow"><button type="button" class="acn-lang" data-l="ko">KO</button><button type="button" class="acn-lang" data-l="en">EN</button></div>'
      + '<div class="acn-body" id="acn-body"></div>'
      + '<label class="acn-agree"><input type="checkbox" id="acn-agree"> <span id="acn-agreetx"></span></label>'
      + '<label class="acn-field"><span class="ko-text">보호자 성명</span><span class="en-text">Guardian name</span><input type="text" id="acn-signer" value="'+esc(opts.signerName||'')+'"></label>'
      + '<div class="acn-siglabel"><span class="ko-text">서명</span><span class="en-text">Signature</span></div>'
      + '<canvas id="acn-sig" class="acn-sig" width="540" height="160"></canvas>'
      + '<div class="acn-sigrow"><button class="acn-sigclear" id="acn-sigclear" type="button"><span class="ko-text">서명 지우기</span><span class="en-text">Clear</span></button></div>'
      + '<div class="acn-msg" id="acn-msg"></div>'
      + '<button class="acn-submit" id="acn-submit"></button></div>';
    document.body.appendChild(ov);
    var bodyEl = ov.querySelector('#acn-body');
    function renderLang(l){
      bodyEl.innerHTML = bodyHtml(l);
      ov.querySelector('#acn-agreetx').textContent = (l==='en'?'I agree to the above':'위 내용에 동의합니다');
      ov.querySelector('#acn-submit').textContent = (l==='en'?'Submit consent':'동의 제출');
    }
    renderLang(lang);
    var langBtns = ov.querySelectorAll('.acn-lang');
    function markActive(l){ for(var i=0;i<langBtns.length;i++){ langBtns[i].classList.toggle('on', langBtns[i].getAttribute('data-l')===l); } }
    markActive(lang);
    for(var bi=0; bi<langBtns.length; bi++){ langBtns[bi].addEventListener('click', function(){ var l=this.getAttribute('data-l'); if(window.bnmSetLang){ window.bnmSetLang(l); } else { lang=l; renderLang(l); } markActive(l); }); }
    var langObs = new MutationObserver(function(){ if(!document.getElementById(CVID)){ langObs.disconnect(); return; } var nl = window.bnmGetLang ? window.bnmGetLang() : lang; if(nl){ lang=nl; renderLang(nl); markActive(nl); } });
    langObs.observe(document.body, {attributes:true, attributeFilter:['data-lang']});
    ov.querySelector('.acn-x').addEventListener('click', function(){ langObs.disconnect(); closeIt(); });
    var sig = setupCanvas(ov.querySelector('#acn-sig'));
    ov.querySelector('#acn-sigclear').addEventListener('click', function(){ sig.clear(); });
    ov.querySelector('#acn-submit').addEventListener('click', async function(){
      var msg = ov.querySelector('#acn-msg');
      if(!ov.querySelector('#acn-agree').checked){ msg.textContent = (lang==='en'?'Please check the agreement.':'동의 체크가 필요합니다.'); return; }
      var signer = (ov.querySelector('#acn-signer').value||'').trim();
      if(!signer){ msg.textContent = (lang==='en'?'Please enter signer name.':'성명을 입력하세요.'); return; }
      if(!sig.isDirty()){ msg.textContent = (lang==='en'?'Please sign.':'서명을 입력하세요.'); return; }
      msg.textContent = (lang==='en'?'Submitting…':'제출 중…');
      try{
        var r = await fetch(edge + '/consent_sign', {
          method:'POST',
          headers:{ 'content-type':'application/json', 'apikey': anon, 'authorization': 'Bearer ' + anon },
          body: JSON.stringify({ token: token, signature: sig.dataUrl(), signer_name: signer, consent_type:'minor', data_types: DATA_TYPES })
        });
        var j = {}; try{ j = await r.json(); }catch(e){}
        if(!r.ok || !j.ok){ msg.textContent = (lang==='en'?'Failed: ':'실패: ') + esc((j && j.error) || ('HTTP '+r.status)); return; }
        langObs.disconnect();
        ov.querySelector('.acn-card').innerHTML = '<h2>'+(lang==='en'?'Thank you':'감사합니다')+'</h2><div class="acn-tag">'+(lang==='en'?'Consent has been recorded.':'동의가 저장되었습니다.')+'</div>';
        if(typeof opts.onDone==='function') opts.onDone(j);
      }catch(e){ msg.textContent = (lang==='en'?'Error: ':'오류: ') + esc(e.message||e); }
    });
  }

  window.AdhdConsent = { collect: collect, collectByToken: collectByToken, close: closeIt, DATA_TYPES: DATA_TYPES, text: function(){ return {ko:TEXT_KO, en:TEXT_EN}; } };
})();
