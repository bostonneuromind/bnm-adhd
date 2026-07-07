/* ===== dept별 QEEG 마커 자동 추출 v2 — 복사 시 각 증상 마커 자동 표시 =====
   각 사이트의 rules(dept)에서 대표 QEEG 마커를 읽어 그래프 Y축·라벨에 사용.
   v2: rules metric의 primary(대표) + derived_path(엔진 산출 필드명) + engine_status를 읽음.
   복사 시 코드 안 바꿔도 rules만 다르면 각 증상 마커가 자동으로 뜸. */
(function(){
  window.getDeptQeegMarker = function(rules){
    try{
      var qn = rules && rules.game_module && rules.game_module.qeeg_norms;
      if(!qn || !qn.metrics) return null;
      var keys = Object.keys(qn.metrics);
      var key = null;
      // v2: primary:true 마커 우선(rules에 명시), 없으면 첫 키 폴백
      for(var i=0;i<keys.length;i++){ if(qn.metrics[keys[i]] && qn.metrics[keys[i]].primary){ key=keys[i]; break; } }
      if(!key) key = keys[0];
      if(!key) return null;
      var m = qn.metrics[key];
      var dp = m.derived_path || null;        // v2: 엔진 산출 필드명(rules가 지정). null=엔진확장대기
      // 값 탐색 경로 — derived_path 최우선, 그다음 키 자체·frontal_theta_beta 폴백
      var paths = [];
      if(dp) paths.push('derived.' + dp);
      paths.push('derived.' + key, 'derived.frontal_theta_beta', 'metrics.' + key);
      return {
        key: key,
        label_ko: m.ko || key, label_en: m.en || key,
        site: m.site || '',
        interpret_ko: m.interpret_ko || '', interpret_en: m.interpret_en || '',
        derived_path: dp,
        engine_status: m.engine_status || (dp ? '산출됨' : '엔진확장대기'),
        available: !!dp,                        // v2: 엔진이 실제 산출하는 마커인지(그래프 그릴 수 있나)
        data_paths: paths
      };
    }catch(e){ return null; }
  };
  window.extractMarkerValue = function(qeegData, marker){
    if(!qeegData || !marker) return null;
    for(var i=0;i<marker.data_paths.length;i++){
      var val = getPath(qeegData, marker.data_paths[i]);
      if(typeof val === 'number' && isFinite(val)) return val;
    }
    return null;
  };
  function getPath(obj, path){
    var parts = path.split('.'), cur = obj;
    for(var i=0;i<parts.length;i++){ if(cur==null) return null; cur = cur[parts[i]]; }
    return cur;
  }
})();
