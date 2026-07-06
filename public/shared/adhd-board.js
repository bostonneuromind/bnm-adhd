/* shared/adhd-board.js — 공유 게시판 렌더 모듈 (페이지네이션 + 영한토글)
   window.AdhdBoard = { render, esc, fmtDate, nameOr }

   render(container, {
     columns: [{ en, ko, cell:(row)=>htmlString }],   // 헤더=.ko-text/.en-text span(즉시 토글), cell html은 호출측이 esc
     rows:    [...],                                    // RPC 데이터 배열
     pageSize: 20,                                      // 페이지당 행수
     empty:   { en, ko },                               // 빈 목록 문구
   })
   - data-lang 토글은 CSS(.ko-text/.en-text)가 처리 → 헤더/라벨/카운트 재렌더 불필요(즉시 반영)
   - 페이지 상태는 container 로컬(매 render 호출 시 1페이지로 리셋)
*/
(function () {
  'use strict';

  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function fmtDate(s){ if(!s) return '-'; var d=new Date(s); return isNaN(d)?'-':d.toLocaleDateString(); }
  // 이름 있으면 esc(문자열), 없으면 .ko-text/.en-text 폴백 span
  function nameOr(s, labels){ labels=labels||{}; if(s) return esc(s); return langSpan(esc(labels.en||'(no name)'), esc(labels.ko||'(이름없음)')); }
  function langSpan(en, ko){ return '<span class="en-text">'+en+'</span><span class="ko-text">'+ko+'</span>'; }

  function render(container, opts){
    if(!container) return;
    opts = opts || {};
    var columns = opts.columns || [];
    var rows = opts.rows || [];
    var pageSize = opts.pageSize || 5;
    var empty = opts.empty || { en:'No records yet', ko:'기록이 없습니다' };
    var totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

    injectStyle();
    var head = '<tr><th class="adb-th">#</th>'+columns.map(function(c){
      return '<th class="adb-th">'+langSpan(esc(c.en||''), esc(c.ko||''))+'</th>';
    }).join('')+'</tr>';

    container.innerHTML =
        '<div class="adb-count">'+langSpan('Total '+rows.length, '총 '+rows.length)+'</div>'
      + '<div class="adb-scroll"><table class="adb-table"><thead>'+head+'</thead><tbody class="adb-body"></tbody></table></div>'
      + '<div class="adb-pager"></div>';

    var bodyEl = container.querySelector('.adb-body');
    var pagerEl = container.querySelector('.adb-pager');
    var page = 0; // 매 render 호출 시 1페이지로 리셋

    function renderBody(){
      if(!rows.length){
        bodyEl.innerHTML = '<tr><td class="adb-empty" colspan="'+(columns.length+1)+'">'+langSpan(esc(empty.en||''), esc(empty.ko||''))+'</td></tr>';
        return;
      }
      var start = page*pageSize, slice = rows.slice(start, start+pageSize);
      bodyEl.innerHTML = slice.map(function(r,i){
        var cells = columns.map(function(c){ return '<td class="adb-td">'+(c.cell?c.cell(r):'')+'</td>'; }).join('');
        return '<tr><td class="adb-td adb-idx">'+(start+i+1)+'</td>'+cells+'</tr>';
      }).join('');
    }

    function renderPager(){
      if(totalPages<=1){ pagerEl.innerHTML=''; return; }
      var html='';
      for(var p=0;p<totalPages;p++){ html+='<button class="adb-pg'+(p===page?' on':'')+'" data-p="'+p+'">'+(p+1)+'</button>'; }
      pagerEl.innerHTML=html;
      [].forEach.call(pagerEl.querySelectorAll('.adb-pg'), function(b){
        b.addEventListener('click', function(){ page=parseInt(b.getAttribute('data-p'),10)||0; renderBody(); renderPager(); });
      });
    }

    renderBody();
    renderPager();
  }

  function injectStyle(){
    if(document.getElementById('adb-style')) return;
    var s=document.createElement('style'); s.id='adb-style';
    s.textContent =
        '.adb-count{font-size:13px;color:#6b6660;margin-bottom:10px}'
      + '.adb-scroll{overflow-x:auto}'
      + '.adb-table{width:100%;border-collapse:collapse;font-size:14px}'
      + '.adb-th{text-align:left;padding:10px 12px;font-size:13px;color:#6b6660;border-bottom:2px solid #e3ddd3}'
      + '.adb-td{padding:12px;border-bottom:1px solid #eee}'
      + '.adb-idx{font-weight:700;color:#6b6660}'
      + '.adb-empty{padding:24px 12px;color:#9ca3af;text-align:center}'
      + '.adb-pager{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px}'
      + '.adb-pg{min-width:32px;padding:6px 10px;border:1px solid #e3ddd3;border-radius:8px;background:#fff;cursor:pointer;font-size:13px;color:#6b6660}'
      + '.adb-pg.on{background:#1f1d1a;color:#fff;border-color:#1f1d1a;font-weight:700}';
    document.head.appendChild(s);
  }

  window.AdhdBoard = { render:render, esc:esc, fmtDate:fmtDate, nameOr:nameOr };
})();
