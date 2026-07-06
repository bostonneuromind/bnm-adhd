/* shared/adhd-clients.js v3 — 임상가 환자관리 (자기완결). 동의는 단일 정본 window.AdhdConsent.collect 위임.
   window.AdhdClients.open() — 역할(owner/admin/clinician)만. 환자목록 + 관리형 추가 + 동의수집(정본). */
(function () {
  'use strict';
  var OVID='adhd-clients-overlay';
  function cli(){ return (window.AdhdAuth && typeof window.AdhdAuth.client==='function') ? window.AdhdAuth.client() : null; }
  function role(){ try{ var s=window.AdhdSession&&window.AdhdSession.current&&window.AdhdSession.current(); return s?s.role:null; }catch(e){ return null; } }
  function canManage(){ return ['owner','admin','clinician'].indexOf(role())>=0; }
  function ageFrom(dob){ if(!dob)return null; var d=new Date(dob); if(isNaN(d))return null; var t=new Date(),a=t.getFullYear()-d.getFullYear(),m=t.getMonth()-d.getMonth(); if(m<0||(m===0&&t.getDate()<d.getDate()))a--; return a; }
  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function close(){ var o=document.getElementById(OVID); if(o)o.remove(); }

  // 로그인 링크를 컨테이너에 [열기] + [복사] 버튼으로 표시 (prompt 대체, addPatient·Get link 공용)
  function showLink(container, link){
    if(!container||!link) return;
    var ko=document.body.getAttribute('data-lang')==='ko';
    container.innerHTML='';
    var row1=document.createElement('div');
    row1.appendChild(document.createTextNode(ko?'로그인 링크: ':'Login link: '));
    var a=document.createElement('a'); a.href=link; a.target='_blank'; a.rel='noopener'; a.textContent=ko?'링크 열기':'Open link';
    row1.appendChild(a);
    var row2=document.createElement('div'); row2.style.marginTop='6px';   // 복사 버튼은 링크 바로 밑 줄
    var btn=document.createElement('button'); btn.type='button'; btn.textContent=ko?'복사':'Copy';
    btn.style.cssText='padding:2px 10px;border:1px solid #047857;color:#047857;border-radius:6px;cursor:pointer;background:#fff';
    btn.onclick=function(){
      function done(){ btn.textContent=ko?'복사됨!':'Copied!'; setTimeout(function(){ btn.textContent=ko?'복사':'Copy'; },1500); }
      function fallback(){ var t=document.createElement('textarea'); t.value=link; document.body.appendChild(t); t.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(t); done(); }
      if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(link).then(done, fallback); }
      else fallback();
    };
    row2.appendChild(btn);
    container.appendChild(row1); container.appendChild(row2);
  }

  // 공유 게시판(AdhdBoard)으로 렌더. 동의 버튼은 인라인 onclick→window.AdhdClients.openConsent(id)
  // (페이지네이션 tbody 재렌더에도 살아남도록 글로벌 호출). 행은 id로 캐시.
  var _clientsById = {};
  var _lastListEl = null;

  async function refreshList(listEl){
    var c=cli(); if(!c){ listEl.innerHTML='<div class="acl-empty"><span class="en-text">Not signed in. Sign in as a clinician.</span><span class="ko-text">세션이 없습니다. 임상가로 로그인하세요.</span></div>'; return; }
    if(!window.AdhdBoard){ listEl.innerHTML='<div class="acl-empty">board module (adhd-board.js) not loaded</div>'; return; }
    listEl.innerHTML='<div class="acl-empty"><span class="en-text">Loading…</span><span class="ko-text">불러오는 중…</span></div>';
    _lastListEl = listEl;
    try{
      var r=await c.rpc('adhd_list_clients');
      if(r.error){ listEl.innerHTML='<div class="acl-empty">'+esc(r.error.message)+'</div>'; return; }
      var rows=(r.data||[]).filter(function(x){return !x.is_self;});
      _clientsById = {};
      rows.forEach(function(x){ var age=ageFrom(x.date_of_birth); x._age=age; x._minor=(age!=null&&age<18); _clientsById[x.id]=x; });
      window.AdhdBoard.render(listEl, {
        pageSize: 5,
        empty: { en:'No patients yet', ko:'등록된 환자가 없습니다' },
        rows: rows,
        columns: [
          { en:'Name', ko:'이름', cell:function(x){ return '<b>'+window.AdhdBoard.nameOr(x.full_name,{en:'(no name)',ko:'(이름없음)'})+'</b>'; } },
          { en:'DOB / Age', ko:'생년월일 / 나이', cell:function(x){
              var who = x._minor ? '<span class="en-text">Minor</span><span class="ko-text">미성년</span>'
                      : (x._age!=null ? '<span class="en-text">Adult</span><span class="ko-text">성인</span>'
                      : '<span class="en-text">Age unknown</span><span class="ko-text">나이미상</span>');
              return esc(x.date_of_birth||'-')+' · '+who+(x._age!=null?' ('+x._age+')':''); } },
          { en:'Consent', ko:'동의', cell:function(x){
              return x.has_consent
                ? '<span class="acl-badge ok"><span class="en-text">Done</span><span class="ko-text">동의완료</span></span>'
                : '<button class="acl-consent-btn" onclick="window.AdhdClients.openConsent(\''+esc(x.id)+'\')"><span class="en-text">Get consent</span><span class="ko-text">동의 받기</span></button>'; } },
          { en:'Login', ko:'로그인', cell:function(x){
              return '<button type="button" class="acl-getlink" data-cid="'+esc(x.id)+'"><span class="en-text">Get link</span><span class="ko-text">로그인 링크</span></button>'; } }
        ]
      });
    }catch(e){ listEl.innerHTML='<div class="acl-empty">'+esc(e.message)+'</div>'; }
  }

  // 게시판 동의 버튼(인라인 onclick)에서 호출 — id로 캐시 조회 후 정본 동의 컴포넌트.
  function openConsentById(id){
    var x=_clientsById[id]; if(!x) return;
    openConsent({ id:x.id, name:x.full_name||'', dob:x.date_of_birth||'', minor:!!x._minor }, function(){ if(_lastListEl) refreshList(_lastListEl); });
  }

  // 환자추가 = adhd-create-patient Edge 위임 (클라 signUp 안 함 → 임상가 세션 안 깨짐, service_role 계정생성)
  async function addPatient(nameEl, dobEl, msgEl, listEl) {
    var cfg  = window.ADHD_CONFIG || {};
    var edge = (cfg.edgeBase || '').replace(/\/+$/, '');
    var anon = cfg.anonKey || '';
    var lang = (document.body.getAttribute('data-lang') === 'ko') ? 'ko' : 'en';

    var full_name = (nameEl.value || '').trim();
    if (!full_name) { msgEl.textContent = (lang==='ko'?'이름을 입력하세요':'Enter a name'); return; }

    var emailEl  = document.getElementById('acl-email');
    var minorEl  = document.getElementById('acl-minor');
    var parentEl = document.getElementById('acl-parent');
    var email = (emailEl && emailEl.value || '').trim();
    var is_minor = !!(minorEl && minorEl.checked);
    var parent_email = (parentEl && parentEl.value || '').trim();

    // 환자 등록 = 항상 계정+로그인 링크(케이스B). 이메일 필수.
    if (!email) { msgEl.textContent = (lang==='ko'?'환자 이메일이 필요합니다':'Patient email required'); return; }
    if (is_minor && !parent_email) { msgEl.textContent = (lang==='ko'?'부모 이메일이 필요합니다':'Parent email required'); return; }

    // 임상가 JWT (anon 아님 — 호출자 신원검증용)
    var session = window.AdhdAuth && window.AdhdAuth.getSession ? await window.AdhdAuth.getSession() : null;
    var token = session && session.access_token;
    if (!token) { msgEl.textContent = (lang==='ko'?'임상가 로그인이 필요합니다':'Clinician login required'); return; }

    msgEl.textContent = (lang==='ko'?'추가 중…':'Adding…');
    try {
      var r = await fetch(edge + '/adhd-create-patient', {
        method: 'POST',
        headers: { 'content-type':'application/json', 'apikey': anon, 'authorization': 'Bearer ' + token },
        body: JSON.stringify({ full_name: full_name, dob: (dobEl.value || null), self_login: true, email: email, is_minor: is_minor, parent_email: parent_email, lang: lang, redirect_to: (window.location.origin + (window.ADHD_CONFIG && window.ADHD_CONFIG.portalPath ? window.ADHD_CONFIG.portalPath : '/')) })
      });
      var j = await r.json();
      if (!r.ok || !j.ok) { msgEl.textContent = (lang==='ko'?'실패: ':'Failed: ') + (j && j.error ? j.error : r.status); return; }
      // 성공 — 폼 리셋 + 목록 갱신 + 로그인 링크(복사 버튼) 표시
      nameEl.value = ''; dobEl.value = '';
      if (emailEl) emailEl.value = ''; if (parentEl) parentEl.value = '';
      if (minorEl) minorEl.checked = false;
      var pw=document.getElementById('acl-parent-wrap'); if(pw) pw.style.display='none';
      if (j.mode === 'account' && j.login_link) {
        showLink(msgEl, j.login_link);
      } else {
        msgEl.textContent = (lang==='ko'?'환자 추가됨':'Patient added');
      }
      if (window.AdhdClients && window.AdhdClients.refreshList) window.AdhdClients.refreshList(listEl);
      else if (typeof refreshList === 'function') refreshList(listEl);
    } catch (e) {
      msgEl.textContent = (lang==='ko'?'오류: ':'Error: ') + String(e).slice(0,120);
    }
  }

  // 동의 = 단일 정본 컴포넌트 위임 (게이트와 동일 본문·영한토글·저장)
  function openConsent(client, onDone){
    if(!window.AdhdConsent || typeof window.AdhdConsent.collect!=='function'){ alert('동의 모듈(AdhdConsent)이 로드되지 않았습니다.'); return; }
    var minor=!!client.minor;
    window.AdhdConsent.collect({
      clientId: client.id,
      mode: minor?'minor':'adult',
      signerName: minor?'':(client.name||''),
      title: '임상가 · 환자 동의',
      subtitle: '임상가가 환자 대신 받는 동의 — 일반 로그인/가입과 같은 본문',
      whoLabel: (client.name||'(이름없음)')+' · '+(minor?'보호자 동의 (Guardian)':'본인 동의 (Self)'),
      onDone: function(){ if(typeof onDone==='function') onDone(); }
    });
  }

  function injectStyle(){
    if(document.getElementById('acl-style'))return;
    var s=document.createElement('style'); s.id='acl-style';
    s.textContent='#'+OVID+'{position:fixed;inset:0;background:rgba(20,24,40,.45);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:inherit}'
    +'#'+OVID+' .acl-card{background:#fff;border-radius:16px;width:min(560px,92vw);max-height:88vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:24px;position:relative}'
    +'#'+OVID+' h2{margin:0 0 4px;font-size:20px;color:#1f2937}'
    +'#'+OVID+' .acl-tag{font-size:12px;color:#6b7280;margin-bottom:16px}'
    +'#'+OVID+' .acl-x{position:absolute;top:16px;right:20px;border:none;background:none;font-size:22px;cursor:pointer;color:#9ca3af}'
    +'#'+OVID+' .acl-form{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-bottom:6px}'
    +'#'+OVID+' .acl-form label{display:flex;flex-direction:column;font-size:12px;color:#374151;gap:4px}'
    +'#'+OVID+' .acl-form input{padding:9px 11px;border:1px solid #d1d5db;border-radius:9px;font-size:14px}'
    +'#'+OVID+' .acl-add{background:#2563eb;color:#fff;border:none;border-radius:9px;padding:10px 16px;font-weight:600;cursor:pointer}'
    +'#'+OVID+' .acl-msg{font-size:12px;color:#2563eb;min-height:16px;margin:6px 0 12px}'
    +'#'+OVID+' .acl-list{border-top:1px solid #eee;margin-top:8px}'
    +'#'+OVID+' .acl-row{display:flex;justify-content:space-between;align-items:center;padding:11px 2px;border-bottom:1px solid #f1f1f1}'
    +'#'+OVID+' .acl-sub{display:block;font-size:12px;color:#6b7280;margin-top:2px}'
    +'#'+OVID+' .acl-empty{padding:18px 2px;color:#9ca3af;font-size:14px}'
    +'#'+OVID+' .acl-badge{font-size:11px;padding:3px 9px;border-radius:999px;font-weight:600}'
    +'#'+OVID+' .acl-badge.ok{background:#dcfce7;color:#166534}'
    +'#'+OVID+' .acl-badge.no{background:#fee2e2;color:#991b1b}'
    +'#'+OVID+' .acl-consent-btn{font-size:12px;border:1px solid #2563eb;color:#2563eb;background:#fff;border-radius:999px;padding:5px 12px;font-weight:600;cursor:pointer}'
    +'#'+OVID+' .acl-getlink{font-size:12px;border:1px solid #047857;color:#047857;background:#fff;border-radius:999px;padding:5px 12px;font-weight:600;cursor:pointer}';
    document.head.appendChild(s);
  }

  function open(){
    if(!canManage()){ alert('임상가/관리자 권한이 필요합니다. 임상가로 로그인 후 이용하세요. (현재 역할: '+(role()||'없음')+')'); return; }
    close(); injectStyle();
    var ov=document.createElement('div'); ov.id=OVID;
    ov.innerHTML='<div class="acl-card"><button class="acl-x" aria-label="닫기">&times;</button>'
      +'<h2><span class="en-text">Register a patient</span><span class="ko-text">환자 등록</span></h2>'
      +'<div class="acl-tag"><span class="en-text">Clinician registers patient · creates a login link for the patient</span><span class="ko-text">임상가가 환자를 등록합니다 · 환자에게 로그인 링크가 생성됩니다</span></div>'
      +'<div style="font-size:12px;color:#b45309;background:#fef3c7;border-radius:8px;padding:8px 10px;margin-bottom:12px"><span class="en-text">Not a login/signup form — creates the patient account on their behalf</span><span class="ko-text">로그인·가입 화면이 아닙니다 — 환자 계정을 대신 생성합니다</span></div>'
      +'<div class="acl-form"><label><span class="ko-text">환자 이름</span><span class="en-text">Patient name</span><input type="text" id="acl-name" placeholder="환자 이름 / Patient name"></label>'
      +'<label><span class="ko-text">생년월일</span><span class="en-text">Date of birth</span><input type="date" id="acl-dob"></label>'
      +'<label><span class="ko-text">환자 이메일 (로그인 링크 받을 주소)</span><span class="en-text">Patient email (receives login link)</span><input type="email" id="acl-email" placeholder="patient@email.com"></label>'
      +'<label class="acl-minor"><input type="checkbox" id="acl-minor"> <span class="ko-text">미성년 (부모 동의)</span><span class="en-text">Minor (parent consent)</span></label>'
      +'<label class="acl-parent-wrap" id="acl-parent-wrap" style="display:none"><span class="ko-text">부모 이메일</span><span class="en-text">Parent email</span><input type="email" id="acl-parent" placeholder="parent@email.com"></label>'
      +'<button class="acl-add" id="acl-add"><span class="ko-text">환자 추가</span><span class="en-text">Add patient</span></button></div>'
      +'<div class="acl-msg" id="acl-msg"></div><div class="acl-list" id="acl-list"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click',function(e){ if(e.target===ov)close(); });
    ov.querySelector('.acl-x').addEventListener('click',close);
    var listEl=ov.querySelector('#acl-list'),msgEl=ov.querySelector('#acl-msg'),nameEl=ov.querySelector('#acl-name'),dobEl=ov.querySelector('#acl-dob');
    // 미성년 토글: 체크 시 부모 이메일칸 표시 (환자 등록 = 항상 계정+로그인 링크)
    var minorChk=ov.querySelector('#acl-minor');
    if(minorChk){ minorChk.addEventListener('change', function(e){
      var pw=ov.querySelector('#acl-parent-wrap'); if(pw) pw.style.display=e.target.checked?'':'none';
    }); }
    ov.querySelector('#acl-add').addEventListener('click',function(){ addPatient(nameEl,dobEl,msgEl,listEl); });
    // Get link 위임 핸들러 — listEl 1회 등록(refreshList가 자식만 교체하므로 살아남음). resend_link Edge 호출.
    listEl.addEventListener('click', async function(e){
      var btn=e.target.closest('.acl-getlink'); if(!btn) return;
      var cid=btn.getAttribute('data-cid');
      var ko=document.body.getAttribute('data-lang')==='ko';
      var cfg=window.ADHD_CONFIG||{}; var edge=(cfg.edgeBase||'').replace(/\/+$/,''); var anon=cfg.anonKey||'';
      var session=window.AdhdAuth&&window.AdhdAuth.getSession ? await window.AdhdAuth.getSession() : null;
      var token=session&&session.access_token; if(!token){ alert(ko?'임상가 로그인이 필요합니다':'Clinician login required'); return; }
      btn.textContent='…';
      try{
        var r=await fetch(edge+'/adhd-create-patient',{ method:'POST',
          headers:{'content-type':'application/json','apikey':anon,'authorization':'Bearer '+token},
          body: JSON.stringify({ action:'resend_link', client_id: cid, redirect_to: (window.location.origin + (window.ADHD_CONFIG && window.ADHD_CONFIG.portalPath ? window.ADHD_CONFIG.portalPath : '/')) }) });
        var j=await r.json();
        btn.innerHTML='<span class="en-text">Get link</span><span class="ko-text">로그인 링크</span>';
        if(j.ok && j.login_link){ showLink(msgEl, j.login_link); }
        else { msgEl.textContent=(ko?'링크 생성 실패: ':'Link failed: ')+(j.error||r.status); }
      }catch(err){ btn.innerHTML='<span class="en-text">Get link</span><span class="ko-text">로그인 링크</span>'; msgEl.textContent=(ko?'오류: ':'Error: ')+String(err).slice(0,100); }
    });
    refreshList(listEl);
  }
  window.AdhdClients={ open:open, close:close, canManage:canManage, openConsent:openConsentById };
})();
