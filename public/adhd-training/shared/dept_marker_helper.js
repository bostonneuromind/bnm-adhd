/* ===== dept별 QEEG 마커 자동 추출 — 복사 시 각 증상 마커 자동 표시 =====
   각 사이트의 rules(dept)에서 대표 QEEG 마커를 읽어 그래프 Y축·라벨에 사용.
   복사 시 코드 안 바꿔도 rules만 다르면 각 증상 마커가 자동으로 뜸. */
(function(){
  window.getDeptQeegMarker = function(rules){
    try{
      var qn = rules && rules.game_module && rules.game_module.qeeg_norms;
      if(!qn || !qn.metrics) return null;
      var keys = Object.keys(qn.metrics);
      var key = null;
      for(var i=0;i<keys.length;i++){ if(qn.metrics[keys[i]].primary){ key=keys[i]; break; } }
      if(!key) key = keys[0];
      if(!key) return null;
      var m = qn.metrics[key];
      return {
        key: key,
        label_ko: m.ko || key, label_en: m.en || key,
        site: m.site || '',
        interpret_ko: m.interpret_ko || '', interpret_en: m.interpret_en || '',
        data_paths: [ 'derived.' + key, 'derived.frontal_theta_beta', 'metrics.' + key ]
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
