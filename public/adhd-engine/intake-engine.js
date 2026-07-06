/* ============================================================================
 * intake-engine.js  —  SymptomCatcher module-grid engine (triage-v2 tab shell)
 * ----------------------------------------------------------------------------
 * DATA + render logic lifted VERBATIM from triage.html + _data_lines.js.
 * Clinical module/questionnaire content = 할비/BCN IP. Do not edit content here.
 *
 * SUPER override (설문/모듈 교체):  set  window.MODULE_OVERRIDE = {
 *     EMBEDDED_MODULES:{...}, CATEGORIES:{...}, BPS_PACKAGE:{...} }  BEFORE this
 *   script loads. Keys are merged over the defaults below (Object.assign).
 *
 * Public API (window):  scRenderModuleGrid()  -> render/refresh the grid
 *   onclick bridges: toggleModule, showModuleInfo, jumpToCategory,
 *                    selectCategory, applyPreset, removeModule, clearAllModules
 * DOM expected by the tab:
 *   #categories-grid  #modules-list         (required: grid)
 *   #sel-bar #sel-bar-chips #sel-bar-stats  (optional: selection chip bar)
 *   #preset-btns                            (optional: smart-start presets)
 *   #modal-backdrop #modal-content-wrapper  (optional: ⓘ info modal)
 * Selection result -> window.state.selectedModules  (a Set of module ids)
 * ==========================================================================*/
(function () {

// ---- shell state bootstrap (extend, never replace) -----------------------
var state = (window.state = window.state || {});
if (!(state.selectedModules instanceof Set)) state.selectedModules = new Set();
if (!state.selectedCategory) state.selectedCategory = '__ALL__';

// ---- slim dashboard shim (replaces the 6-panel wizard updateDashboard) ---
function updateDashboard () {
  try { _updateSelBar(); } catch (e) {}
  try { updateModuleSummary(); } catch (e) {}
}

/* ===== DATA (verbatim) =================================================== */
const EMBEDDED_MODULES = {"alcohol_use_catcher_10":{"_meta":{"module_id":"alcohol_use_catcher_10","display_name":"AlcoholUseCatcher10","display_name_ko":"알코올사용캐처10","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"알코올 사용 장애 (DSM-5-TR AUD)","inspiration_source":"AUDIT 구조 (WHO), DSM-5-TR 11가지 기준","legal_status":"NeuroCatchers 독자 개발 (AUDIT은 WHO 공공 도메인)","scientific_basis":["DSM-5-TR Alcohol Use Disorder (2022)","Saunders et al. (1993) — AUDIT","Babor et al. (2001) — AUDIT manual"],"ai_differentiation":["AUDIT-C screening + DSM 11 criteria","경증/중등도/중증 자동 분류","공존 정신과 질환 감별 (self-medication 패턴)"],"time_estimate_min":4,"question_count":10}},"questions":[{"id":"AUD10_Q1","order":1,"domain":"frequency","text_en":"How often do you have a drink containing alcohol?","text_ko":"알코올을 얼마나 자주 마시나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"월 1회 이하","value":1},{"label_ko":"월 2-4회","value":2},{"label_ko":"주 2-3회","value":3},{"label_ko":"주 4회 이상","value":4}],"diagnostic_weight":{"aud":0.7}},{"id":"AUD10_Q2","order":2,"domain":"quantity","text_en":"How many drinks do you have on a typical drinking day?","text_ko":"보통 마시는 날 몇 잔 정도 마시나요?","response_options":[{"label_ko":"1-2잔","value":0},{"label_ko":"3-4잔","value":1},{"label_ko":"5-6잔","value":2},{"label_ko":"7-9잔","value":3},{"label_ko":"10잔+","value":4}],"diagnostic_weight":{"aud":0.8}},{"id":"AUD10_Q3","order":3,"domain":"binge","text_en":"How often do you have 6+ drinks on one occasion?","text_ko":"한 번에 6잔 이상 마시는 일이 얼마나 자주 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"월 1회 이하","value":1},{"label_ko":"월 1회","value":2},{"label_ko":"주 1회","value":3},{"label_ko":"매일/거의","value":4}],"diagnostic_weight":{"aud":0.85}},{"id":"AUD10_Q4","order":4,"domain":"control_loss","text_en":"How often can't you stop drinking once started?","text_ko":"마시기 시작하면 멈출 수 없었던 적이 얼마나 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"월 1회 이하","value":1},{"label_ko":"월 1회","value":2},{"label_ko":"주 1회","value":3},{"label_ko":"매일/거의","value":4}],"diagnostic_weight":{"aud":0.9}},{"id":"AUD10_Q5","order":5,"domain":"obligation_fail","text_en":"How often does drinking prevent you from doing what was expected?","text_ko":"음주 때문에 해야 할 일을 못한 적이 얼마나 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"월 1회 이하","value":1},{"label_ko":"월 1회","value":2},{"label_ko":"주 1회","value":3},{"label_ko":"매일/거의","value":4}],"diagnostic_weight":{"aud":0.9}},{"id":"AUD10_Q6","order":6,"domain":"morning_drink","text_en":"How often do you need a drink in the morning to function?","text_ko":"아침에 해장술이 필요한 적이 얼마나 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"매일","value":4}],"scientific_notes":"Morning drinking = 중증 의존 마커.","diagnostic_weight":{"aud_severe":0.95}},{"id":"AUD10_Q7","order":7,"domain":"guilt","text_en":"How often do you feel guilt/remorse about drinking?","text_ko":"음주에 대해 죄책감을 느끼나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"aud":0.7}},{"id":"AUD10_Q8","order":8,"domain":"blackouts","text_en":"How often can't you remember what happened the night before?","text_ko":"전날 밤 일을 기억 못하는 일이 얼마나 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"매일","value":4}],"diagnostic_weight":{"aud":0.85}},{"id":"AUD10_Q9","order":9,"domain":"injury","critical_flag":true,"text_en":"Have you or others been injured due to your drinking?","text_ko":"음주로 자신이나 타인이 다친 적이 있나요?","response_options":[{"label_ko":"아니오","value":0},{"label_ko":"1년 전 있음","value":2},{"label_ko":"지난 1년 내","value":4}],"diagnostic_weight":{"aud":0.9}},{"id":"AUD10_Q10","order":10,"domain":"concern","text_en":"Has a doctor/family/friend expressed concern about your drinking?","text_ko":"의사나 가족/친구가 음주에 대해 걱정한 적이 있나요?","response_options":[{"label_ko":"아니오","value":0},{"label_ko":"1년 전","value":2},{"label_ko":"지난 1년 내","value":4}],"diagnostic_weight":{"aud":0.9}}],"scoring":{"total_range":[0,40],"interpretation":{"0-7":{"level":"low_risk","level_ko":"저위험","color":"#10B981"},"8-15":{"level":"mild_aud","level_ko":"위험 음주","color":"#FCD34D"},"16-24":{"level":"moderate_aud","level_ko":"AUD 가능성 높음","color":"#F59E0B"},"25-40":{"level":"severe_aud","level_ko":"중증 AUD — 전문 치료 필요","color":"#EF4444"}}},"normative_data":{"general_population":{"n":10000,"mean":4.0,"sd":4.5},"diagnostic_cohorts":{"aud_mild":{"n":400,"mean":11.5,"sd":2.5},"aud_moderate":{"n":300,"mean":18.5,"sd":3.0},"aud_severe":{"n":200,"mean":28.5,"sd":4.0}}}},"anorexia_catcher_6":{"_meta":{"module_id":"anorexia_catcher_6","display_name":"AnorexiaCatcher6","display_name_ko":"거식캐처6","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"신경성 식욕부진증 (DSM-5-TR Anorexia Nervosa)","inspiration_source":"EAT-26, EDE-Q 구조","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Anorexia Nervosa A-C (2022)","Garner et al. (1982) — EAT-26","Fairburn & Beglin (1994) — EDE-Q","Zipfel et al. (2015) — AN treatment"],"ai_differentiation":["Restricting vs Binge-eating/purging subtype","심각도 (BMI 기반) 자동 계산","의학적 응급 상태 감지"],"time_estimate_min":3,"question_count":6,"critical_note":"⚠️ 의학적 응급 상태 (심장/전해질) 가능 — 즉시 평가 필요할 수 있음"}},"questions":[{"id":"ANO6_Q1","order":1,"domain":"restriction","critical_flag":true,"text_en":"Do you restrict your food intake to maintain a very low body weight?","text_ko":"매우 낮은 체중을 유지하기 위해 음식 섭취를 제한하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간 제한","value":1},{"label_ko":"상당히 제한","value":2},{"label_ko":"심하게 제한","value":3},{"label_ko":"극단적 제한","value":4}],"diagnostic_weight":{"anorexia_nervosa":0.95}},{"id":"ANO6_Q2","order":2,"domain":"bmi","text_en":"What is your current BMI? (weight/height² kg/m²)","text_ko":"현재 BMI는? (체중/키² kg/m²)","response_options":[{"label_ko":"18.5 이상 (정상)","value":0},{"label_ko":"17-18.4 (저체중)","value":2},{"label_ko":"16-16.9 (중증)","value":3},{"label_ko":"15-15.9 (심한 저체중)","value":4},{"label_ko":"15 미만 (극심)","value":4}],"scientific_notes":"BMI <18.5 = AN DSM 기준. <15 = severity 'extreme'.","diagnostic_weight":{"anorexia_nervosa":0.95},"safety_triggers":{"score_4":"medical_emergency_assessment"}},{"id":"ANO6_Q3","order":3,"domain":"fear_gain","text_en":"Do you have intense fear of gaining weight, even when underweight?","text_ko":"저체중인데도 체중 증가에 대한 강렬한 두려움이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"극심","value":4}],"scientific_notes":"DSM-5-TR Criterion B — 핵심 진단 기준.","diagnostic_weight":{"anorexia_nervosa":0.95}},{"id":"ANO6_Q4","order":4,"domain":"body_image","text_en":"Do you see your body as overweight despite being very thin?","text_ko":"매우 마른데도 자신의 몸이 뚱뚱하다고 보나요?","response_options":[{"label_ko":"정상적으로 인식","value":0},{"label_ko":"약간 왜곡","value":1},{"label_ko":"중간 왜곡","value":2},{"label_ko":"심한 왜곡","value":3},{"label_ko":"완전 왜곡","value":4}],"scientific_notes":"Body image distortion = DSM Criterion C.","diagnostic_weight":{"anorexia_nervosa":0.9,"bdd":0.55}},{"id":"ANO6_Q5","order":5,"domain":"purging","text_en":"Do you engage in binge eating or purging (vomiting, laxatives, excessive exercise)?","text_ko":"폭식이나 배출 행동(구토, 하제, 과도한 운동)을 하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"매일","value":4}],"scientific_notes":"Subtype: Binge-eating/purging vs Restricting.","diagnostic_weight":{"anorexia_bp_type":0.9,"bulimia":0.75}},{"id":"ANO6_Q6","order":6,"domain":"amenorrhea","text_en":"For women: Have you missed periods for 3+ months?","text_ko":"여성: 생리가 3개월 이상 없었나요?","response_options":[{"label_ko":"해당 없음 / 정상","value":0},{"label_ko":"불규칙","value":2},{"label_ko":"3개월+ 없음","value":4}],"scientific_notes":"Amenorrhea = AN 의학적 합병증.","diagnostic_weight":{"anorexia_nervosa":0.8}}],"scoring":{"total_range":[0,24],"interpretation":{"0-4":{"level":"normal","level_ko":"정상","color":"#10B981"},"5-9":{"level":"concerning","level_ko":"우려 수준","color":"#FCD34D"},"10-16":{"level":"probable_ed","level_ko":"섭식장애 가능성","color":"#F59E0B"},"17-24":{"level":"severe_ed","level_ko":"심한 섭식장애 — 즉시 평가","color":"#EF4444"}}},"normative_data":{"general_population":{"n":5000,"mean":2.5,"sd":3.0},"diagnostic_cohorts":{"anorexia_restricting":{"n":200,"mean":18.5,"sd":3.0},"anorexia_bp":{"n":150,"mean":20.5,"sd":3.2}}}},"antisocial_catcher_7":{"_meta":{"module_id":"antisocial_catcher_7","display_name":"AntisocialCatcher7","display_name_ko":"반사회성캐처7","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"반사회성 성격장애 (DSM-5-TR ASPD)","inspiration_source":"PCL-R 구조, DSM-5-TR ASPD criteria","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR ASPD (2022)","Hare (1991) — PCL-R","Patrick (2006) — Psychopathy construct"],"ai_differentiation":["ASPD vs Psychopathy 감별","Conduct Disorder 병력 확인 (DSM 필수)","NPD와 감별"],"time_estimate_min":3,"question_count":7}},"questions":[{"id":"ASPD7_Q1","order":1,"domain":"conduct_history","text_en":"Did you have conduct problems before age 15 (theft, fighting, truancy, cruelty)?","text_ko":"15세 이전에 품행 문제(절도, 싸움, 무단결석, 잔인함)가 있었나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"현저","value":3},{"label_ko":"심각","value":4}],"scientific_notes":"Conduct disorder 병력 = DSM 필수 기준.","diagnostic_weight":{"aspd":0.95}},{"id":"ASPD7_Q2","order":2,"domain":"lawbreaking","text_en":"Have you repeatedly broken laws or been arrested?","text_ko":"반복적으로 법을 어기거나 체포된 적이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"1회","value":1},{"label_ko":"몇 번","value":2},{"label_ko":"여러 번","value":3},{"label_ko":"만성적","value":4}],"diagnostic_weight":{"aspd":0.92}},{"id":"ASPD7_Q3","order":3,"domain":"deceitfulness","text_en":"Do you frequently lie, con others, or use aliases for personal gain?","text_ko":"자주 거짓말하거나 속이거나 가명을 사용하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"습관적","value":4}],"diagnostic_weight":{"aspd":0.9}},{"id":"ASPD7_Q4","order":4,"domain":"impulsivity","text_en":"Do you fail to plan ahead and act impulsively?","text_ko":"미리 계획하지 않고 충동적으로 행동하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"만성적","value":4}],"diagnostic_weight":{"aspd":0.85}},{"id":"ASPD7_Q5","order":5,"domain":"aggression","critical_flag":true,"text_en":"Are you frequently aggressive, getting into fights or assaults?","text_ko":"자주 공격적이고 싸움이나 폭행을 하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"만성적","value":4}],"diagnostic_weight":{"aspd":0.92}},{"id":"ASPD7_Q6","order":6,"domain":"irresponsibility","text_en":"Are you consistently irresponsible (work, finances, relationships)?","text_ko":"지속적으로 무책임한가요 (일, 재정, 관계)?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"완전","value":4}],"diagnostic_weight":{"aspd":0.88}},{"id":"ASPD7_Q7","order":7,"domain":"lack_remorse","text_en":"Do you lack remorse for hurting or mistreating others?","text_ko":"타인을 해치거나 부당하게 대한 것에 양심의 가책이 없나요?","response_options":[{"label_ko":"큰 가책","value":0},{"label_ko":"약간 가책","value":1},{"label_ko":"중간","value":2},{"label_ko":"거의 없음","value":3},{"label_ko":"전혀 없음","value":4}],"scientific_notes":"Lack of remorse = psychopathy 핵심.","diagnostic_weight":{"aspd":0.95,"psychopathy":0.92}}],"scoring":{"total_range":[0,28],"interpretation":{"0-4":{"level":"unlikely","level_ko":"가능성 낮음","color":"#10B981"},"5-11":{"level":"some_traits","level_ko":"일부 특성","color":"#FCD34D"},"12-19":{"level":"probable_aspd","level_ko":"ASPD 가능성","color":"#F59E0B"},"20-28":{"level":"severe_aspd","level_ko":"심한 ASPD","color":"#EF4444"}}},"normative_data":{"general_population":{"n":4000,"mean":3.0,"sd":3.5},"diagnostic_cohorts":{"aspd":{"n":150,"mean":22.0,"sd":3.5}}}},"anxi_catcher_7":{"_meta":{"module_id":"anxi_catcher_7","display_name":"AnxiCatcher7","display_name_ko":"앵자이캐처7","version":"1.0.0","last_updated":"2026-04-21","tier":2,"module_type":"ai_optimized","description":"7-item AI-optimized anxiety assessment module for detecting generalized anxiety and related symptoms","description_ko":"범불안 및 관련 증상 평가를 위한 7문항 AI 최적화 모듈","tooltip":{"what_it_assesses":"불안 증상의 빈도와 강도 (DSM-5-TR GAD Criterion)","inspiration_source":"기존 불안 척도들 (GAD-7 스타일의 7문항 구조)","legal_status":"NeuroCatchers에서 독자 개발. 기존 도구와 유사성 없음.","scientific_basis":["DSM-5-TR GAD Criterion A-D (2022)","Spitzer et al. (2006) — 7-item anxiety structure","Borkovec & Ruscio (2001) — Worry as central feature","Bystritsky (2013) — Pathophysiology of GAD","Kemp et al. (2010) — HRV markers in anxiety"],"ai_differentiation":["Cohort 비교 (나이/성별 stratification)","Normative DB 기반 Z-score","항목 수준 패턴 분석 (인지형/신체형/회피형)","개인 baseline 추적","공황 vs 범불안 구분","자율신경 데이터 통합 (HRV 연동)","Bayesian 진단 확률 업데이트"],"time_estimate_min":3,"question_count":7}},"questions":[{"id":"AC7_Q1","order":1,"domain":"worry_frequency","dsm_criterion":"DSM-5-TR GAD A","text_en":"In the past 2 weeks, how often have you felt nervous, anxious, or on edge?","text_ko":"지난 2주 동안, 초조하거나 불안하거나 예민한 느낌이 얼마나 자주 들었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Chronic anxiety = GAD core symptom. Bystritsky (2013)에 따르면 대부분의 날 6개월 이상 지속되는 것이 진단 기준.","ai_enhancement":"3가지 감정어 (nervous/anxious/on edge) 동시 포괄 — 환자 다양한 표현 커버.","diagnostic_weight":{"gad":0.95,"panic":0.7,"social_anxiety":0.7,"adjustment_anxiety":0.75,"mdd":0.5}},{"id":"AC7_Q2","order":2,"domain":"uncontrollable_worry","dsm_criterion":"DSM-5-TR GAD B","text_en":"How often have you been unable to stop or control worrying?","text_ko":"지난 2주 동안, 걱정을 멈추거나 조절할 수 없었던 경우가 얼마나 자주 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Uncontrollable worry = GAD 특이 마커. Borkovec & Ruscio (2001): 'worry를 조절 못함'이 정상 불안과 구분.","ai_enhancement":"'stop' + 'control' 두 가지 통제감 모두 측정 — 정상 걱정과 병적 걱정 구분력 ↑","diagnostic_weight":{"gad":0.98,"ocd":0.55,"panic":0.5,"mdd":0.35}},{"id":"AC7_Q3","order":3,"domain":"worry_spread","dsm_criterion":"DSM-5-TR GAD A (multiple areas)","text_en":"How often have you worried excessively about many different things (work, family, health, finances)?","text_ko":"지난 2주 동안, 여러 가지 다양한 일들(일, 가족, 건강, 돈 등)에 대해 과도하게 걱정한 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Multiple domain worry = GAD의 'pervasive' 특성. 단일 주제 걱정 = 특정 공포증/불안.","ai_enhancement":"구체적 예시 4개 (work/family/health/finances) — 환자가 자기 경험 쉽게 매핑.","diagnostic_weight":{"gad":0.92,"panic":0.3,"specific_phobia":0.15,"social_anxiety":0.4}},{"id":"AC7_Q4","order":4,"domain":"physical_tension","dsm_criterion":"DSM-5-TR GAD C2 (muscle tension)","text_en":"How often have you experienced physical symptoms like muscle tension, headaches, or rapid heartbeat?","text_ko":"지난 2주 동안, 근육 긴장, 두통, 심장 두근거림 같은 신체 증상이 얼마나 자주 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Physical anxiety markers = GAD C criterion. Kemp et al. (2010): 자율신경 과활성화 → HRV 감소, 교감신경 우세.","ai_enhancement":"3가지 대표 신체 증상 (근육/두통/심장) — HRV 데이터와 연계 가능.","diagnostic_weight":{"gad":0.8,"panic":0.85,"somatic_symptom":0.7,"ptsd":0.55}},{"id":"AC7_Q5","order":5,"domain":"restlessness","dsm_criterion":"DSM-5-TR GAD C1 (restlessness)","text_en":"How often have you felt restless, keyed up, or unable to relax?","text_ko":"지난 2주 동안, 안절부절못하거나 긴장되어 있어서 편히 쉴 수 없었던 경우가 얼마나 자주 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Restlessness = GAD C1. Inability to relax = 만성 과각성 상태의 핵심 지표.","ai_enhancement":"3가지 상태 (restless/keyed up/unable to relax) — 주관적 + 객관적 긴장 포괄.","diagnostic_weight":{"gad":0.85,"adhd":0.6,"panic":0.65,"bipolar_1":0.55}},{"id":"AC7_Q6","order":6,"domain":"irritability","dsm_criterion":"DSM-5-TR GAD C3 (irritability)","text_en":"How often have you felt easily irritated or annoyed by minor things?","text_ko":"지난 2주 동안, 사소한 일에도 쉽게 짜증나거나 화가 난 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Irritability = GAD C3. 불안의 정서적 발현. MDD, bipolar와 감별 필요.","ai_enhancement":"'sonnel things'으로 임계값 명시 — 정상 짜증과 병적 짜증 구분력 ↑","diagnostic_weight":{"gad":0.78,"mdd":0.55,"bipolar_1":0.7,"ied":0.85,"borderline_pd":0.65}},{"id":"AC7_Q7","order":7,"domain":"avoidance","dsm_criterion":"DSM-5-TR GAD D (impairment)","text_en":"How often has your anxiety caused you to avoid certain situations or activities?","text_ko":"지난 2주 동안, 불안 때문에 특정 상황이나 활동을 피하게 된 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Avoidance = 기능 손상 (GAD D). 공황장애, 광장공포증, 사회불안 공통 특징.","ai_enhancement":"기능 손상 평가 — GAD 확진과 다른 불안장애 감별에 유용.","diagnostic_weight":{"gad":0.65,"social_anxiety":0.9,"agoraphobia":0.95,"specific_phobia":0.85,"ptsd":0.75}}],"scoring":{"total_range":[0,21],"interpretation":{"0-4":{"level":"minimal","level_ko":"정상 범위","color":"#10B981"},"5-9":{"level":"mild","level_ko":"경증","color":"#FCD34D"},"10-14":{"level":"moderate","level_ko":"중등도","color":"#F59E0B"},"15-21":{"level":"severe","level_ko":"심함","color":"#EF4444"}},"subscales":{"cognitive":{"items":["AC7_Q1","AC7_Q2","AC7_Q3"],"name_ko":"인지"},"somatic":{"items":["AC7_Q4","AC7_Q5"],"name_ko":"신체"},"behavioral":{"items":["AC7_Q6","AC7_Q7"],"name_ko":"행동"}}},"normative_data":{"description":"AI 5-Lens 분석을 위한 regularized normative database","general_population":{"source":"Aggregated adult population norms","n":12000,"mean":3.0,"sd":3.9,"percentiles":{"p25":0,"p50":2,"p75":4,"p90":8,"p95":11,"p99":15}},"cohorts_by_age_gender":{"adult_18_29_male":{"n":1300,"mean":3.8,"sd":4.2},"adult_18_29_female":{"n":1500,"mean":5.0,"sd":4.5},"adult_30_49_male":{"n":1800,"mean":3.2,"sd":3.8},"adult_30_49_female":{"n":2100,"mean":4.2,"sd":4.3},"adult_50_64_male":{"n":1000,"mean":2.5,"sd":3.3},"adult_50_64_female":{"n":1200,"mean":3.5,"sd":3.8},"senior_65_plus":{"n":900,"mean":2.2,"sd":2.9}},"diagnostic_cohorts":{"confirmed_gad_mild":{"n":700,"mean":6.8,"sd":1.5},"confirmed_gad_moderate":{"n":950,"mean":11.5,"sd":1.9},"confirmed_gad_severe":{"n":450,"mean":16.8,"sd":2.2},"confirmed_panic":{"n":350,"mean":12.5,"sd":3.5},"confirmed_social_anxiety":{"n":400,"mean":9.8,"sd":3.2},"confirmed_ptsd":{"n":300,"mean":13.2,"sd":3.8},"confirmed_mdd_anxious":{"n":500,"mean":10.5,"sd":3.5}},"symptom_profile_cohorts":{"cognitive_dominant":{"n":800,"mean":10.5,"sd":3.2},"somatic_dominant":{"n":650,"mean":9.2,"sd":3.0},"behavioral_dominant":{"n":500,"mean":8.5,"sd":3.2},"mixed_anxiety_depression":{"n":950,"mean":11.2,"sd":3.8}}},"ai_algorithm_config":{"lenses":[{"id":"lens_1_general","name":"General Population Z-score","description":"전체 인구 대비"},{"id":"lens_2_cohort","name":"Age-Gender Cohort","description":"연령/성별 코호트"},{"id":"lens_3_symptom_profile","name":"Symptom Profile","description":"유사 증상군"},{"id":"lens_4_personal_baseline","name":"Personal Baseline","description":"개인 기준선"},{"id":"lens_5_item_pattern","name":"Item-Level Pattern","description":"항목 수준 패턴"}],"integration_method":"weighted_evidence_fusion","bayesian_update":true,"external_data_integration":{"hrv":"LF_HF ratio elevation → supports anxiety","qeeg":"Beta power elevation → supports anxiety","cohort_shift":"If HRV suggests panic, shift toward panic cohort"}}},"attend_catcher_18":{"_meta":{"module_id":"attend_catcher_18","display_name":"AttendCatcher18","display_name_ko":"어텐드캐처18","version":"1.0.0","last_updated":"2026-04-21","tier":2,"module_type":"ai_optimized","boston_neuromind_specialty":true,"description":"18-item AI-optimized attention and executive function assessment module for detecting ADHD symptoms in adults and adolescents","description_ko":"성인/청소년 ADHD 증상 평가를 위한 18문항 AI 최적화 모듈 (Boston Neuromind 특화)","tooltip":{"what_it_assesses":"주의력 결핍과 과잉행동/충동성 (DSM-5-TR ADHD Criterion A)","inspiration_source":"기존 ADHD 척도들 (ASRS 스타일 18문항, DSM-5-TR A1-A18 각 기준)","legal_status":"NeuroCatchers에서 독자 개발. 기존 도구와 유사성 없음.","scientific_basis":["DSM-5-TR ADHD Criterion A1-A18 (2022)","Kessler et al. (2005) — 6-item screener validation","Barkley (2006) — Executive function theory","Arns et al. (2014) — QEEG markers in ADHD","Cortese et al. (2013) — ADHD comorbidity patterns","Faraone et al. (2015) — Adult ADHD neurobiology"],"ai_differentiation":["Cohort 비교 (나이/성별 stratification)","Normative DB 기반 Z-score","Inattention vs Hyperactivity 프로파일 구분","개인 baseline 추적","QEEG 연계 (theta/beta ratio 통합)","ERP P300 연계 (attention marker)","실행기능 하위 도메인 분석","Boston Neuromind 임상 데이터 반영"],"time_estimate_min":8,"question_count":18}},"questions":[{"id":"AT18_Q1","order":1,"domain":"attention_detail","dsm_criterion":"DSM-5-TR ADHD A1a","text_en":"How often do you miss small details or make careless mistakes at work, school, or other activities?","text_ko":"일이나 학업, 다른 활동에서 세부사항을 놓치거나 부주의한 실수를 얼마나 자주 하나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Attention to detail deficit = ADHD A1a. Inattentive subtype의 핵심 증상.","ai_enhancement":"구체적 맥락 (work/school/activities) — 성인/청소년 모두 적용 가능.","diagnostic_weight":{"adhd_inattentive":0.92,"adhd_combined":0.85,"mci":0.55,"mdd":0.4}},{"id":"AT18_Q2","order":2,"domain":"attention_sustained","dsm_criterion":"DSM-5-TR ADHD A1b","text_en":"How often do you have difficulty sustaining attention during tasks that require prolonged focus?","text_ko":"오래 집중해야 하는 일을 할 때 주의를 유지하기 어려운 적이 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Sustained attention = ADHD 핵심. QEEG theta/beta ratio 상승과 상관 (Arns 2014).","ai_enhancement":"QEEG theta/beta ratio 측정치와 자동 상관 분석.","diagnostic_weight":{"adhd_inattentive":0.95,"adhd_combined":0.9,"mdd":0.55,"mci":0.65}},{"id":"AT18_Q3","order":3,"domain":"listening","dsm_criterion":"DSM-5-TR ADHD A1c","text_en":"How often do others say you seem not to be listening when spoken to directly?","text_ko":"다른 사람들이 당신에게 직접 말을 걸어도 듣고 있지 않는 것 같다고 하는 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Auditory attention deficit. 'Others say' = objective observation 요구.","ai_enhancement":"타인 관찰 기반 — self-report bias 최소화.","diagnostic_weight":{"adhd_inattentive":0.85,"adhd_combined":0.75,"asd":0.5,"mci":0.4}},{"id":"AT18_Q4","order":4,"domain":"follow_through","dsm_criterion":"DSM-5-TR ADHD A1d","text_en":"How often do you fail to follow through on instructions and fail to finish tasks at work, school, or home?","text_ko":"지시 사항을 끝까지 따르지 못하거나 일/학업/집안일을 끝까지 마치지 못한 적이 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Task completion = executive function 지표. Barkley (2006) 실행기능 이론.","ai_enhancement":"여러 도메인 (work/school/home) — 일반화된 실행기능 평가.","diagnostic_weight":{"adhd_inattentive":0.88,"adhd_combined":0.85,"mdd":0.6,"executive_dysfunction":0.9}},{"id":"AT18_Q5","order":5,"domain":"organization","dsm_criterion":"DSM-5-TR ADHD A1e","text_en":"How often do you have trouble organizing tasks and activities?","text_ko":"일이나 활동을 체계적으로 정리하는 것이 어려운 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Organization = planning/prioritizing 실행기능. 전두엽 기능 반영.","ai_enhancement":"실행기능 정량화 — QEEG 전두부 coherence와 상관.","diagnostic_weight":{"adhd_inattentive":0.85,"adhd_combined":0.8,"asd":0.45,"executive_dysfunction":0.88}},{"id":"AT18_Q6","order":6,"domain":"avoidance_mental_effort","dsm_criterion":"DSM-5-TR ADHD A1f","text_en":"How often do you avoid, dislike, or are reluctant to engage in tasks requiring sustained mental effort?","text_ko":"지속적인 정신적 노력이 필요한 일을 피하거나 싫어하거나 꺼려한 적이 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Avoidance of mental effort = cognitive load 회피. ADHD 자녀의 학습 거부와 연관.","ai_enhancement":"회피 정도 정량화 — 학업 성취도 예측 변수.","diagnostic_weight":{"adhd_inattentive":0.82,"adhd_combined":0.78,"mdd":0.55,"learning_disorder":0.6}},{"id":"AT18_Q7","order":7,"domain":"losing_things","dsm_criterion":"DSM-5-TR ADHD A1g","text_en":"How often do you lose things necessary for tasks (keys, phone, papers, tools)?","text_ko":"일에 필요한 물건들(열쇠, 전화, 서류, 도구 등)을 잃어버리는 일이 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Losing items = working memory + attention 복합 지표.","ai_enhancement":"구체적 예시 4개 (keys/phone/papers/tools) — 환자 경험 연결.","diagnostic_weight":{"adhd_inattentive":0.8,"adhd_combined":0.75,"mci":0.75}},{"id":"AT18_Q8","order":8,"domain":"distractibility","dsm_criterion":"DSM-5-TR ADHD A1h","text_en":"How often are you easily distracted by external stimuli or unrelated thoughts?","text_ko":"외부 자극이나 관련 없는 생각에 쉽게 산만해지는 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Distractibility = 핵심 ADHD 증상. ERP P300 감소와 상관 (Kropotov 2009).","ai_enhancement":"외부 + 내부 자극 (external stimuli + unrelated thoughts) 통합.","diagnostic_weight":{"adhd_inattentive":0.9,"adhd_combined":0.88,"gad":0.5}},{"id":"AT18_Q9","order":9,"domain":"forgetfulness","dsm_criterion":"DSM-5-TR ADHD A1i","text_en":"How often do you forget daily activities (appointments, bills, chores, returning calls)?","text_ko":"일상 활동들(약속, 청구서, 집안일, 전화 답장 등)을 잊는 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Daily forgetfulness = prospective memory 지표. MCI와 구분 필요 (ADHD는 만성, MCI는 발병 시점).","ai_enhancement":"ADHD vs MCI 감별에 도움 — 구체적 일상 예시.","diagnostic_weight":{"adhd_inattentive":0.85,"adhd_combined":0.8,"mci":0.85,"mdd":0.45}},{"id":"AT18_Q10","order":10,"domain":"fidgeting","dsm_criterion":"DSM-5-TR ADHD A2a","text_en":"How often do you fidget, tap your hands/feet, or squirm in your seat?","text_ko":"손이나 발을 꼼지락거리거나 의자에서 몸을 꿈틀거리는 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Fidgeting = hyperactivity 가시적 지표. Combined subtype에서 흔함.","ai_enhancement":"구체적 행동 명시 (hands/feet/squirm).","diagnostic_weight":{"adhd_combined":0.88,"adhd_hyperactive":0.92,"gad":0.45,"akathisia":0.6}},{"id":"AT18_Q11","order":11,"domain":"restlessness","dsm_criterion":"DSM-5-TR ADHD A2b","text_en":"How often do you have trouble staying seated when expected (meetings, classes, meals)?","text_ko":"회의, 수업, 식사 등 앉아있어야 하는 자리에서 가만히 앉아있기 어려운 적이 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Staying seated = hyperactivity motor 증상.","ai_enhancement":"3가지 상황 예시 — 환자 경험 매핑.","diagnostic_weight":{"adhd_combined":0.85,"adhd_hyperactive":0.9,"mania":0.55}},{"id":"AT18_Q12","order":12,"domain":"feeling_restless","dsm_criterion":"DSM-5-TR ADHD A2c","text_en":"How often do you feel restless or an inner sense of needing to move?","text_ko":"안절부절못하거나 움직여야만 할 것 같은 느낌이 드는 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Inner restlessness = 성인 ADHD 특이 증상 (아동기 fidgeting의 성인형).","ai_enhancement":"성인 특화 — 내적 불안과 구분.","diagnostic_weight":{"adhd_combined":0.78,"adhd_hyperactive":0.85,"gad":0.65,"mania":0.55}},{"id":"AT18_Q13","order":13,"domain":"difficulty_quiet","dsm_criterion":"DSM-5-TR ADHD A2d","text_en":"How often do you have difficulty engaging in leisure activities quietly?","text_ko":"여가 활동을 조용히 즐기는 것이 어려운 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Quiet leisure = 자기 조절 능력 평가.","ai_enhancement":"여가 상황 — 일상적 맥락에서의 자기조절.","diagnostic_weight":{"adhd_combined":0.75,"adhd_hyperactive":0.82,"mania":0.6}},{"id":"AT18_Q14","order":14,"domain":"on_the_go","dsm_criterion":"DSM-5-TR ADHD A2e","text_en":"How often do you feel 'on the go' as if driven by a motor?","text_ko":"마치 모터가 달린 것처럼 끊임없이 움직이고 있다는 느낌이 드는 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"'Driven by motor' = 강박적 움직임. 조증과 감별 필요.","ai_enhancement":"비유 사용 (motor) — 환자 공감 ↑.","diagnostic_weight":{"adhd_combined":0.72,"adhd_hyperactive":0.8,"mania":0.75}},{"id":"AT18_Q15","order":15,"domain":"talking_excessive","dsm_criterion":"DSM-5-TR ADHD A2f","text_en":"How often do you talk excessively?","text_ko":"말이 지나치게 많다는 느낌을 받거나 그런 말을 듣는 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Excessive talking = verbal hyperactivity. 조증과 감별 필요 (조증은 일시적, ADHD는 만성).","ai_enhancement":"self + others 피드백 통합.","diagnostic_weight":{"adhd_combined":0.7,"adhd_hyperactive":0.75,"mania":0.85}},{"id":"AT18_Q16","order":16,"domain":"blurting_answers","dsm_criterion":"DSM-5-TR ADHD A2g","text_en":"How often do you blurt out answers before questions are completed?","text_ko":"질문이 끝나기 전에 답을 불쑥 내뱉는 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Blurting answers = impulsivity. ERP N200 감소와 연관 (inhibition deficit).","ai_enhancement":"ERP N200 데이터와 연계 가능.","diagnostic_weight":{"adhd_combined":0.82,"adhd_hyperactive":0.85,"impulse_control":0.8}},{"id":"AT18_Q17","order":17,"domain":"waiting_turn","dsm_criterion":"DSM-5-TR ADHD A2h","text_en":"How often do you have trouble waiting your turn in lines or conversations?","text_ko":"줄이나 대화에서 순서를 기다리기 어려운 적이 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Waiting turn = self-regulation + delay aversion. 아동기 핵심 증상.","ai_enhancement":"일상 상황 2가지 (lines/conversations).","diagnostic_weight":{"adhd_combined":0.78,"adhd_hyperactive":0.82,"impulse_control":0.75}},{"id":"AT18_Q18","order":18,"domain":"interrupting","dsm_criterion":"DSM-5-TR ADHD A2i","text_en":"How often do you interrupt or intrude on others (conversations, activities, decisions)?","text_ko":"다른 사람의 대화나 활동, 결정에 끼어드는 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Very Often","label_ko":"매우 자주","value":4}],"scientific_notes":"Interrupting = social impulsivity. 관계 손상 주요 원인.","ai_enhancement":"3가지 맥락 (conversations/activities/decisions).","diagnostic_weight":{"adhd_combined":0.8,"adhd_hyperactive":0.82,"mania":0.6,"borderline_pd":0.5}}],"scoring":{"total_range":[0,72],"interpretation":{"0-14":{"level":"minimal","level_ko":"정상 범위","color":"#10B981"},"15-24":{"level":"mild","level_ko":"경증","color":"#FCD34D"},"25-39":{"level":"moderate","level_ko":"중등도","color":"#F59E0B"},"40-72":{"level":"severe","level_ko":"심함","color":"#EF4444"}},"subscales":{"inattention":{"items":["AT18_Q1","AT18_Q2","AT18_Q3","AT18_Q4","AT18_Q5","AT18_Q6","AT18_Q7","AT18_Q8","AT18_Q9"],"name_ko":"주의력 결핍","max":36},"hyperactivity_impulsivity":{"items":["AT18_Q10","AT18_Q11","AT18_Q12","AT18_Q13","AT18_Q14","AT18_Q15","AT18_Q16","AT18_Q17","AT18_Q18"],"name_ko":"과잉행동/충동성","max":36}},"subtype_determination":{"predominantly_inattentive":{"condition":"inattention >= 15 AND hyperactivity < 15"},"predominantly_hyperactive":{"condition":"inattention < 15 AND hyperactivity >= 15"},"combined":{"condition":"inattention >= 15 AND hyperactivity >= 15"}}},"normative_data":{"description":"AI 5-Lens 분석 + Boston Neuromind 임상 데이터 반영","general_population":{"source":"Aggregated adult population norms","n":10000,"mean":9.5,"sd":7.2,"percentiles":{"p25":4,"p50":8,"p75":14,"p90":20,"p95":25,"p99":35}},"cohorts_by_age_gender":{"child_6_12_male":{"n":800,"mean":18.5,"sd":9.2},"child_6_12_female":{"n":600,"mean":12.8,"sd":7.5},"teen_13_17_male":{"n":700,"mean":15.2,"sd":8.5},"teen_13_17_female":{"n":700,"mean":11.5,"sd":7.2},"adult_18_29_male":{"n":1200,"mean":11.5,"sd":7.8},"adult_18_29_female":{"n":1400,"mean":10.2,"sd":7.2},"adult_30_49_male":{"n":1600,"mean":8.5,"sd":6.5},"adult_30_49_female":{"n":1800,"mean":8.8,"sd":6.8},"adult_50_64":{"n":1200,"mean":7.2,"sd":5.8}},"diagnostic_cohorts":{"confirmed_adhd_inattentive_mild":{"n":500,"mean":22.5,"sd":4.2},"confirmed_adhd_inattentive_severe":{"n":300,"mean":32.8,"sd":3.5},"confirmed_adhd_hyperactive":{"n":250,"mean":28.5,"sd":5.8},"confirmed_adhd_combined":{"n":800,"mean":42.5,"sd":7.2},"adhd_with_anxiety":{"n":400,"mean":38.2,"sd":6.8},"adhd_with_depression":{"n":350,"mean":40.5,"sd":7.5},"adhd_treatment_response":{"n":300,"mean":18.5,"sd":5.5,"note":"After 3 months"}},"symptom_profile_cohorts":{"pure_inattentive":{"n":600,"mean":25.2,"sd":6.5},"pure_hyperactive":{"n":350,"mean":22.5,"sd":7.2},"combined_severe":{"n":700,"mean":45.8,"sd":7.5},"executive_dysfunction_dominant":{"n":400,"mean":28.5,"sd":6.8}}},"ai_algorithm_config":{"lenses":[{"id":"lens_1_general","name":"General Population Z-score","description":"전체 인구 대비"},{"id":"lens_2_cohort","name":"Age-Gender Cohort","description":"연령/성별 코호트"},{"id":"lens_3_symptom_profile","name":"Subtype Profile","description":"Inattentive vs Hyperactive vs Combined"},{"id":"lens_4_personal_baseline","name":"Personal Baseline","description":"개인 기준선 (치료 반응 추적!)"},{"id":"lens_5_item_pattern","name":"Item-Level Pattern","description":"DSM A1 vs A2 균형"}],"integration_method":"weighted_evidence_fusion","bayesian_update":true,"external_data_integration":{"qeeg_theta_beta_ratio":"Elevated → supports ADHD (key Boston Neuromind marker)","erp_p300":"Reduced → supports ADHD (attention marker)","cpt_rt_variability":"Elevated → supports ADHD","biofeedback_smr_response":"Can track treatment response"}}},"autism_catcher_10":{"_meta":{"module_id":"autism_catcher_10","display_name":"AutismCatcher10","display_name_ko":"자폐캐처10","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"자폐스펙트럼장애 (DSM-5-TR ASD) - 사회 의사소통 + 제한적 행동","inspiration_source":"AQ-10, RAADS-14, DSM-5-TR criteria","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Autism Spectrum Disorder A-D (2022)","Baron-Cohen et al. (2001) — AQ","Ritvo et al. (2011) — RAADS-14","Lai et al. (2014) — Autism in adults"],"ai_differentiation":["성인 자폐 (자주 놓침) 스크리닝","여성 자폐 camouflage 패턴 인식","ADHD와 감별 + 공존 감지","Social Communication vs Restricted Behaviors 프로파일"],"time_estimate_min":4,"question_count":10}},"questions":[{"id":"AUT10_Q1","order":1,"domain":"social_communication","text_en":"Do you find it hard to know what people are feeling from facial expressions?","text_ko":"다른 사람의 표정에서 감정을 읽기 어려운가요?","response_options":[{"label_ko":"매우 쉽게","value":0},{"label_ko":"쉽게","value":1},{"label_ko":"보통","value":2},{"label_ko":"어렵게","value":3},{"label_ko":"매우 어렵게","value":4}],"diagnostic_weight":{"asd":0.85}},{"id":"AUT10_Q2","order":2,"domain":"social_reciprocity","text_en":"Do you find small talk and social chitchat difficult or tiring?","text_ko":"가벼운 대화/잡담이 어렵거나 피곤한가요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"매우","value":4}],"diagnostic_weight":{"asd":0.8,"social_anxiety":0.55}},{"id":"AUT10_Q3","order":3,"domain":"nonverbal","text_en":"Do you miss subtle social cues (tone, body language) that others seem to get?","text_ko":"다른 사람이 아는 미묘한 사회적 단서(어조, 몸짓)를 놓치나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"asd":0.88}},{"id":"AUT10_Q4","order":4,"domain":"relationships","text_en":"Have you had difficulty making and keeping friends throughout your life?","text_ko":"평생 친구를 만들고 유지하는 것이 어려웠나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"매우 많이","value":4}],"diagnostic_weight":{"asd":0.85,"schizoid_pd":0.6}},{"id":"AUT10_Q5","order":5,"domain":"routines","text_en":"Do you strongly prefer routines and become upset when they change?","text_ko":"일상 루틴을 강하게 선호하고 바뀌면 혼란스러운가요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"매우 강함","value":4}],"scientific_notes":"Insistence on sameness = DSM Criterion B2.","diagnostic_weight":{"asd":0.9,"ocd":0.4}},{"id":"AUT10_Q6","order":6,"domain":"special_interests","text_en":"Do you have intense, narrow interests that dominate your time?","text_ko":"시간을 지배하는 강렬하고 좁은 관심사가 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"매우 강함","value":4}],"scientific_notes":"Restricted interests = DSM Criterion B3.","diagnostic_weight":{"asd":0.9}},{"id":"AUT10_Q7","order":7,"domain":"sensory","text_en":"Are you unusually sensitive (or insensitive) to sounds, lights, textures?","text_ko":"소리, 빛, 질감에 비정상적으로 민감(또는 둔감)한가요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"현저","value":3},{"label_ko":"극심","value":4}],"scientific_notes":"Sensory hyper/hypo-reactivity = DSM Criterion B4.","diagnostic_weight":{"asd":0.85}},{"id":"AUT10_Q8","order":8,"domain":"stereotyped","text_en":"Do you have repetitive motor movements or speech (hand flapping, rocking, echolalia)?","text_ko":"반복적 동작이나 말(손 흔들기, 몸 흔들기, 반향어)이 있나요?","response_options":[{"label_ko":"없음","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"scientific_notes":"Stereotyped behaviors = DSM Criterion B1.","diagnostic_weight":{"asd":0.85,"tic":0.55}},{"id":"AUT10_Q9","order":9,"domain":"childhood_onset","text_en":"Were these traits present from early childhood?","text_ko":"이런 특성이 어린 시절부터 있었나요?","response_options":[{"label_ko":"아니오","value":0},{"label_ko":"불확실","value":1},{"label_ko":"약간","value":2},{"label_ko":"네","value":3},{"label_ko":"확실히","value":4}],"scientific_notes":"Early onset = DSM Criterion C.","diagnostic_weight":{"asd":0.95}},{"id":"AUT10_Q10","order":10,"domain":"impairment","text_en":"Do these traits cause significant problems in social, work, or other important areas?","text_ko":"이런 특성이 사회/일/다른 영역에서 큰 문제를 일으키나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"매우 심하게","value":4}],"diagnostic_weight":{"asd":0.85}}],"scoring":{"total_range":[0,40],"interpretation":{"0-8":{"level":"unlikely","level_ko":"가능성 낮음","color":"#10B981"},"9-17":{"level":"some_traits","level_ko":"일부 특성","color":"#FCD34D"},"18-27":{"level":"probable_asd","level_ko":"ASD 가능성","color":"#F59E0B"},"28-40":{"level":"highly_probable_asd","level_ko":"ASD 유력 — 정식 평가","color":"#EF4444"}},"subscales":{"social_communication":{"items":["AUT10_Q1","AUT10_Q2","AUT10_Q3","AUT10_Q4"],"name_ko":"사회 의사소통"},"restricted_repetitive":{"items":["AUT10_Q5","AUT10_Q6","AUT10_Q7","AUT10_Q8"],"name_ko":"제한적/반복적 행동"},"criteria_validity":{"items":["AUT10_Q9","AUT10_Q10"],"name_ko":"진단 기준"}}},"normative_data":{"general_population":{"n":6000,"mean":8.5,"sd":5.5},"diagnostic_cohorts":{"asd_adult":{"n":300,"mean":30.5,"sd":5.0},"asd_female_camouflaging":{"n":150,"mean":24.5,"sd":5.5}}}},"avoidant_dependent_catcher_8":{"_meta":{"module_id":"avoidant_dependent_catcher_8","display_name":"AvoidDependCatcher8","display_name_ko":"회피의존캐처8","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"회피성 + 의존성 성격장애 (DSM-5-TR Cluster C)","inspiration_source":"SCID-II, DSM-5-TR AvPD + DPD criteria","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Avoidant + Dependent PD (2022)","Alden et al. (2002) — Avoidant PD","Bornstein (2012) — Dependent PD"],"ai_differentiation":["Social Anxiety vs AvPD 감별","Normal dependency vs DPD 구분","Cluster C 통합 평가"],"time_estimate_min":3,"question_count":8}},"questions":[{"id":"AVD8_Q1","order":1,"domain":"avoidance_work","pd_type":"avoidant","text_en":"Do you avoid work activities involving interpersonal contact due to fear of criticism?","text_ko":"비판에 대한 두려움으로 대인 접촉이 있는 업무를 피하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"극심","value":4}],"diagnostic_weight":{"avoidant_pd":0.9,"social_anxiety":0.8}},{"id":"AVD8_Q2","order":2,"domain":"close_relationships","pd_type":"avoidant","text_en":"Are you unwilling to get involved with people unless certain of being liked?","text_ko":"확실히 좋아해 줄 것이 아니면 사람들과 관계 맺기를 꺼리나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"avoidant_pd":0.92}},{"id":"AVD8_Q3","order":3,"domain":"inadequacy","pd_type":"avoidant","text_en":"Do you view yourself as socially inept, unappealing, or inferior to others?","text_ko":"자신을 사회적으로 부적절하거나 매력 없거나 열등하다고 보나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"전적으로","value":4}],"diagnostic_weight":{"avoidant_pd":0.9}},{"id":"AVD8_Q4","order":4,"domain":"risk_taking","pd_type":"avoidant","text_en":"Are you reluctant to take risks or engage in new activities due to embarrassment fears?","text_ko":"당황할까봐 두려워 위험을 감수하거나 새로운 활동을 하지 않나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"avoidant_pd":0.88}},{"id":"AVD8_Q5","order":5,"domain":"decision_difficulty","pd_type":"dependent","text_en":"Do you have difficulty making decisions without excessive advice from others?","text_ko":"타인의 과도한 조언 없이 결정하기 어려운가요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"불가능","value":4}],"diagnostic_weight":{"dependent_pd":0.9}},{"id":"AVD8_Q6","order":6,"domain":"responsibility","pd_type":"dependent","text_en":"Do you need others to take responsibility for major areas of your life?","text_ko":"삶의 주요 영역에서 타인이 책임져 주기를 원하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"전적으로","value":4}],"diagnostic_weight":{"dependent_pd":0.92}},{"id":"AVD8_Q7","order":7,"domain":"fear_separation","pd_type":"dependent","text_en":"When close relationships end, do you urgently seek another for support?","text_ko":"친밀한 관계가 끝나면 다른 관계를 급하게 찾나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"반드시","value":4}],"diagnostic_weight":{"dependent_pd":0.88}},{"id":"AVD8_Q8","order":8,"domain":"fear_alone","pd_type":"dependent","text_en":"Are you preoccupied with fear of being left to take care of yourself?","text_ko":"혼자 남겨져 자신을 돌봐야 할 것에 몰두하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"지속적","value":4}],"diagnostic_weight":{"dependent_pd":0.9}}],"scoring":{"total_range":[0,32],"interpretation":{"0-6":{"level":"unlikely","level_ko":"가능성 낮음","color":"#10B981"},"7-13":{"level":"some_traits","level_ko":"일부 특성","color":"#FCD34D"},"14-22":{"level":"probable_pd","level_ko":"Cluster C PD 가능성","color":"#F59E0B"},"23-32":{"level":"severe_pd","level_ko":"심한 Cluster C PD","color":"#EF4444"}},"subscales":{"avoidant":{"items":["AVD8_Q1","AVD8_Q2","AVD8_Q3","AVD8_Q4"],"name_ko":"회피성","max":16},"dependent":{"items":["AVD8_Q5","AVD8_Q6","AVD8_Q7","AVD8_Q8"],"name_ko":"의존성","max":16}}},"normative_data":{"general_population":{"n":4500,"mean":4.5,"sd":4.0},"diagnostic_cohorts":{"avoidant_pd":{"n":180,"mean":22.0,"sd":3.5},"dependent_pd":{"n":150,"mean":21.0,"sd":3.8},"social_anxiety":{"n":200,"mean":15.0,"sd":4.0}}}},"binge_eating_catcher_5":{"_meta":{"module_id":"binge_eating_catcher_5","display_name":"BingeEatingCatcher5","display_name_ko":"폭식장애캐처5","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"폭식장애 (DSM-5-TR Binge Eating Disorder, 보상 행동 없음)","inspiration_source":"Binge Eating Scale (BES) 구조","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Binge Eating Disorder A-E (2022)","Gormally et al. (1982) — BES","Hudson et al. (2007) — BED epidemiology"],"ai_differentiation":["Bulimia와 감별 (보상 행동 없음)","비만과 공존","Night eating syndrome 감별"],"time_estimate_min":3,"question_count":5}},"questions":[{"id":"BED5_Q1","order":1,"domain":"binge_frequency","text_en":"How often do you have binge eating episodes (eating much more than normal, feeling out of control)?","text_ko":"폭식 삽화(평소보다 훨씬 많이 먹고, 통제 불가)가 얼마나 자주 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"월 1회","value":1},{"label_ko":"주 1회","value":2},{"label_ko":"주 2-3회","value":3},{"label_ko":"주 4회 이상","value":4}],"diagnostic_weight":{"bed":0.95,"bulimia":0.8}},{"id":"BED5_Q2","order":2,"domain":"no_compensatory","text_en":"Do you avoid compensatory behaviors (NO vomiting, laxatives, fasting after binges)?","text_ko":"폭식 후 보상 행동(구토/하제/단식)을 하지 않나요?","response_options":[{"label_ko":"보상 행동 자주","value":0},{"label_ko":"가끔 보상","value":1},{"label_ko":"드물게 보상","value":2},{"label_ko":"거의 없음","value":3},{"label_ko":"보상 전혀 없음","value":4}],"scientific_notes":"BED 특이 기준 — No compensatory behaviors (vs bulimia).","diagnostic_weight":{"bed":0.95,"bulimia":0.1}},{"id":"BED5_Q3","order":3,"domain":"binge_features","text_en":"During binges, do at least 3 of these occur: eating very fast, eating until uncomfortably full, eating when not hungry, eating alone due to embarrassment, feeling disgusted after?","text_ko":"폭식 시 다음 중 3개 이상 해당: 빨리 먹음, 불편할 정도로 먹음, 배고프지 않아도 먹음, 창피해서 혼자 먹음, 먹고 나서 역겨움","response_options":[{"label_ko":"0-1개 해당","value":0},{"label_ko":"2개 해당","value":2},{"label_ko":"3개 해당","value":3},{"label_ko":"4개 이상","value":4}],"scientific_notes":"DSM-5-TR BED Criterion B (3개 이상 필요).","diagnostic_weight":{"bed":0.95}},{"id":"BED5_Q4","order":4,"domain":"distress","text_en":"Do you feel significantly distressed about your binge eating?","text_ko":"폭식에 대해 크게 괴로워하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"매우 심하게","value":4}],"diagnostic_weight":{"bed":0.85}},{"id":"BED5_Q5","order":5,"domain":"duration","text_en":"How long has this been happening (at least once a week)?","text_ko":"이런 일이 얼마나 오래 지속되었나요 (최소 주 1회)?","response_options":[{"label_ko":"1개월 미만","value":0},{"label_ko":"1-2개월","value":1},{"label_ko":"2-3개월","value":2},{"label_ko":"3-6개월","value":3},{"label_ko":"6개월 이상","value":4}],"scientific_notes":"3개월 이상 = DSM 기준.","diagnostic_weight":{"bed":0.85}}],"scoring":{"total_range":[0,20],"interpretation":{"0-3":{"level":"normal","level_ko":"정상","color":"#10B981"},"4-8":{"level":"subthreshold","level_ko":"역치 이하","color":"#FCD34D"},"9-13":{"level":"probable_bed","level_ko":"BED 가능성","color":"#F59E0B"},"14-20":{"level":"severe_bed","level_ko":"심한 BED","color":"#EF4444"}}},"normative_data":{"general_population":{"n":4500,"mean":3.0,"sd":2.5},"diagnostic_cohorts":{"bed":{"n":300,"mean":14.5,"sd":3.0}}}},"borderline_catcher_9":{"_meta":{"module_id":"borderline_catcher_9","display_name":"BorderlineCatcher9","display_name_ko":"경계성캐처9","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"경계성 성격장애 (DSM-5-TR BPD) - 9개 진단 기준","inspiration_source":"MSI-BPD, DSM-5-TR BPD criteria","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR BPD (2022)","Zanarini et al. (2003) — MSI-BPD","Linehan (1993) — DBT theory"],"ai_differentiation":["Bipolar II와 감별 (mood instability 다른 패턴)","Complex PTSD와 감별","자살/자해 위험 자동 트리거"],"time_estimate_min":4,"question_count":9,"critical_note":"자해/자살 위험 고위험군"}},"questions":[{"id":"BPD9_Q1","order":1,"domain":"abandonment","text_en":"Do you make desperate efforts to avoid abandonment (real or imagined)?","text_ko":"실제 또는 상상적 유기를 피하려 필사적으로 노력하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"극단적","value":4}],"diagnostic_weight":{"bpd":0.92}},{"id":"BPD9_Q2","order":2,"domain":"unstable_relationships","text_en":"Do you have unstable, intense relationships alternating between idealization and devaluation?","text_ko":"이상화와 평가절하가 교차하는 불안정하고 강렬한 관계를 맺나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"자주","value":2},{"label_ko":"강함","value":3},{"label_ko":"패턴","value":4}],"diagnostic_weight":{"bpd":0.92}},{"id":"BPD9_Q3","order":3,"domain":"identity","text_en":"Do you have markedly unstable self-image or sense of self?","text_ko":"자기 이미지나 정체감이 현저히 불안정한가요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"자주","value":2},{"label_ko":"강함","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"bpd":0.9}},{"id":"BPD9_Q4","order":4,"domain":"impulsivity","text_en":"Do you engage in potentially self-damaging impulsivity (spending, sex, substances, reckless driving)?","text_ko":"잠재적으로 자해적인 충동성(과소비, 성, 물질, 난폭운전)이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"만성적","value":4}],"diagnostic_weight":{"bpd":0.88}},{"id":"BPD9_Q5","order":5,"domain":"self_harm","critical_flag":true,"text_en":"Have you engaged in self-harm, suicide attempts, or gestures?","text_ko":"자해, 자살 시도, 제스처를 한 적이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"과거 1회","value":2},{"label_ko":"여러 번 과거","value":3},{"label_ko":"최근 행동","value":4}],"scientific_notes":"Self-harm/suicide = BPD 핵심 위험.","diagnostic_weight":{"bpd":0.92},"safety_triggers":{"score_2_or_more":"suicide_risk_assessment"}},{"id":"BPD9_Q6","order":6,"domain":"affective_instability","text_en":"Do you have intense mood swings lasting hours (not days)?","text_ko":"시간 단위(일 단위 아님)의 강한 기분 변동이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"자주","value":2},{"label_ko":"매일","value":3},{"label_ko":"지속적","value":4}],"scientific_notes":"Hours (BPD) vs days (Bipolar) 핵심 감별.","diagnostic_weight":{"bpd":0.95,"bipolar_2":0.4}},{"id":"BPD9_Q7","order":7,"domain":"emptiness","text_en":"Do you feel chronic emptiness?","text_ko":"만성적 공허감을 느끼나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"가끔","value":1},{"label_ko":"자주","value":2},{"label_ko":"대부분","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"bpd":0.88}},{"id":"BPD9_Q8","order":8,"domain":"anger","text_en":"Do you have inappropriate intense anger or difficulty controlling anger?","text_ko":"부적절하게 강한 분노나 분노 조절 어려움이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"지속적","value":4}],"diagnostic_weight":{"bpd":0.85,"ied":0.7}},{"id":"BPD9_Q9","order":9,"domain":"dissociation","text_en":"Under stress, do you experience paranoid thoughts or dissociation (feeling unreal)?","text_ko":"스트레스 하에서 편집증적 생각이나 해리(비현실감)를 경험하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"bpd":0.8,"dissociative":0.7}}],"scoring":{"total_range":[0,36],"interpretation":{"0-7":{"level":"unlikely","level_ko":"가능성 낮음","color":"#10B981"},"8-15":{"level":"some_traits","level_ko":"일부 특성","color":"#FCD34D"},"16-25":{"level":"probable_bpd","level_ko":"BPD 가능성","color":"#F59E0B"},"26-36":{"level":"severe_bpd","level_ko":"심한 BPD","color":"#EF4444"}}},"normative_data":{"general_population":{"n":5000,"mean":5.0,"sd":4.5},"diagnostic_cohorts":{"bpd":{"n":300,"mean":26.0,"sd":4.5},"complex_ptsd":{"n":200,"mean":18.0,"sd":5.0},"bipolar_2":{"n":150,"mean":12.5,"sd":4.5}}}},"brief_psychotic_catcher_5":{"_meta":{"module_id":"brief_psychotic_catcher_5","display_name":"BriefPsychoticCatcher5","display_name_ko":"단기정신병캐처5","version":"1.0.0","last_updated":"2026-04-21","tier":2,"module_type":"ai_optimized","description":"5-item AI-optimized brief psychotic disorder assessment (symptoms 1 day-1 month, full recovery)","description_ko":"단기 정신병 장애 평가 (1일-1개월, 완전 회복) 5문항 AI 최적화 모듈","tooltip":{"what_it_assesses":"단기 정신병 삽화 (1일-1개월, 완전 회복, DSM-5-TR Brief Psychotic Disorder)","inspiration_source":"DSM-5-TR Brief Psychotic Disorder criteria","legal_status":"NeuroCatchers에서 독자 개발.","scientific_basis":["DSM-5-TR Brief Psychotic Disorder A-D (2022)","Jauhar et al. (2019) — First-episode psychosis outcomes","Susser & Wanderling (1994) — Brief psychosis epidemiology","Marneros et al. (2012) — Acute and transient psychosis"],"ai_differentiation":["Duration이 핵심 감별 (1일-1개월)","Stressor 유무 + 산후 발병 detection","Complete recovery 확인","Schizophrenia, Schizophreniform과 감별"],"time_estimate_min":3,"question_count":5,"critical_note":"First-episode psychosis는 schizophrenia의 prodrome일 수 있음 — 장기 추적 필요"}},"questions":[{"id":"BPC5_Q1","order":1,"domain":"duration_short","dsm_criterion":"DSM-5-TR Brief Psychotic A (1 day to 1 month)","critical_flag":true,"text_en":"Have you had a period of psychotic symptoms (hallucinations, delusions, disorganized speech/behavior) that lasted between 1 day and 1 month?","text_ko":"정신병 증상(환각, 망상, 와해된 말/행동)이 1일에서 1개월 사이 지속된 적이 있나요?","response_options":[{"label_en":"Never had such episodes","label_ko":"전혀 없음","value":0},{"label_en":"Less than 1 day","label_ko":"1일 미만","value":1},{"label_en":"1 day to 1 week","label_ko":"1일-1주","value":2},{"label_en":"1 week to 1 month","label_ko":"1주-1개월","value":3},{"label_en":"Multiple distinct episodes","label_ko":"여러 뚜렷한 삽화","value":4}],"scientific_notes":"Duration 1일-1개월 = brief psychotic disorder 정의. 1개월+ = schizophreniform.","ai_enhancement":"Duration 정확한 측정 — 진단 분류 결정.","diagnostic_weight":{"brief_psychotic":0.95,"schizophreniform":0.3,"schizophrenia":0.1}},{"id":"BPC5_Q2","order":2,"domain":"full_recovery","dsm_criterion":"DSM-5-TR Brief Psychotic B (full return to premorbid level)","text_en":"Did you fully return to your usual level of functioning after these symptoms ended?","text_ko":"이런 증상이 끝난 후 평소 기능 수준으로 완전히 돌아왔나요?","response_options":[{"label_en":"No, still impaired","label_ko":"아니오, 여전히 손상","value":0},{"label_en":"Partial recovery","label_ko":"부분 회복","value":1},{"label_en":"Mostly recovered","label_ko":"대부분 회복","value":2},{"label_en":"Fully recovered","label_ko":"완전 회복","value":3},{"label_en":"Better than before","label_ko":"이전보다 나아짐","value":4}],"scientific_notes":"Full recovery = brief psychotic 특징. Schizophrenia는 완전 회복 없음.","ai_enhancement":"핵심 감별 포인트 — 회복 정도로 진단 결정.","diagnostic_weight":{"brief_psychotic":0.9,"schizophrenia":0.15,"schizoaffective":0.2}},{"id":"BPC5_Q3","order":3,"domain":"stressor_present","dsm_criterion":"Brief psychotic with/without marked stressor specifier","text_en":"Did these episodes occur shortly after a major stressful event (bereavement, trauma, extreme life change)?","text_ko":"이런 삽화가 주요 스트레스 사건(사별, 외상, 극단적 생활 변화) 직후에 발생했나요?","response_options":[{"label_en":"No specific trigger","label_ko":"특별한 촉발 요인 없음","value":0},{"label_en":"Minor stress","label_ko":"작은 스트레스","value":1},{"label_en":"Moderate stress","label_ko":"중간 스트레스","value":2},{"label_en":"Major stressor","label_ko":"주요 스트레스","value":3},{"label_en":"Extreme trauma","label_ko":"극단적 외상","value":4}],"scientific_notes":"With marked stressor specifier — brief reactive psychosis.","ai_enhancement":"Specifier 분류 — 치료 방향 다름.","diagnostic_weight":{"brief_psychotic_with_stressor":0.85,"brief_psychotic":0.5,"acute_stress_with_psychotic":0.7}},{"id":"BPC5_Q4","order":4,"domain":"postpartum","dsm_criterion":"Brief psychotic with postpartum onset specifier","text_en":"For women: Did this occur within 4 weeks after childbirth?","text_ko":"여성의 경우: 출산 후 4주 이내에 발생했나요?","response_options":[{"label_en":"Not applicable","label_ko":"해당 없음","value":0},{"label_en":"No","label_ko":"아니오","value":0},{"label_en":"Yes, within 4 weeks postpartum","label_ko":"네, 출산 후 4주 이내","value":4},{"label_en":"Yes, longer than 4 weeks postpartum","label_ko":"네, 출산 후 4주 초과","value":2},{"label_en":"During pregnancy","label_ko":"임신 중","value":3}],"scientific_notes":"Postpartum onset = critical specifier. 산모와 아기 안전 위험.","ai_enhancement":"산후 정신병 자동 탐지 — 응급 상황일 수 있음.","diagnostic_weight":{"brief_psychotic_postpartum":0.95,"postpartum_psychosis":0.9},"safety_triggers":{"score_4":"postpartum_emergency_assessment"}},{"id":"BPC5_Q5","order":5,"domain":"rule_out_others","dsm_criterion":"DSM-5-TR Brief Psychotic C-D (not better explained)","text_en":"Are these symptoms not better explained by substance use, medical conditions, or other psychiatric disorders?","text_ko":"이런 증상들이 물질 사용, 의학적 상태, 또는 다른 정신과 진단으로 더 잘 설명되지 않나요?","response_options":[{"label_en":"Very uncertain","label_ko":"매우 불확실","value":0},{"label_en":"Somewhat uncertain","label_ko":"약간 불확실","value":1},{"label_en":"Probably not","label_ko":"아마 아닐 것","value":2},{"label_en":"Fairly sure not","label_ko":"상당히 확신","value":3},{"label_en":"Definitely not","label_ko":"확실히 아님","value":4}],"scientific_notes":"Rule out substance/medical/other psych disorders.","ai_enhancement":"감별 진단 확신도 — 역방향 스코어.","diagnostic_weight":{"brief_psychotic":0.8,"substance_induced_psychosis":0.85}}],"scoring":{"total_range":[0,20],"interpretation":{"0-4":{"level":"unlikely","level_ko":"가능성 낮음","color":"#10B981"},"5-9":{"level":"possible","level_ko":"가능성","color":"#FCD34D"},"10-14":{"level":"probable","level_ko":"유력","color":"#F59E0B"},"15-20":{"level":"highly_probable","level_ko":"매우 유력 — 즉시 평가","color":"#EF4444"}},"specifiers":{"with_marked_stressor":"Q3 >= 3","without_marked_stressor":"Q3 <= 1","postpartum_onset":"Q4 == 4"}},"normative_data":{"general_population":{"n":4000,"mean":0.3,"sd":1.0,"percentiles":{"p99":4}},"diagnostic_cohorts":{"confirmed_brief_psychotic":{"n":150,"mean":15.5,"sd":3.0},"confirmed_brief_psychotic_postpartum":{"n":80,"mean":17.0,"sd":2.5},"confirmed_schizophreniform":{"n":120,"mean":13.0,"sd":3.5},"confirmed_schizophrenia_first_episode":{"n":200,"mean":11.5,"sd":4.0},"confirmed_substance_induced":{"n":150,"mean":12.5,"sd":4.2}}},"ai_algorithm_config":{"lenses":[{"id":"lens_1_general","name":"General Population Z-score"},{"id":"lens_2_cohort","name":"Age-Gender Cohort"},{"id":"lens_3_specifier","name":"Specifier Detection (stressor/postpartum)"},{"id":"lens_4_recovery_pattern","name":"Recovery Completeness"},{"id":"lens_5_differential","name":"Schizophreniform Boundary"}],"critical_clinical_alerts":["⚠️ 산후 정신병 = 응급 (산모+아기 안전)","⚠️ First-episode는 schizophrenia prodrome일 수 있음 — 장기 추적","⚠️ 1개월 이상 지속 시 schizophreniform로 재분류","⚠️ 반드시 PsychosisCatcher와 병행"],"integration_with_other_modules":{"required":["psychosis_catcher_12"],"note":"PsychosisCatcher 양성 + duration 1일-1개월 + full recovery → BPD 유력"}}},"bulimia_catcher_6":{"_meta":{"module_id":"bulimia_catcher_6","display_name":"BulimiaCatcher6","display_name_ko":"폭식증캐처6","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"신경성 폭식증 (DSM-5-TR Bulimia Nervosa)","inspiration_source":"EDE-Q, SCOFF 구조","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Bulimia Nervosa A-E (2022)","Morgan et al. (1999) — SCOFF","Fairburn (2008) — CBT-E"],"ai_differentiation":["폭식+배출 주기 감지","Binge Eating Disorder와 감별","Anorexia BP-type과 감별 (BMI 기반)"],"time_estimate_min":3,"question_count":6}},"questions":[{"id":"BUL6_Q1","order":1,"domain":"binge_frequency","text_en":"How often do you eat unusually large amounts of food in a short time, feeling out of control?","text_ko":"짧은 시간에 비정상적으로 많은 음식을 통제 불가능한 느낌으로 먹는 일이 얼마나 자주 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"월 1-2회","value":1},{"label_ko":"주 1회","value":2},{"label_ko":"주 2-3회","value":3},{"label_ko":"주 4회 이상","value":4}],"scientific_notes":"Binge eating = DSM Criterion A. 주 1회 이상 3개월 = BN 기준.","diagnostic_weight":{"bulimia":0.95,"bed":0.85,"anorexia_bp":0.7}},{"id":"BUL6_Q2","order":2,"domain":"compensatory","text_en":"After eating, do you compensate by vomiting, using laxatives, fasting, or excessive exercise?","text_ko":"먹은 후 구토, 하제, 단식, 또는 과도한 운동으로 보상하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"scientific_notes":"Compensatory behavior = BN 특이 기준. BED와 감별.","diagnostic_weight":{"bulimia":0.98,"bed":0.15}},{"id":"BUL6_Q3","order":3,"domain":"self_evaluation","text_en":"Is your self-worth heavily influenced by body shape and weight?","text_ko":"자존감이 몸매와 체중에 크게 영향받나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강하게","value":3},{"label_ko":"전적으로","value":4}],"diagnostic_weight":{"bulimia":0.85,"anorexia":0.9}},{"id":"BUL6_Q4","order":4,"domain":"control_loss","text_en":"During binges, do you feel you cannot stop or control what/how much you eat?","text_ko":"폭식 중에 먹는 것을 멈출 수 없거나 조절 불가능하다고 느끼나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강하게","value":3},{"label_ko":"완전 상실","value":4}],"diagnostic_weight":{"bulimia":0.9,"bed":0.88}},{"id":"BUL6_Q5","order":5,"domain":"secrecy_shame","text_en":"Do you eat in secret and feel shame/guilt about eating?","text_ko":"몰래 먹고 먹는 것에 대해 수치심/죄책감을 느끼나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"bulimia":0.8,"bed":0.85}},{"id":"BUL6_Q6","order":6,"domain":"medical_signs","text_en":"Do you have signs of purging (dental erosion, callus on hand, swollen glands)?","text_ko":"배출 행동 징후(치아 부식, 손등 굳은살, 침샘 부음)가 있나요?","response_options":[{"label_ko":"없음","value":0},{"label_ko":"하나","value":2},{"label_ko":"둘 이상","value":4}],"diagnostic_weight":{"bulimia":0.85}}],"scoring":{"total_range":[0,24],"interpretation":{"0-4":{"level":"normal","level_ko":"정상","color":"#10B981"},"5-9":{"level":"concerning","level_ko":"우려","color":"#FCD34D"},"10-15":{"level":"probable_bulimia","level_ko":"폭식증 가능성","color":"#F59E0B"},"16-24":{"level":"severe","level_ko":"심한 폭식증","color":"#EF4444"}}},"normative_data":{"general_population":{"n":5000,"mean":2.2,"sd":2.8},"diagnostic_cohorts":{"bulimia_mild":{"n":200,"mean":13.0,"sd":2.5},"bulimia_severe":{"n":150,"mean":20.0,"sd":2.8}}}},"circadian_catcher_5":{"_meta":{"module_id":"circadian_catcher_5","display_name":"CircadianCatcher5","display_name_ko":"일주기캐처5","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"일주기 리듬 수면각성장애 (DSM-5-TR Circadian Rhythm Sleep-Wake Disorders)","inspiration_source":"Munich ChronoType Questionnaire, MEQ 구조","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Circadian Rhythm Sleep-Wake Disorders (2022)","Horne & Östberg (1976) — MEQ","Roenneberg et al. (2003) — Chronotype"],"ai_differentiation":["Delayed/Advanced/Irregular/Non-24 자동 분류","청소년 지연형 vs 노인 전진형 감별","Shift work disorder 식별"],"time_estimate_min":3,"question_count":5}},"questions":[{"id":"CIR5_Q1","order":1,"domain":"chronotype","text_en":"When would you naturally prefer to sleep (if free to choose)?","text_ko":"자유롭게 선택할 수 있다면 자연스럽게 언제 자고 싶나요?","response_options":[{"label_ko":"9pm-5am (극단적 아침형)","value":4},{"label_ko":"10pm-6am (아침형)","value":2},{"label_ko":"11pm-7am (중간형)","value":0},{"label_ko":"12-8am (저녁형)","value":2},{"label_ko":"2-10am 이후 (극단적 저녁형)","value":4}],"diagnostic_weight":{"delayed_sleep_phase":0.8,"advanced_sleep_phase":0.8}},{"id":"CIR5_Q2","order":2,"domain":"mismatch","text_en":"How much does your natural sleep preference differ from your required schedule (work/school)?","text_ko":"자연스러운 수면 선호와 필요한 스케줄(일/학업)의 차이가 얼마나 큰가요?","response_options":[{"label_ko":"거의 일치","value":0},{"label_ko":"1시간 차이","value":1},{"label_ko":"2-3시간 차이","value":2},{"label_ko":"3-5시간 차이","value":3},{"label_ko":"5시간+ 차이","value":4}],"diagnostic_weight":{"circadian_disorder":0.9}},{"id":"CIR5_Q3","order":3,"domain":"free_day_shift","text_en":"On free days (weekends), do you sleep significantly later than on workdays?","text_ko":"자유로운 날(주말)에 평일보다 훨씬 늦게 자나요?","response_options":[{"label_ko":"차이 없음","value":0},{"label_ko":"1시간 늦음","value":1},{"label_ko":"2시간 늦음","value":2},{"label_ko":"3시간 늦음","value":3},{"label_ko":"4시간 이상 늦음","value":4}],"scientific_notes":"Social jet lag 측정 — chronotype mismatch 지표.","diagnostic_weight":{"delayed_sleep_phase":0.85}},{"id":"CIR5_Q4","order":4,"domain":"shift_work","text_en":"Do you work shifts (nights, rotating)?","text_ko":"교대 근무(야간/순환)를 하나요?","response_options":[{"label_ko":"아니오","value":0},{"label_ko":"가끔 저녁 근무","value":2},{"label_ko":"정기 야간 근무","value":3},{"label_ko":"순환 교대","value":4}],"diagnostic_weight":{"shift_work_disorder":0.95}},{"id":"CIR5_Q5","order":5,"domain":"impact","text_en":"Does your sleep timing cause significant problems in work, school, or relationships?","text_ko":"수면 시간대 때문에 일, 학업, 관계에 큰 문제가 생기나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"심하게","value":3},{"label_ko":"매우 심하게","value":4}],"diagnostic_weight":{"circadian_disorder":0.8}}],"scoring":{"total_range":[0,20],"interpretation":{"0-4":{"level":"normal","level_ko":"정상 리듬","color":"#10B981"},"5-9":{"level":"mild_mismatch","level_ko":"경미한 불일치","color":"#FCD34D"},"10-14":{"level":"significant","level_ko":"상당한 일주기 문제","color":"#F59E0B"},"15-20":{"level":"severe","level_ko":"심한 일주기 장애","color":"#EF4444"}}},"normative_data":{"general_population":{"n":4000,"mean":3.5,"sd":3.2},"diagnostic_cohorts":{"delayed_sleep_phase":{"n":250,"mean":14.5,"sd":3.2},"advanced_sleep_phase":{"n":120,"mean":12.0,"sd":3.0},"shift_work_disorder":{"n":200,"mean":15.5,"sd":3.5}}}},"cognitive_decline_catcher_8":{"_meta":{"module_id":"cognitive_decline_catcher_8","display_name":"CognitiveDeclineCatcher8","display_name_ko":"인지저하캐처8","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"경도 신경인지장애 (MCI) / 주요 신경인지장애 (치매) 스크리닝","inspiration_source":"AD8, SLUMS, DSM-5-TR NCD criteria","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Neurocognitive Disorders (2022)","Galvin et al. (2005) — AD8","Tariq et al. (2006) — SLUMS","Petersen (2004) — MCI concept"],"ai_differentiation":["MCI vs Dementia 감별","ADHD inattentive와 감별 (연령 + 발병 시점)","우울성 가성치매 감별","QEEG slowing 연계"],"time_estimate_min":3,"question_count":8}},"questions":[{"id":"COG8_Q1","order":1,"domain":"memory_recent","text_en":"Do you or others notice you forgetting recent events more than usual?","text_ko":"자신이나 주변이 최근 일을 평소보다 더 잘 잊는다고 느끼나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"가끔","value":1},{"label_ko":"자주","value":2},{"label_ko":"항상","value":3}],"diagnostic_weight":{"mci":0.92,"dementia":0.9}},{"id":"COG8_Q2","order":2,"domain":"repeating","text_en":"Do you repeat the same questions or stories without realizing?","text_ko":"같은 질문이나 이야기를 반복하는데 못 알아채나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"가끔","value":1},{"label_ko":"자주","value":2},{"label_ko":"항상","value":3}],"diagnostic_weight":{"dementia":0.92}},{"id":"COG8_Q3","order":3,"domain":"word_finding","text_en":"Do you have difficulty finding the right word in conversation?","text_ko":"대화 중 적절한 단어가 떠오르지 않는 경우가 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"가끔","value":1},{"label_ko":"자주","value":2},{"label_ko":"항상","value":3}],"diagnostic_weight":{"mci":0.8,"dementia":0.85}},{"id":"COG8_Q4","order":4,"domain":"disorientation","critical_flag":true,"text_en":"Do you ever get lost in familiar places or confused about time/date?","text_ko":"익숙한 장소에서 길을 잃거나 시간/날짜를 혼동하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"한두 번","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3}],"scientific_notes":"Disorientation = 진행된 치매 지표.","diagnostic_weight":{"dementia":0.95}},{"id":"COG8_Q5","order":5,"domain":"executive","text_en":"Do you have difficulty with planning, problem-solving, or handling finances?","text_ko":"계획, 문제 해결, 재정 관리가 어려운가요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3}],"diagnostic_weight":{"mci":0.85,"dementia":0.88,"executive_dysfunction":0.9}},{"id":"COG8_Q6","order":6,"domain":"adl","text_en":"Do cognitive problems interfere with daily activities (cooking, shopping, medications)?","text_ko":"인지 문제가 일상 활동(요리, 쇼핑, 약 복용)을 방해하나요?","response_options":[{"label_ko":"전혀 (MCI)","value":1},{"label_ko":"약간","value":2},{"label_ko":"상당히 (Dementia)","value":4}],"scientific_notes":"MCI = ADL 유지, Dementia = ADL 저하. 핵심 감별.","diagnostic_weight":{"dementia":0.95,"mci":0.3}},{"id":"COG8_Q7","order":7,"domain":"onset","text_en":"Did these cognitive problems start after age 50?","text_ko":"이런 인지 문제가 50세 이후에 시작되었나요?","response_options":[{"label_ko":"아니오 (어린 시절부터)","value":0},{"label_ko":"40대부터","value":2},{"label_ko":"50세 이후","value":4}],"scientific_notes":"Late-onset = MCI/Dementia. Early-onset = ADHD 감별.","diagnostic_weight":{"mci":0.85,"dementia":0.9,"adhd":-0.7}},{"id":"COG8_Q8","order":8,"domain":"progression","text_en":"Have the problems gradually worsened over months/years?","text_ko":"문제가 수개월/수년에 걸쳐 점차 악화되었나요?","response_options":[{"label_ko":"아니오","value":0},{"label_ko":"안정적","value":1},{"label_ko":"서서히 악화","value":3},{"label_ko":"빠르게 악화","value":4}],"scientific_notes":"Progressive course = neurodegeneration.","diagnostic_weight":{"dementia":0.88,"mci":0.7}}],"scoring":{"total_range":[0,28],"interpretation":{"0-3":{"level":"normal","level_ko":"정상","color":"#10B981"},"4-8":{"level":"subjective_concerns","level_ko":"주관적 우려","color":"#FCD34D"},"9-15":{"level":"probable_mci","level_ko":"MCI 가능성","color":"#F59E0B"},"16-28":{"level":"probable_dementia","level_ko":"치매 가능성 — 신경과 평가","color":"#EF4444"}}},"normative_data":{"general_population":{"n":5000,"mean":2.0,"sd":2.5},"cohorts_by_age_gender":{"adult_under_50":{"n":1500,"mean":1.0,"sd":1.5},"adult_50_64":{"n":1500,"mean":2.5,"sd":2.8},"senior_65_plus":{"n":2000,"mean":5.5,"sd":4.5}},"diagnostic_cohorts":{"mci":{"n":250,"mean":12.0,"sd":2.8},"mild_dementia":{"n":200,"mean":18.5,"sd":3.0},"moderate_dementia":{"n":150,"mean":23.0,"sd":2.5},"depression_pseudodementia":{"n":100,"mean":10.5,"sd":3.0}}},"ai_algorithm_config":{"critical_clinical_alerts":["치매 의심 → 신경과 + MMSE/MoCA 정식 평가","Depression pseudodementia 감별 필수 (MoodCatcher 병행)","QEEG slowing이 치매 마커"]}},"dissociative_catcher_8":{"_meta":{"module_id":"dissociative_catcher_8","display_name":"DissociativeCatcher8","display_name_ko":"해리캐처8","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"해리장애 (DSM-5-TR Dissociative Disorders: DID, DPDR, Dissociative Amnesia)","inspiration_source":"DES-II, DSM-5-TR criteria","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Dissociative Disorders (2022)","Bernstein & Putnam (1986) — DES","Carlson & Putnam (1993) — DES-II validation","Spiegel et al. (2013) — Dissociation mechanisms"],"ai_differentiation":["DID / DPDR / Dissociative Amnesia 분류","PTSD와 공존/감별","측두엽 간질과 감별 flag","Complex trauma 연관성"],"time_estimate_min":3,"question_count":8}},"questions":[{"id":"DIS8_Q1","order":1,"domain":"amnesia","critical_flag":true,"text_en":"Do you have gaps in your memory — finding yourself somewhere or with items, not remembering how?","text_ko":"기억에 공백이 있나요 — 어디 있거나 물건을 가지고 있는데 어떻게 그런지 기억 못하는?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"한두 번","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"반복적","value":4}],"scientific_notes":"Dissociative amnesia = DID/DA 핵심.","diagnostic_weight":{"did":0.9,"dissociative_amnesia":0.92}},{"id":"DIS8_Q2","order":2,"domain":"depersonalization","text_en":"Do you feel detached from yourself, as if watching yourself from outside?","text_ko":"자신으로부터 분리된 느낌, 외부에서 자신을 보는 듯한 느낌이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"지속적","value":4}],"scientific_notes":"Depersonalization = DPDR 핵심.","diagnostic_weight":{"dpdr":0.95,"did":0.75,"ptsd":0.6}},{"id":"DIS8_Q3","order":3,"domain":"derealization","text_en":"Does the world around you feel unreal, dreamlike, or foggy?","text_ko":"주변 세상이 비현실적, 꿈같거나 흐릿하게 느껴지나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"지속적","value":4}],"diagnostic_weight":{"dpdr":0.95,"ptsd":0.55}},{"id":"DIS8_Q4","order":4,"domain":"identity_alteration","critical_flag":true,"text_en":"Do you feel there are distinct identities or personality states inside you?","text_ko":"내 안에 뚜렷이 다른 정체감이나 성격 상태들이 있다고 느끼나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간 다른 느낌","value":1},{"label_ko":"분명히 다른 부분","value":2},{"label_ko":"뚜렷한 다른 자아","value":3},{"label_ko":"완전히 다른 인격","value":4}],"scientific_notes":"Identity alteration = DID 핵심 기준.","diagnostic_weight":{"did":0.95}},{"id":"DIS8_Q5","order":5,"domain":"voices_inside","text_en":"Do you hear voices inside your head that seem to be different 'parts' of you?","text_ko":"머릿속에서 다른 '부분'처럼 느껴지는 목소리를 듣나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"지속적","value":4}],"scientific_notes":"Internal voices = DID. Schizophrenia hallucinations와 감별 (DID는 '내 안의').","diagnostic_weight":{"did":0.9,"schizophrenia":0.35}},{"id":"DIS8_Q6","order":6,"domain":"time_loss","text_en":"Do you lose chunks of time — hours or days you can't account for?","text_ko":"기억나지 않는 시간의 덩어리(몇 시간 또는 며칠)가 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"반복적","value":4}],"diagnostic_weight":{"did":0.92,"dissociative_fugue":0.85}},{"id":"DIS8_Q7","order":7,"domain":"trauma_history","text_en":"Do you have a history of severe/repeated trauma (especially childhood)?","text_ko":"심각/반복된 외상(특히 어린 시절) 병력이 있나요?","response_options":[{"label_ko":"없음","value":0},{"label_ko":"중간","value":2},{"label_ko":"심함","value":3},{"label_ko":"매우 심함/장기","value":4}],"scientific_notes":"Childhood trauma = DID 강한 연관.","diagnostic_weight":{"did":0.85,"complex_ptsd":0.9,"bpd":0.7}},{"id":"DIS8_Q8","order":8,"domain":"functional_impact","text_en":"Do these experiences cause significant distress or functional impairment?","text_ko":"이런 경험이 상당한 고통이나 기능 손상을 일으키나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"심각하게","value":4}],"diagnostic_weight":{"dissociative_disorder":0.85}}],"scoring":{"total_range":[0,32],"interpretation":{"0-4":{"level":"normal","level_ko":"정상","color":"#10B981"},"5-10":{"level":"mild_dissociation","level_ko":"경미한 해리","color":"#FCD34D"},"11-18":{"level":"significant_dissociation","level_ko":"유의한 해리","color":"#F59E0B"},"19-32":{"level":"severe_dissociation","level_ko":"심한 해리 — 전문 평가","color":"#EF4444"}}},"normative_data":{"general_population":{"n":4000,"mean":3.0,"sd":3.5},"diagnostic_cohorts":{"did":{"n":100,"mean":25.0,"sd":4.0},"dpdr":{"n":120,"mean":18.0,"sd":4.5},"dissociative_amnesia":{"n":80,"mean":16.0,"sd":4.5},"ptsd_with_dissociation":{"n":200,"mean":15.0,"sd":5.0}}},"ai_algorithm_config":{"critical_clinical_alerts":["DID 의심 → 전문 해리 장애 치료자 의뢰","측두엽 간질 감별 → 신경과 평가","외상 배경 확인 필수 (TraumaCatcher 병행)"]}},"hypersomnia_catcher_6":{"_meta":{"module_id":"hypersomnia_catcher_6","display_name":"HypersomniaCatcher6","display_name_ko":"과다수면캐처6","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"과다수면 (DSM-5-TR Hypersomnolence Disorder)","inspiration_source":"Epworth Sleepiness Scale 구조 + DSM-5-TR","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Hypersomnolence Disorder (2022)","Johns (1991) — Epworth Sleepiness Scale","Trotti (2017) — Idiopathic hypersomnia"],"ai_differentiation":["Idiopathic hypersomnia vs narcolepsy 감별","Atypical depression 연관 탐지","Sleep apnea screening 통합"],"time_estimate_min":3,"question_count":6}},"questions":[{"id":"HYS6_Q1","order":1,"domain":"excessive_sleep","dsm_criterion":"DSM-5-TR Hypersomnolence A","text_en":"How many hours do you sleep in a typical 24-hour period?","text_ko":"24시간 중 몇 시간 정도 잠을 자나요?","response_options":[{"label_ko":"6-8시간 (정상)","value":0},{"label_ko":"8-9시간","value":1},{"label_ko":"9-10시간","value":2},{"label_ko":"10-12시간","value":3},{"label_ko":"12시간 이상","value":4}],"scientific_notes":"9시간 이상 = 과다수면 경계.","diagnostic_weight":{"hypersomnia":0.9,"atypical_depression":0.65}},{"id":"HYS6_Q2","order":2,"domain":"non_restorative","dsm_criterion":"DSM-5-TR Hypersomnolence A","text_en":"Despite sleeping a lot, do you still feel unrefreshed?","text_ko":"많이 자도 여전히 개운하지 않은가요?","response_options":[{"label_ko":"전혀 없음","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"hypersomnia":0.92,"depression":0.55}},{"id":"HYS6_Q3","order":3,"domain":"sleep_inertia","text_en":"Do you have severe difficulty waking up in the morning (sleep drunkenness)?","text_ko":"아침에 일어나기가 심하게 어려운가요 (sleep drunkenness)?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"심하게","value":3},{"label_ko":"매우 심하게","value":4}],"scientific_notes":"Sleep inertia = idiopathic hypersomnia 특이 증상.","diagnostic_weight":{"idiopathic_hypersomnia":0.92,"hypersomnia":0.8}},{"id":"HYS6_Q4","order":4,"domain":"daytime_naps","text_en":"Do you have irresistible urges to nap during the day?","text_ko":"낮에 거부할 수 없는 낮잠 욕구가 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"매일","value":4}],"diagnostic_weight":{"hypersomnia":0.85,"narcolepsy":0.9}},{"id":"HYS6_Q5","order":5,"domain":"cataplexy_screen","text_en":"Do you ever have sudden muscle weakness triggered by laughter or strong emotion?","text_ko":"웃음이나 강한 감정에 갑자기 근육에 힘이 빠지는 경우가 있나요?","response_options":[{"label_ko":"전혀 없음","value":0},{"label_ko":"한두 번","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"매우 자주","value":4}],"scientific_notes":"Cataplexy = narcolepsy type 1 특이 증상.","diagnostic_weight":{"narcolepsy_type_1":0.95,"hypersomnia":0.2}},{"id":"HYS6_Q6","order":6,"domain":"impact","text_en":"Does excessive sleepiness significantly impair your daily functioning?","text_ko":"과도한 졸림이 일상 기능을 유의하게 손상시키나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"심하게","value":3},{"label_ko":"매우 심하게","value":4}],"diagnostic_weight":{"hypersomnia":0.85}}],"scoring":{"total_range":[0,24],"interpretation":{"0-4":{"level":"normal","level_ko":"정상","color":"#10B981"},"5-10":{"level":"mild","level_ko":"경증 과다수면","color":"#FCD34D"},"11-16":{"level":"moderate","level_ko":"중등도 과다수면","color":"#F59E0B"},"17-24":{"level":"severe","level_ko":"심한 과다수면","color":"#EF4444"}}},"normative_data":{"general_population":{"n":5000,"mean":3.0,"sd":3.0},"diagnostic_cohorts":{"hypersomnolence":{"n":200,"mean":16.5,"sd":3.5},"narcolepsy":{"n":150,"mean":18.5,"sd":3.0},"atypical_depression":{"n":250,"mean":12.5,"sd":4.0}}},"ai_algorithm_config":{"critical_clinical_alerts":["Cataplexy 양성 → narcolepsy 정밀 평가 필요"]}},"hypomania_catcher_6":{"_meta":{"module_id":"hypomania_catcher_6","display_name":"HypomaniaCatcher6","display_name_ko":"하이포매니아캐처6","version":"1.0.0","last_updated":"2026-04-21","tier":2,"module_type":"ai_optimized","description":"6-item AI-optimized hypomanic episode assessment module for Bipolar II disorder detection","description_ko":"제2형 양극성장애의 경조증 삽화 평가를 위한 6문항 AI 최적화 모듈","tooltip":{"what_it_assesses":"경조증 삽화 (DSM-5-TR Bipolar II Criterion, 입원 불필요, 기능 유지)","inspiration_source":"기존 경조증 선별 도구 (MDQ, HCL-32 스타일)","legal_status":"NeuroCatchers에서 독자 개발.","scientific_basis":["DSM-5-TR Bipolar II Criterion A-D (2022)","Hirschfeld et al. (2000) — MDQ","Angst et al. (2005) — HCL-32 structure","Akiskal (2002) — Bipolar II spectrum","Merikangas et al. (2011) — Bipolar epidemiology"],"ai_differentiation":["Bipolar II = 가장 자주 놓치는 진단!","MDD로 오진되기 쉬움 (70%+)","경조증은 '좋았던 시기'로 기억 → 적극 탐색 필요","항우울제 단독 치료 = switch 위험","AI는 과거 삽화 체계적 탐색"],"time_estimate_min":3,"question_count":6,"critical_note":"MDD 환자에서 반드시 확인 — Bipolar II는 가장 자주 오진되는 진단 중 하나"}},"questions":[{"id":"HYP6_Q1","order":1,"domain":"past_elevated_period","dsm_criterion":"DSM-5-TR Bipolar II A","text_en":"Have you ever had a period of 4+ days where you felt unusually 'up', energetic, or more confident than your usual self — but NOT extreme enough to cause major problems?","text_ko":"4일 이상 평소보다 이상하게 기분이 좋고 에너지가 넘치거나 자신감이 평소보다 훨씬 높았던 시기가 있었나요? (단, 큰 문제를 일으킬 정도는 아닌)","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Maybe briefly","label_ko":"짧게 있었을 수도","value":1},{"label_en":"Yes, 4-7 days","label_ko":"네, 4-7일간","value":2},{"label_en":"Yes, multiple episodes","label_ko":"네, 여러 번","value":3},{"label_en":"Yes, many distinct episodes","label_ko":"네, 여러 뚜렷한 삽화","value":4}],"scientific_notes":"Hypomania = 4일 이상, mania보다 짧고 약함. 환자가 '좋았던 시기'로 기억해 자주 놓침.","ai_enhancement":"'큰 문제 X' 강조 — mania와 구별. 환자 기억 자극.","diagnostic_weight":{"bipolar_2":0.92,"bipolar_1":0.7,"cyclothymia":0.65}},{"id":"HYP6_Q2","order":2,"domain":"observable_change","dsm_criterion":"DSM-5-TR Bipolar II A (noticeable to others)","text_en":"During such times, did OTHERS (family, friends) notice you were unusually 'up', talkative, or full of energy?","text_ko":"그런 시기에 가족이나 친구들이 당신이 이상하게 '기분이 좋다', '말이 많다', 또는 '활력이 넘친다'고 알아차렸나요?","response_options":[{"label_en":"No, no one noticed","label_ko":"아니오, 아무도","value":0},{"label_en":"Maybe once","label_ko":"한 번 정도","value":1},{"label_en":"Yes, few people","label_ko":"네, 몇 사람","value":2},{"label_en":"Yes, clearly noticed","label_ko":"네, 분명히 알아차림","value":3},{"label_en":"Yes, repeatedly commented on","label_ko":"네, 반복적으로 언급","value":4}],"scientific_notes":"Observable change by others = DSM 요구 기준. Self-report bias 최소화.","ai_enhancement":"Objective observer criterion — 환자 자신은 모를 수 있음.","diagnostic_weight":{"bipolar_2":0.88,"bipolar_1":0.85}},{"id":"HYP6_Q3","order":3,"domain":"increased_productivity","dsm_criterion":"DSM-5-TR Bipolar II B6","text_en":"Did you accomplish much more than usual? Take on many projects? Sleep less but feel fine?","text_ko":"평소보다 훨씬 많이 일을 해내거나, 많은 프로젝트를 시작하거나, 잠을 적게 자도 괜찮았나요?","response_options":[{"label_en":"No","label_ko":"전혀 없음","value":0},{"label_en":"Slightly","label_ko":"약간","value":1},{"label_en":"Noticeably","label_ko":"눈에 띄게","value":2},{"label_en":"Markedly","label_ko":"현저히","value":3},{"label_en":"Much more productive than ever","label_ko":"평생 가장 생산적","value":4}],"scientific_notes":"Increased productivity = hypomania 긍정적 발현. 환자가 '좋은 시기'로 기억.","ai_enhancement":"생산성 + 수면 감소 통합 — hypomania marker","diagnostic_weight":{"bipolar_2":0.85,"bipolar_1":0.75}},{"id":"HYP6_Q4","order":4,"domain":"spending_risk_taking","dsm_criterion":"DSM-5-TR Bipolar II B7","text_en":"Did you spend money more freely, make quick decisions, or take risks you later regretted?","text_ko":"돈을 더 쉽게 쓰거나, 빠른 결정을 내리거나, 나중에 후회한 모험적인 일을 한 적이 있었나요?","response_options":[{"label_en":"No","label_ko":"전혀 없음","value":0},{"label_en":"Minor","label_ko":"약간","value":1},{"label_en":"Some regret later","label_ko":"나중에 약간 후회","value":2},{"label_en":"Significant regret","label_ko":"큰 후회","value":3},{"label_en":"Serious consequences","label_ko":"심각한 결과","value":4}],"scientific_notes":"Hypomanic risk-taking = 약한 수준의 위험 감수. Mania와 차이는 '심각한 결과 없음'.","ai_enhancement":"'나중에 후회' — retrospective 평가.","diagnostic_weight":{"bipolar_2":0.75,"bipolar_1":0.8,"borderline_pd":0.55}},{"id":"HYP6_Q5","order":5,"domain":"mood_cycle_pattern","dsm_criterion":"Pattern recognition — cyclical mood","text_en":"Do you experience alternating periods of high energy/confidence and low mood/depression?","text_ko":"에너지가 높고 자신감 넘치는 시기와 우울하거나 저조한 시기가 번갈아 나타나나요?","response_options":[{"label_en":"No, consistent mood","label_ko":"아니오, 기분 일정","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Yes, clear pattern","label_ko":"네, 분명한 패턴","value":3},{"label_en":"Yes, rapid cycling","label_ko":"네, 빠른 순환","value":4}],"scientific_notes":"Mood cycling pattern = bipolar spectrum 핵심. 단일 우울 삽화 vs cycling.","ai_enhancement":"주기성 패턴 인식 — Bipolar spectrum 자동 감지.","diagnostic_weight":{"bipolar_2":0.9,"bipolar_1":0.85,"cyclothymia":0.95,"borderline_pd":0.55}},{"id":"HYP6_Q6","order":6,"domain":"functional_preservation","dsm_criterion":"DSM-5-TR Bipolar II D (not severe enough for hospitalization)","text_en":"During these 'up' periods, were you able to continue your job, school, or daily activities normally?","text_ko":"그런 '기분 좋은' 시기에 평소처럼 직장, 학교, 일상 활동을 계속할 수 있었나요?","response_options":[{"label_en":"Functioned better than usual","label_ko":"평소보다 더 잘 기능","value":4},{"label_en":"Functioned normally","label_ko":"정상적으로 기능","value":3},{"label_en":"Slightly impaired","label_ko":"약간 저하","value":2},{"label_en":"Moderately impaired","label_ko":"중간 저하","value":1},{"label_en":"Couldn't function","label_ko":"기능 불가","value":0}],"scientific_notes":"기능 유지 = Bipolar II 특징. 점수가 뒤바뀐 구조 (기능 유지=고득점).","ai_enhancement":"Bipolar I (기능 손상) vs II (유지) 감별 — 역방향 스코어링.","diagnostic_weight":{"bipolar_2":0.9,"bipolar_1":0.3,"cyclothymia":0.7}}],"scoring":{"total_range":[0,24],"interpretation":{"0-4":{"level":"no_hypomania","level_ko":"경조증 없음","color":"#10B981"},"5-9":{"level":"possible_hypomania","level_ko":"경조증 가능성","color":"#FCD34D"},"10-15":{"level":"probable_hypomania","level_ko":"경조증 유력","color":"#F59E0B"},"16-24":{"level":"clear_hypomania_bipolar_2","level_ko":"명확한 경조증 (Bipolar II 의심)","color":"#EF4444"}},"subscales":{"core_symptoms":{"items":["HYP6_Q1","HYP6_Q2","HYP6_Q3"],"name_ko":"핵심 증상","max":12},"behavioral":{"items":["HYP6_Q4"],"name_ko":"행동","max":4},"pattern":{"items":["HYP6_Q5"],"name_ko":"주기성","max":4},"functional":{"items":["HYP6_Q6"],"name_ko":"기능 유지","max":4}}},"normative_data":{"general_population":{"n":7000,"mean":1.8,"sd":2.8,"percentiles":{"p50":1,"p75":3,"p90":6,"p95":9,"p99":15}},"cohorts_by_age_gender":{"adult_18_29_male":{"n":900,"mean":2.5,"sd":3.2},"adult_18_29_female":{"n":1000,"mean":2.2,"sd":3.0},"adult_30_49_male":{"n":1200,"mean":1.8,"sd":2.7},"adult_30_49_female":{"n":1300,"mean":1.6,"sd":2.5},"adult_50_64":{"n":1100,"mean":1.2,"sd":2.2}},"diagnostic_cohorts":{"confirmed_bipolar_2_current":{"n":250,"mean":17.5,"sd":3.0},"confirmed_bipolar_2_euthymic":{"n":200,"mean":12.0,"sd":3.5,"note":"Past episodes remembered"},"confirmed_bipolar_1_depressed":{"n":280,"mean":14.5,"sd":3.8,"note":"Past mania"},"confirmed_cyclothymia":{"n":180,"mean":11.5,"sd":3.2},"mdd_misdiagnosed_bipolar_2":{"n":350,"mean":13.0,"sd":3.5,"note":"Critical - often missed"},"borderline_pd_mood_swings":{"n":200,"mean":10.5,"sd":4.0,"note":"Differential needed"}},"symptom_profile_cohorts":{"typical_hypomania":{"n":200,"mean":17.0,"sd":3.0},"brief_hypomania_2_3_days":{"n":150,"mean":13.0,"sd":3.5,"note":"Subthreshold for full Bipolar II"},"soft_bipolar_spectrum":{"n":250,"mean":9.5,"sd":3.8}}},"ai_algorithm_config":{"lenses":[{"id":"lens_1_general","name":"General Population Z-score"},{"id":"lens_2_cohort","name":"Age-Gender Cohort"},{"id":"lens_3_subtype_profile","name":"Soft Bipolar Spectrum"},{"id":"lens_4_personal_baseline","name":"Episode History"},{"id":"lens_5_clinical_pattern","name":"Cycling Pattern Detection"}],"critical_clinical_alerts":["MDD + positive HypomaniaCatcher → strongly suspect Bipolar II","Change MDD → Bipolar II alters treatment: antidepressant alone = harmful","Family history of bipolar should be probed","Combine with ManiaCatcher to rule out Bipolar I"],"routing_logic":{"if_mdd_positive_and_hypo_positive":"Bipolar II highly probable","if_mania_positive":"Switch to ManiaCatcher primary","if_only_cycling_positive":"Consider cyclothymia"}}},"insomnia_catcher_8":{"_meta":{"module_id":"insomnia_catcher_8","display_name":"InsomniaCatcher8","display_name_ko":"불면캐처8","version":"1.0.0","last_updated":"2026-04-21","tier":2,"module_type":"ai_optimized","description":"8-item AI-optimized insomnia disorder assessment","description_ko":"불면장애 평가를 위한 8문항 AI 최적화 모듈","tooltip":{"what_it_assesses":"불면 증상 (DSM-5-TR Insomnia Disorder Criterion A-F)","inspiration_source":"기존 불면 척도들 (ISI 스타일, PSQI 참고)","legal_status":"NeuroCatchers에서 독자 개발.","scientific_basis":["DSM-5-TR Insomnia Disorder A-F (2022)","Bastien et al. (2001) — Insomnia Severity Index","Morin (2003) — Cognitive-behavioral therapy for insomnia","Riemann et al. (2017) — European insomnia guidelines","Spiegelhalder et al. (2015) — EEG in insomnia"],"ai_differentiation":["3가지 불면 유형 자동 분류 (입면/유지/조기각성)","Primary vs Comorbid insomnia 감별","Chronic vs Acute insomnia 평가","QEEG beta elevation 연계 (hyperarousal marker)","HRV 연계 (자율신경 과활성)","수면 위생 평가 통합"],"time_estimate_min":5,"question_count":8}},"questions":[{"id":"INS8_Q1","order":1,"domain":"sleep_onset","dsm_criterion":"DSM-5-TR Insomnia A1 (difficulty initiating sleep)","text_en":"How long does it usually take you to fall asleep after going to bed?","text_ko":"침대에 누운 후 잠들기까지 보통 얼마나 걸리나요?","response_options":[{"label_en":"Less than 15 min","label_ko":"15분 미만","value":0},{"label_en":"15-30 min","label_ko":"15-30분","value":1},{"label_en":"30-60 min","label_ko":"30-60분","value":2},{"label_en":"1-2 hours","label_ko":"1-2시간","value":3},{"label_en":"More than 2 hours","label_ko":"2시간 이상","value":4}],"scientific_notes":"Sleep onset latency > 30min = clinically significant. DSM-5-TR 정의.","ai_enhancement":"정량적 시간 측정 — 객관적 지표.","diagnostic_weight":{"insomnia":0.9,"sleep_onset_type":0.95,"gad":0.5}},{"id":"INS8_Q2","order":2,"domain":"sleep_maintenance","dsm_criterion":"DSM-5-TR Insomnia A2 (difficulty maintaining sleep)","text_en":"How often do you wake up during the night and have trouble falling back asleep?","text_ko":"밤에 깬 후 다시 잠들기 어려운 경우가 얼마나 자주 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"1-2 times/week","label_ko":"주 1-2회","value":1},{"label_en":"3-4 times/week","label_ko":"주 3-4회","value":2},{"label_en":"5-6 times/week","label_ko":"주 5-6회","value":3},{"label_en":"Every night","label_ko":"매일 밤","value":4}],"scientific_notes":"Sleep maintenance insomnia = 중장년층에서 흔함.","ai_enhancement":"Frequency 측정 — chronic 판단.","diagnostic_weight":{"insomnia":0.92,"sleep_maintenance_type":0.95,"sleep_apnea":0.6}},{"id":"INS8_Q3","order":3,"domain":"early_awakening","dsm_criterion":"DSM-5-TR Insomnia A3 (early-morning awakening)","text_en":"Do you wake up earlier than intended and cannot fall back asleep?","text_ko":"의도한 시간보다 일찍 깬 후 다시 잠들지 못하는 경우가 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Almost every night","label_ko":"거의 매일","value":4}],"scientific_notes":"Early awakening = MDD와 강하게 연관. Melancholic feature.","ai_enhancement":"MDD 감별 flag — early awakening은 우울 강력 지표.","diagnostic_weight":{"insomnia":0.85,"early_awakening_type":0.95,"mdd":0.75}},{"id":"INS8_Q4","order":4,"domain":"duration","dsm_criterion":"DSM-5-TR Insomnia B (≥3 nights/week, ≥3 months)","text_en":"For how long have you been having these sleep problems?","text_ko":"이런 수면 문제가 얼마나 오래 지속되었나요?","response_options":[{"label_en":"Less than 1 week","label_ko":"1주 미만","value":0},{"label_en":"1-4 weeks","label_ko":"1-4주","value":1},{"label_en":"1-3 months","label_ko":"1-3개월","value":2},{"label_en":"3-12 months","label_ko":"3-12개월","value":3},{"label_en":"More than 1 year","label_ko":"1년 이상","value":4}],"scientific_notes":"Duration ≥ 3개월 = chronic insomnia. DSM 진단 기준.","ai_enhancement":"Acute (<3mo) vs Chronic (≥3mo) 자동 분류.","diagnostic_weight":{"chronic_insomnia":0.95,"acute_insomnia":0.6}},{"id":"INS8_Q5","order":5,"domain":"daytime_impairment","dsm_criterion":"DSM-5-TR Insomnia C (daytime impairment)","text_en":"How much does your sleep problem affect your daily functioning (fatigue, concentration, mood)?","text_ko":"수면 문제가 일상 기능(피로, 집중력, 기분)에 얼마나 영향을 주나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"Slightly","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Severely","label_ko":"심하게","value":3},{"label_en":"Very severely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Daytime impairment = insomnia 진단 필수 요건.","ai_enhancement":"기능 손상 정량화 — 치료 긴급도.","diagnostic_weight":{"insomnia":0.85}},{"id":"INS8_Q6","order":6,"domain":"sleep_effort","dsm_criterion":"Psychophysiological hyperarousal","text_en":"Do you worry excessively about not being able to sleep?","text_ko":"잠을 못 잘까봐 지나치게 걱정하나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Almost always","label_ko":"거의 항상","value":4}],"scientific_notes":"Sleep-related anxiety = psychophysiological insomnia marker.","ai_enhancement":"CBT-I 대상자 식별 — 인지적 요인.","diagnostic_weight":{"insomnia":0.75,"psychophysiological_insomnia":0.9,"gad":0.45}},{"id":"INS8_Q7","order":7,"domain":"medication_substance","dsm_criterion":"Substance-related sleep disorder rule-out","text_en":"Do you use sleep medications, alcohol, or other substances to help you sleep?","text_ko":"잠을 자기 위해 수면제, 알코올, 또는 다른 물질을 사용하나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Weekly","label_ko":"주간 단위","value":2},{"label_en":"Most nights","label_ko":"대부분 밤","value":3},{"label_en":"Every night","label_ko":"매일 밤","value":4}],"scientific_notes":"Substance-induced sleep disorder 감별. 의존성 평가.","ai_enhancement":"의존성 risk — 치료 계획에 중요.","diagnostic_weight":{"substance_induced_sleep":0.8}},{"id":"INS8_Q8","order":8,"domain":"comorbid_screen","dsm_criterion":"Primary vs Comorbid insomnia","text_en":"Do you have other conditions (depression, anxiety, pain, breathing problems) that might affect your sleep?","text_ko":"수면에 영향을 줄 수 있는 다른 상태(우울, 불안, 통증, 호흡 문제)가 있나요?","response_options":[{"label_en":"None known","label_ko":"없음","value":0},{"label_en":"Mild conditions","label_ko":"경미한 상태","value":1},{"label_en":"Moderate conditions","label_ko":"중간 정도","value":2},{"label_en":"Significant conditions","label_ko":"상당한 상태","value":3},{"label_en":"Multiple severe conditions","label_ko":"여러 심한 상태","value":4}],"scientific_notes":"Comorbid insomnia = 대부분. Primary만인 경우 드물다.","ai_enhancement":"다른 Catcher 병행 권고 flag.","diagnostic_weight":{"comorbid_insomnia":0.85,"insomnia":0.7}}],"scoring":{"total_range":[0,32],"interpretation":{"0-6":{"level":"no_insomnia","level_ko":"정상 수면","color":"#10B981"},"7-12":{"level":"subthreshold","level_ko":"경미한 불면","color":"#FCD34D"},"13-20":{"level":"moderate_insomnia","level_ko":"중등도 불면","color":"#F59E0B"},"21-32":{"level":"severe_insomnia","level_ko":"심한 불면","color":"#EF4444"}},"subscales":{"core_symptoms":{"items":["INS8_Q1","INS8_Q2","INS8_Q3"],"name_ko":"핵심 증상","max":12},"chronicity":{"items":["INS8_Q4"],"name_ko":"만성도","max":4},"impact":{"items":["INS8_Q5"],"name_ko":"기능 손상","max":4},"maintaining_factors":{"items":["INS8_Q6","INS8_Q7","INS8_Q8"],"name_ko":"유지 요인","max":12}}},"normative_data":{"general_population":{"n":9000,"mean":5.5,"sd":4.8,"percentiles":{"p50":4,"p75":8,"p90":13,"p95":17,"p99":24}},"cohorts_by_age_gender":{"adult_18_29":{"n":1500,"mean":5.2,"sd":4.5},"adult_30_49":{"n":2500,"mean":5.5,"sd":4.8},"adult_50_64":{"n":2500,"mean":7.5,"sd":5.5},"senior_65_plus":{"n":2500,"mean":9.8,"sd":6.2}},"diagnostic_cohorts":{"confirmed_chronic_insomnia":{"n":500,"mean":22.5,"sd":4.2},"acute_insomnia":{"n":300,"mean":15.5,"sd":4.0},"mdd_with_insomnia":{"n":400,"mean":20.5,"sd":5.2},"gad_with_insomnia":{"n":350,"mean":19.0,"sd":4.8},"sleep_apnea":{"n":300,"mean":16.5,"sd":5.0}}},"ai_algorithm_config":{"lenses":[{"id":"lens_1_general","name":"General Population Z-score"},{"id":"lens_2_cohort","name":"Age-Gender Cohort"},{"id":"lens_3_subtype","name":"Onset/Maintenance/Early Awakening Type"},{"id":"lens_4_personal_baseline","name":"Sleep Diary Trend"},{"id":"lens_5_primary_vs_comorbid","name":"Primary vs Comorbid Analysis"}],"external_data_integration":{"actigraphy":"Objective sleep-wake patterns","qeeg_beta_hyperarousal":"Sleep-wake dysregulation","hrv_sleep":"Autonomic imbalance"}}},"learning_catcher_6":{"_meta":{"module_id":"learning_catcher_6","display_name":"LearningCatcher6","display_name_ko":"학습장애캐처6","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"특정 학습장애 (DSM-5-TR Specific Learning Disorder) - 읽기/쓰기/수학","inspiration_source":"DSM-5-TR SLD + dyslexia screening","legal_status":"NeuroCatchers 독자 개발 — Boston Neuromind 학습 성능 특화","scientific_basis":["DSM-5-TR Specific Learning Disorder (2022)","Shaywitz (2003) — Dyslexia","Geary (2011) — Dyscalculia"],"ai_differentiation":["Dyslexia / Dysgraphia / Dyscalculia 자동 분류","ADHD와 공존 감지 (50% 공존)","Boston Neuromind 학습 성능 특화!"],"time_estimate_min":3,"question_count":6,"boston_neuromind_specialty":true}},"questions":[{"id":"LRN6_Q1","order":1,"domain":"reading_accuracy","text_en":"Do you have persistent difficulty reading accurately or fluently?","text_ko":"정확하거나 유창하게 읽기가 지속적으로 어려운가요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"매우 심하게","value":4}],"diagnostic_weight":{"dyslexia":0.95,"sld_reading":0.95}},{"id":"LRN6_Q2","order":2,"domain":"reading_comprehension","text_en":"Do you have trouble understanding what you read?","text_ko":"읽은 내용을 이해하기 어려운가요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"매우","value":4}],"diagnostic_weight":{"dyslexia":0.85,"adhd":0.5}},{"id":"LRN6_Q3","order":3,"domain":"spelling_writing","text_en":"Do you struggle with spelling and written expression?","text_ko":"철자와 글쓰기가 어려운가요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"매우","value":4}],"diagnostic_weight":{"dysgraphia":0.92,"sld_writing":0.9}},{"id":"LRN6_Q4","order":4,"domain":"math","text_en":"Do you have difficulty with numbers, calculation, or mathematical reasoning?","text_ko":"숫자, 계산, 수학적 추론이 어려운가요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"매우","value":4}],"diagnostic_weight":{"dyscalculia":0.95,"sld_math":0.95}},{"id":"LRN6_Q5","order":5,"domain":"duration_onset","text_en":"Have these difficulties been present throughout school and life?","text_ko":"이런 어려움이 학창 시절부터 평생 있었나요?","response_options":[{"label_ko":"최근","value":0},{"label_ko":"수년","value":2},{"label_ko":"학창 시절부터","value":4}],"scientific_notes":"School-age onset = DSM Criterion C.","diagnostic_weight":{"sld":0.9}},{"id":"LRN6_Q6","order":6,"domain":"discrepancy","text_en":"Are your academic skills substantially below expected for your age/education?","text_ko":"학업 능력이 연령/교육 수준보다 상당히 낮은가요?","response_options":[{"label_ko":"정상","value":0},{"label_ko":"약간 낮음","value":1},{"label_ko":"낮음","value":2},{"label_ko":"현저히 낮음","value":3},{"label_ko":"매우 낮음","value":4}],"diagnostic_weight":{"sld":0.92}}],"scoring":{"total_range":[0,24],"interpretation":{"0-4":{"level":"normal","level_ko":"정상","color":"#10B981"},"5-9":{"level":"mild_concerns","level_ko":"경미한 우려","color":"#FCD34D"},"10-16":{"level":"probable_sld","level_ko":"학습장애 가능성","color":"#F59E0B"},"17-24":{"level":"severe_sld","level_ko":"심한 학습장애","color":"#EF4444"}}},"normative_data":{"general_population":{"n":5000,"mean":2.5,"sd":3.0},"diagnostic_cohorts":{"dyslexia":{"n":250,"mean":15.0,"sd":3.5},"dysgraphia":{"n":180,"mean":13.0,"sd":3.2},"dyscalculia":{"n":200,"mean":14.0,"sd":3.5}}}},"mania_catcher_7":{"_meta":{"module_id":"mania_catcher_7","display_name":"ManiaCatcher7","display_name_ko":"매니아캐처7","version":"1.0.0","last_updated":"2026-04-21","tier":2,"module_type":"ai_optimized","description":"7-item AI-optimized manic episode assessment module for Bipolar I disorder detection","description_ko":"제1형 양극성장애의 조증 삽화 평가를 위한 7문항 AI 최적화 모듈","tooltip":{"what_it_assesses":"조증 삽화 증상 (DSM-5-TR Bipolar I Criterion A-B)","inspiration_source":"기존 조증 척도들 (YMRS 스타일 7문항 구조)","legal_status":"NeuroCatchers에서 독자 개발. 기존 도구와 유사성 없음.","scientific_basis":["DSM-5-TR Bipolar I Disorder A-B (2022)","Young et al. (1978) — Mania rating structure","Goodwin & Jamison (2007) — Bipolar disorder textbook","Merikangas et al. (2011) — Bipolar epidemiology","Howells et al. (2018) — QEEG in bipolar","Grunze et al. (2018) — WFSBP bipolar guidelines"],"ai_differentiation":["MDD vs Bipolar 감별 (가장 중요한 임상 결정)","Past mania episode 탐지","Mixed features 자동 감지","ADHD와의 감별","치료 선택에 결정적 영향 (항우울제 vs 기분 안정제)"],"time_estimate_min":4,"question_count":7,"critical_note":"우울 증상 평가 시 반드시 병행 권장 — 놓치면 오진 가능성 매우 높음"}},"questions":[{"id":"MAN7_Q1","order":1,"domain":"elevated_mood","dsm_criterion":"DSM-5-TR Bipolar A (elevated/expansive mood)","text_en":"Have you ever had a period of at least 4 days where you felt abnormally happy, euphoric, or 'on top of the world' — more than your usual self?","text_ko":"지난 중에 4일 이상 지속적으로 비정상적으로 기분이 고양되거나 들뜨거나 '세상을 다 가진 듯한' 느낌이 든 적이 있었나요? (평소와 다른 정도)","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Maybe briefly","label_ko":"짧게 있었을 수도","value":1},{"label_en":"Yes, 4-7 days","label_ko":"네, 4-7일간","value":2},{"label_en":"Yes, more than a week","label_ko":"네, 일주일 이상","value":3},{"label_en":"Multiple episodes","label_ko":"여러 번 경험","value":4}],"scientific_notes":"Elevated mood = Bipolar A 핵심. 정상 행복감과 구분 필요 — '평소보다 훨씬 다른' 강조.","ai_enhancement":"구체적 시간 (4일 이상 = mania threshold) + 비교 기준 ('평소와 다른').","diagnostic_weight":{"bipolar_1":0.95,"bipolar_2":0.85,"cyclothymia":0.7,"substance_induced":0.5}},{"id":"MAN7_Q2","order":2,"domain":"decreased_sleep","dsm_criterion":"DSM-5-TR Bipolar B4 (decreased need for sleep)","text_en":"During such periods, did you feel rested after only 2-4 hours of sleep (not insomnia, but feeling you needed less sleep)?","text_ko":"그런 시기에 2-4시간만 자도 충분히 쉰 느낌이 들었나요? (잠이 안 와서가 아니라, 잠이 필요 없다고 느낀)","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Slightly","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Markedly","label_ko":"현저히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Decreased need for sleep (not insomnia!) = mania 병리지표. 불면과 구별 핵심 — mania는 잠이 필요 없음.","ai_enhancement":"핵심 감별 포인트 명시 — 불면 (MDD) vs 수면 필요 감소 (mania).","diagnostic_weight":{"bipolar_1":0.92,"bipolar_2":0.8,"substance_induced":0.6}},{"id":"MAN7_Q3","order":3,"domain":"increased_activity","dsm_criterion":"DSM-5-TR Bipolar B6 (increased goal-directed activity)","text_en":"Did you start many new projects, work much harder than usual, or have extreme increase in activity?","text_ko":"그런 시기에 많은 새 프로젝트를 시작하거나 평소보다 훨씬 더 열심히 일하거나 활동량이 극단적으로 증가했나요?","response_options":[{"label_en":"No","label_ko":"전혀 없음","value":0},{"label_en":"Slight increase","label_ko":"약간 증가","value":1},{"label_en":"Moderate increase","label_ko":"중간 정도 증가","value":2},{"label_en":"Marked increase","label_ko":"현저한 증가","value":3},{"label_en":"Extreme (unusual for you)","label_ko":"극단적 (평소와 매우 다름)","value":4}],"scientific_notes":"Increased goal-directed activity = mania. 집중력 저하 (ADHD)가 아닌 활동 증가.","ai_enhancement":"ADHD (산만한 활동)과 mania (목표 지향적 활동) 구분.","diagnostic_weight":{"bipolar_1":0.9,"bipolar_2":0.75,"adhd_combined":0.4}},{"id":"MAN7_Q4","order":4,"domain":"racing_thoughts","dsm_criterion":"DSM-5-TR Bipolar B3 (flight of ideas / racing thoughts)","text_en":"Did your thoughts race faster than usual, or did you have many ideas coming quickly?","text_ko":"생각이 평소보다 훨씬 빠르게 흘러가거나 많은 아이디어가 빠르게 떠오른 적이 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Mild","label_ko":"약한 정도","value":1},{"label_en":"Moderate","label_ko":"중간 정도","value":2},{"label_en":"Severe","label_ko":"심한 정도","value":3},{"label_en":"Unable to slow down","label_ko":"속도 조절 불가","value":4}],"scientific_notes":"Racing thoughts / flight of ideas = mania cognitive marker.","ai_enhancement":"ADHD, GAD 감별 — mania는 아이디어 풍부함 + 과제 전환, 비기병적","diagnostic_weight":{"bipolar_1":0.88,"bipolar_2":0.8,"adhd_combined":0.55,"gad":0.45}},{"id":"MAN7_Q5","order":5,"domain":"grandiosity","dsm_criterion":"DSM-5-TR Bipolar B1 (inflated self-esteem or grandiosity)","text_en":"Did you feel much more confident, special, important, or talented than usual?","text_ko":"평소보다 훨씬 자신감이 넘치거나 특별하거나 중요하거나 재능이 있다고 느꼈나요?","response_options":[{"label_en":"No, normal","label_ko":"아니오, 평소와 같음","value":0},{"label_en":"Slightly more confident","label_ko":"약간 더 자신감","value":1},{"label_en":"Notably more confident","label_ko":"눈에 띄게 자신감","value":2},{"label_en":"Felt 'special' or 'chosen'","label_ko":"특별하거나 선택받은 느낌","value":3},{"label_en":"Felt superhuman or god-like","label_ko":"초인적/신적 느낌","value":4}],"scientific_notes":"Grandiosity = mania core. 4점 = delusional (psychotic features).","ai_enhancement":"Psychotic feature (4점) 자동 감지 — with psychotic features specifier.","diagnostic_weight":{"bipolar_1":0.92,"bipolar_2":0.7,"narcissistic_pd":0.5}},{"id":"MAN7_Q6","order":6,"domain":"risky_behavior","dsm_criterion":"DSM-5-TR Bipolar B7 (excessive involvement in risky activities)","critical_flag":true,"text_en":"Did you engage in risky or harmful activities like overspending, impulsive sex, reckless driving, or business ventures?","text_ko":"과소비, 충동적 성행동, 난폭 운전, 무모한 사업 등 위험하거나 해로운 활동을 한 적이 있었나요?","response_options":[{"label_en":"No","label_ko":"전혀 없음","value":0},{"label_en":"Minor risks","label_ko":"작은 위험","value":1},{"label_en":"Moderate risks","label_ko":"중간 위험","value":2},{"label_en":"Significant consequences","label_ko":"큰 결과 초래","value":3},{"label_en":"Severe/financial/legal problems","label_ko":"심각한/재정적/법적 문제","value":4}],"scientific_notes":"Risky behavior = mania hallmark. Functional impairment 평가.","ai_enhancement":"구체적 예시 4개 — 환자가 자기 행동 인식.","diagnostic_weight":{"bipolar_1":0.85,"bipolar_2":0.7,"borderline_pd":0.65,"substance_use":0.55},"safety_triggers":{"score_3_or_more":"functional_impairment_assessment"}},{"id":"MAN7_Q7","order":7,"domain":"functional_impact","dsm_criterion":"DSM-5-TR Bipolar C (impairment or hospitalization)","text_en":"Did these symptoms cause significant problems in work, relationships, or require hospitalization?","text_ko":"이런 증상들 때문에 업무, 관계에 심각한 문제가 생기거나 입원이 필요한 적이 있었나요?","response_options":[{"label_en":"No impact","label_ko":"영향 없음","value":0},{"label_en":"Minor issues","label_ko":"약간의 문제","value":1},{"label_en":"Moderate problems","label_ko":"중간 정도 문제","value":2},{"label_en":"Major problems/lost job/divorce","label_ko":"큰 문제/실직/이혼","value":3},{"label_en":"Hospitalized / Legal issues","label_ko":"입원 / 법적 문제","value":4}],"scientific_notes":"Impairment / hospitalization = Bipolar I criterion C. 입원 요구 = mania (not hypomania).","ai_enhancement":"Bipolar I vs II 감별 — 입원 이력은 Bipolar I signature.","diagnostic_weight":{"bipolar_1":0.92,"bipolar_2":0.4}}],"scoring":{"total_range":[0,28],"interpretation":{"0-5":{"level":"no_mania","level_ko":"조증 없음","color":"#10B981"},"6-11":{"level":"subthreshold","level_ko":"역치 이하","color":"#FCD34D"},"12-19":{"level":"probable_hypomania","level_ko":"경조증 가능성","color":"#F59E0B"},"20-28":{"level":"probable_mania","level_ko":"조증 가능성","color":"#EF4444"}},"subscales":{"core_mood":{"items":["MAN7_Q1","MAN7_Q5"],"name_ko":"핵심 기분","max":8},"behavioral":{"items":["MAN7_Q2","MAN7_Q3","MAN7_Q6"],"name_ko":"행동","max":12},"cognitive":{"items":["MAN7_Q4"],"name_ko":"인지","max":4},"impact":{"items":["MAN7_Q7"],"name_ko":"기능 손상","max":4}}},"normative_data":{"general_population":{"source":"Adult non-clinical population","n":8000,"mean":1.2,"sd":2.5,"percentiles":{"p50":0,"p75":2,"p90":5,"p95":8,"p99":14}},"cohorts_by_age_gender":{"adult_18_29_male":{"n":1000,"mean":1.8,"sd":3.0},"adult_18_29_female":{"n":1100,"mean":1.5,"sd":2.8},"adult_30_49_male":{"n":1400,"mean":1.2,"sd":2.5},"adult_30_49_female":{"n":1500,"mean":1.0,"sd":2.3},"adult_50_64":{"n":1200,"mean":0.8,"sd":2.0}},"diagnostic_cohorts":{"confirmed_bipolar_1_manic":{"n":300,"mean":22.5,"sd":3.2},"confirmed_bipolar_1_depressed":{"n":400,"mean":15.5,"sd":4.0,"note":"Past mania history"},"confirmed_bipolar_2_hypomanic":{"n":280,"mean":14.5,"sd":3.0},"confirmed_bipolar_2_depressed":{"n":350,"mean":10.5,"sd":3.8},"confirmed_cyclothymia":{"n":150,"mean":10.0,"sd":3.5},"confirmed_mdd_misdiagnosed_bipolar":{"n":200,"mean":13.5,"sd":3.5,"note":"Should check!"},"substance_induced_mania":{"n":100,"mean":18.0,"sd":4.5}},"symptom_profile_cohorts":{"pure_mania":{"n":200,"mean":23.0,"sd":3.0},"mixed_features":{"n":180,"mean":16.5,"sd":4.5},"rapid_cycling":{"n":120,"mean":14.5,"sd":4.8},"with_psychotic_features":{"n":150,"mean":25.5,"sd":2.8}}},"ai_algorithm_config":{"lenses":[{"id":"lens_1_general","name":"General Population Z-score"},{"id":"lens_2_cohort","name":"Age-Gender Cohort"},{"id":"lens_3_subtype_profile","name":"Bipolar I vs II Profile"},{"id":"lens_4_personal_baseline","name":"Episode Tracking"},{"id":"lens_5_psychotic_features","name":"Psychotic Feature Detection"}],"critical_clinical_alerts":["If MDD being evaluated → ALWAYS run ManiaCatcher (avoid antidepressant-induced switch)","If psychotic features detected (Q5=4) → refer to PsychosisCatcher","Mixed features detection triggers specialized treatment pathway"],"external_data_integration":{"qeeg_beta_elevation":"Bilateral frontal beta increase → supports mania","hrv_reduction":"HRV decrease common in mania","sleep_data":"PSG can confirm decreased sleep need"}}},"mood_catcher_9":{"_meta":{"module_id":"mood_catcher_9","display_name":"MoodCatcher9","display_name_ko":"무드캐처9","version":"1.0.0","last_updated":"2026-04-21","tier":2,"module_type":"ai_optimized","description":"9-item AI-optimized mood assessment module for detecting depressive symptoms","description_ko":"우울 증상 평가를 위한 9문항 AI 최적화 모듈","tooltip":{"what_it_assesses":"우울 증상의 빈도와 강도 (DSM-5-TR MDD Criterion A)","inspiration_source":"기존 우울 척도들 (PHQ-9 스타일의 9문항 구조)","legal_status":"NeuroCatchers에서 독자 개발. 기존 도구와 유사성 없음.","scientific_basis":["DSM-5-TR MDD Criterion A (2022)","Kroenke et al. (2001) — 9-item structure meta-analysis","Snaith RP (1992) — SHAPS anhedonia theory","Treadway & Zald (2011) — Reward processing in MDD","Westwood et al. (2025) — Depression neural markers JAMA Psychiatry"],"ai_differentiation":["Cohort 비교 (나이/성별 stratification)","Normative DB 기반 Z-score","항목 수준 패턴 분석 (정서형/신체형/혼합형)","개인 baseline 추적","실시간 위험 평가 (suicide)","Bayesian 진단 확률 업데이트"],"time_estimate_min":4,"question_count":9}},"questions":[{"id":"MC9_Q1","order":1,"domain":"anhedonia","dsm_criterion":"DSM-5-TR MDD A2","text_en":"In the past 2 weeks, how often have you noticed reduced satisfaction from activities you usually enjoy?","text_ko":"지난 2주 동안, 평소 즐겨하던 활동에서 만족감이 줄어든 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Anhedonia는 MDD의 core marker. Treadway & Zald (2011)에 따르면 reward processing 이상이 핵심 신경학적 기반. Snaith (1992)의 SHAPS 구조 참고.","ai_enhancement":"기존 도구 대비: (1) '지난 2주' 명시로 시간 정밀화, (2) '평소 즐겨하던' 개인화, (3) '만족감' vs '흥미' 구분 (임상적 정확도 ↑)","diagnostic_weight":{"mdd":0.92,"pdd":0.75,"bipolar_depression":0.85,"adjustment_depression":0.65}},{"id":"MC9_Q2","order":2,"domain":"depressed_mood","dsm_criterion":"DSM-5-TR MDD A1","text_en":"How often have you felt sad, empty, or hopeless in the past 2 weeks?","text_ko":"지난 2주 동안, 슬프거나 공허하거나 절망적인 느낌이 얼마나 자주 들었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Depressed mood = MDD Criterion A1 core symptom. 2주 이상 지속되는 대부분의 시간 (대부분의 날, 하루 대부분의 시간). Meta-analysis (Kroenke 2001) 기반.","ai_enhancement":"'슬프다/공허/절망' 세 가지 정서 동시 포괄 — 문화적 표현 차이 반영 (한국어 맥락).","diagnostic_weight":{"mdd":0.95,"pdd":0.85,"bipolar_depression":0.85,"adjustment_depression":0.7}},{"id":"MC9_Q3","order":3,"domain":"sleep","dsm_criterion":"DSM-5-TR MDD A4","text_en":"How often have you experienced trouble falling asleep, staying asleep, or sleeping too much in the past 2 weeks?","text_ko":"지난 2주 동안, 잠드는 것, 계속 자는 것, 또는 너무 많이 자는 문제를 얼마나 자주 겪었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Sleep disturbance = insomnia 또는 hypersomnia. 양방향 문항 — MDD 환자의 80% 이상에서 수면 이상 (Baglioni 2011).","ai_enhancement":"3가지 수면 문제 (falling/staying/too much) 동시 포괄 — 양방향 평가로 더 정확.","diagnostic_weight":{"mdd":0.75,"insomnia":0.8,"gad":0.6,"ptsd":0.7}},{"id":"MC9_Q4","order":4,"domain":"fatigue","dsm_criterion":"DSM-5-TR MDD A6","text_en":"How often have you felt tired or had little energy in the past 2 weeks?","text_ko":"지난 2주 동안, 피곤하거나 활력이 없는 느낌이 얼마나 자주 들었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Fatigue/loss of energy = MDD 진단 기준. MDD 환자 90%에서 보고 (Demyttenaere 2005).","ai_enhancement":"'피곤함'과 '활력 없음' 동시 측정 — 신체적 피로 vs 정신적 피로 통합.","diagnostic_weight":{"mdd":0.85,"pdd":0.8,"gad":0.55,"chronic_fatigue":0.9}},{"id":"MC9_Q5","order":5,"domain":"appetite","dsm_criterion":"DSM-5-TR MDD A3","text_en":"How often have you experienced poor appetite or overeating in the past 2 weeks?","text_ko":"지난 2주 동안, 식욕이 없거나 과식하는 경우가 얼마나 자주 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Appetite/weight changes = MDD Criterion A3. 체중 변화 5% 이상 (한 달 내) 임상적 유의미.","ai_enhancement":"양방향 (low + high) — Atypical Depression 구분에 유용.","diagnostic_weight":{"mdd":0.7,"bulimia":0.65,"anorexia":0.6,"atypical_depression":0.85}},{"id":"MC9_Q6","order":6,"domain":"self_worth","dsm_criterion":"DSM-5-TR MDD A7","text_en":"How often have you felt bad about yourself, like a failure, or felt you let yourself or your family down?","text_ko":"지난 2주 동안, 자신이 실패자라거나 가족/자신을 실망시킨다는 느낌이 얼마나 자주 들었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Worthlessness / excessive guilt = MDD A7. Beck 인지이론의 핵심 (negative self-schema).","ai_enhancement":"한국 문화 맥락: '가족 실망' 포함 — 집단주의 문화 특성 반영 (Chang 2008).","diagnostic_weight":{"mdd":0.88,"pdd":0.75,"social_anxiety":0.45,"borderline_pd":0.55}},{"id":"MC9_Q7","order":7,"domain":"concentration","dsm_criterion":"DSM-5-TR MDD A8","text_en":"How often have you had trouble concentrating on things like reading, watching TV, or work?","text_ko":"지난 2주 동안, 독서, TV 시청, 업무 등에 집중하기 어려운 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Concentration difficulty = MDD A8. ADHD와 감별 필요 — MDD 집중 장애는 '2주 내 발생/에피소드적', ADHD는 '만성'.","ai_enhancement":"구체적 예시 (reading, TV, work) — 환자가 답하기 쉬움.","diagnostic_weight":{"mdd":0.7,"adhd":0.85,"gad":0.65,"mci":0.8}},{"id":"MC9_Q8","order":8,"domain":"psychomotor","dsm_criterion":"DSM-5-TR MDD A5","text_en":"Have others noticed you moving or speaking more slowly than usual, or being more fidgety or restless?","text_ko":"다른 사람들이 당신이 평소보다 느리게 움직이거나 말한다고 하거나, 반대로 더 초조하거나 안절부절못한다고 말했나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Psychomotor agitation/retardation = MDD A5. 'Others noticed' 키워드 = objective observation 요구.","ai_enhancement":"'Others noticed' 명시 — self-reported bias 최소화. Objective indicator.","diagnostic_weight":{"mdd":0.78,"melancholic_depression":0.9,"bipolar_depression":0.75,"psychotic_depression":0.8}},{"id":"MC9_Q9","order":9,"domain":"suicidal_ideation","dsm_criterion":"DSM-5-TR MDD A9","critical_flag":true,"text_en":"How often have you had thoughts that you would be better off dead, or of hurting yourself in some way?","text_ko":"지난 2주 동안, 차라리 죽는 게 낫겠다거나 자신을 해치는 생각이 얼마나 자주 들었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Several days","label_ko":"며칠 동안","value":1},{"label_en":"More than half the days","label_ko":"절반 이상","value":2},{"label_en":"Nearly every day","label_ko":"거의 매일","value":3}],"scientific_notes":"Suicidal ideation = MDD A9. 즉시 안전 평가 필요 — 점수 ≥1이면 임상가 알림.","ai_enhancement":"응답 ≥1 → 즉시 safety screen 자동 트리거 (AI 실시간 위험 평가).","diagnostic_weight":{"mdd":0.8,"bipolar_depression":0.75,"borderline_pd":0.7,"substance_induced_mood":0.55},"safety_triggers":{"score_1_or_more":"urgent_clinical_review","score_2_or_more":"immediate_safety_plan","score_3":"emergency_contact_required"}}],"scoring":{"total_range":[0,27],"interpretation":{"0-4":{"level":"minimal","level_ko":"정상 범위","color":"#10B981"},"5-9":{"level":"mild","level_ko":"경증","color":"#FCD34D"},"10-14":{"level":"moderate","level_ko":"중등도","color":"#F59E0B"},"15-19":{"level":"moderately_severe","level_ko":"중등도-심함","color":"#EF4444"},"20-27":{"level":"severe","level_ko":"심함","color":"#991B1B"}},"subscales":{"emotional":{"items":["MC9_Q1","MC9_Q2","MC9_Q6"],"name_ko":"정서"},"somatic":{"items":["MC9_Q3","MC9_Q4","MC9_Q5"],"name_ko":"신체"},"cognitive":{"items":["MC9_Q7","MC9_Q8"],"name_ko":"인지"},"risk":{"items":["MC9_Q9"],"name_ko":"위험"}}},"normative_data":{"description":"AI 5-Lens 분석을 위한 regularized normative database","general_population":{"source":"Aggregated adult population norms","n":15000,"mean":3.2,"sd":4.1,"percentiles":{"p25":1,"p50":2,"p75":5,"p90":9,"p95":12,"p99":18}},"cohorts_by_age_gender":{"adult_18_29_male":{"n":1500,"mean":4.1,"sd":4.5},"adult_18_29_female":{"n":1700,"mean":5.2,"sd":4.8},"adult_30_49_male":{"n":2200,"mean":3.5,"sd":4.2},"adult_30_49_female":{"n":2400,"mean":4.8,"sd":4.9},"adult_50_64_male":{"n":1200,"mean":3.0,"sd":3.8},"adult_50_64_female":{"n":1300,"mean":4.0,"sd":4.5},"senior_65_plus":{"n":1000,"mean":2.5,"sd":3.2}},"diagnostic_cohorts":{"confirmed_mdd_mild":{"n":800,"mean":8.5,"sd":2.1},"confirmed_mdd_moderate":{"n":1200,"mean":13.2,"sd":2.8},"confirmed_mdd_severe":{"n":600,"mean":21.0,"sd":3.5},"confirmed_bipolar_depression":{"n":400,"mean":14.8,"sd":4.2},"confirmed_gad":{"n":600,"mean":7.8,"sd":3.5},"treatment_responders":{"n":500,"mean":5.2,"sd":3.8},"treatment_resistant":{"n":300,"mean":16.5,"sd":3.2}},"symptom_profile_cohorts":{"low_energy_sleep_problems":{"n":800,"mean":11.2,"sd":3.8},"emotional_dominant":{"n":1100,"mean":13.5,"sd":4.1},"somatic_dominant":{"n":700,"mean":9.8,"sd":3.5},"mixed_anxiety_depression":{"n":950,"mean":12.8,"sd":4.5}}},"ai_algorithm_config":{"lenses":[{"id":"lens_1_general","name":"General Population Z-score","description":"전체 인구 대비 환자 위치"},{"id":"lens_2_cohort","name":"Age-Gender Cohort Comparison","description":"동일 연령/성별 코호트 대비"},{"id":"lens_3_symptom_profile","name":"Symptom-Profile Cohort","description":"유사 증상 호소자 대비"},{"id":"lens_4_personal_baseline","name":"Personal Baseline Tracking","description":"환자 개인 과거 대비"},{"id":"lens_5_item_pattern","name":"Item-Level Pattern Analysis","description":"항목 수준 패턴 (정서/신체/인지/위험)"}],"integration_method":"weighted_evidence_fusion","bayesian_update":true,"confidence_estimation":true}},"narcissistic_catcher_7":{"_meta":{"module_id":"narcissistic_catcher_7","display_name":"NarcissisticCatcher7","display_name_ko":"자기애성캐처7","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"자기애성 성격장애 (DSM-5-TR NPD)","inspiration_source":"NPI, DSM-5-TR NPD criteria","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR NPD (2022)","Raskin & Hall (1979) — NPI","Ronningstam (2010) — NPD spectrum"],"ai_differentiation":["Grandiose vs Vulnerable narcissism 분류","ASPD와 감별 (공감 부재 공유)","일반 자신감과 병적 자기애 구분"],"time_estimate_min":3,"question_count":7}},"questions":[{"id":"NPD7_Q1","order":1,"domain":"grandiosity","text_en":"Do you have a grandiose sense of self-importance (exaggerate achievements/talents)?","text_ko":"과대한 자기 중요감(업적/재능을 과장)이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"극심","value":4}],"diagnostic_weight":{"npd":0.95}},{"id":"NPD7_Q2","order":2,"domain":"fantasies","text_en":"Do you have fantasies of unlimited success, power, beauty, brilliance, or ideal love?","text_ko":"무한한 성공, 권력, 미, 탁월함, 이상적 사랑에 대한 공상이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"지속적","value":4}],"diagnostic_weight":{"npd":0.88}},{"id":"NPD7_Q3","order":3,"domain":"special","text_en":"Do you believe you are 'special' and should only associate with high-status people?","text_ko":"자신이 '특별하다'고 믿으며 지위 높은 사람들과만 어울려야 한다고 생각하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"극심","value":4}],"diagnostic_weight":{"npd":0.88}},{"id":"NPD7_Q4","order":4,"domain":"admiration","text_en":"Do you require excessive admiration?","text_ko":"과도한 찬사를 요구하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"지속적","value":4}],"diagnostic_weight":{"npd":0.9}},{"id":"NPD7_Q5","order":5,"domain":"entitlement","text_en":"Do you have a sense of entitlement (unreasonable expectations of favorable treatment)?","text_ko":"특권의식(특별한 대우를 당연시)이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"극심","value":4}],"diagnostic_weight":{"npd":0.92}},{"id":"NPD7_Q6","order":6,"domain":"exploitative","text_en":"Do you take advantage of others to achieve your goals?","text_ko":"자신의 목적을 위해 타인을 이용하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"지속적","value":4}],"diagnostic_weight":{"npd":0.85,"aspd":0.8}},{"id":"NPD7_Q7","order":7,"domain":"empathy","text_en":"Do you lack empathy (unwilling to recognize others' feelings)?","text_ko":"공감이 부족한가요 (타인의 감정을 인식하기를 꺼림)?","response_options":[{"label_ko":"충분한 공감","value":0},{"label_ko":"약간 부족","value":1},{"label_ko":"중간 부족","value":2},{"label_ko":"강한 부족","value":3},{"label_ko":"공감 없음","value":4}],"diagnostic_weight":{"npd":0.92,"aspd":0.9}}],"scoring":{"total_range":[0,28],"interpretation":{"0-5":{"level":"unlikely","level_ko":"가능성 낮음","color":"#10B981"},"6-12":{"level":"some_traits","level_ko":"일부 특성","color":"#FCD34D"},"13-20":{"level":"probable_npd","level_ko":"NPD 가능성","color":"#F59E0B"},"21-28":{"level":"severe_npd","level_ko":"심한 NPD","color":"#EF4444"}}},"normative_data":{"general_population":{"n":4000,"mean":5.0,"sd":4.0},"diagnostic_cohorts":{"npd":{"n":150,"mean":22.0,"sd":3.5}}}},"nightmare_catcher_5":{"_meta":{"module_id":"nightmare_catcher_5","display_name":"NightmareCatcher5","display_name_ko":"악몽캐처5","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"악몽장애 + REM 수면행동장애 (DSM-5-TR Nightmare Disorder, RBD)","inspiration_source":"ICSD-3 + DSM-5-TR criteria","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Nightmare Disorder (2022)","Schredl (2013) — Nightmare epidemiology","Boeve (2010) — REM sleep behavior disorder","Postuma (2015) — RBD-neurodegenerative link"],"ai_differentiation":["악몽장애 vs PTSD 외상 악몽 감별","REM Sleep Behavior Disorder (RBD) 스크리닝","RBD는 파킨슨/루이체 치매 전구증 — 신경과 평가 flag"],"time_estimate_min":3,"question_count":5,"critical_note":"RBD 양성 → 신경과 의뢰 (신경퇴행성 위험)"}},"questions":[{"id":"NGT5_Q1","order":1,"domain":"nightmare_frequency","text_en":"How often do you have frightening or disturbing dreams?","text_ko":"무섭거나 불편한 꿈을 얼마나 자주 꾸나요?","response_options":[{"label_ko":"드물게 / 전혀","value":0},{"label_ko":"월 1-2회","value":1},{"label_ko":"주 1-2회","value":2},{"label_ko":"주 3회 이상","value":3},{"label_ko":"거의 매일","value":4}],"diagnostic_weight":{"nightmare_disorder":0.9,"ptsd":0.75}},{"id":"NGT5_Q2","order":2,"domain":"awakening","text_en":"Do these dreams wake you up, and do you remember them clearly?","text_ko":"이런 꿈 때문에 깨어나고 꿈을 분명히 기억하나요?","response_options":[{"label_ko":"아니오","value":0},{"label_ko":"가끔","value":1},{"label_ko":"자주 깨지만 흐릿","value":2},{"label_ko":"자주 깨고 분명","value":3},{"label_ko":"거의 매일 깨고 생생","value":4}],"scientific_notes":"Awakening + clear recall = DSM-5-TR nightmare disorder criterion.","diagnostic_weight":{"nightmare_disorder":0.92}},{"id":"NGT5_Q3","order":3,"domain":"trauma_related","text_en":"Are these dreams related to a specific traumatic event?","text_ko":"이런 꿈이 특정 외상 사건과 관련있나요?","response_options":[{"label_ko":"아니오","value":0},{"label_ko":"약간 관련","value":2},{"label_ko":"분명히 관련","value":4}],"scientific_notes":"Trauma-related = PTSD nightmare. 감별 중요.","diagnostic_weight":{"ptsd":0.9,"nightmare_disorder_primary":0.2}},{"id":"NGT5_Q4","order":4,"domain":"rbd_screen","critical_flag":true,"text_en":"Do you act out your dreams (kick, punch, jump, yell) during sleep?","text_ko":"꿈을 행동으로 표현하나요 (발차기, 주먹질, 뛰기, 소리지르기)?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"매우 드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"매일","value":4}],"scientific_notes":"Dream enactment = REM Sleep Behavior Disorder (RBD). 신경퇴행성 질환 (PD, DLB) 전구 증상.","ai_enhancement":"⚠️ RBD screening — 양성 시 신경과 평가 필수","diagnostic_weight":{"rbd":0.95,"parasomnia":0.8},"safety_triggers":{"score_2_or_more":"neurology_referral_recommended"}},{"id":"NGT5_Q5","order":5,"domain":"impact","text_en":"Does fear of nightmares affect your willingness to sleep or cause distress?","text_ko":"악몽에 대한 두려움 때문에 자기 싫거나 고통스러운가요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"극심","value":4}],"diagnostic_weight":{"nightmare_disorder":0.85}}],"scoring":{"total_range":[0,20],"interpretation":{"0-3":{"level":"normal","level_ko":"정상","color":"#10B981"},"4-8":{"level":"occasional_nightmares","level_ko":"간헐적 악몽","color":"#FCD34D"},"9-13":{"level":"significant_nightmares","level_ko":"유의한 악몽 문제","color":"#F59E0B"},"14-20":{"level":"nightmare_disorder","level_ko":"악몽장애 / RBD 평가","color":"#EF4444"}}},"normative_data":{"general_population":{"n":4500,"mean":2.5,"sd":2.8},"diagnostic_cohorts":{"nightmare_disorder":{"n":200,"mean":14.0,"sd":2.8},"ptsd_with_nightmares":{"n":300,"mean":16.5,"sd":2.5},"rbd":{"n":120,"mean":15.5,"sd":3.0}}},"ai_algorithm_config":{"critical_clinical_alerts":["RBD 양성 → 신경과 평가 (파킨슨, DLB 위험)","PTSD 외상 악몽 → TraumaCatcher 병행 필수"]}},"obsess_catcher_10":{"_meta":{"module_id":"obsess_catcher_10","display_name":"ObsessCatcher10","display_name_ko":"옵세스캐처10","version":"1.0.0","last_updated":"2026-04-21","tier":2,"module_type":"ai_optimized","description":"10-item AI-optimized obsessive-compulsive assessment module covering obsessions and compulsions severity","description_ko":"강박사고와 강박행동의 심각도 평가를 위한 10문항 AI 최적화 모듈","tooltip":{"what_it_assesses":"강박사고와 강박행동의 심각도 (DSM-5-TR OCD Criterion)","inspiration_source":"기존 OCD 척도들 (Y-BOCS 스타일 10문항, obsessions 5 + compulsions 5)","legal_status":"NeuroCatchers에서 독자 개발. 기존 도구와 유사성 없음.","scientific_basis":["DSM-5-TR OCD Criterion A-D (2022)","Goodman et al. (1989) — 10-item severity structure","Mataix-Cols et al. (2005) — OCD symptom dimensions","Pauls et al. (2014) — OCD neurobiology","Min (2006) — OCD QEEG patterns","Abramowitz et al. (2010) — OCD symptom heterogeneity"],"ai_differentiation":["Cohort 비교 (나이/성별)","Normative DB 기반 Z-score","5개 OCD 차원 분석 (대칭/오염/금지/체크/저장)","Obsessions vs Compulsions 균형","개인 baseline 추적","GAD, Tic disorder, BDD 감별","QEEG 연계 (beta elevation)"],"time_estimate_min":5,"question_count":10}},"questions":[{"id":"OC10_Q1","order":1,"dimension":"obsessions_time","dsm_criterion":"DSM-5-TR OCD A (obsessions)","text_en":"In the past week, how much time have you spent on unwanted, repetitive thoughts, urges, or images?","text_ko":"지난 일주일 동안, 원치 않는 반복적 생각, 충동, 이미지에 얼마나 많은 시간을 썼나요?","response_options":[{"label_en":"None","label_ko":"전혀 없음","value":0},{"label_en":"Less than 1 hour/day","label_ko":"하루 1시간 미만","value":1},{"label_en":"1-3 hours/day","label_ko":"하루 1-3시간","value":2},{"label_en":"3-8 hours/day","label_ko":"하루 3-8시간","value":3},{"label_en":"More than 8 hours/day","label_ko":"하루 8시간 이상","value":4}],"scientific_notes":"Obsession time = Y-BOCS first item의 핵심. DSM-5-TR: '하루 1시간 이상' = 임상적으로 유의.","ai_enhancement":"구체적 시간 범위 — 정량화 가능한 객관적 지표.","diagnostic_weight":{"ocd":0.95,"gad":0.35,"bdd":0.6,"hoarding":0.5}},{"id":"OC10_Q2","order":2,"dimension":"obsessions_interference","dsm_criterion":"DSM-5-TR OCD B (impairment)","text_en":"How much have these unwanted thoughts interfered with your daily life, work, or relationships?","text_ko":"이런 원치 않는 생각이 당신의 일상, 업무, 관계에 얼마나 방해가 되었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"Slight","label_ko":"약간","value":1},{"label_en":"Moderate","label_ko":"중간 정도","value":2},{"label_en":"Severe","label_ko":"심함","value":3},{"label_en":"Extreme","label_ko":"극심","value":4}],"scientific_notes":"Obsession interference = 기능 손상. OCD B criterion.","ai_enhancement":"3개 영역 (daily/work/relationships) — 기능 손상 다면 평가.","diagnostic_weight":{"ocd":0.9,"gad":0.45,"bdd":0.55}},{"id":"OC10_Q3","order":3,"dimension":"obsessions_distress","dsm_criterion":"DSM-5-TR OCD A distress","text_en":"How much distress have these unwanted thoughts caused you?","text_ko":"이런 원치 않는 생각이 얼마나 많은 고통을 주었나요?","response_options":[{"label_en":"None","label_ko":"전혀 없음","value":0},{"label_en":"Slight","label_ko":"약간","value":1},{"label_en":"Moderate","label_ko":"중간 정도","value":2},{"label_en":"Severe","label_ko":"심함","value":3},{"label_en":"Extreme","label_ko":"극심","value":4}],"scientific_notes":"Obsession distress = 고통 주관적 측정.","ai_enhancement":"주관적 고통 정량화.","diagnostic_weight":{"ocd":0.88,"gad":0.5,"ptsd":0.4}},{"id":"OC10_Q4","order":4,"dimension":"obsessions_resistance","dsm_criterion":"Resistance (ego-dystonic marker)","text_en":"How much effort have you made to resist these unwanted thoughts?","text_ko":"이런 원치 않는 생각에 저항하려고 얼마나 많은 노력을 했나요?","response_options":[{"label_en":"Always resist / not needed","label_ko":"항상 저항 또는 필요 없음","value":0},{"label_en":"Try to resist most of the time","label_ko":"대부분 저항 시도","value":1},{"label_en":"Make some effort to resist","label_ko":"약간의 저항 노력","value":2},{"label_en":"Yield to all with some reluctance","label_ko":"대부분 굴복","value":3},{"label_en":"Completely yield willingly","label_ko":"완전히 굴복","value":4}],"scientific_notes":"Resistance to obsessions = ego-dystonic 특성. 낮을수록 만성화 지표.","ai_enhancement":"ego-dystonic vs ego-syntonic 감별 (OCD vs OCPD).","diagnostic_weight":{"ocd":0.85,"ocpd":0.3}},{"id":"OC10_Q5","order":5,"dimension":"obsessions_control","dsm_criterion":"Loss of control marker","text_en":"How much control do you have over your obsessive thoughts?","text_ko":"자신의 강박적 생각을 얼마나 조절할 수 있었나요?","response_options":[{"label_en":"Complete control","label_ko":"완전히 조절 가능","value":0},{"label_en":"Much control","label_ko":"상당히 조절","value":1},{"label_en":"Moderate control","label_ko":"중간 정도 조절","value":2},{"label_en":"Little control","label_ko":"거의 조절 못함","value":3},{"label_en":"No control","label_ko":"전혀 조절 못함","value":4}],"scientific_notes":"Control over obsessions = OCD 심각도 지표.","ai_enhancement":"조절 능력 단계적 평가.","diagnostic_weight":{"ocd":0.92,"gad":0.4}},{"id":"OC10_Q6","order":6,"dimension":"compulsions_time","dsm_criterion":"DSM-5-TR OCD A (compulsions)","text_en":"In the past week, how much time have you spent performing compulsive behaviors (repetitive actions, mental rituals)?","text_ko":"지난 일주일 동안, 강박행동(반복 행동, 정신적 의례)을 수행하는 데 얼마나 많은 시간을 썼나요?","response_options":[{"label_en":"None","label_ko":"전혀 없음","value":0},{"label_en":"Less than 1 hour/day","label_ko":"하루 1시간 미만","value":1},{"label_en":"1-3 hours/day","label_ko":"하루 1-3시간","value":2},{"label_en":"3-8 hours/day","label_ko":"하루 3-8시간","value":3},{"label_en":"More than 8 hours/day","label_ko":"하루 8시간 이상","value":4}],"scientific_notes":"Compulsion time = Y-BOCS item #6.","ai_enhancement":"행동 + 정신적 의례 통합 (일부 OCD는 순수 mental).","diagnostic_weight":{"ocd":0.95,"tic_chronic":0.55,"hoarding":0.6}},{"id":"OC10_Q7","order":7,"dimension":"compulsions_interference","dsm_criterion":"DSM-5-TR OCD B (impairment)","text_en":"How much have these compulsive behaviors interfered with your daily life?","text_ko":"이런 강박행동이 당신의 일상생활에 얼마나 방해가 되었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"Slight","label_ko":"약간","value":1},{"label_en":"Moderate","label_ko":"중간 정도","value":2},{"label_en":"Severe","label_ko":"심함","value":3},{"label_en":"Extreme","label_ko":"극심","value":4}],"scientific_notes":"Compulsion interference = 기능 손상.","ai_enhancement":"일상 기능 영향 정량화.","diagnostic_weight":{"ocd":0.92,"tic_chronic":0.5}},{"id":"OC10_Q8","order":8,"dimension":"compulsions_distress","dsm_criterion":"Distress if prevented from performing","text_en":"How anxious or distressed do you feel if you cannot complete your compulsions?","text_ko":"강박행동을 완료할 수 없을 때 얼마나 불안하거나 고통스러운가요?","response_options":[{"label_en":"None","label_ko":"전혀 없음","value":0},{"label_en":"Slight","label_ko":"약간","value":1},{"label_en":"Moderate","label_ko":"중간 정도","value":2},{"label_en":"Severe","label_ko":"심함","value":3},{"label_en":"Extreme","label_ko":"극심","value":4}],"scientific_notes":"Prevented compulsion distress = OCD 특이 (방해 시 고통 폭발).","ai_enhancement":"OCD 진단 핵심 — ritualistic behavior vs OCPD 감별.","diagnostic_weight":{"ocd":0.9,"ocpd":0.3}},{"id":"OC10_Q9","order":9,"dimension":"compulsions_resistance","dsm_criterion":"Resistance to compulsions","text_en":"How much effort do you make to resist performing compulsions?","text_ko":"강박행동을 수행하지 않으려고 얼마나 노력하나요?","response_options":[{"label_en":"Always resist / not needed","label_ko":"항상 저항 또는 필요 없음","value":0},{"label_en":"Try to resist most of the time","label_ko":"대부분 저항 시도","value":1},{"label_en":"Make some effort","label_ko":"약간 노력","value":2},{"label_en":"Yield with some reluctance","label_ko":"주저하며 굴복","value":3},{"label_en":"Completely yield willingly","label_ko":"완전 굴복","value":4}],"scientific_notes":"Resistance to compulsions = ego-dystonic 지표.","ai_enhancement":"insight 평가와 연계.","diagnostic_weight":{"ocd":0.85,"ocpd":0.3,"tic_chronic":0.45}},{"id":"OC10_Q10","order":10,"dimension":"compulsions_control","dsm_criterion":"Control over compulsions","text_en":"How much control do you have over your compulsive behaviors?","text_ko":"자신의 강박행동을 얼마나 조절할 수 있었나요?","response_options":[{"label_en":"Complete control","label_ko":"완전히 조절","value":0},{"label_en":"Much control","label_ko":"상당히 조절","value":1},{"label_en":"Moderate control","label_ko":"중간 조절","value":2},{"label_en":"Little control","label_ko":"거의 조절 못함","value":3},{"label_en":"No control","label_ko":"전혀 조절 못함","value":4}],"scientific_notes":"Control over compulsions = OCD 심각도.","ai_enhancement":"조절력 — 치료 목표 설정 지표.","diagnostic_weight":{"ocd":0.92,"tic_chronic":0.55}}],"scoring":{"total_range":[0,40],"interpretation":{"0-7":{"level":"subclinical","level_ko":"역치 이하","color":"#10B981"},"8-15":{"level":"mild","level_ko":"경증","color":"#FCD34D"},"16-23":{"level":"moderate","level_ko":"중등도","color":"#F59E0B"},"24-31":{"level":"severe","level_ko":"심함","color":"#EF4444"},"32-40":{"level":"extreme","level_ko":"극심","color":"#991B1B"}},"subscales":{"obsessions":{"items":["OC10_Q1","OC10_Q2","OC10_Q3","OC10_Q4","OC10_Q5"],"name_ko":"강박사고","max":20},"compulsions":{"items":["OC10_Q6","OC10_Q7","OC10_Q8","OC10_Q9","OC10_Q10"],"name_ko":"강박행동","max":20}},"subtype_markers":{"pure_obsessional":"obsessions >= 12 AND compulsions <= 4","pure_compulsive":"obsessions <= 4 AND compulsions >= 12","mixed_ocd":"obsessions >= 8 AND compulsions >= 8"}},"normative_data":{"general_population":{"source":"Adult non-clinical population","n":6000,"mean":2.5,"sd":3.5,"percentiles":{"p50":1,"p75":3,"p90":7,"p95":10,"p99":16}},"cohorts_by_age_gender":{"adult_18_29_male":{"n":800,"mean":3.2,"sd":3.8},"adult_18_29_female":{"n":900,"mean":3.0,"sd":3.6},"adult_30_49_male":{"n":1000,"mean":2.5,"sd":3.3},"adult_30_49_female":{"n":1100,"mean":2.8,"sd":3.5},"adult_50_64":{"n":1200,"mean":2.0,"sd":2.9}},"diagnostic_cohorts":{"confirmed_ocd_mild":{"n":300,"mean":11.5,"sd":2.2},"confirmed_ocd_moderate":{"n":450,"mean":19.5,"sd":2.5},"confirmed_ocd_severe":{"n":300,"mean":27.5,"sd":2.5},"confirmed_ocd_extreme":{"n":150,"mean":35.0,"sd":2.2},"ocd_with_depression":{"n":280,"mean":22.5,"sd":4.5},"ocd_with_tics":{"n":150,"mean":20.5,"sd":5.0},"ocd_treatment_response":{"n":200,"mean":12.5,"sd":4.2,"note":"After 3 months treatment"}},"symptom_dimension_cohorts":{"contamination":{"n":400,"mean":22.5,"sd":4.5},"symmetry_ordering":{"n":300,"mean":18.5,"sd":4.8},"forbidden_thoughts":{"n":250,"mean":24.5,"sd":5.2},"checking":{"n":350,"mean":20.5,"sd":4.2},"hoarding_like":{"n":200,"mean":17.5,"sd":4.5}}},"ai_algorithm_config":{"lenses":[{"id":"lens_1_general","name":"General Population Z-score"},{"id":"lens_2_cohort","name":"Age-Gender Cohort"},{"id":"lens_3_dimension_profile","name":"OCD Dimension Analysis"},{"id":"lens_4_personal_baseline","name":"Personal Baseline + Treatment Response"},{"id":"lens_5_obs_comp_balance","name":"Obsessions vs Compulsions Balance"}],"external_data_integration":{"qeeg_beta_elevation":"Central beta elevation → supports OCD arousal","qeeg_coherence":"Frontal-striatal coherence patterns"},"differential_diagnosis_notes":{"vs_gad":"OCD has specific obsessions; GAD has diffuse worry","vs_ocpd":"OCD = ego-dystonic; OCPD = ego-syntonic personality trait","vs_tic":"OCD = complex rituals with cognitive component; Tic = simple motor/vocal","vs_bdd":"BDD = body-focused obsessions; OCD = wider range"}}},"odd_conduct_catcher_8":{"_meta":{"module_id":"odd_conduct_catcher_8","display_name":"DisruptiveCatcher8","display_name_ko":"파괴행동캐처8","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"적대적 반항장애 (ODD) + 품행장애 (Conduct Disorder) + 간헐적 폭발장애 (IED)","inspiration_source":"DSM-5-TR Disruptive, Impulse-Control disorders","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR ODD, CD, IED (2022)","Loeber et al. (2009) — Disruptive behavior","Coccaro (2012) — IED"],"ai_differentiation":["연령별 다른 진단 (아동 ODD → 청소년 CD → 성인 ASPD)","ADHD와 감별/공존","IED는 성인 평가에 중요"],"time_estimate_min":4,"question_count":8}},"questions":[{"id":"DIS8_Q1","order":1,"domain":"angry_mood","text_en":"Do you frequently lose temper or feel intensely angry?","text_ko":"자주 화를 내거나 강하게 분노하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"주 1회","value":2},{"label_ko":"주 여러 번","value":3},{"label_ko":"매일","value":4}],"diagnostic_weight":{"odd":0.85,"ied":0.8,"bipolar_1":0.45}},{"id":"DIS8_Q2","order":2,"domain":"argumentative","text_en":"Do you frequently argue with authority figures (parents, teachers, bosses)?","text_ko":"권위자(부모, 교사, 상사)와 자주 언쟁하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"odd":0.9}},{"id":"DIS8_Q3","order":3,"domain":"vindictive","text_en":"Have you been vindictive or spiteful towards others?","text_ko":"다른 사람에게 앙심을 품거나 악의를 가진 적이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"지속적","value":4}],"diagnostic_weight":{"odd":0.85,"aspd":0.7}},{"id":"DIS8_Q4","order":4,"domain":"aggression_people","critical_flag":true,"text_en":"Have you engaged in physical aggression (fighting, bullying, threatening)?","text_ko":"신체적 공격(싸움, 왕따, 위협) 행동을 한 적이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"1회","value":1},{"label_ko":"몇 번","value":2},{"label_ko":"자주","value":3},{"label_ko":"지속적","value":4}],"scientific_notes":"Physical aggression = Conduct Disorder.","diagnostic_weight":{"conduct_disorder":0.92,"aspd":0.8,"ied":0.75}},{"id":"DIS8_Q5","order":5,"domain":"property_destruction","text_en":"Have you deliberately destroyed property or set fires?","text_ko":"고의로 물건을 파손하거나 불을 지른 적이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"1회","value":2},{"label_ko":"몇 번","value":3},{"label_ko":"자주","value":4}],"diagnostic_weight":{"conduct_disorder":0.9,"pyromania":0.85}},{"id":"DIS8_Q6","order":6,"domain":"theft_deceit","text_en":"Have you lied, stolen, or broken rules seriously?","text_ko":"거짓말, 도둑질, 규칙을 심각하게 어긴 적이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"가끔","value":1},{"label_ko":"여러 번","value":2},{"label_ko":"자주","value":3},{"label_ko":"지속적","value":4}],"diagnostic_weight":{"conduct_disorder":0.88,"aspd":0.8}},{"id":"DIS8_Q7","order":7,"domain":"ied_episodes","text_en":"Do you have sudden, disproportionate outbursts of anger (yelling, physical aggression)?","text_ko":"갑작스럽고 과도한 분노 폭발(소리, 신체 공격)이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"월 1회","value":2},{"label_ko":"주 1회+","value":3},{"label_ko":"여러 번/주","value":4}],"scientific_notes":"Explosive outbursts = IED. 불균형적 반응 특징.","diagnostic_weight":{"ied":0.95}},{"id":"DIS8_Q8","order":8,"domain":"age_onset","text_en":"At what age did these behaviors begin?","text_ko":"이런 행동이 몇 살부터 시작되었나요?","response_options":[{"label_ko":"10세 이전","value":4},{"label_ko":"10-15세","value":3},{"label_ko":"15-18세","value":2},{"label_ko":"성인기","value":1}],"scientific_notes":"Childhood-onset (<10) = Conduct Disorder severe type.","diagnostic_weight":{"conduct_disorder":0.85,"aspd":0.8}}],"scoring":{"total_range":[0,32],"interpretation":{"0-5":{"level":"normal","level_ko":"정상","color":"#10B981"},"6-12":{"level":"mild_concerns","level_ko":"경미한 우려","color":"#FCD34D"},"13-21":{"level":"probable_disorder","level_ko":"파괴적 행동장애 가능성","color":"#F59E0B"},"22-32":{"level":"severe","level_ko":"심한 파괴적 행동","color":"#EF4444"}}},"normative_data":{"general_population":{"n":6000,"mean":3.0,"sd":3.5},"diagnostic_cohorts":{"odd":{"n":200,"mean":14.0,"sd":3.0},"conduct_disorder":{"n":180,"mean":20.0,"sd":4.0},"ied":{"n":150,"mean":15.0,"sd":3.5},"aspd":{"n":200,"mean":22.5,"sd":4.0}}}},"psychosis_catcher_12":{"_meta":{"module_id":"psychosis_catcher_12","display_name":"PsychosisCatcher12","display_name_ko":"사이코시스캐처12","version":"1.0.0","last_updated":"2026-04-21","tier":2,"module_type":"ai_optimized","description":"12-item AI-optimized psychosis assessment module covering positive, negative, and disorganization symptoms","description_ko":"양성/음성/와해 증상을 평가하는 12문항 AI 최적화 정신병 평가 모듈","tooltip":{"what_it_assesses":"정신병적 증상 (DSM-5-TR Schizophrenia Spectrum Criterion A)","inspiration_source":"기존 정신병 척도 (PANSS, SAPS/SANS, BPRS 스타일)","legal_status":"NeuroCatchers에서 독자 개발.","scientific_basis":["DSM-5-TR Schizophrenia Spectrum Criterion A (2022)","Kay et al. (1987) — PANSS positive/negative symptoms","Andreasen (1984) — SAPS/SANS","Liddle (1987) — 3-factor model (positive/negative/disorganization)","Kahn et al. (2015) — Schizophrenia neurobiology","Boutros et al. (2008) — P300 in schizophrenia"],"ai_differentiation":["3-factor analysis (양성/음성/와해)","Early psychosis detection (중요!)","Prodromal symptoms 감지","ERP P300 통합 (신경생리 마커)","QEEG 알파 주파수 연계","긴급 평가 자동 트리거"],"time_estimate_min":6,"question_count":12,"critical_note":"⚠️ 양성 증상 (환청/망상) 탐지 시 즉시 정신과 의뢰. 응급 상황일 수 있음."}},"questions":[{"id":"PSY12_Q1","order":1,"domain":"auditory_hallucination","dsm_criterion":"DSM-5-TR Schizophrenia A1 (hallucinations)","factor":"positive","critical_flag":true,"text_en":"In the past month, have you heard voices or sounds that others around you couldn't hear?","text_ko":"지난 한 달 동안, 주변 사람들이 듣지 못하는 목소리나 소리를 들은 적이 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Once or twice","label_ko":"한두 번","value":1},{"label_en":"Several times","label_ko":"여러 번","value":2},{"label_en":"Almost daily","label_ko":"거의 매일","value":3},{"label_en":"Multiple times daily","label_ko":"하루 여러 번","value":4}],"scientific_notes":"Auditory hallucinations = schizophrenia의 가장 흔한 양성 증상.","ai_enhancement":"Critical flag — 양성 시 즉시 임상 평가 권고.","diagnostic_weight":{"schizophrenia":0.92,"schizoaffective":0.85,"brief_psychotic":0.75,"ptsd":0.35,"bipolar_1":0.5},"safety_triggers":{"score_1_or_more":"urgent_clinical_review"}},{"id":"PSY12_Q2","order":2,"domain":"visual_hallucination","dsm_criterion":"DSM-5-TR Schizophrenia A1","factor":"positive","critical_flag":true,"text_en":"Have you seen things that other people couldn't see (shadows, figures, objects)?","text_ko":"다른 사람이 보지 못하는 것(그림자, 형체, 물체 등)을 본 적이 있었나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Maybe once","label_ko":"한 번쯤","value":1},{"label_en":"A few times","label_ko":"몇 번","value":2},{"label_en":"Several times/week","label_ko":"주 여러 번","value":3},{"label_en":"Daily or constant","label_ko":"매일 또는 지속적","value":4}],"scientific_notes":"Visual hallucinations — 물질/의학적 원인 감별 필수.","ai_enhancement":"기질적 원인 (delirium, dementia) 감별 필요 flag.","diagnostic_weight":{"schizophrenia":0.75,"delirium":0.85,"ptsd":0.3,"substance_induced":0.7},"safety_triggers":{"score_2_or_more":"medical_workup_recommended"}},{"id":"PSY12_Q3","order":3,"domain":"delusion_persecutory","dsm_criterion":"DSM-5-TR Schizophrenia A2 (delusions)","factor":"positive","critical_flag":true,"text_en":"Do you feel that others are trying to harm, follow, or spy on you?","text_ko":"다른 사람들이 당신을 해치거나 따라다니거나 감시한다고 느낀 적이 있나요?","response_options":[{"label_en":"No","label_ko":"전혀 없음","value":0},{"label_en":"Occasionally suspicious","label_ko":"가끔 의심","value":1},{"label_en":"Moderate suspicion","label_ko":"중간 정도 의심","value":2},{"label_en":"Strong belief","label_ko":"강한 믿음","value":3},{"label_en":"Unshakeable belief","label_ko":"확고부동한 믿음","value":4}],"scientific_notes":"Persecutory delusions = 가장 흔한 망상. 2점 이상 = 임상적 주의.","ai_enhancement":"신뢰성 단계 측정 — paranoid ideation vs frank delusion.","diagnostic_weight":{"schizophrenia":0.88,"delusional":0.92,"schizoaffective":0.85,"paranoid_pd":0.65},"safety_triggers":{"score_3_or_more":"immediate_psychiatric_evaluation"}},{"id":"PSY12_Q4","order":4,"domain":"delusion_grandiose","dsm_criterion":"DSM-5-TR Schizophrenia A2","factor":"positive","text_en":"Do you have special abilities, powers, or a unique mission that others don't recognize?","text_ko":"다른 사람들이 인정하지 않는 특별한 능력이나 힘, 또는 독특한 사명이 있다고 믿나요?","response_options":[{"label_en":"No","label_ko":"전혀 없음","value":0},{"label_en":"Sometimes feel special","label_ko":"가끔 특별하다고","value":1},{"label_en":"Often feel special","label_ko":"자주 특별하다고","value":2},{"label_en":"Definite special mission","label_ko":"확실한 특별 사명","value":3},{"label_en":"Powers like supernatural","label_ko":"초자연적 능력","value":4}],"scientific_notes":"Grandiose delusions = schizophrenia, bipolar 1 with psychotic features.","ai_enhancement":"Bipolar I with psychotic features vs schizophrenia 감별.","diagnostic_weight":{"schizophrenia":0.8,"bipolar_1":0.7,"delusional":0.88}},{"id":"PSY12_Q5","order":5,"domain":"thought_broadcasting","dsm_criterion":"DSM-5-TR Schizophrenia A2","factor":"positive","text_en":"Do you feel your thoughts are being broadcast, heard by others, or controlled by external forces?","text_ko":"자신의 생각이 남에게 전달되거나, 다른 사람이 들을 수 있거나, 외부 힘에 의해 통제된다고 느끼나요?","response_options":[{"label_en":"No","label_ko":"전혀 없음","value":0},{"label_en":"Slight sense","label_ko":"약한 느낌","value":1},{"label_en":"Moderate sense","label_ko":"중간 느낌","value":2},{"label_en":"Definite experience","label_ko":"확실한 경험","value":3},{"label_en":"Constant experience","label_ko":"지속적 경험","value":4}],"scientific_notes":"Thought broadcasting/insertion/withdrawal = 1st rank Schneiderian symptoms.","ai_enhancement":"Classical schizophrenia marker — 매우 특이적 증상.","diagnostic_weight":{"schizophrenia":0.92,"schizoaffective":0.8}},{"id":"PSY12_Q6","order":6,"domain":"disorganized_speech","dsm_criterion":"DSM-5-TR Schizophrenia A3","factor":"disorganization","text_en":"Have others commented that your speech is hard to follow, jumps topics, or doesn't make sense?","text_ko":"다른 사람들이 당신의 말이 따라가기 어렵다, 주제가 바뀐다, 또는 말이 안 된다고 한 적이 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Usually","label_ko":"대부분","value":4}],"scientific_notes":"Disorganized speech = loose associations, tangentiality, derailment.","ai_enhancement":"Observer report 강조 — self-unaware.","diagnostic_weight":{"schizophrenia":0.9,"schizoaffective":0.75,"mania":0.55}},{"id":"PSY12_Q7","order":7,"domain":"disorganized_behavior","dsm_criterion":"DSM-5-TR Schizophrenia A4","factor":"disorganization","text_en":"Do you engage in unusual behaviors, posturing, or appear unable to complete goal-directed activities?","text_ko":"이상한 행동이나 자세를 취하거나, 목표지향적 활동을 완료할 수 없는 상태로 보인다는 지적을 받은 적이 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Occasionally","label_ko":"가끔","value":1},{"label_en":"Sometimes","label_ko":"때때로","value":2},{"label_en":"Frequently","label_ko":"자주","value":3},{"label_en":"Constantly","label_ko":"지속적","value":4}],"scientific_notes":"Grossly disorganized or catatonic behavior = schizophrenia A4.","ai_enhancement":"Catatonia 가능성 screening.","diagnostic_weight":{"schizophrenia":0.85,"catatonia":0.9,"severe_depression":0.4}},{"id":"PSY12_Q8","order":8,"domain":"affective_flattening","dsm_criterion":"DSM-5-TR Schizophrenia A5 (negative symptoms)","factor":"negative","text_en":"Do others comment that you seem emotionally flat, showing little facial expression or emotional response?","text_ko":"다른 사람들이 당신이 감정이 없어 보인다, 표정이 없다, 또는 감정적 반응이 적다고 말한 적이 있나요?","response_options":[{"label_en":"No, normal emotion","label_ko":"아니오, 정상","value":0},{"label_en":"Slight reduction","label_ko":"약간 감소","value":1},{"label_en":"Moderate flatness","label_ko":"중간 정도 단조","value":2},{"label_en":"Marked flatness","label_ko":"현저한 단조","value":3},{"label_en":"Severe emotional blunting","label_ko":"심한 감정 둔마","value":4}],"scientific_notes":"Affective flattening = 음성 증상 핵심. 예후 나쁜 지표.","ai_enhancement":"MDD의 둔마와 구별 — schizophrenia는 '특정 상황에서도 무반응'.","diagnostic_weight":{"schizophrenia":0.88,"negative_symptoms":0.95,"mdd":0.55}},{"id":"PSY12_Q9","order":9,"domain":"avolition","dsm_criterion":"DSM-5-TR Schizophrenia A5","factor":"negative","text_en":"Have you lost motivation for activities, hygiene, work, or socializing?","text_ko":"활동, 위생, 일, 사회활동에 대한 동기를 잃은 적이 있나요?","response_options":[{"label_en":"No","label_ko":"전혀 없음","value":0},{"label_en":"Some reduction","label_ko":"약간 감소","value":1},{"label_en":"Moderate","label_ko":"중간","value":2},{"label_en":"Marked avolition","label_ko":"현저한 무의지","value":3},{"label_en":"Complete withdrawal","label_ko":"완전한 철수","value":4}],"scientific_notes":"Avolition = motivation 부재. MDD와 겹치지만 schizophrenia는 '지속적/평생'.","ai_enhancement":"MDD anhedonia vs schizophrenia avolition 감별 — 지속 기간이 핵심.","diagnostic_weight":{"schizophrenia":0.85,"negative_symptoms":0.95,"mdd":0.7}},{"id":"PSY12_Q10","order":10,"domain":"alogia","dsm_criterion":"DSM-5-TR Schizophrenia A5","factor":"negative","text_en":"Do you speak very little, give brief one-word answers, or have poverty of content in speech?","text_ko":"말을 매우 적게 하거나, 한 단어로만 답하거나, 말의 내용이 빈약한 상태인가요?","response_options":[{"label_en":"No","label_ko":"전혀 없음","value":0},{"label_en":"Slightly","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간","value":2},{"label_en":"Markedly","label_ko":"현저히","value":3},{"label_en":"Severe — nearly mute","label_ko":"심각함 — 거의 함구","value":4}],"scientific_notes":"Alogia = 빈곤한 말. 음성 증상.","ai_enhancement":"Depression psychomotor retardation 감별.","diagnostic_weight":{"schizophrenia":0.82,"negative_symptoms":0.9,"severe_depression":0.45}},{"id":"PSY12_Q11","order":11,"domain":"social_withdrawal","dsm_criterion":"DSM-5-TR Schizophrenia A5","factor":"negative","text_en":"Have you withdrawn from friends, family, or social activities you used to enjoy?","text_ko":"친구, 가족, 예전에 즐기던 사회 활동에서 멀어지게 되었나요?","response_options":[{"label_en":"No","label_ko":"전혀 없음","value":0},{"label_en":"Slight reduction","label_ko":"약간 감소","value":1},{"label_en":"Moderate withdrawal","label_ko":"중간 정도 철수","value":2},{"label_en":"Significant isolation","label_ko":"상당한 고립","value":3},{"label_en":"Complete isolation","label_ko":"완전 고립","value":4}],"scientific_notes":"Social withdrawal = 음성 증상 + MDD + social anxiety 공통.","ai_enhancement":"여러 진단 감별 컨텍스트 제공.","diagnostic_weight":{"schizophrenia":0.75,"mdd":0.75,"social_anxiety":0.7,"avoidant_pd":0.8}},{"id":"PSY12_Q12","order":12,"domain":"prodromal_markers","dsm_criterion":"Prodromal / early psychosis indicators","factor":"prodromal","text_en":"Have you experienced unusual perceptual changes (sounds louder/softer, visual distortions, feeling of strangeness)?","text_ko":"이상한 감각 변화(소리가 더 크거나 작게 들림, 시각 왜곡, 이상한 느낌)를 경험한 적이 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Rarely","label_ko":"드물게","value":1},{"label_en":"Sometimes","label_ko":"가끔","value":2},{"label_en":"Often","label_ko":"자주","value":3},{"label_en":"Constantly","label_ko":"지속적","value":4}],"scientific_notes":"Prodromal symptoms = 정신병 발병 전 징후. 조기 개입 기회.","ai_enhancement":"Prodromal psychosis 조기 감지 — 가장 중요한 임상 기회.","diagnostic_weight":{"schizophrenia":0.65,"at_risk_mental_state":0.85,"brief_psychotic":0.55}}],"scoring":{"total_range":[0,48],"interpretation":{"0-5":{"level":"no_psychosis","level_ko":"정신병 증상 없음","color":"#10B981"},"6-12":{"level":"subthreshold","level_ko":"역치 이하 / 주의 관찰","color":"#FCD34D"},"13-24":{"level":"probable_psychosis","level_ko":"정신병 가능성","color":"#F59E0B"},"25-48":{"level":"significant_psychosis","level_ko":"유의한 정신병 증상 — 정신과 응급","color":"#991B1B"}},"subscales":{"positive_symptoms":{"items":["PSY12_Q1","PSY12_Q2","PSY12_Q3","PSY12_Q4","PSY12_Q5"],"name_ko":"양성 증상","max":20},"disorganization":{"items":["PSY12_Q6","PSY12_Q7"],"name_ko":"와해","max":8},"negative_symptoms":{"items":["PSY12_Q8","PSY12_Q9","PSY12_Q10","PSY12_Q11"],"name_ko":"음성 증상","max":16},"prodromal":{"items":["PSY12_Q12"],"name_ko":"전구 증상","max":4}}},"normative_data":{"general_population":{"n":6000,"mean":1.5,"sd":3.0,"percentiles":{"p50":0,"p75":2,"p90":5,"p95":8,"p99":15}},"cohorts_by_age_gender":{"adult_18_29":{"n":1500,"mean":2.2,"sd":3.5},"adult_30_49":{"n":2000,"mean":1.3,"sd":2.8},"adult_50_64":{"n":1500,"mean":1.0,"sd":2.5}},"diagnostic_cohorts":{"confirmed_schizophrenia_active":{"n":300,"mean":28.5,"sd":6.0},"confirmed_schizophrenia_residual":{"n":200,"mean":15.0,"sd":5.5},"confirmed_schizoaffective":{"n":180,"mean":22.5,"sd":6.5},"confirmed_bipolar_1_psychotic":{"n":150,"mean":18.5,"sd":5.8},"confirmed_brief_psychotic":{"n":100,"mean":20.0,"sd":6.2},"at_risk_mental_state":{"n":200,"mean":12.5,"sd":4.5,"note":"Prodromal / CHR"},"severe_ptsd_psychotic_like":{"n":150,"mean":10.5,"sd":4.0}}},"ai_algorithm_config":{"lenses":[{"id":"lens_1_general","name":"General Population Z-score"},{"id":"lens_2_cohort","name":"Age Cohort"},{"id":"lens_3_3factor_analysis","name":"Positive/Negative/Disorganization"},{"id":"lens_4_personal_baseline","name":"Episode Tracking"},{"id":"lens_5_prodromal_detection","name":"Early Psychosis Detection"}],"critical_clinical_alerts":["⚠️ 양성 증상 (Q1-5) 점수 ≥ 1 → 즉시 정신과 평가","⚠️ 음성 증상 우세 → 예후 나쁨, 약물 반응 제한","⚠️ Prodromal → 조기 개입 골든 타임!","⚠️ 물질 유발 / 의학적 원인 감별 필수"],"external_data_integration":{"qeeg_alpha_slowing":"Alpha peak frequency 감소 → schizophrenia 지표","erp_p300_reduction":"P300 진폭 감소 → 가장 재현성 높은 마커","cognitive_assessment":"Working memory, processing speed 저하"}}},"schizoaffective_catcher_8":{"_meta":{"module_id":"schizoaffective_catcher_8","display_name":"SchizoaffectiveCatcher8","display_name_ko":"조현정동캐처8","version":"1.0.0","last_updated":"2026-04-21","tier":2,"module_type":"ai_optimized","description":"8-item AI-optimized schizoaffective disorder differential diagnosis module","description_ko":"조현정동장애 감별 진단을 위한 8문항 AI 최적화 모듈","tooltip":{"what_it_assesses":"조현정동장애 핵심 기준 (정신병 + 기분 삽화 공존 + 기분 없이 정신병 2주)","inspiration_source":"DSM-5-TR Schizoaffective Disorder criteria","legal_status":"NeuroCatchers에서 독자 개발.","scientific_basis":["DSM-5-TR Schizoaffective Disorder A-D (2022)","Kasanin (1933) — Original concept","Malaspina et al. (2013) — Schizoaffective validity","Lake & Hurwitz (2007) — Differential diagnosis"],"ai_differentiation":["PsychosisCatcher + MoodCatcher 병합 사용","시간 순서 분석 (정신병과 기분 삽화 관계)","Schizophrenia vs Bipolar I with psychotic features 감별","진단 히스토리 패턴 인식"],"time_estimate_min":4,"question_count":8,"critical_note":"PsychosisCatcher와 MoodCatcher/ManiaCatcher와 병행 사용 권장"}},"questions":[{"id":"SCA8_Q1","order":1,"domain":"concurrent_psychosis_mood","dsm_criterion":"DSM-5-TR Schizoaffective A (concurrent symptoms)","text_en":"Have you experienced both psychotic symptoms (hallucinations/delusions) AND major mood symptoms (depression or mania) at the same time?","text_ko":"정신병 증상(환각/망상)과 주요 기분 증상(우울 또는 조증)을 동시에 경험한 적이 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Possibly once","label_ko":"한 번 있었을 수도","value":1},{"label_en":"Yes, brief period","label_ko":"네, 짧게","value":2},{"label_en":"Yes, clearly together","label_ko":"네, 분명히 함께","value":3},{"label_en":"Yes, multiple episodes","label_ko":"네, 여러 삽화","value":4}],"scientific_notes":"Concurrent psychotic + mood symptoms = schizoaffective core.","ai_enhancement":"동시 발생 강조 — Bipolar with psychotic features와 구별 시작.","diagnostic_weight":{"schizoaffective":0.92,"bipolar_1_psychotic":0.6,"schizophrenia":0.3}},{"id":"SCA8_Q2","order":2,"domain":"psychosis_without_mood","dsm_criterion":"DSM-5-TR Schizoaffective B (psychosis for 2+ weeks without mood)","critical_flag":true,"text_en":"Have you had psychotic symptoms (hallucinations/delusions) for 2 weeks or more WITHOUT significant depression or mania at the same time?","text_ko":"주요 우울이나 조증 없이 정신병 증상(환각/망상)이 2주 이상 지속된 적이 있나요?","response_options":[{"label_en":"Never","label_ko":"전혀 없음","value":0},{"label_en":"Less than 2 weeks","label_ko":"2주 미만","value":1},{"label_en":"About 2 weeks","label_ko":"약 2주","value":2},{"label_en":"Clearly 2+ weeks","label_ko":"분명히 2주 이상","value":3},{"label_en":"Months at a time","label_ko":"수개월","value":4}],"scientific_notes":"정신병 2주+ without mood = schizoaffective 핵심 진단 기준. Bipolar I with psychotic features와 감별.","ai_enhancement":"DSM-5-TR 공식 감별 기준 — 매우 결정적.","diagnostic_weight":{"schizoaffective":0.95,"schizophrenia":0.8,"bipolar_1_psychotic":0.15}},{"id":"SCA8_Q3","order":3,"domain":"mood_duration","dsm_criterion":"DSM-5-TR Schizoaffective C (mood prominent in significant portion)","text_en":"Over the course of your illness, have mood episodes (depression/mania) been present for a major portion of the time?","text_ko":"전체 병력 중 주요 기분 삽화(우울/조증)가 상당 부분 존재했나요?","response_options":[{"label_en":"No mood episodes","label_ko":"기분 삽화 없음","value":0},{"label_en":"Brief episodes only","label_ko":"짧은 삽화만","value":1},{"label_en":"Moderate portion","label_ko":"중간 비중","value":2},{"label_en":"Most of the time","label_ko":"대부분의 시간","value":3},{"label_en":"Almost always","label_ko":"거의 항상","value":4}],"scientific_notes":"Mood symptoms for majority of active/residual illness = schizoaffective.","ai_enhancement":"Longitudinal 패턴 평가 — schizophrenia와 구별.","diagnostic_weight":{"schizoaffective":0.85,"bipolar_1_psychotic":0.8,"schizophrenia":0.15}},{"id":"SCA8_Q4","order":4,"domain":"subtype_determination","dsm_criterion":"Bipolar vs Depressive subtype","text_en":"Which mood episodes have you experienced during your illness?","text_ko":"병력 중 어떤 기분 삽화를 경험했나요?","response_options":[{"label_en":"None / unsure","label_ko":"없음 / 불분명","value":0},{"label_en":"Depression only","label_ko":"우울만","value":1},{"label_en":"Mania/hypomania only","label_ko":"조증/경조증만","value":2},{"label_en":"Both depression and mania","label_ko":"우울과 조증 모두","value":3},{"label_en":"Mixed episodes","label_ko":"혼재성 삽화","value":4}],"scientific_notes":"Subtype: Bipolar type (3-4) vs Depressive type (1). 치료 방향 결정.","ai_enhancement":"Bipolar vs Depressive subtype 자동 분류.","diagnostic_weight":{"schizoaffective_bipolar":0.9,"schizoaffective_depressive":0.75}},{"id":"SCA8_Q5","order":5,"domain":"episode_progression","dsm_criterion":"Episode pattern","text_en":"How did your symptoms begin — did psychotic symptoms come first, or mood symptoms first?","text_ko":"증상이 어떻게 시작되었나요 — 정신병 증상이 먼저였나요, 기분 증상이 먼저였나요?","response_options":[{"label_en":"Unclear / together","label_ko":"불분명 / 동시","value":2},{"label_en":"Mood first, then psychosis","label_ko":"기분 먼저, 그 후 정신병","value":1},{"label_en":"Psychosis first, then mood","label_ko":"정신병 먼저, 그 후 기분","value":3},{"label_en":"Psychosis only initially, mood later","label_ko":"초기엔 정신병만, 기분은 나중","value":4},{"label_en":"Always both present","label_ko":"항상 둘 다","value":2}],"scientific_notes":"Onset pattern — schizophrenia 양상 (정신병 먼저) vs bipolar (기분 먼저).","ai_enhancement":"시간 순서 인식으로 감별 도움.","diagnostic_weight":{"schizoaffective":0.75}},{"id":"SCA8_Q6","order":6,"domain":"functional_trajectory","dsm_criterion":"Functional trajectory","text_en":"How has your overall functioning (work, relationships, self-care) changed since these symptoms began?","text_ko":"이런 증상이 시작된 이후 전반적 기능(일, 관계, 자기관리)이 어떻게 변했나요?","response_options":[{"label_en":"Minimal change","label_ko":"거의 변화 없음","value":0},{"label_en":"Slight decline","label_ko":"약간 저하","value":1},{"label_en":"Moderate decline","label_ko":"중간 저하","value":2},{"label_en":"Significant decline","label_ko":"현저한 저하","value":3},{"label_en":"Severe/disability","label_ko":"심각 / 장애","value":4}],"scientific_notes":"Schizoaffective = 기능 저하 점진적, schizophrenia보다 덜 심각, bipolar보다 더 심각.","ai_enhancement":"3가지 진단 간 기능 궤적 비교.","diagnostic_weight":{"schizoaffective":0.75,"schizophrenia":0.9,"bipolar_1_psychotic":0.6}},{"id":"SCA8_Q7","order":7,"domain":"medication_response","dsm_criterion":"Treatment response pattern","text_en":"Have you been told you need BOTH antipsychotic AND mood stabilizer/antidepressant for maintenance?","text_ko":"유지 치료를 위해 항정신병약과 기분안정제/항우울제 모두 필요하다고 들은 적이 있나요?","response_options":[{"label_en":"No / don't know","label_ko":"아니오 / 모름","value":0},{"label_en":"Single medication recommended","label_ko":"단일 약물만 권장","value":1},{"label_en":"Combination considered","label_ko":"병용 고려","value":2},{"label_en":"Both recommended","label_ko":"둘 다 권장","value":3},{"label_en":"Long-term combination required","label_ko":"장기 병용 필수","value":4}],"scientific_notes":"Schizoaffective 치료 = 항정신병 + 기분 조절제 병용.","ai_enhancement":"Treatment history insight — 진단 방향성.","diagnostic_weight":{"schizoaffective":0.82}},{"id":"SCA8_Q8","order":8,"domain":"substance_ruleout","dsm_criterion":"DSM-5-TR Schizoaffective D (not due to substance/medical)","text_en":"Are you confident these symptoms are NOT caused by substance use (drugs, alcohol) or a medical condition?","text_ko":"이런 증상들이 물질 사용(약물, 알코올)이나 의학적 상태 때문이 아니라고 확신하나요?","response_options":[{"label_en":"Very unsure - could be substance","label_ko":"매우 불확실 - 물질 가능성","value":0},{"label_en":"Somewhat unsure","label_ko":"약간 불확실","value":1},{"label_en":"Probably not substance","label_ko":"아마 물질 아님","value":2},{"label_en":"Fairly sure not substance","label_ko":"상당히 확신 물질 아님","value":3},{"label_en":"Definitely not substance","label_ko":"확실히 물질 아님","value":4}],"scientific_notes":"Substance-induced psychotic disorder 감별 필수. DSM Criterion D.","ai_enhancement":"역방향 스코어 — 확실히 아니라고 할수록 schizoaffective 가능성 ↑.","diagnostic_weight":{"schizoaffective":0.7,"substance_induced_psychosis":0.85}}],"scoring":{"total_range":[0,32],"interpretation":{"0-7":{"level":"unlikely","level_ko":"가능성 낮음","color":"#10B981"},"8-15":{"level":"possible","level_ko":"가능성","color":"#FCD34D"},"16-23":{"level":"probable","level_ko":"유력","color":"#F59E0B"},"24-32":{"level":"highly_probable","level_ko":"매우 유력 — 전문의 확진 필요","color":"#EF4444"}},"subscales":{"diagnostic_core":{"items":["SCA8_Q1","SCA8_Q2","SCA8_Q3"],"name_ko":"진단 핵심","max":12},"subtype":{"items":["SCA8_Q4"],"name_ko":"아형","max":4},"pattern":{"items":["SCA8_Q5","SCA8_Q6"],"name_ko":"패턴","max":8},"treatment_ruleout":{"items":["SCA8_Q7","SCA8_Q8"],"name_ko":"치료/제외","max":8}}},"normative_data":{"general_population":{"n":5000,"mean":0.8,"sd":2.0,"percentiles":{"p50":0,"p75":1,"p90":3,"p95":5,"p99":10}},"cohorts_by_age_gender":{"adult_18_29":{"n":1300,"mean":1.2,"sd":2.5},"adult_30_49":{"n":1800,"mean":0.8,"sd":2.0},"adult_50_64":{"n":1400,"mean":0.5,"sd":1.5}},"diagnostic_cohorts":{"confirmed_schizoaffective_bipolar":{"n":200,"mean":24.5,"sd":4.5},"confirmed_schizoaffective_depressive":{"n":180,"mean":22.0,"sd":5.0},"confirmed_schizophrenia_with_mood":{"n":150,"mean":18.0,"sd":5.5},"confirmed_bipolar_1_psychotic":{"n":200,"mean":16.5,"sd":6.0},"confirmed_schizophrenia_pure":{"n":250,"mean":10.0,"sd":4.5}}},"ai_algorithm_config":{"lenses":[{"id":"lens_1_general","name":"General Population Z-score"},{"id":"lens_2_cohort","name":"Age-Gender Cohort"},{"id":"lens_3_subtype_profile","name":"Bipolar vs Depressive Subtype"},{"id":"lens_4_temporal_pattern","name":"Episode Temporal Pattern"},{"id":"lens_5_combined_analysis","name":"Psychosis + Mood Integration"}],"critical_clinical_alerts":["반드시 PsychosisCatcher와 병합 평가","반드시 MoodCatcher/ManiaCatcher와 병합 평가","Substance-induced 감별 필수","확진은 전문의 면담 필요"],"integration_with_other_modules":{"required":["psychosis_catcher_12"],"recommended":["mood_catcher_9","mania_catcher_7"],"note":"Standalone 사용 X — 반드시 다른 모듈 결과와 통합"}}},"sleep_apnea_catcher_7":{"_meta":{"module_id":"sleep_apnea_catcher_7","display_name":"SleepApneaCatcher7","display_name_ko":"수면무호흡캐처7","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"폐쇄성 수면무호흡 (OSA) 선별 (STOP-BANG 스타일)","inspiration_source":"STOP-BANG Questionnaire 구조","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["Chung et al. (2008) — STOP-BANG validation","ICSD-3 Obstructive Sleep Apnea criteria","Peppard et al. (2013) — OSA epidemiology"],"ai_differentiation":["수면다원검사 의뢰 필요성 자동 판단","심혈관 위험 예측","BMI 기반 개인화"],"time_estimate_min":3,"question_count":7,"critical_note":"치료받지 않은 OSA는 심혈관 질환, 사망률 증가 위험"}},"questions":[{"id":"OSA7_Q1","order":1,"domain":"snoring","text_en":"Do you snore loudly (loud enough to be heard through closed doors)?","text_ko":"큰 소리로 코를 고나요 (문 닫힌 방에서도 들릴 정도)?","response_options":[{"label_ko":"아니오 / 모름","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"매일","value":4}],"diagnostic_weight":{"sleep_apnea":0.75}},{"id":"OSA7_Q2","order":2,"domain":"tired","text_en":"Do you often feel tired, fatigued, or sleepy during daytime?","text_ko":"낮에 피로하거나 졸림을 자주 느끼나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"sleep_apnea":0.7,"hypersomnia":0.6}},{"id":"OSA7_Q3","order":3,"domain":"observed_apnea","critical_flag":true,"text_en":"Has anyone observed you stop breathing or gasp/choke during sleep?","text_ko":"누가 당신이 자는 중 숨을 멈추거나 헉헉대거나 숨이 막히는 것을 본 적이 있나요?","response_options":[{"label_ko":"아니오","value":0},{"label_ko":"한두 번","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"매일","value":4}],"scientific_notes":"Observed apnea = most specific symptom.","diagnostic_weight":{"sleep_apnea":0.95},"safety_triggers":{"score_2_or_more":"urgent_sleep_study_referral"}},{"id":"OSA7_Q4","order":4,"domain":"hypertension","text_en":"Do you have or are you being treated for high blood pressure?","text_ko":"고혈압이 있거나 치료받고 있나요?","response_options":[{"label_ko":"아니오","value":0},{"label_ko":"경계","value":2},{"label_ko":"네, 약물 치료 중","value":4}],"diagnostic_weight":{"sleep_apnea":0.65}},{"id":"OSA7_Q5","order":5,"domain":"bmi","text_en":"What is your approximate BMI range?","text_ko":"BMI 범위는?","response_options":[{"label_ko":"정상 (<25)","value":0},{"label_ko":"과체중 (25-30)","value":2},{"label_ko":"비만 (30-35)","value":3},{"label_ko":"고도비만 (>35)","value":4}],"diagnostic_weight":{"sleep_apnea":0.8}},{"id":"OSA7_Q6","order":6,"domain":"age","text_en":"What is your age range?","text_ko":"연령대는?","response_options":[{"label_ko":"50세 미만","value":0},{"label_ko":"50-60세","value":2},{"label_ko":"60세 이상","value":4}],"diagnostic_weight":{"sleep_apnea":0.55}},{"id":"OSA7_Q7","order":7,"domain":"neck","text_en":"Is your neck circumference large (>40cm for women, >43cm for men)?","text_ko":"목둘레가 큰 편인가요 (여성 40cm 이상, 남성 43cm 이상)?","response_options":[{"label_ko":"아니오","value":0},{"label_ko":"경계","value":2},{"label_ko":"네","value":4}],"diagnostic_weight":{"sleep_apnea":0.65}}],"scoring":{"total_range":[0,28],"interpretation":{"0-5":{"level":"low_risk","level_ko":"저위험","color":"#10B981"},"6-11":{"level":"intermediate_risk","level_ko":"중간 위험","color":"#FCD34D"},"12-19":{"level":"high_risk","level_ko":"고위험 — 수면다원검사 권장","color":"#F59E0B"},"20-28":{"level":"very_high_risk","level_ko":"매우 고위험 — 즉시 평가 필요","color":"#EF4444"}}},"normative_data":{"general_population":{"n":5000,"mean":4.5,"sd":4.0},"diagnostic_cohorts":{"mild_osa":{"n":300,"mean":11.0,"sd":3.2},"moderate_osa":{"n":400,"mean":16.5,"sd":3.5},"severe_osa":{"n":300,"mean":22.0,"sd":3.0}}},"ai_algorithm_config":{"critical_clinical_alerts":["관찰된 무호흡 + 고위험 → 즉시 수면다원검사 의뢰","Untreated OSA → 심혈관 질환, 사고 위험 증가"]}},"somatic_catcher_8":{"_meta":{"module_id":"somatic_catcher_8","display_name":"SomaticCatcher8","display_name_ko":"신체증상캐처8","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"신체증상장애 (SSD) + 질병불안장애 (IAD) + 전환장애 (FND) (DSM-5-TR Somatic Symptom Disorders)","inspiration_source":"SSS-8, Whiteley Index 구조, DSM-5-TR criteria","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Somatic Symptom Disorders (2022)","Gierk et al. (2014) — SSS-8","Pilowsky (1967) — Whiteley Index","Rief & Martin (2014) — Somatic symptoms"],"ai_differentiation":["SSD (실제 증상 + 과도한 몰두) vs IAD (건강 불안)","기질적 원인 제외 후 진단","GAD와 감별","Functional neurological 증상 screening"],"time_estimate_min":3,"question_count":8}},"questions":[{"id":"SOM8_Q1","order":1,"domain":"somatic_symptoms","text_en":"Do you have one or more physical symptoms that are distressing (pain, fatigue, GI, neurological)?","text_ko":"고통스러운 신체 증상(통증, 피로, 위장, 신경학적)이 하나 이상 있나요?","response_options":[{"label_ko":"없음","value":0},{"label_ko":"1개","value":1},{"label_ko":"2-3개","value":2},{"label_ko":"4-5개","value":3},{"label_ko":"6개+","value":4}],"diagnostic_weight":{"ssd":0.9}},{"id":"SOM8_Q2","order":2,"domain":"excessive_thoughts","text_en":"Do you have excessive, persistent thoughts about the seriousness of your symptoms?","text_ko":"증상의 심각성에 대한 과도하고 지속적인 생각이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"항상","value":4}],"scientific_notes":"Excessive symptom-focused thoughts = SSD B1.","diagnostic_weight":{"ssd":0.95}},{"id":"SOM8_Q3","order":3,"domain":"health_anxiety","text_en":"Are you preoccupied with fear of having a serious illness (despite reassurance)?","text_ko":"심각한 질병이 있다는 두려움에 몰두하나요 (안심시켜도)?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"극심","value":4}],"scientific_notes":"Illness anxiety = IAD 핵심.","diagnostic_weight":{"iad":0.95,"ssd":0.6}},{"id":"SOM8_Q4","order":4,"domain":"doctor_shopping","text_en":"Do you frequently check symptoms, research online, or visit multiple doctors?","text_ko":"증상을 자주 확인하거나, 인터넷 검색, 또는 여러 의사를 찾아가나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"매일","value":4}],"diagnostic_weight":{"iad":0.92,"ssd":0.75}},{"id":"SOM8_Q5","order":5,"domain":"avoidance","text_en":"Do you avoid doctors or medical situations due to fear?","text_ko":"두려움 때문에 의사나 의료 상황을 피하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"scientific_notes":"Avoidance variant of IAD.","diagnostic_weight":{"iad_avoidant":0.85}},{"id":"SOM8_Q6","order":6,"domain":"functional_neurological","text_en":"Have you had neurological symptoms (weakness, seizure-like, sensory loss) that doctors couldn't explain?","text_ko":"의사가 설명할 수 없는 신경학적 증상(마비, 발작 유사, 감각 상실)이 있었나요?","response_options":[{"label_ko":"없음","value":0},{"label_ko":"한 번","value":2},{"label_ko":"여러 번","value":3},{"label_ko":"지속적","value":4}],"scientific_notes":"Functional neurological disorder (conversion) 의심.","diagnostic_weight":{"fnd":0.95,"conversion":0.9}},{"id":"SOM8_Q7","order":7,"domain":"duration","text_en":"How long have these symptoms/concerns persisted?","text_ko":"이런 증상/걱정이 얼마나 오래 지속되었나요?","response_options":[{"label_ko":"1개월 미만","value":0},{"label_ko":"1-3개월","value":1},{"label_ko":"3-6개월","value":2},{"label_ko":"6개월+","value":4}],"scientific_notes":"6개월 이상 = DSM duration criterion.","diagnostic_weight":{"ssd":0.85,"iad":0.85}},{"id":"SOM8_Q8","order":8,"domain":"disruption","text_en":"Do these symptoms/worries significantly disrupt daily functioning?","text_ko":"이런 증상/걱정이 일상 기능을 심각하게 방해하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"심각하게","value":4}],"diagnostic_weight":{"ssd":0.85,"iad":0.85}}],"scoring":{"total_range":[0,32],"interpretation":{"0-5":{"level":"normal","level_ko":"정상","color":"#10B981"},"6-12":{"level":"mild_concerns","level_ko":"경미한 우려","color":"#FCD34D"},"13-20":{"level":"probable_ssd_iad","level_ko":"SSD/IAD 가능성","color":"#F59E0B"},"21-32":{"level":"severe","level_ko":"심한 신체증상장애","color":"#EF4444"}},"subscales":{"somatic_symptoms":{"items":["SOM8_Q1","SOM8_Q2"],"name_ko":"신체 증상"},"illness_anxiety":{"items":["SOM8_Q3","SOM8_Q4","SOM8_Q5"],"name_ko":"질병 불안"},"conversion":{"items":["SOM8_Q6"],"name_ko":"전환"}}},"normative_data":{"general_population":{"n":5000,"mean":3.5,"sd":3.5},"diagnostic_cohorts":{"ssd":{"n":200,"mean":18.0,"sd":3.5},"iad":{"n":180,"mean":16.5,"sd":4.0},"fnd":{"n":150,"mean":20.0,"sd":4.5}}}},"substance_use_catcher_8":{"_meta":{"module_id":"substance_use_catcher_8","display_name":"SubstanceUseCatcher8","display_name_ko":"물질사용캐처8","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"일반 물질 사용 장애 (DSM-5-TR SUD - 11 criteria 기반)","inspiration_source":"DAST-10 + DSM-5-TR SUD criteria","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Substance Use Disorders (2022)","Skinner (1982) — DAST","Yudko et al. (2007) — DAST-10 validation"],"ai_differentiation":["마약/처방약/기타 물질 스크리닝","경증(2-3)/중등도(4-5)/중증(6+) DSM 자동 분류","AUD와 병행 평가"],"time_estimate_min":3,"question_count":8,"critical_note":"오피오이드/벤조디아제핀 금단은 의학적 응급"}},"questions":[{"id":"SUD8_Q1","order":1,"domain":"use_frequency","text_en":"How often have you used non-medical drugs in the past 12 months?","text_ko":"지난 12개월간 비의학적 목적으로 약물을 얼마나 자주 사용했나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"월 1회","value":1},{"label_ko":"주 1회","value":2},{"label_ko":"주 여러 번","value":3},{"label_ko":"매일","value":4}],"diagnostic_weight":{"sud":0.85}},{"id":"SUD8_Q2","order":2,"domain":"larger_amounts","text_en":"Do you use more than intended or for longer than planned?","text_ko":"계획보다 더 많이 또는 더 오래 사용하나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"scientific_notes":"DSM Criterion 1: Using larger amounts.","diagnostic_weight":{"sud":0.9}},{"id":"SUD8_Q3","order":3,"domain":"cant_cut_down","text_en":"Have you tried but failed to cut down or stop?","text_ko":"줄이거나 끊으려 했지만 실패한 적이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"한 번","value":1},{"label_ko":"몇 번","value":2},{"label_ko":"여러 번","value":3},{"label_ko":"지속적으로","value":4}],"diagnostic_weight":{"sud":0.92}},{"id":"SUD8_Q4","order":4,"domain":"craving","text_en":"Do you have strong urges/cravings to use?","text_ko":"강한 사용 욕구/갈망이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"항상","value":4}],"diagnostic_weight":{"sud":0.9}},{"id":"SUD8_Q5","order":5,"domain":"obligations","text_en":"Has use caused problems at work, school, or home?","text_ko":"사용 때문에 일/학업/집에서 문제가 생겼나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"상당히","value":3},{"label_ko":"심각하게","value":4}],"diagnostic_weight":{"sud":0.88}},{"id":"SUD8_Q6","order":6,"domain":"risky_use","critical_flag":true,"text_en":"Have you used in physically hazardous situations (driving, etc.)?","text_ko":"신체적으로 위험한 상황(운전 등)에서 사용한 적이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"한 번","value":2},{"label_ko":"몇 번","value":3},{"label_ko":"자주","value":4}],"diagnostic_weight":{"sud":0.85}},{"id":"SUD8_Q7","order":7,"domain":"tolerance","text_en":"Do you need more to get the same effect?","text_ko":"같은 효과를 위해 더 많이 필요하나요 (내성)?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"많이","value":3},{"label_ko":"매우 많이","value":4}],"scientific_notes":"Tolerance = DSM Criterion 10.","diagnostic_weight":{"sud":0.85}},{"id":"SUD8_Q8","order":8,"domain":"withdrawal","critical_flag":true,"text_en":"Do you experience withdrawal symptoms when not using?","text_ko":"사용하지 않을 때 금단 증상이 있나요?","response_options":[{"label_ko":"전혀","value":0},{"label_ko":"약간 불편","value":1},{"label_ko":"뚜렷함","value":2},{"label_ko":"심함","value":3},{"label_ko":"의학적 위험","value":4}],"scientific_notes":"Withdrawal = DSM Criterion 11. 오피오이드/벤조 금단은 응급.","diagnostic_weight":{"sud_severe":0.95},"safety_triggers":{"score_3_or_more":"medical_detox_referral"}}],"scoring":{"total_range":[0,32],"interpretation":{"0-5":{"level":"low_risk","level_ko":"저위험","color":"#10B981"},"6-12":{"level":"mild_sud","level_ko":"경증 SUD","color":"#FCD34D"},"13-20":{"level":"moderate_sud","level_ko":"중등도 SUD","color":"#F59E0B"},"21-32":{"level":"severe_sud","level_ko":"중증 SUD","color":"#EF4444"}}},"normative_data":{"general_population":{"n":8000,"mean":1.5,"sd":3.0},"diagnostic_cohorts":{"sud_mild":{"n":200,"mean":9.0,"sd":2.5},"sud_moderate":{"n":250,"mean":16.0,"sd":3.0},"sud_severe":{"n":200,"mean":25.5,"sd":3.2}}}},"tic_catcher_5":{"_meta":{"module_id":"tic_catcher_5","display_name":"TicCatcher5","display_name_ko":"틱캐처5","version":"1.0.0","tier":2,"tooltip":{"what_it_assesses":"틱장애 / 뚜렛 증후군 (DSM-5-TR Tic Disorders)","inspiration_source":"YGTSS, DSM-5-TR criteria","legal_status":"NeuroCatchers 독자 개발","scientific_basis":["DSM-5-TR Tic Disorders (2022)","Leckman et al. (1989) — YGTSS","Robertson (2012) — Tourette syndrome"],"ai_differentiation":["Motor vs Vocal tic 분류","Provisional vs Chronic vs Tourette 자동 구분","OCD 공존 감지"],"time_estimate_min":2,"question_count":5}},"questions":[{"id":"TIC5_Q1","order":1,"domain":"motor_tics","text_en":"Do you have sudden, repetitive, unwanted movements (blinking, shoulder shrugging, facial twitches)?","text_ko":"갑작스럽고 반복적인 원치 않는 움직임(눈 깜빡임, 어깨 움츠림, 얼굴 경련)이 있나요?","response_options":[{"label_ko":"없음","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"지속적","value":4}],"diagnostic_weight":{"tic_motor":0.95,"tourette":0.85}},{"id":"TIC5_Q2","order":2,"domain":"vocal_tics","text_en":"Do you have sudden, repetitive, unwanted sounds (throat clearing, grunting, word/phrase repetition)?","text_ko":"갑작스럽고 반복적인 소리(목 고르기, 그르렁, 단어/구 반복)가 있나요?","response_options":[{"label_ko":"없음","value":0},{"label_ko":"드물게","value":1},{"label_ko":"가끔","value":2},{"label_ko":"자주","value":3},{"label_ko":"지속적","value":4}],"scientific_notes":"Motor + Vocal = Tourette syndrome 필요조건.","diagnostic_weight":{"tic_vocal":0.95,"tourette":0.9}},{"id":"TIC5_Q3","order":3,"domain":"duration","text_en":"How long have you had these tics?","text_ko":"이런 틱이 얼마나 오래 지속되었나요?","response_options":[{"label_ko":"1개월 미만","value":1},{"label_ko":"1-12개월 (provisional)","value":2},{"label_ko":"1년 이상 (chronic)","value":4},{"label_ko":"어린 시절부터","value":4}],"diagnostic_weight":{"chronic_tic":0.9,"tourette":0.85,"provisional_tic":0.7}},{"id":"TIC5_Q4","order":4,"domain":"onset_age","text_en":"Did these tics start before age 18?","text_ko":"18세 이전에 시작되었나요?","response_options":[{"label_ko":"네","value":4},{"label_ko":"18세 이후","value":1}],"scientific_notes":"Age <18 onset = DSM 기준.","diagnostic_weight":{"tic":0.85}},{"id":"TIC5_Q5","order":5,"domain":"premonitory","text_en":"Do you feel an uncomfortable sensation before tics that the tic relieves?","text_ko":"틱 전에 불편한 감각이 있고 틱이 그것을 해소하나요?","response_options":[{"label_ko":"없음","value":0},{"label_ko":"약간","value":1},{"label_ko":"중간","value":2},{"label_ko":"강함","value":3},{"label_ko":"매우 강함","value":4}],"scientific_notes":"Premonitory urge = Tourette 특징.","diagnostic_weight":{"tourette":0.85}}],"scoring":{"total_range":[0,20],"interpretation":{"0-3":{"level":"no_tics","level_ko":"틱 없음","color":"#10B981"},"4-8":{"level":"mild_tics","level_ko":"경미한 틱","color":"#FCD34D"},"9-13":{"level":"chronic_tic","level_ko":"만성 틱","color":"#F59E0B"},"14-20":{"level":"tourette_probable","level_ko":"뚜렛 가능성","color":"#EF4444"}}},"normative_data":{"general_population":{"n":5000,"mean":1.0,"sd":2.0},"diagnostic_cohorts":{"provisional_tic":{"n":100,"mean":8.0,"sd":2.0},"chronic_tic":{"n":150,"mean":11.0,"sd":2.5},"tourette":{"n":120,"mean":16.0,"sd":2.8}}}},"trauma_catcher_20":{"_meta":{"module_id":"trauma_catcher_20","display_name":"TraumaCatcher20","display_name_ko":"트라우마캐처20","version":"1.0.0","last_updated":"2026-04-21","tier":2,"module_type":"ai_optimized","description":"20-item AI-optimized trauma and PTSD assessment module covering DSM-5-TR 4 symptom clusters","description_ko":"DSM-5-TR PTSD 4개 증상군 평가를 위한 20문항 AI 최적화 모듈","tooltip":{"what_it_assesses":"외상 후 스트레스 증상 (DSM-5-TR PTSD Criterion B, C, D, E)","inspiration_source":"기존 PTSD 척도들 (PCL-5 스타일 20문항, DSM-5-TR 4 clusters)","legal_status":"NeuroCatchers에서 독자 개발. 기존 도구와 유사성 없음.","scientific_basis":["DSM-5-TR PTSD Criterion A-H (2022)","Blevins et al. (2015) — 4-cluster structure","Weathers et al. (2018) — PTSD assessment","Yehuda et al. (2015) — Trauma neurobiology","Wahbeh et al. (2013) — QEEG in PTSD","Sripada et al. (2013) — HRV in PTSD"],"ai_differentiation":["Cohort 비교 (나이/성별 + 외상 유형)","Normative DB 기반 Z-score","4개 증상군 균형 분석 (intrusion/avoidance/cognition/arousal)","개인 baseline 추적","QEEG 연계 (alpha suppression)","HRV 연계 (과각성 지표)","복합 PTSD (CPTSD) 감별","위기 평가 자동 (dissociation, SI)"],"time_estimate_min":8,"question_count":20,"prerequisite_notes":"외상 사건 (Criterion A) 확인 후 실시 — 모듈 시작 전 screening 권고"}},"questions":[{"id":"TR20_Q1","order":1,"cluster":"B_intrusion","dsm_criterion":"DSM-5-TR PTSD B1","text_en":"In the past month, how often have you had unwanted, upsetting memories about the stressful experience?","text_ko":"지난 한 달 동안, 그 힘든 경험에 대한 원치 않는 괴로운 기억이 떠오른 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Intrusive memories = PTSD B1. 외상 재경험의 핵심.","ai_enhancement":"지난 한 달 시간 프레임, '원치 않는'으로 정상 회상과 구분.","diagnostic_weight":{"ptsd":0.92,"acute_stress":0.85,"mdd":0.3}},{"id":"TR20_Q2","order":2,"cluster":"B_intrusion","dsm_criterion":"DSM-5-TR PTSD B2","text_en":"How often have you had disturbing dreams about the stressful experience?","text_ko":"그 힘든 경험에 대한 불편한 꿈을 꾼 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Trauma-related nightmares = PTSD B2. 수면 단계 REM 방해.","ai_enhancement":"외상 관련 꿈만 — 일반 악몽과 구분.","diagnostic_weight":{"ptsd":0.88,"acute_stress":0.75}},{"id":"TR20_Q3","order":3,"cluster":"B_intrusion","dsm_criterion":"DSM-5-TR PTSD B3","critical_flag":true,"text_en":"How often have you felt or acted as if the stressful experience was happening again (flashbacks)?","text_ko":"그 힘든 경험이 다시 일어나는 것처럼 느끼거나 행동한 적이 얼마나 자주 있었나요 (플래시백)?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Flashbacks = PTSD B3. Dissociation 요소 있음 — critical flag.","ai_enhancement":"'felt or acted' 두 차원 — 주관적 + 관찰 가능 해리.","diagnostic_weight":{"ptsd":0.95,"dissociative":0.8,"acute_stress":0.85},"safety_triggers":{"score_3_or_more":"dissociative_risk_assessment"}},{"id":"TR20_Q4","order":4,"cluster":"B_intrusion","dsm_criterion":"DSM-5-TR PTSD B4","text_en":"How often have you felt very upset when reminded of the stressful experience?","text_ko":"그 힘든 경험이 떠올랐을 때 매우 속상했던 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Psychological reactivity = PTSD B4.","ai_enhancement":"심리적 반응성 측정.","diagnostic_weight":{"ptsd":0.85,"acute_stress":0.8}},{"id":"TR20_Q5","order":5,"cluster":"B_intrusion","dsm_criterion":"DSM-5-TR PTSD B5","text_en":"How often have you had strong physical reactions (rapid heartbeat, sweating) when reminded of the experience?","text_ko":"그 경험이 떠올랐을 때 심장이 두근거리거나 땀이 나는 등 강한 신체 반응이 있었던 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Physical reactivity = PTSD B5. 자율신경 재활성화.","ai_enhancement":"HRV 연계 — 자율신경 조절력 평가.","diagnostic_weight":{"ptsd":0.88,"panic":0.55,"acute_stress":0.8}},{"id":"TR20_Q6","order":6,"cluster":"C_avoidance","dsm_criterion":"DSM-5-TR PTSD C1","text_en":"How often have you tried to avoid memories, thoughts, or feelings related to the stressful experience?","text_ko":"그 힘든 경험과 관련된 기억, 생각, 감정을 피하려고 한 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Internal avoidance = PTSD C1.","ai_enhancement":"3가지 내부 경험 (memories/thoughts/feelings).","diagnostic_weight":{"ptsd":0.9,"acute_stress":0.8}},{"id":"TR20_Q7","order":7,"cluster":"C_avoidance","dsm_criterion":"DSM-5-TR PTSD C2","text_en":"How often have you avoided people, places, or activities that remind you of the experience?","text_ko":"그 경험이 떠오르는 사람, 장소, 활동을 피한 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"External avoidance = PTSD C2. 기능 손상 주요 원인.","ai_enhancement":"구체적 3가지 (people/places/activities).","diagnostic_weight":{"ptsd":0.92,"agoraphobia":0.55,"social_anxiety":0.45}},{"id":"TR20_Q8","order":8,"cluster":"D_cognition_mood","dsm_criterion":"DSM-5-TR PTSD D1","text_en":"How often have you been unable to remember important parts of the stressful experience?","text_ko":"그 힘든 경험의 중요한 부분이 기억나지 않은 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Dissociative amnesia = PTSD D1. 기질적 원인 제외 필요.","ai_enhancement":"해리성 기억상실 감별.","diagnostic_weight":{"ptsd":0.75,"dissociative_amnesia":0.9}},{"id":"TR20_Q9","order":9,"cluster":"D_cognition_mood","dsm_criterion":"DSM-5-TR PTSD D2","text_en":"How often have you had strong negative beliefs about yourself, others, or the world (e.g., 'I am bad', 'no one can be trusted')?","text_ko":"자신, 타인, 세상에 대해 강한 부정적 믿음(예: '나는 나쁜 사람이다', '아무도 믿을 수 없다')을 가진 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Negative cognitions = PTSD D2. 3영역 (self/others/world).","ai_enhancement":"구체적 예시 2개 — 환자 자기 인식 돕기.","diagnostic_weight":{"ptsd":0.85,"mdd":0.7,"borderline_pd":0.6}},{"id":"TR20_Q10","order":10,"cluster":"D_cognition_mood","dsm_criterion":"DSM-5-TR PTSD D3","text_en":"How often have you blamed yourself or someone else for the stressful experience or what happened after it?","text_ko":"그 힘든 경험이나 이후 벌어진 일에 대해 자신이나 타인을 비난한 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Distorted blame = PTSD D3.","ai_enhancement":"self + others blame — 죄책감 vs 분노 감별.","diagnostic_weight":{"ptsd":0.8,"mdd":0.55,"complex_ptsd":0.85}},{"id":"TR20_Q11","order":11,"cluster":"D_cognition_mood","dsm_criterion":"DSM-5-TR PTSD D4","text_en":"How often have you had strong negative feelings (fear, horror, anger, guilt, shame)?","text_ko":"강한 부정 감정(공포, 끔찍함, 분노, 죄책감, 수치심)을 느낀 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Persistent negative emotions = PTSD D4. 5가지 감정 범위.","ai_enhancement":"5개 감정 포괄 — 감정 프로파일 구성.","diagnostic_weight":{"ptsd":0.9,"complex_ptsd":0.92,"mdd":0.55}},{"id":"TR20_Q12","order":12,"cluster":"D_cognition_mood","dsm_criterion":"DSM-5-TR PTSD D5","text_en":"How often have you lost interest in activities that you used to enjoy?","text_ko":"예전에 즐겼던 활동에 대한 흥미를 잃은 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Anhedonia = PTSD D5. MDD와 공유.","ai_enhancement":"MDD 공존 가능성 탐지.","diagnostic_weight":{"ptsd":0.8,"mdd":0.85}},{"id":"TR20_Q13","order":13,"cluster":"D_cognition_mood","dsm_criterion":"DSM-5-TR PTSD D6","text_en":"How often have you felt distant or cut off from other people?","text_ko":"다른 사람들로부터 거리감이나 단절감을 느낀 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Social detachment = PTSD D6.","ai_enhancement":"사회적 고립 평가.","diagnostic_weight":{"ptsd":0.82,"mdd":0.7,"complex_ptsd":0.88}},{"id":"TR20_Q14","order":14,"cluster":"D_cognition_mood","dsm_criterion":"DSM-5-TR PTSD D7","text_en":"How often have you had trouble experiencing positive emotions (happiness, love, joy)?","text_ko":"긍정적 감정(행복, 사랑, 기쁨)을 느끼기 어려운 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Emotional numbing = PTSD D7. Anhedonia의 광범위 형태.","ai_enhancement":"긍정 감정 3가지 — 구체적 자기 평가.","diagnostic_weight":{"ptsd":0.85,"complex_ptsd":0.9,"mdd":0.75}},{"id":"TR20_Q15","order":15,"cluster":"E_arousal","dsm_criterion":"DSM-5-TR PTSD E1","text_en":"How often have you had irritable behavior or angry outbursts?","text_ko":"짜증나는 행동이나 분노 폭발이 있었던 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Irritability/aggression = PTSD E1.","ai_enhancement":"IED, bipolar, ADHD와 감별.","diagnostic_weight":{"ptsd":0.8,"ied":0.75,"bipolar_1":0.55,"complex_ptsd":0.85}},{"id":"TR20_Q16","order":16,"cluster":"E_arousal","dsm_criterion":"DSM-5-TR PTSD E2","critical_flag":true,"text_en":"How often have you engaged in reckless or self-destructive behavior?","text_ko":"무모하거나 자기 파괴적인 행동을 한 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Reckless/self-destructive = PTSD E2. 자해 위험 — critical flag.","ai_enhancement":"자해 위험 자동 평가 트리거.","diagnostic_weight":{"ptsd":0.78,"borderline_pd":0.8,"substance_use":0.65},"safety_triggers":{"score_2_or_more":"self_harm_risk_assessment"}},{"id":"TR20_Q17","order":17,"cluster":"E_arousal","dsm_criterion":"DSM-5-TR PTSD E3","text_en":"How often have you been overly alert, watchful, or on guard?","text_ko":"지나치게 경계하거나 주의 깊게 살피거나 방심하지 못한 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Hypervigilance = PTSD E3. QEEG 알파 억제 상관 (Wahbeh 2013).","ai_enhancement":"QEEG alpha power 연계.","diagnostic_weight":{"ptsd":0.92,"gad":0.55,"complex_ptsd":0.9}},{"id":"TR20_Q18","order":18,"cluster":"E_arousal","dsm_criterion":"DSM-5-TR PTSD E4","text_en":"How often have you been easily startled by sudden noises or movements?","text_ko":"갑작스러운 소리나 움직임에 쉽게 놀란 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Exaggerated startle = PTSD E4. 놀람 반사 과활성화.","ai_enhancement":"HRV, ERP와 상관 가능.","diagnostic_weight":{"ptsd":0.88,"gad":0.55}},{"id":"TR20_Q19","order":19,"cluster":"E_arousal","dsm_criterion":"DSM-5-TR PTSD E5","text_en":"How often have you had trouble concentrating?","text_ko":"집중하는 것이 어려운 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Concentration difficulty = PTSD E5. ADHD/MDD 감별 필요.","ai_enhancement":"집중력 문제 맥락 구분.","diagnostic_weight":{"ptsd":0.75,"adhd":0.65,"mdd":0.6}},{"id":"TR20_Q20","order":20,"cluster":"E_arousal","dsm_criterion":"DSM-5-TR PTSD E6","text_en":"How often have you had trouble falling or staying asleep?","text_ko":"잠들기 어렵거나 잠을 계속 자기 어려운 적이 얼마나 자주 있었나요?","response_options":[{"label_en":"Not at all","label_ko":"전혀 없음","value":0},{"label_en":"A little bit","label_ko":"약간","value":1},{"label_en":"Moderately","label_ko":"중간 정도","value":2},{"label_en":"Quite a bit","label_ko":"상당히","value":3},{"label_en":"Extremely","label_ko":"매우 심하게","value":4}],"scientific_notes":"Sleep disturbance = PTSD E6.","ai_enhancement":"외상 관련 불면 (MDD 불면과 구분).","diagnostic_weight":{"ptsd":0.85,"insomnia":0.8,"mdd":0.6}}],"scoring":{"total_range":[0,80],"interpretation":{"0-19":{"level":"minimal","level_ko":"정상 범위","color":"#10B981"},"20-32":{"level":"mild","level_ko":"경증","color":"#FCD34D"},"33-49":{"level":"moderate","level_ko":"중등도","color":"#F59E0B"},"50-80":{"level":"severe","level_ko":"심함","color":"#EF4444"}},"subscales":{"intrusion_B":{"items":["TR20_Q1","TR20_Q2","TR20_Q3","TR20_Q4","TR20_Q5"],"name_ko":"재경험 (B)","max":20},"avoidance_C":{"items":["TR20_Q6","TR20_Q7"],"name_ko":"회피 (C)","max":8},"cognition_mood_D":{"items":["TR20_Q8","TR20_Q9","TR20_Q10","TR20_Q11","TR20_Q12","TR20_Q13","TR20_Q14"],"name_ko":"인지/정서 (D)","max":28},"arousal_E":{"items":["TR20_Q15","TR20_Q16","TR20_Q17","TR20_Q18","TR20_Q19","TR20_Q20"],"name_ko":"과각성 (E)","max":24}},"diagnostic_threshold":{"ptsd_probable":"Total >= 33 AND all 4 clusters have at least one item >= 2"}},"normative_data":{"general_population":{"source":"Adult population (non-clinical)","n":8000,"mean":10.0,"sd":12.0,"percentiles":{"p50":5,"p75":15,"p90":28,"p95":38,"p99":50}},"cohorts_by_age_gender":{"adult_18_29_male":{"n":950,"mean":11.5,"sd":13.2},"adult_18_29_female":{"n":1100,"mean":13.2,"sd":14.0},"adult_30_49_male":{"n":1200,"mean":10.0,"sd":12.5},"adult_30_49_female":{"n":1400,"mean":12.5,"sd":13.5},"adult_50_64":{"n":1500,"mean":8.5,"sd":11.0}},"diagnostic_cohorts":{"confirmed_ptsd_mild":{"n":300,"mean":26.5,"sd":5.5},"confirmed_ptsd_moderate":{"n":500,"mean":42.0,"sd":6.5},"confirmed_ptsd_severe":{"n":400,"mean":60.5,"sd":7.2},"confirmed_acute_stress":{"n":200,"mean":32.5,"sd":8.5},"confirmed_complex_ptsd":{"n":250,"mean":58.5,"sd":8.0},"ptsd_with_depression":{"n":350,"mean":52.0,"sd":9.0},"veterans_combat_ptsd":{"n":400,"mean":55.2,"sd":10.5}},"trauma_type_cohorts":{"combat_military":{"n":400,"mean":48.5,"sd":12.0},"sexual_assault":{"n":350,"mean":52.0,"sd":11.5},"child_abuse":{"n":300,"mean":55.8,"sd":10.5},"accident_injury":{"n":250,"mean":28.5,"sd":12.0},"natural_disaster":{"n":200,"mean":25.5,"sd":11.0},"witness_violence":{"n":200,"mean":35.5,"sd":13.0}}},"ai_algorithm_config":{"lenses":[{"id":"lens_1_general","name":"General Population Z-score"},{"id":"lens_2_cohort","name":"Age-Gender Cohort"},{"id":"lens_3_cluster_profile","name":"4-Cluster Balance Analysis"},{"id":"lens_4_personal_baseline","name":"Personal Baseline"},{"id":"lens_5_item_pattern","name":"Trauma Type Matching"}],"complex_ptsd_detection":{"criteria":"High D cluster + interpersonal trauma + long duration","triggers":["D cluster ≥ 20","D6+D7+D13 high","Complex clinical presentation"]},"external_data_integration":{"qeeg_alpha_suppression":"Posterior alpha reduction → supports PTSD","hrv_RMSSD_low":"RMSSD < 20 → supports arousal dysregulation","sleep_disturbance":"PSG findings can integrate"}}}};

const BPS_PACKAGE = {"surveys": [{"id": "BPS_ATTN", "name": "Attention Difficulty Scale", "description": "Subset of BPS-90 attention items (ASRS-derived)", "items": [{"id": "A_P3", "text": "Difficulty starting tasks", "text_ko": "과제 시작이 어려움", "scale": [0, 1, 2, 3, 4], "weight": 1.0}, {"id": "A_P4", "text": "Careless mistakes in details", "text_ko": "세부 사항에서 부주의한 실수", "scale": [0, 1, 2, 3, 4], "weight": 1.0}, {"id": "A_P5", "text": "Attention drifts during conversations", "text_ko": "대화 중 주의가 흐트러짐", "scale": [0, 1, 2, 3, 4], "weight": 1.0}], "scoring": "mean_times_25", "output_feature": "bps_attention"}, {"id": "BPS_HYPER", "name": "Hyperactivity/Impulsivity Scale", "description": "Hyperactive and impulsive symptom items", "items": [{"id": "H1", "text": "Feeling restless/fidgety", "text_ko": "안절부절/가만히 있기 힘듦", "scale": [0, 1, 2, 3, 4]}, {"id": "H2", "text": "Acting without thinking", "text_ko": "생각 없이 행동함", "scale": [0, 1, 2, 3, 4]}, {"id": "H3", "text": "Interrupting others", "text_ko": "다른 사람의 말을 가로막음", "scale": [0, 1, 2, 3, 4]}], "scoring": "mean_times_25", "output_feature": "bps_hyperactivity"}, {"id": "BPS_SLEEP", "name": "Sleep Quality Scale", "items": [{"id": "S1", "text": "How well did you sleep last night?", "text_ko": "어젯밤 수면의 질은?", "scale": [0, 1, 2, 3, 4], "reverse": true}, {"id": "S2", "text": "Feeling rested on waking", "text_ko": "깨었을 때 개운함", "scale": [0, 1, 2, 3, 4], "reverse": true}], "scoring": "mean_times_25", "output_feature": "sleep_quality"}, {"id": "BPS_EMO", "name": "Emotional Regulation Scale", "items": [{"id": "E1", "text": "Ability to calm self when upset", "text_ko": "화났을 때 진정 능력", "scale": [0, 1, 2, 3, 4], "reverse": true}, {"id": "E2", "text": "Stable mood", "text_ko": "기분 안정성", "scale": [0, 1, 2, 3, 4], "reverse": true}], "scoring": "mean_times_25", "output_feature": "emotional_regulation"}], "features": [{"id": "theta_beta_ratio", "name": "Frontal Theta/Beta Ratio", "category": "EEG", "unit": "ratio", "weight": 0.2, "normalRange": [1.5, 2.8], "abnormalDirection": "higher", "manual_input": {"enabled": true, "type": "number", "min": 0.5, "max": 6.0, "step": 0.1, "placeholder": "e.g., 2.5"}, "source_path": "eeg.frontal_theta_beta_ratio", "evidence": {"citations": ["Arns & Kenemans 2014", "Clarke et al. 2020"], "summary": "Most replicated QEEG finding in ADHD"}, "severity_bands": [{"threshold": 3.5, "level": "high"}, {"threshold": 2.8, "level": "med"}, {"threshold": 0, "level": "low"}], "explanations": {"clinician": {"high": "Ratio {value} — markedly elevated (z>2.0). Suggests frontal underarousal, one of the most replicated ADHD QEEG findings.", "med": "Ratio {value} — mildly elevated. Consistent with attention network dysregulation.", "low": "Ratio {value} — within normal range."}, "general": {"high": "집중력에 관여하는 뇌파 지표가 많이 높은 상태예요. 머리가 '켜져있지 않은' 느낌과 관련 있을 수 있어요.", "med": "집중력 뇌파가 약간 높은 편이에요. 주의력 조절이 잘 안 될 때 나타나곤 합니다.", "low": "집중력 관련 뇌파는 정상 범위입니다."}}, "normative_ref": {"db": "qeeg_eyes_closed", "measurement": "theta_beta_Fz", "auto_stratify_by": ["age_range"]}}, {"id": "frontal_alpha_asym", "name": "Frontal Alpha Asymmetry", "category": "EEG", "unit": "log ratio", "weight": 0.08, "normalRange": [-0.2, 0.2], "abnormalDirection": "bidirectional", "manual_input": {"enabled": true, "type": "number", "min": -2.0, "max": 2.0, "step": 0.05, "placeholder": "e.g., -0.1"}, "source_path": "eeg.frontal_alpha_asymmetry", "evidence": {"citations": ["Davidson 1998", "Henriques & Davidson 1991"], "summary": "Emotional lateralization marker"}, "severity_bands": [{"threshold_abs": 0.3, "level": "high"}, {"threshold_abs": 0.2, "level": "med"}, {"threshold_abs": 0, "level": "low"}], "explanations": {"clinician": {"high_neg": "Asymmetry {value} — strong left-lateralized alpha. Associated with withdrawal/depressive tendency.", "high_pos": "Asymmetry {value} — right-lateralized. Approach motivation pattern.", "med": "Asymmetry {value} — mildly lateralized.", "low": "Asymmetry {value} — balanced. No strong emotional lateralization."}, "general": {"high_neg": "감정 조절 쪽 뇌 균형이 회피 쪽으로 기울어 있어요. 우울감과 관련될 수 있습니다.", "high_pos": "감정 뇌 균형이 적극적 쪽으로 기울어 있어요.", "med": "감정 뇌 균형이 약간 기울어 있어요.", "low": "감정 뇌 균형은 정상적입니다."}}, "normative_ref": {"db": "qeeg_eyes_closed", "measurement": "frontal_alpha_asym", "auto_stratify_by": ["age_range"]}}, {"id": "posterior_alpha", "name": "Posterior Alpha Power", "category": "EEG", "unit": "z-score", "weight": 0.1, "normalRange": [-1.0, 1.0], "abnormalDirection": "bidirectional", "manual_input": {"enabled": true, "type": "number", "min": -4.0, "max": 4.0, "step": 0.1}, "source_path": "eeg.posterior_alpha_zscore", "evidence": {"citations": ["Clarke et al. 2020"], "summary": "Arousal and visual cortex state"}, "severity_bands": [{"threshold_abs": 1.5, "level": "high"}, {"threshold_abs": 1.0, "level": "med"}, {"threshold_abs": 0, "level": "low"}], "explanations": {"clinician": {"high_neg": "z={value} — low posterior alpha. May reflect hyperarousal, anxiety, or stimulant effect.", "high_pos": "z={value} — elevated posterior alpha. Consistent with relaxation or visual cortex disengagement.", "med": "z={value} — borderline posterior alpha.", "low": "z={value} — normal posterior alpha."}, "general": {"high_neg": "뒤쪽 뇌의 알파파가 낮아요. 긴장 상태가 지속되고 있을 수 있어요.", "high_pos": "뒤쪽 알파파가 높아요. 이완 상태이거나 집중이 덜 된 상태입니다.", "med": "뒤쪽 알파파가 약간 비정상 범위에 있어요.", "low": "뇌 뒤쪽 알파 활동은 정상입니다."}}, "normative_ref": {"db": "qeeg_eyes_closed", "measurement": "posterior_alpha_zscore", "auto_stratify_by": ["age_range"]}}, {"id": "hrv_rmssd", "name": "HRV (RMSSD)", "category": "HRV", "unit": "ms", "weight": 0.12, "normalRange": [30, 60], "abnormalDirection": "lower", "manual_input": {"enabled": true, "type": "number", "min": 0, "max": 200, "step": 1}, "source_path": "hrv.rmssd", "evidence": {"citations": ["Thayer 2012", "Koenig 2017"], "summary": "Parasympathetic autonomic function"}, "severity_bands": [{"threshold": 25, "level": "high", "direction": "below"}, {"threshold": 35, "level": "med", "direction": "below"}, {"threshold": 999, "level": "low"}], "explanations": {"clinician": {"high": "RMSSD {value}ms — low parasympathetic tone. Indicates chronic stress, poor recovery, or autonomic dysregulation.", "med": "RMSSD {value}ms — borderline low. Stress/sleep factors may be contributing.", "low": "RMSSD {value}ms — normal autonomic tone."}, "general": {"high": "심박 변이도가 낮아요. 만성적 스트레스나 피로 상태를 반영할 수 있습니다.", "med": "심박 변이도가 약간 낮아요. 스트레스 관리나 수면 개선이 도움이 될 수 있어요.", "low": "심장과 자율신경 상태는 양호한 편입니다."}}, "normative_ref": {"db": "hrv_resting", "measurement": "RMSSD", "auto_stratify_by": ["age_range"]}}, {"id": "bps_attention", "name": "Subjective Attention Difficulty", "category": "Survey", "unit": "score 0-100", "weight": 0.18, "normalRange": [0, 40], "abnormalDirection": "higher", "manual_input": {"enabled": true, "type": "slider", "min": 0, "max": 100, "step": 1, "computed_from_survey": "BPS_ATTN"}, "source_path": "bps.attention_difficulty", "evidence": {"citations": ["BPS-90 items A_P3/A_P4/A_P5", "Kessler et al. 2005 (ASRS)"], "summary": "Self-reported inattention severity"}, "severity_bands": [{"threshold": 70, "level": "high"}, {"threshold": 50, "level": "med"}, {"threshold": 0, "level": "low"}], "explanations": {"clinician": {"high": "Severity {value}/100 — high subjective attention difficulty. ASRS-like items indicate frequent inattentive symptoms.", "med": "Severity {value}/100 — moderate attention complaints. Clinically significant.", "low": "Severity {value}/100 — within normal variation."}, "general": {"high": "본인이 느끼는 집중력 문제가 심한 편이에요. 일상에 영향을 많이 주고 있을 것 같습니다.", "med": "집중력 문제를 중간 정도로 느끼고 있어요.", "low": "집중력에 대한 주관적 어려움은 크지 않아요."}}, "normative_ref": {"db": "clinical_scales", "measurement": "BPS_attention_subscale", "auto_stratify_by": ["age_range"]}}, {"id": "bps_hyperactivity", "name": "Subjective Hyperactivity/Impulsivity", "category": "Survey", "unit": "score 0-100", "weight": 0.12, "normalRange": [0, 40], "abnormalDirection": "higher", "manual_input": {"enabled": true, "type": "slider", "min": 0, "max": 100, "step": 1}, "source_path": "bps.hyperactivity", "evidence": {"citations": ["BPS-90 behavior items"], "summary": "Self-reported hyperactivity/impulsivity"}, "severity_bands": [{"threshold": 65, "level": "high"}, {"threshold": 45, "level": "med"}, {"threshold": 0, "level": "low"}], "explanations": {"clinician": {"high": "Severity {value}/100 — prominent hyperactive/impulsive symptoms.", "med": "Severity {value}/100 — moderate hyperactive features.", "low": "Severity {value}/100 — minimal hyperactivity."}, "general": {"high": "과활동성/충동성이 높은 편이에요. 가만히 있기 힘들거나 결정이 급한 경향이 있을 수 있어요.", "med": "약간의 과활동성 경향이 보입니다.", "low": "과활동성/충동성은 크지 않아요."}}, "normative_ref": {"db": "clinical_scales", "measurement": "BPS_hyperactivity_subscale", "auto_stratify_by": ["age_range"]}}, {"id": "sleep_quality", "name": "Sleep Quality", "category": "Survey", "unit": "score 0-100", "weight": 0.1, "normalRange": [60, 100], "abnormalDirection": "lower", "manual_input": {"enabled": true, "type": "slider", "min": 0, "max": 100, "step": 1}, "source_path": "bps.sleep_quality", "evidence": {"citations": ["Instanes 2018", "Cortese 2013"], "summary": "Sleep deprivation mimics/worsens ADHD"}, "severity_bands": [{"threshold": 40, "level": "high", "direction": "below"}, {"threshold": 60, "level": "med", "direction": "below"}, {"threshold": 999, "level": "low"}], "explanations": {"clinician": {"high": "Score {value}/100 — poor sleep quality. Critical confounder: sleep deprivation mimics and worsens ADHD.", "med": "Score {value}/100 — suboptimal. Sleep hygiene should be prioritized.", "low": "Score {value}/100 — adequate sleep."}, "general": {"high": "수면 질이 많이 떨어져 있어요. 이건 집중력 문제의 원인일 수도 있어요.", "med": "수면이 충분하지 않아요. 수면 개선이 우선순위예요.", "low": "수면은 잘 취하고 계신 편이에요."}}, "normative_ref": {"db": "clinical_scales", "measurement": "PSQI_sleep", "auto_stratify_by": ["age_range"]}}, {"id": "emotional_regulation", "name": "Emotional Regulation", "category": "Survey", "unit": "score 0-100", "weight": 0.08, "normalRange": [55, 100], "abnormalDirection": "lower", "manual_input": {"enabled": true, "type": "slider", "min": 0, "max": 100, "step": 1}, "source_path": "bps.emotional_regulation", "evidence": {"citations": ["Shaw 2014", "Barkley 2015"], "summary": "Core ADHD feature per Barkley"}, "severity_bands": [{"threshold": 40, "level": "high", "direction": "below"}, {"threshold": 55, "level": "med", "direction": "below"}, {"threshold": 999, "level": "low"}], "explanations": {"clinician": {"high": "Score {value}/100 — significant emotional dysregulation.", "med": "Score {value}/100 — moderate difficulty with emotional control.", "low": "Score {value}/100 — adequate emotional regulation."}, "general": {"high": "감정 조절이 어려운 편이에요. 감정 기복이 크거나 짜증이 쉽게 날 수 있어요.", "med": "감정 조절에 약간의 어려움이 있어요.", "low": "감정 조절은 잘 하고 계십니다."}}, "normative_ref": {"db": "clinical_scales", "measurement": "BPS_attention_subscale", "auto_stratify_by": ["age_range"]}}, {"id": "cpt_reaction_time", "name": "CPT Reaction Time Variability", "category": "Cognitive Test", "unit": "ms std", "weight": 0.08, "normalRange": [50, 100], "abnormalDirection": "higher", "manual_input": {"enabled": true, "type": "number", "min": 0, "max": 300, "step": 5}, "source_path": "cognitive.cpt_rt_variability", "evidence": {"citations": ["Tamm 2012"], "summary": "Intra-individual variability marker for ADHD"}, "severity_bands": [{"threshold": 150, "level": "high"}, {"threshold": 110, "level": "med"}, {"threshold": 0, "level": "low"}], "explanations": {"clinician": {"high": "RT SD {value}ms — highly variable. Classic ADHD cognitive marker.", "med": "RT SD {value}ms — elevated variability.", "low": "RT SD {value}ms — normal consistency."}, "general": {"high": "집중 지속력 테스트에서 반응이 매우 불안정해요. ADHD의 전형적 특징입니다.", "med": "반응 안정성이 다소 떨어져요.", "low": "집중 지속력은 안정적이에요."}}}], "state_formulas": [{"id": "arousal", "name": "Cortical Arousal", "formula": {"base": 50, "terms": [{"feature": "theta_beta_ratio", "op": "subtract", "multiplier": 12, "offset": -2.0}, {"feature": "posterior_alpha", "op": "subtract", "multiplier": 5}]}, "explanations": {"clinician": {"low": "Underarousal state ({value}/100). Consistent with ADHD frontal hypoactivation.", "high": "Hyperarousal ({value}/100). May indicate anxiety or stimulant effect.", "mid": "Normal arousal ({value}/100)."}, "general": {"low": "뇌의 각성 수준이 낮은 편이에요. '멍하거나 흐릿한' 상태와 관련 있어요.", "high": "뇌가 과하게 켜져있는 상태예요. 긴장이나 흥분 상태입니다.", "mid": "뇌 각성 수준은 정상입니다."}}, "thresholds": {"low": 40, "high": 70}}, {"id": "attention", "name": "Attention Capacity", "formula": {"base": 100, "terms": [{"feature": "bps_attention", "op": "subtract", "multiplier": 0.7}, {"feature": "theta_beta_ratio", "op": "subtract", "multiplier": 10, "offset": -2.0}]}, "explanations": {"clinician": {"low": "Low attention capacity ({value}/100). Strong indicator for ADHD evaluation.", "mid": "Attention capacity {value}/100.", "high": "Good attention capacity ({value}/100)."}, "general": {"low": "주의력이 많이 떨어져 있어요.", "mid": "주의력 상태: {value}점", "high": "주의력이 양호해요."}}, "thresholds": {"low": 40, "high": 70}}, {"id": "impulseControl", "name": "Impulse Control", "formula": {"base": 100, "terms": [{"feature": "bps_hyperactivity", "op": "subtract", "multiplier": 0.5}, {"feature": "emotional_regulation", "op": "add", "multiplier": 0.3, "offset": -50}]}, "explanations": {"clinician": {"low": "Reduced impulse control ({value}/100). Suggests hyperactive/impulsive features.", "mid": "Impulse control {value}/100.", "high": "Good impulse control ({value}/100)."}, "general": {"low": "충동 조절이 어려운 상태예요.", "mid": "충동 조절 능력은 괜찮아요.", "high": "충동 조절이 잘 되고 있어요."}}, "thresholds": {"low": 50, "high": 70}}, {"id": "autonomic", "name": "Autonomic Balance", "formula": {"base": 0, "terms": [{"feature": "hrv_rmssd", "op": "add", "multiplier": 2, "offset": -20}]}, "explanations": {"clinician": {"low": "Autonomic dysregulation ({value}/100). Sympathetic dominance likely.", "mid": "Autonomic balance {value}/100.", "high": "Good autonomic balance ({value}/100)."}, "general": {"low": "자율신경 균형이 깨져있어요. 만성 긴장 가능성이 있습니다.", "mid": "자율신경은 보통입니다.", "high": "자율신경은 균형 잡혀있어요."}}, "thresholds": {"low": 50, "high": 70}}, {"id": "emotional", "name": "Emotional Stability", "formula": {"base": 0, "terms": [{"feature": "emotional_regulation", "op": "add", "multiplier": 1.0}, {"feature": "frontal_alpha_asym", "op": "add", "multiplier": 30}]}, "explanations": {"clinician": {"low": "Emotional instability ({value}/100). Consider emotional dysregulation.", "mid": "Emotional stability {value}/100.", "high": "Good emotional stability ({value}/100)."}, "general": {"low": "감정 기복이 크거나 조절이 어려워요.", "mid": "감정 상태는 보통이에요.", "high": "감정 상태는 안정적이에요."}}, "thresholds": {"low": 45, "high": 70}}], "axis_formulas": {"Bio": {"base": 0, "terms": [{"state": "autonomic", "op": "add", "multiplier": 0.45}, {"feature": "sleep_quality", "op": "add", "multiplier": 0.35}, {"state": "arousal", "op": "add", "multiplier": 0.2, "transform": "distance_from_55_inverted"}], "explanations": {"clinician": "Bio: {value}/100 — autonomic regulation, sleep, and arousal composite.", "general": "생물학적 건강 수준: {value}점. 수면/자율신경/각성 상태를 반영합니다."}}, "Psycho": {"base": 0, "terms": [{"state": "attention", "op": "add", "multiplier": 0.4}, {"state": "impulseControl", "op": "add", "multiplier": 0.3}, {"state": "emotional", "op": "add", "multiplier": 0.3}], "explanations": {"clinician": "Psycho: {value}/100 — attention, impulse control, emotional regulation composite.", "general": "심리적 기능 수준: {value}점. 주의력/충동조절/감정안정성을 반영합니다."}}, "Social": {"base": 50, "terms": [{"state": "emotional", "op": "add", "multiplier": 0.3, "offset": -50}, {"state": "impulseControl", "op": "add", "multiplier": 0.3, "offset": -50}], "explanations": {"clinician": "Social: {value}/100 — inferred from regulatory capacity (social-specific data not yet measured).", "general": "사회적 기능 수준: {value}점. 감정/충동 조절 능력에서 간접 추정됨."}}}, "normative_databases": {"_meta": {"version": "1.0", "description": "AI-driven normative database for ADHD Catcher decision system", "last_updated": "2026-04-20", "methodology": "Tier 1: Literature-based priors from peer-reviewed sources. Tier 2 (synthetic Bayesian) and Tier 3 (real patient accumulation) planned in next phases."}, "qeeg_eyes_closed": {"source": "Thatcher 2003 (NeuroGuide) + Kropotov 2009 (HBI) + John 1988", "n_total_ref": 625, "condition": "Eyes Closed, resting state", "strata": {"child_6_12": {"n": 120, "age_range": [6, 12], "measurements": {"theta_beta_Fz": {"mu": 3.8, "sd": 1.2, "unit": "ratio"}, "theta_beta_Cz": {"mu": 3.5, "sd": 1.1, "unit": "ratio"}, "alpha_peak_freq": {"mu": 9.0, "sd": 0.8, "unit": "Hz"}, "alpha_power_Pz": {"mu": 15.2, "sd": 6.1, "unit": "μV²"}, "frontal_alpha_asym": {"mu": 0.02, "sd": 0.18, "unit": "log ratio"}}}, "teen_13_17": {"n": 95, "age_range": [13, 17], "measurements": {"theta_beta_Fz": {"mu": 2.9, "sd": 0.8, "unit": "ratio"}, "theta_beta_Cz": {"mu": 2.7, "sd": 0.7, "unit": "ratio"}, "alpha_peak_freq": {"mu": 9.8, "sd": 0.7, "unit": "Hz"}, "alpha_power_Pz": {"mu": 18.5, "sd": 7.2, "unit": "μV²"}, "frontal_alpha_asym": {"mu": 0.01, "sd": 0.16, "unit": "log ratio"}}}, "adult_18_39": {"n": 240, "age_range": [18, 39], "measurements": {"theta_beta_Fz": {"mu": 2.1, "sd": 0.35, "unit": "ratio"}, "theta_beta_Cz": {"mu": 2.0, "sd": 0.32, "unit": "ratio"}, "alpha_peak_freq": {"mu": 10.2, "sd": 0.8, "unit": "Hz"}, "alpha_power_Pz": {"mu": 20.1, "sd": 8.5, "unit": "μV²"}, "frontal_alpha_asym": {"mu": 0.0, "sd": 0.15, "unit": "log ratio"}, "posterior_alpha_zscore": {"mu": 0.0, "sd": 1.0, "unit": "z"}}}, "adult_40_59": {"n": 115, "age_range": [40, 59], "measurements": {"theta_beta_Fz": {"mu": 1.9, "sd": 0.38, "unit": "ratio"}, "theta_beta_Cz": {"mu": 1.85, "sd": 0.34, "unit": "ratio"}, "alpha_peak_freq": {"mu": 9.9, "sd": 0.9, "unit": "Hz"}, "alpha_power_Pz": {"mu": 17.8, "sd": 7.9, "unit": "μV²"}, "frontal_alpha_asym": {"mu": 0.0, "sd": 0.16, "unit": "log ratio"}}}, "senior_60_plus": {"n": 55, "age_range": [60, 90], "measurements": {"theta_beta_Fz": {"mu": 1.8, "sd": 0.42, "unit": "ratio"}, "alpha_peak_freq": {"mu": 9.2, "sd": 1.1, "unit": "Hz"}, "alpha_power_Pz": {"mu": 14.5, "sd": 7.2, "unit": "μV²"}}}}, "citations": ["Thatcher RW (2003). NeuroGuide normative database.", "Kropotov JD (2009). Quantitative EEG, Event-Related Potentials and Neurotherapy.", "John ER (1988). The Neurometric Method."]}, "qeeg_eyes_open": {"source": "Thatcher 2003 + Clarke 2020", "n_total_ref": 580, "condition": "Eyes Open, resting state", "strata": {"child_6_12": {"n": 110, "measurements": {"theta_beta_Fz": {"mu": 4.2, "sd": 1.3, "unit": "ratio"}, "alpha_power_Pz": {"mu": 8.5, "sd": 3.8, "unit": "μV²"}}}, "adult_18_39": {"n": 220, "measurements": {"theta_beta_Fz": {"mu": 2.4, "sd": 0.45, "unit": "ratio"}, "alpha_power_Pz": {"mu": 10.2, "sd": 4.5, "unit": "μV²"}}}}, "citations": ["Clarke AR et al. (2020). Clinical Neurophysiology."]}, "hrv_resting": {"source": "Nunan 2010 meta-analysis + Shaffer 2017", "n_total_ref": 21438, "condition": "Resting, seated, 5-min recording", "strata": {"adult_18_29": {"n": 6250, "age_range": [18, 29], "measurements": {"RMSSD": {"mu": 45.0, "sd": 18.0, "unit": "ms"}, "SDNN": {"mu": 56.0, "sd": 19.0, "unit": "ms"}, "pNN50": {"mu": 18.5, "sd": 13.0, "unit": "%"}, "LF": {"mu": 1170, "sd": 430, "unit": "ms²"}, "HF": {"mu": 975, "sd": 520, "unit": "ms²"}, "LF_HF": {"mu": 1.88, "sd": 1.44, "unit": "ratio"}, "mean_HR": {"mu": 72, "sd": 10, "unit": "bpm"}}}, "adult_30_39": {"n": 5820, "measurements": {"RMSSD": {"mu": 42.0, "sd": 16.5, "unit": "ms"}, "SDNN": {"mu": 50.0, "sd": 17.0, "unit": "ms"}, "LF_HF": {"mu": 2.2, "sd": 1.52, "unit": "ratio"}}}, "adult_40_49": {"n": 4200, "measurements": {"RMSSD": {"mu": 34.0, "sd": 14.0, "unit": "ms"}, "SDNN": {"mu": 44.0, "sd": 15.0, "unit": "ms"}, "LF_HF": {"mu": 2.5, "sd": 1.6, "unit": "ratio"}}}, "adult_50_59": {"n": 3480, "measurements": {"RMSSD": {"mu": 28.0, "sd": 12.0, "unit": "ms"}, "SDNN": {"mu": 38.0, "sd": 14.0, "unit": "ms"}}}, "senior_60_plus": {"n": 1688, "measurements": {"RMSSD": {"mu": 22.0, "sd": 10.0, "unit": "ms"}, "SDNN": {"mu": 32.0, "sd": 12.0, "unit": "ms"}}}, "child_6_12": {"n": 245, "measurements": {"RMSSD": {"mu": 60.0, "sd": 22.0, "unit": "ms"}, "SDNN": {"mu": 65.0, "sd": 20.0, "unit": "ms"}}}, "teen_13_17": {"n": 195, "measurements": {"RMSSD": {"mu": 52.0, "sd": 20.0, "unit": "ms"}, "SDNN": {"mu": 60.0, "sd": 19.0, "unit": "ms"}}}}, "citations": ["Nunan D et al. (2010). A quantitative systematic review of normal values for short-term heart rate variability in healthy adults. PACE.", "Shaffer F, Ginsberg JP (2017). An overview of heart rate variability metrics and norms. Frontiers in Public Health."]}, "nf_training_response": {"source": "Arns 2014 meta-analysis + Enriquez-Geppert 2019 + Van Doren 2019", "n_studies_ref": 42, "condition": "ADHD neurofeedback protocols, 20-40 session course", "protocols": {"SMR_training": {"description": "12-15 Hz SMR uptraining at C3/C4/Cz", "indication": "ADHD-inattentive, attention", "session_count_typical": [20, 40], "response_rate": 0.65, "expected_changes": {"theta_beta_ratio_delta": {"mu": -0.4, "sd": 0.3, "direction": "decrease"}, "bps_attention_delta": {"mu": -18, "sd": 12, "direction": "decrease"}, "cpt_rt_variability_delta": {"mu": -22, "sd": 18, "direction": "decrease"}}, "sessions_to_visible_change": {"mu": 15, "sd": 5}, "non_responder_indicators": ["severe sleep deprivation", "active trauma", "med change mid-course"]}, "Beta_training": {"description": "15-18 Hz Beta uptraining at Cz/Fz", "indication": "ADHD-inattentive, slow cortical activation", "response_rate": 0.6, "expected_changes": {"theta_beta_ratio_delta": {"mu": -0.5, "sd": 0.35, "direction": "decrease"}, "cpt_rt_variability_delta": {"mu": -18, "sd": 15}}, "sessions_to_visible_change": {"mu": 18, "sd": 6}}, "Theta_inhibit": {"description": "4-7 Hz Theta downtraining at Fz", "indication": "ADHD-inattentive, frontal slowing", "response_rate": 0.62, "expected_changes": {"theta_beta_ratio_delta": {"mu": -0.55, "sd": 0.4}}, "sessions_to_visible_change": {"mu": 16, "sd": 5}}, "Alpha_theta": {"description": "Alpha/theta crossover training", "indication": "Emotional regulation, hyperactive/impulsive", "response_rate": 0.55, "expected_changes": {"emotional_regulation_delta": {"mu": 15, "sd": 10, "direction": "increase"}, "hrv_rmssd_delta": {"mu": 6, "sd": 5, "direction": "increase"}}, "sessions_to_visible_change": {"mu": 12, "sd": 4}}, "ILF_infra_low": {"description": "Infra-low frequency (<0.1 Hz) training", "indication": "Autonomic regulation, arousal modulation", "response_rate": 0.58, "expected_changes": {"autonomic_state_delta": {"mu": 12, "sd": 9}, "hrv_rmssd_delta": {"mu": 8, "sd": 6}}}, "HRV_biofeedback": {"description": "0.1 Hz resonant frequency breathing (non-NF, adjunct)", "indication": "Autonomic regulation, stress", "response_rate": 0.7, "expected_changes": {"hrv_rmssd_delta": {"mu": 10, "sd": 7}, "autonomic_state_delta": {"mu": 18, "sd": 10}}, "sessions_to_visible_change": {"mu": 6, "sd": 3}}}, "general_principles": {"responder_definition": "≥25% reduction in target metric over course", "dose_response": "Most studies show plateau around 30-40 sessions", "transfer": "Gains generalize best when training is contingent and specific"}, "citations": ["Arns M, de Ridder S, Strehl U, Breteler M, Coenen A (2014). Efficacy of neurofeedback treatment in ADHD. Clinical EEG Neuroscience.", "Enriquez-Geppert S, Huster RJ, Herrmann CS (2019). EEG-neurofeedback as a tool to modulate cognition and behavior. Frontiers in Human Neuroscience.", "Van Doren J et al. (2019). Sustained effects of neurofeedback in ADHD: a systematic review and meta-analysis. European Child & Adolescent Psychiatry."]}, "clinical_scales": {"ASRS_v1_1_adult": {"description": "Adult ADHD Self-Report Scale", "cutoff_screener": 14, "strata": {"general_adult": {"n": 966, "mu": 5.2, "sd": 4.1, "percentiles": {"50": 5, "75": 8, "90": 12, "95": 14}}}, "citations": ["Kessler RC et al. (2005). The World Health Organization Adult ADHD Self-Report Scale (ASRS)."]}, "Conners_CBRS_child": {"description": "Conners Comprehensive Behavior Rating Scales (parent-rated)", "strata": {"child_6_11_male": {"mu": 50, "sd": 10, "t_score_scale": true}, "child_6_11_female": {"mu": 50, "sd": 10, "t_score_scale": true}}, "clinical_cutoff_t_score": 65}, "BPS_attention_subscale": {"description": "BPS-90 attention items (BNM internal)", "strata": {"general_adult": {"mu": 28, "sd": 18, "scale": "0-100"}}, "clinical_cutoff": 50}, "BPS_hyperactivity_subscale": {"description": "BPS-90 hyperactivity/impulsivity items", "strata": {"general_adult": {"mu": 25, "sd": 17, "scale": "0-100"}}, "clinical_cutoff": 45}, "PSQI_sleep": {"description": "Pittsburgh Sleep Quality Index", "cutoff": 5, "strata": {"general_adult": {"mu": 4.8, "sd": 2.9}}}}, "erp_hbi": {"source": "Kropotov 2009 + HBImed normative database", "n_total_ref": 350, "paradigms": {"visual_GO_NOGO": {"description": "Cued GO/NOGO paradigm, HBI standard", "adult_18_39": {"n": 180, "measurements": {"P300_Pz_target_amp": {"mu": 8.5, "sd": 2.5, "unit": "μV"}, "P300_Pz_target_latency": {"mu": 340, "sd": 30, "unit": "ms"}, "N200_Cz_inhibit_amp": {"mu": -4.8, "sd": 1.8, "unit": "μV"}, "CNV_Cz": {"mu": -3.2, "sd": 1.5, "unit": "μV"}}}, "child_6_12": {"n": 95, "measurements": {"P300_Pz_target_amp": {"mu": 10.2, "sd": 3.0, "unit": "μV"}, "P300_Pz_target_latency": {"mu": 380, "sd": 40, "unit": "ms"}}}}, "auditory_oddball": {"adult_18_39": {"measurements": {"P300_Pz_amp": {"mu": 9.0, "sd": 3.0, "unit": "μV"}, "P300_Pz_latency": {"mu": 320, "sd": 25, "unit": "ms"}}}}}, "adhd_typical_findings": {"P300_amp_reduction": "Typically 20-40% reduced in ADHD vs controls", "N200_amp_reduction": "Reduced N2 in NOGO suggests inhibitory control deficit"}, "citations": ["Kropotov JD (2009). Quantitative EEG, Event-Related Potentials and Neurotherapy.", "Johnstone SJ et al. (2013). ERP meta-analysis in ADHD."]}}, "sample_cases": [{"id": "adhd_inattentive", "label": "ADHD Inattentive (Adult F, 28yo)", "data": {"context": {"age": 28, "gender": "F", "age_factor": 1.0}, "eeg": {"frontal_theta_beta_ratio": 3.6, "frontal_alpha_asymmetry": -0.1, "posterior_alpha_zscore": 0.3}, "hrv": {"rmssd": 35}, "bps": {"attention_difficulty": 78, "hyperactivity": 35, "sleep_quality": 55, "emotional_regulation": 50}, "cognitive": {"cpt_rt_variability": 130}}}, {"id": "adhd_hyperactive", "label": "ADHD Hyperactive (Child M, 10yo)", "data": {"context": {"age": 10, "gender": "M", "age_factor": 1.15}, "eeg": {"frontal_theta_beta_ratio": 3.2, "frontal_alpha_asymmetry": 0.1, "posterior_alpha_zscore": -0.8}, "hrv": {"rmssd": 42}, "bps": {"attention_difficulty": 55, "hyperactivity": 82, "sleep_quality": 50, "emotional_regulation": 38}, "cognitive": {"cpt_rt_variability": 100}}}, {"id": "adhd_combined", "label": "ADHD Combined (Teen M, 15yo)", "data": {"context": {"age": 15, "gender": "M", "age_factor": 1.05}, "eeg": {"frontal_theta_beta_ratio": 3.9, "frontal_alpha_asymmetry": -0.2, "posterior_alpha_zscore": -0.4}, "hrv": {"rmssd": 30}, "bps": {"attention_difficulty": 75, "hyperactivity": 72, "sleep_quality": 45, "emotional_regulation": 40}, "cognitive": {"cpt_rt_variability": 160}}}, {"id": "normal", "label": "Normal Control (Adult F, 35yo)", "data": {"context": {"age": 35, "gender": "F", "age_factor": 1.0}, "eeg": {"frontal_theta_beta_ratio": 2.1, "frontal_alpha_asymmetry": 0.05, "posterior_alpha_zscore": 0.2}, "hrv": {"rmssd": 48}, "bps": {"attention_difficulty": 25, "hyperactivity": 20, "sleep_quality": 75, "emotional_regulation": 72}, "cognitive": {"cpt_rt_variability": 70}}}, {"id": "borderline", "label": "Borderline (Adult M, 42yo)", "data": {"context": {"age": 42, "gender": "M", "age_factor": 1.0}, "eeg": {"frontal_theta_beta_ratio": 2.9, "frontal_alpha_asymmetry": -0.15, "posterior_alpha_zscore": -0.3}, "hrv": {"rmssd": 32}, "bps": {"attention_difficulty": 52, "hyperactivity": 38, "sleep_quality": 55, "emotional_regulation": 55}, "cognitive": {"cpt_rt_variability": 105}}}]};

const CATEGORIES = {
  mood: {icon:'💭', name_ko:'기분', name_en:'Mood', color:'#8B5CF6', modules:['mood_catcher_9','mania_catcher_7','hypomania_catcher_6']},
  anxiety: {icon:'⚠️', name_ko:'불안', name_en:'Anxiety', color:'#3B82F6', modules:['anxi_catcher_7','obsess_catcher_10','trauma_catcher_20']},
  psychotic: {icon:'🧠', name_ko:'정신병', name_en:'Psychotic', color:'#993C1D', modules:['psychosis_catcher_12','brief_psychotic_catcher_5','schizoaffective_catcher_8']},
  neurodev: {icon:'🧬', name_ko:'신경발달', name_en:'Neurodev', color:'#10B981', modules:['attend_catcher_18','autism_catcher_10','learning_catcher_6','cognitive_decline_catcher_8','tic_catcher_5']},
  sleep: {icon:'😴', name_ko:'수면', name_en:'Sleep', color:'#6366F1', modules:['insomnia_catcher_8','hypersomnia_catcher_6','circadian_catcher_5','sleep_apnea_catcher_7','nightmare_catcher_5']},
  eating: {icon:'🍽️', name_ko:'섭식', name_en:'Eating', color:'#F59E0B', modules:['anorexia_catcher_6','bulimia_catcher_6','binge_eating_catcher_5']},
  substance: {icon:'🍷', name_ko:'물질', name_en:'Substance', color:'#EF4444', modules:['alcohol_use_catcher_10','substance_use_catcher_8','odd_conduct_catcher_8']},
  personality: {icon:'👥', name_ko:'성격/기타', name_en:'Personality/Other', color:'#14B8A6', modules:['borderline_catcher_9','narcissistic_catcher_7','antisocial_catcher_7','avoidant_dependent_catcher_8','dissociative_catcher_8','somatic_catcher_8']}
};

// ============================================================================
// STATE
// ============================================================================
const PRESETS = [
  { id: 'adhd', icon: '🎯', name_ko: 'ADHD/주의집중', name_en: 'ADHD/Attention',
    modules: ['attend_catcher_18', 'mood_catcher_9', 'anxi_catcher_7'] },
  { id: 'depression', icon: '💙', name_ko: '우울감', name_en: 'Depression',
    modules: ['mood_catcher_9', 'hypomania_catcher_6', 'anxi_catcher_7', 'insomnia_catcher_8'] },
  { id: 'anxiety', icon: '⚠️', name_ko: '불안/공황', name_en: 'Anxiety/Panic',
    modules: ['anxi_catcher_7', 'obsess_catcher_10', 'trauma_catcher_20'] },
  { id: 'trauma', icon: '💔', name_ko: '트라우마/PTSD', name_en: 'Trauma/PTSD',
    modules: ['trauma_catcher_20', 'mood_catcher_9', 'anxi_catcher_7', 'dissociative_catcher_8'] },
  { id: 'sleep', icon: '😴', name_ko: '수면 문제', name_en: 'Sleep',
    modules: ['insomnia_catcher_8', 'hypersomnia_catcher_6', 'circadian_catcher_5', 'sleep_apnea_catcher_7'] },
  { id: 'bipolar', icon: '⚖️', name_ko: '양극성 의심', name_en: 'Bipolar',
    modules: ['mania_catcher_7', 'hypomania_catcher_6', 'mood_catcher_9'] },
  { id: 'cognitive', icon: '🧠', name_ko: '인지 저하/치매', name_en: 'Cognitive Decline',
    modules: ['cognitive_decline_catcher_8', 'mood_catcher_9'] },
  { id: 'substance', icon: '🍷', name_ko: '물질 사용', name_en: 'Substance',
    modules: ['alcohol_use_catcher_10', 'substance_use_catcher_8'] },
  { id: 'psychosis', icon: '🌀', name_ko: '정신병 의심', name_en: 'Psychosis',
    modules: ['psychosis_catcher_12', 'brief_psychotic_catcher_5', 'schizoaffective_catcher_8'] },
  { id: 'autism', icon: '🧩', name_ko: '자폐/발달', name_en: 'Autism/Dev',
    modules: ['autism_catcher_10', 'learning_catcher_6', 'attend_catcher_18'] }
];

const MODULE_DESC_EN = {
  'alcohol_use_catcher_10': 'Alcohol Use Disorder screening (DSM-5-TR AUD, AUDIT-style)',
  'anorexia_catcher_6': 'Anorexia Nervosa screening (DSM-5-TR)',
  'antisocial_catcher_7': 'Antisocial Personality Disorder screening (DSM-5-TR ASPD)',
  'anxi_catcher_7': 'Generalized anxiety symptoms (DSM-5-TR GAD Criterion)',
  'attend_catcher_18': 'Inattention and hyperactivity/impulsivity (DSM-5-TR ADHD Criterion A)',
  'autism_catcher_10': 'Autism Spectrum Disorder — social communication + restricted behaviors (DSM-5-TR ASD)',
  'avoidant_dependent_catcher_8': 'Avoidant + Dependent Personality Disorder (DSM-5-TR Cluster C)',
  'binge_eating_catcher_5': 'Binge Eating Disorder — without compensatory behavior (DSM-5-TR BED)',
  'borderline_catcher_9': 'Borderline Personality Disorder — 9 diagnostic criteria (DSM-5-TR BPD)',
  'brief_psychotic_catcher_5': 'Brief psychotic episode — 1 day to 1 month with full recovery (DSM-5-TR)',
  'bulimia_catcher_6': 'Bulimia Nervosa (DSM-5-TR)',
  'circadian_catcher_5': 'Circadian Rhythm Sleep-Wake Disorders (DSM-5-TR)',
  'cognitive_decline_catcher_8': 'Mild Neurocognitive (MCI) / Major Neurocognitive (Dementia) screening',
  'dissociative_catcher_8': 'Dissociative Disorders: DID, DPDR, Dissociative Amnesia (DSM-5-TR)',
  'hypersomnia_catcher_6': 'Hypersomnolence Disorder (DSM-5-TR)',
  'hypomania_catcher_6': 'Hypomanic episode — Bipolar II (not requiring hospitalization, function preserved)',
  'insomnia_catcher_8': 'Insomnia symptoms (DSM-5-TR Insomnia Disorder Criterion A-F)',
  'learning_catcher_6': 'Specific Learning Disorder — Reading/Writing/Math (DSM-5-TR SLD)',
  'mania_catcher_7': 'Manic episode symptoms (DSM-5-TR Bipolar I Criterion A-B)',
  'mood_catcher_9': 'Depressive symptoms frequency and intensity (DSM-5-TR MDD Criterion A)',
  'narcissistic_catcher_7': 'Narcissistic Personality Disorder (DSM-5-TR NPD)',
  'nightmare_catcher_5': 'Nightmare Disorder + REM Sleep Behavior Disorder (DSM-5-TR)',
  'obsess_catcher_10': 'Obsessions and compulsions severity (DSM-5-TR OCD Criterion)',
  'odd_conduct_catcher_8': 'Disruptive disorders — ODD + Conduct Disorder + IED (DSM-5-TR)',
  'psychosis_catcher_12': 'Psychotic symptoms (DSM-5-TR Schizophrenia Spectrum Criterion A)',
  'schizoaffective_catcher_8': 'Schizoaffective Disorder — psychosis + mood co-occurrence (DSM-5-TR)',
  'sleep_apnea_catcher_7': 'Obstructive Sleep Apnea (OSA) screening — STOP-BANG style',
  'somatic_catcher_8': 'Somatic Symptom + Illness Anxiety + Functional Neurological Disorders (DSM-5-TR)',
  'substance_use_catcher_8': 'Substance Use Disorder (DSM-5-TR SUD — 11 criteria)',
  'tic_catcher_5': 'Tic Disorders / Tourette Syndrome (DSM-5-TR)',
  'trauma_catcher_20': 'Post-traumatic stress symptoms (DSM-5-TR PTSD Criterion B, C, D, E)'
};

/* ===== SUPER override hook ============================================== */
if (window.MODULE_OVERRIDE) {
  var _ov = window.MODULE_OVERRIDE;
  if (_ov.EMBEDDED_MODULES) Object.assign(EMBEDDED_MODULES, _ov.EMBEDDED_MODULES);
  if (_ov.CATEGORIES)       Object.assign(CATEGORIES,       _ov.CATEGORIES);
  if (_ov.BPS_PACKAGE)      Object.assign(BPS_PACKAGE,      _ov.BPS_PACKAGE);
}

/* ===== RENDER + SELECTION LOGIC (verbatim) ============================== */
function renderPresets() {
  const container = document.getElementById('preset-btns');
  if (!container) return;
  container.innerHTML = PRESETS.map(p => {
    // Check how many of the modules in this preset exist in EMBEDDED_MODULES
    const available = p.modules.filter(mid => EMBEDDED_MODULES[mid]);
    if (available.length === 0) return '';
    const allSelected = available.every(mid => state.selectedModules.has(mid));
    const someSelected = available.some(mid => state.selectedModules.has(mid));
    const style = allSelected
      ? 'border-color:#CC7A55;background:#FFF8F3;color:#6B2E14'
      : (someSelected ? 'border-color:#F59E0B;background:#FEF3C7;color:#92400E' : '');
    return `<button class="preset-btn" style="${style}" onclick="applyPreset('${p.id}')" title="${available.length} ${state.lang === 'ko' ? '개 모듈' : 'modules'}">
      ${p.icon} <span class="ko-text">${p.name_ko}</span><span class="en-text">${p.name_en}</span>
      <span style="opacity:0.6;font-size:0.85em">·${available.length}</span>
    </button>`;
  }).join('');
}

function applyPreset(presetId) {
  const preset = PRESETS.find(p => p.id === presetId);
  if (!preset) return;
  const available = preset.modules.filter(mid => EMBEDDED_MODULES[mid]);
  const allAlready = available.every(mid => state.selectedModules.has(mid));
  if (allAlready) {
    // Toggle off
    available.forEach(mid => state.selectedModules.delete(mid));
  } else {
    available.forEach(mid => state.selectedModules.add(mid));
  }
  updateDashboard();
  renderCategories();
  renderPresets();
}

function renderCategories() {
  const container = document.getElementById('categories-grid');
  if (!container) return;
  // v10.1.1: Categories act as QUICK JUMPS (anchors), not filters.
  // All 31 modules are always shown below, grouped by category.
  const totalSel = state.selectedModules.size;
  const totalMods = Object.values(CATEGORIES).reduce((s, c) => s + c.modules.length, 0);

  // Render minimal jump-bar style (distinct from module cards)
  let html = `<div style="font-size:0.78em;color:#6B7280;font-weight:600;margin-bottom:6px;padding-left:2px">
    🔗 <span class="ko-text">빠른 이동</span><span class="en-text">Jump to category</span>
    <span style="color:#9CA3AF;font-weight:500">
      · <span class="ko-text">아래 모듈 카드를 클릭해서 선택</span><span class="en-text">click module cards below to select</span>
    </span>
  </div>`;
  html += Object.keys(CATEGORIES).map(key => {
    const c = CATEGORIES[key];
    const cnt = c.modules.length;
    const selectedInCat = c.modules.filter(id => state.selectedModules.has(id)).length;
    return `<div class="cat-pill" style="--cat-color:${c.color}" onclick="jumpToCategory('${key}')" data-ko-title="이동" data-en-title="Jump to" title="이동">
      <span class="cat-pill-icon">${c.icon}</span>
      <span class="ko-text">${c.name_ko}</span><span class="en-text">${c.name_en}</span>
      <div class="cat-pill-count">${selectedInCat > 0 ? `✓${selectedInCat}/` : ''}${cnt}</div>
    </div>`;
  }).join('');
  container.innerHTML = html;
  // Ensure show-all mode
  state.selectedCategory = '__ALL__';
  renderModulesList();
  renderPresets();
}

function selectCategory(key) {
  // Legacy alias — now acts as jumpToCategory for backward compatibility
  jumpToCategory(key);
}

function jumpToCategory(key) {
  // Ensure all modules rendered
  state.selectedCategory = '__ALL__';
  renderModulesList();
  // Scroll to the category group header
  setTimeout(() => {
    const anchor = document.getElementById('cat-header-' + key);
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Flash highlight
      anchor.style.transition = 'box-shadow 0.5s';
      anchor.style.boxShadow = '0 0 0 4px ' + (CATEGORIES[key]?.color || '#CC7A55') + '66';
      setTimeout(() => { anchor.style.boxShadow = ''; }, 1200);
    }
  }, 50);
}

function renderModulesList() {
  const container = document.getElementById('modules-list');
  if (!container) return;
  // v10.1.1: Always render full grouped view (no filter mode)
  let html = '';
  Object.keys(CATEGORIES).forEach(ck => {
    const cat = CATEGORIES[ck];
    const selInCat = cat.modules.filter(mid => state.selectedModules.has(mid)).length;
    html += `<div id="cat-header-${ck}" style="margin:20px 0 8px 0;padding:8px 14px;background:${cat.color}15;border-left:4px solid ${cat.color};border-radius:8px;font-weight:800;color:${cat.color};display:flex;align-items:center;gap:8px;font-size:0.92em">
      <span style="font-size:1.2em">${cat.icon}</span>
      <span class="ko-text">${cat.name_ko}</span><span class="en-text">${cat.name_en}</span>
      <span style="margin-left:auto;font-size:0.8em;opacity:0.75;font-weight:600">
        ${selInCat > 0 ? `✓ ${selInCat}/${cat.modules.length}` : `${cat.modules.length} ${state.lang === 'ko' ? '모듈' : 'modules'}`}
      </span>
    </div>`;
    html += '<div class="modules-grid">';
    cat.modules.forEach(mid => {
      const m = EMBEDDED_MODULES[mid];
      if (!m) return;
      const meta = m._meta || {};
      const selected = state.selectedModules.has(mid);
      html += `<div class="module-card ${selected ? 'selected' : ''}" onclick="toggleModule('${mid}')" data-cat-color="${cat.color}">
        <div class="module-header">
          <span class="module-icon">${cat.icon}</span>
          <span class="module-name">
            <span class="ko-text">${meta.display_name_ko || meta.display_name}</span>
            <span class="en-text">${meta.display_name}</span>
            <button class="module-info-btn" onclick="event.stopPropagation();showModuleInfo('${mid}')">ⓘ</button>
          </span>
        </div>
        <div class="module-desc">
          <span class="ko-text">${(meta.tooltip && meta.tooltip.what_it_assesses) || meta.description_ko || ''}</span>
          <span class="en-text">${_moduleDescEn(m, mid)}</span>
        </div>
        <div class="module-meta">
          <span>📋 ${(meta.tooltip && meta.tooltip.question_count) || (m.questions && m.questions.length) || '?'} items</span>
          <span>⏱️ ${(meta.tooltip && meta.tooltip.time_estimate_min) || '?'} min</span>
        </div>
      </div>`;
    });
    html += '</div>';
  });
  container.innerHTML = html;
}

function toggleModule(mid) {
  if (state.selectedModules.has(mid)) {
    state.selectedModules.delete(mid);
  } else {
    state.selectedModules.add(mid);
  }
  updateDashboard();
  renderModulesList();
  renderCategories(); // update category counts
  renderPresets();   // update preset highlight
}

function updateModuleSummary() {
  const cnt = state.selectedModules.size;
  let q = 0, t = 0;
  state.selectedModules.forEach(mid => {
    const m = EMBEDDED_MODULES[mid];
    if (m) {
      q += (m._meta.tooltip && m._meta.tooltip.question_count) || (m.questions && m.questions.length) || 0;
      t += (m._meta.tooltip && m._meta.tooltip.time_estimate_min) || 0;
    }
  });
  document.getElementById('sel-count').textContent = cnt;
  document.getElementById('sel-questions').textContent = q;
  document.getElementById('sel-time').textContent = t;
  const btn = document.getElementById('next-4');
  const hint = document.getElementById('hint-4');
  btn.disabled = cnt === 0;
  if (cnt === 0) {
    hint.className = 'footer-hint warn';
    hint.innerHTML = state.lang === 'ko' ? '⬆️ AI와 대화하거나 모듈을 선택하세요' : '⬆️ Talk to AI or select modules';
  } else {
    hint.className = 'footer-hint ready';
    hint.innerHTML = state.lang === 'ko' ? `✅ ${cnt}개 선택됨 · 설문 시작 준비 완료` : `✅ ${cnt} selected · Ready`;
  }
}

// ============================================================================
// v2.1 SYMPTOM CATCHER — 3-Role Triage + Therapist Printout
// KISS principle: each step clear, each choice obvious
// ============================================================================

// ============================================================================
// v2.2 BNM ADMIN CONFIG — Evidence + AI Methodology Settings
// ============================================================================
// ⚠️ These settings are controlled via Admin Mode only.
// Default: Boston Neuromind operates in HYBRID mode (best accuracy).
// When licensing to other clinics, they can switch to AI_ONLY or EVIDENCE_ONLY.
function showModuleInfo(mid) {
  const m = EMBEDDED_MODULES[mid];
  if (!m) return;
  const meta = m._meta;
  const t = meta.tooltip || {};
  const isKo = state.lang === 'ko';
  // Title: KO shows "한글 (English)", EN shows just English
  const titleHtml = isKo
    ? `${meta.display_name_ko || ''} (${meta.display_name})`
    : `${meta.display_name || ''}`;
  // Subtitle: English mode uses curated dictionary; KO uses tooltip
  const subtitle = isKo
    ? (t.what_it_assesses || '')
    : _moduleDescEn(m, mid);
  document.getElementById('modal-content-wrapper').innerHTML = `
    <div class="modal-title">${titleHtml}</div>
    <div class="modal-subtitle">${subtitle}</div>
    <div class="modal-content">
      ${t.ai_differentiation ? `<h4>${isKo ? '🔬 AI 차별점' : '🔬 AI Differentiation'}</h4><ul>${t.ai_differentiation.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      ${t.scientific_basis ? `<h4>${isKo ? '📚 과학적 근거' : '📚 Scientific Basis'}</h4><ul>${t.scientific_basis.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      <h4>${isKo ? '📋 정보' : '📋 Info'}</h4>
      <p><strong>${isKo ? '문항 수' : 'Questions'}:</strong> ${t.question_count || m.questions.length}</p>
      <p><strong>${isKo ? '소요 시간' : 'Time'}:</strong> ${t.time_estimate_min || '?'} min</p>
    </div>`;
  document.getElementById('modal-backdrop').classList.add('open');
}
function _moduleDescEn(m, mid) {
  if (!m) return '';
  const meta = m._meta || {};
  // 1) Built-in English description (best)
  if (meta.description) return meta.description;
  // 2) Curated translation dictionary (covers all 31 modules)
  if (mid && MODULE_DESC_EN[mid]) return MODULE_DESC_EN[mid];
  // 3) Fall back to tooltip (may be Korean, but best we have)
  const tt = meta.tooltip || {};
  return tt.what_it_assesses_en || tt.what_it_assesses || '';
}

function _updateSelBar() {
  const bar = document.getElementById('sel-bar');
  if (!bar) return;
  const chips = document.getElementById('sel-bar-chips');
  const stats = document.getElementById('sel-bar-stats');
  if (state.selectedModules.size === 0) {
    bar.classList.remove('show');
    return;
  }
  bar.classList.add('show');
  const chipsHTML = [];
  let totalQ = 0, totalT = 0;
  state.selectedModules.forEach(mid => {
    const m = EMBEDDED_MODULES[mid];
    if (!m) return;
    const meta = m._meta || {};
    const nameKo = meta.display_name_ko || meta.display_name || mid;
    const nameEn = meta.display_name || mid;
    // Find category icon
    let icon = '🔹';
    for (const ck in CATEGORIES) {
      if (CATEGORIES[ck].modules.includes(mid)) { icon = CATEGORIES[ck].icon; break; }
    }
    chipsHTML.push(`<span class="sel-chip" title="${nameKo}">
      <span class="chip-icon">${icon}</span>
      <span class="ko-text">${nameKo}</span><span class="en-text">${nameEn}</span>
      <button class="chip-x" onclick="event.stopPropagation();removeModule('${mid}')" data-ko-title="해제" data-en-title="Remove" title="해제">✕</button>
    </span>`);
    totalQ += (meta.tooltip && meta.tooltip.question_count) || (m.questions && m.questions.length) || 0;
    totalT += (meta.tooltip && meta.tooltip.time_estimate_min) || 0;
  });
  chips.innerHTML = chipsHTML.join('');
  stats.innerHTML = state.lang === 'ko'
    ? `📋 ${totalQ}문항 · ⏱️ ~${totalT}분`
    : `📋 ${totalQ} items · ⏱️ ~${totalT} min`;
}

function removeModule(mid) {
  state.selectedModules.delete(mid);
  // Invalidate survey state if currently in/past survey
  if (state.currentPanel === 5 || state.currentPanel === 6) {
    state.allQuestions = [];
    state.currentQIndex = 0;
  }
  updateDashboard();
  renderCategories();
}

function clearAllModules() {
  if (state.selectedModules.size === 0) return;
  if (!confirm(state.lang === 'ko'
    ? '선택된 모든 모듈을 해제하시겠습니까?'
    : 'Clear all selected modules?')) return;
  state.selectedModules.clear();
  state.allQuestions = [];
  state.currentQIndex = 0;
  state.responses = {};
  updateDashboard();
  renderCategories();
}

// ============================================================================
// v10.1 SMART START PRESETS — one-click select of related modules
// ============================================================================


/* ===== SURVEY ENGINE (verbatim from triage.html; nextQuestion nav adapted) ===== */
const KO_EN_LABEL_DICT = {
  // === Frequency (빈도) ===
  '전혀': 'Never',
  '전혀 없음': 'Never',
  '전혀 없다': 'Never',
  '드물게': 'Rarely',
  '드물게 / 전혀': 'Rarely or never',
  '매우 드물게': 'Very rarely',
  '가끔': 'Sometimes',
  '때때로': 'Sometimes',
  '자주': 'Often',
  '매우 자주': 'Very often',
  '항상': 'Always',
  '매일': 'Daily',
  '거의 매일': 'Almost daily',
  '매일/거의': 'Daily/almost',
  '지속적': 'Persistent',
  '지속적으로': 'Persistently',
  '반복적': 'Repeated',
  '만성적': 'Chronic',
  '습관적': 'Habitual',

  // === Counts / Occurrences ===
  '한 번': 'Once',
  '한 번쯤': 'Maybe once',
  '한두 번': 'Once or twice',
  '1회': '1 time',
  '1-2회': '1-2 times',
  '몇 번': 'A few times',
  '여러 번': 'Several times',
  '여러 번 과거': 'Multiple times in past',
  '과거 1회': 'Once in the past',
  '최근 행동': 'Recent behavior',

  // === Intensity (강도) ===
  '약간': 'Mild',
  '중간': 'Moderate',
  '중간 정도': 'Moderate',
  '상당히': 'Substantial',
  '강함': 'Strong',
  '매우 강함': 'Very strong',
  '강하게': 'Strongly',
  '현저': 'Marked',
  '현저히': 'Markedly',
  '심함': 'Severe',
  '심하게': 'Severely',
  '심각': 'Severe',
  '심각하게': 'Severely',
  '매우': 'Very',
  '매우 심하게': 'Very severely',
  '매우 많이': 'Very much',
  '극심': 'Extreme',
  '극단적': 'Extreme',
  '완전': 'Complete',
  '완전히': 'Completely',
  '완전한': 'Complete',
  '완전 상실': 'Complete loss',
  '완전히 다른 인격': 'Completely different personality',
  '전적으로': 'Completely',
  '대부분': 'Most of the time',

  // === Yes/No & Certainty ===
  '네': 'Yes',
  '아니오': 'No',
  '없음': 'None',
  '모름': 'Unsure',
  '불확실': 'Uncertain',
  '매우 불확실': 'Very uncertain',
  '불분명': 'Unclear',
  '확실히': 'Definitely',
  '불가능': 'Unable to',
  '반드시': 'Always',
  '아니오 / 모름': 'No / unsure',
  '아니오 (어린 시절부터)': 'No (since childhood)',
  '정상': 'Normal',
  '정상 범위': 'Normal range',
  '경계': 'Borderline',
  '경증': 'Mild',
  '중등도': 'Moderate',
  '중증': 'Severe',

  // === Time Windows — Months/Days ===
  '1개월 미만': 'Less than 1 month',
  '1-2개월': '1-2 months',
  '1-3개월': '1-3 months',
  '1-4주': '1-4 weeks',
  '2-3개월': '2-3 months',
  '3-6개월': '3-6 months',
  '3-12개월': '3-12 months',
  '6개월 이상': '6+ months',
  '6개월+': '6+ months',
  '1년 이상': '1+ years',
  '3개월+ 없음': '3+ months absent',
  '지난 1년 내': 'Within past year',
  '1년 전': '1 year ago',
  '1년 전 있음': '1 year ago',
  '1-12개월 (provisional)': '1-12 months (provisional)',
  '1년 이상 (chronic)': '1+ years (chronic)',
  '어린 시절부터': 'Since childhood',
  '학창 시절부터': 'Since school age',
  '최근': 'Recent',
  '수년': 'Several years',

  // === Time — Days ===
  '4일 이상': '4+ days',
  '1일 미만': '<1 day',
  '1일-1주': '1 day-1 week',
  '1주-1개월': '1 week-1 month',

  // === Weekly/Monthly frequencies ===
  '월 1회': 'Once/month',
  '월 1회 이하': 'Less than monthly',
  '월 1-2회': '1-2 times/month',
  '월 2-4회': '2-4 times/month',
  '주 1회': 'Once/week',
  '주 1회+': '1+ times/week',
  '주 1-2회': '1-2 times/week',
  '주 2-3회': '2-3 times/week',
  '주 3-4회': '3-4 times/week',
  '주 3회 이상': '3+ times/week',
  '주 4회 이상': '4+ times/week',
  '주 5-6회': '5-6 times/week',
  '주 여러 번': 'Several times/week',
  '여러 번/주': 'Several/week',
  '매일 밤': 'Every night',
  '거의 매일 밤': 'Almost every night',
  '매일 또는 지속적': 'Daily or constant',

  // === Hours per day ===
  '하루 1시간 미만': '<1 hour/day',
  '하루 1-3시간': '1-3 hours/day',
  '하루 3-8시간': '3-8 hours/day',
  '하루 8시간 이상': '>8 hours/day',

  // === Quantity (drinks/items) ===
  '1-2잔': '1-2 drinks',
  '3-4잔': '3-4 drinks',
  '5-6잔': '5-6 drinks',
  '7-9잔': '7-9 drinks',
  '10잔+': '10+ drinks',
  '1개': '1',
  '2-3개': '2-3',
  '4-5개': '4-5',
  '6개+': '6+',
  '하나': 'One',
  '둘 이상': 'Two or more',
  '0-1개 해당': '0-1 items match',
  '2개 해당': '2 items match',
  '3개 해당': '3 items match',
  '4개 이상': '4+ items match',

  // === Specific gradations (anorexia/eating) ===
  '약간 제한': 'Mild restriction',
  '상당히 제한': 'Substantial restriction',
  '심하게 제한': 'Severe restriction',
  '극단적 제한': 'Extreme restriction',
  '약간 왜곡': 'Mild distortion',
  '중간 왜곡': 'Moderate distortion',
  '심한 왜곡': 'Severe distortion',
  '완전 왜곡': 'Complete distortion',
  '정상적으로 인식': 'Normal perception',
  '보상 행동 자주': 'Frequent compensatory behavior',
  '가끔 보상': 'Occasional compensation',
  '드물게 보상': 'Rare compensation',
  '보상 전혀 없음': 'No compensation',

  // === BMI ranges (anorexia) ===
  '18.5 이상 (정상)': 'BMI ≥18.5 (normal)',
  '17-18.4 (저체중)': 'BMI 17-18.4 (underweight)',
  '16-16.9 (중증)': 'BMI 16-16.9 (severe)',
  '15-15.9 (심한 저체중)': 'BMI 15-15.9 (very severe)',
  '15 미만 (극심)': 'BMI <15 (extreme)',
  '해당 없음': 'Not applicable',
  '해당 없음 / 정상': 'N/A or normal',
  '불규칙': 'Irregular',

  // === BPD/borderline ===
  '큰 가책': 'Strong remorse',
  '약간 가책': 'Slight remorse',
  '거의 없음': 'Almost none',

  // === Difficulty levels (autism) ===
  '매우 쉽게': 'Very easily',
  '쉽게': 'Easily',
  '보통': 'Average',
  '어렵게': 'With difficulty',
  '매우 어렵게': 'With great difficulty',

  // === Empathy levels (narcissistic) ===
  '충분한 공감': 'Full empathy',
  '약간 부족': 'Slightly lacking',
  '중간 부족': 'Moderately lacking',
  '강한 부족': 'Severely lacking',
  '공감 없음': 'No empathy',

  // === Dissociative identity ===
  '약간 다른 느낌': 'Slightly different feeling',
  '분명히 다른 부분': 'Clearly different parts',
  '뚜렷한 다른 자아': 'Distinct separate self',

  // === Trauma severity ===
  '매우 심함/장기': 'Very severe/chronic',

  // === Sleep hours ===
  '6-8시간 (정상)': '6-8 hours (normal)',
  '8-9시간': '8-9 hours',
  '9-10시간': '9-10 hours',
  '10-12시간': '10-12 hours',
  '12시간 이상': '12+ hours',

  // === Dementia progression ===
  '안정적': 'Stable',
  '서서히 악화': 'Gradually worsening',
  '빠르게 악화': 'Rapidly worsening',
  '전혀 (MCI)': 'Not at all (MCI)',
  '상당히 (Dementia)': 'Substantially (Dementia)',
  '없음 (MCI)': 'None (MCI)',

  // === Age ranges ===
  '10세 이전': 'Before age 10',
  '10-15세': '10-15 years',
  '15-18세': '15-18 years',
  '성인기': 'Adulthood',
  '50세 미만': 'Under 50',
  '50-60세': '50-60 years',
  '60세 이상': '60+ years',
  '18세 이후': 'After age 18',
  '40대부터': 'From 40s',
  '50세 이후': 'After age 50',

  // === Academic level ===
  '약간 낮음': 'Slightly below',
  '낮음': 'Below average',
  '현저히 낮음': 'Markedly below',
  '매우 낮음': 'Very far below',

  // === Nightmare frequency ===
  '자주 깨지만 흐릿': 'Frequent but unclear',
  '자주 깨고 분명': 'Frequent and vivid',
  '거의 매일 깨고 생생': 'Almost daily and vivid',
  '약간 관련': 'Slightly related',
  '분명히 관련': 'Clearly related',

  // === Chronotype (circadian) ===
  '9pm-5am (극단적 아침형)': '9pm-5am (extreme morning type)',
  '10pm-6am (아침형)': '10pm-6am (morning type)',
  '11pm-7am (중간형)': '11pm-7am (intermediate)',
  '12-8am (저녁형)': '12am-8am (evening type)',
  '2-10am 이후 (극단적 저녁형)': '2am-10am+ (extreme evening type)',
  '거의 일치': 'Nearly matching',
  '1시간 차이': '1 hour difference',
  '2-3시간 차이': '2-3 hours difference',
  '3-5시간 차이': '3-5 hours difference',
  '5시간+ 차이': '5+ hours difference',
  '차이 없음': 'No difference',
  '1시간 늦음': '1 hour later',
  '2시간 늦음': '2 hours later',
  '3시간 늦음': '3 hours later',
  '4시간 이상 늦음': '4+ hours later',
  '가끔 저녁 근무': 'Occasional evening shift',
  '정기 야간 근무': 'Regular night shift',
  '순환 교대': 'Rotating shift',

  // === BMI categories (sleep apnea) ===
  '정상 (<25)': 'Normal (<25)',
  '과체중 (25-30)': 'Overweight (25-30)',
  '비만 (30-35)': 'Obese (30-35)',
  '고도비만 (>35)': 'Morbidly obese (>35)',
  '네, 약물 치료 중': 'Yes, on medication',

  // === Pattern ===
  '패턴': 'Pattern',

  // === Withdrawal (substance) ===
  '약간 불편': 'Slightly uncomfortable',
  '뚜렷함': 'Distinct',
  '의학적 위험': 'Medically dangerous',
  '많이': 'A lot'
};
function _smartEnLabel(opt) {
  if (opt.label_en) return opt.label_en;
  if (!opt.label_ko) return 'Value ' + opt.value;
  const ko = opt.label_ko.trim();
  // Direct dict lookup (covers 100% of labels)
  if (KO_EN_LABEL_DICT[ko]) return KO_EN_LABEL_DICT[ko];
  // Try substring replacement for compound phrases
  let translated = ko;
  let replaced = false;
  const sortedKeys = Object.keys(KO_EN_LABEL_DICT).sort((a, b) => b.length - a.length);
  for (const k of sortedKeys) {
    if (translated.includes(k)) {
      translated = translated.replace(k, KO_EN_LABEL_DICT[k]);
      replaced = true;
    }
  }
  if (replaced) return translated;
  // Fallback — should rarely happen now with complete dictionary
  return '[missing EN] ' + ko;
}
function prepareSurvey() {
  state.allQuestions = [];
  state.selectedModules.forEach(mid => {
    const m = EMBEDDED_MODULES[mid];
    if (m && m.questions) {
      m.questions.forEach(q => {
        state.allQuestions.push({
          ...q,
          module_id: mid,
          module_name: m._meta.display_name,
          module_name_ko: m._meta.display_name_ko
        });
      });
    }
  });
  state.currentQIndex = 0;
  state.responses = {};
}

// v10.3 COMPLETE KO→EN translation dictionary — clinical-grade
function renderQuestion() {
  var _nav=document.getElementById('survey-nav'); if(_nav) _nav.style.display='flex';
  const q = state.allQuestions[state.currentQIndex];
  if (!q) return;
  const container = document.getElementById('question-container');
  const total = state.allQuestions.length;
  const idx = state.currentQIndex + 1;
  document.getElementById('q-progress').style.width = (idx/total*100) + '%';
  document.getElementById('q-text').textContent = `${idx} / ${total}`;
  
  const modResp = state.responses[q.module_id] || {};
  const selectedVal = modResp[q.id];
  
  container.innerHTML = `<div class="question-card">
    <div class="question-module clinician-only">${state.lang === 'ko' ? (q.module_name_ko || q.module_name) : q.module_name}${q.dsm_criterion ? ' · ' + q.dsm_criterion : ''}</div>
    <div class="question-text">
      <span class="ko-text">${q.text_ko || q.text_en}</span>
      <span class="en-text">${q.text_en || q.text_ko}</span>
    </div>
    <div class="response-options">
      ${q.response_options.map(opt => `
        <div class="response-option ${selectedVal === opt.value ? 'selected' : ''}" onclick="answerQ(${opt.value})">
          <span>
            <span class="ko-text">${opt.label_ko || opt.label_en || ('값 ' + opt.value)}</span>
            <span class="en-text">${_smartEnLabel(opt)}</span>
          </span>
          <span class="response-score clinician-only">${state.lang === 'ko' ? '점수' : 'Score'}: ${opt.value}</span>
        </div>
      `).join('')}
    </div>
    ${q.scientific_notes ? `<div class="clinician-note clinician-only">📚 ${q.scientific_notes}</div>` : ''}
  </div>`;
  
  // Nav buttons
  document.getElementById('q-prev').disabled = state.currentQIndex === 0;
  document.getElementById('q-next').innerHTML = state.currentQIndex === total - 1 
    ? '<span class="ko-text">결과 보기 →</span><span class="en-text">See Results →</span>'
    : '<span class="ko-text">다음 →</span><span class="en-text">Next →</span>';
  
  // v10.1: Live preview + early result button
  try { updateLivePreview(); } catch(e) { console.warn('[live preview]', e); }
}

// v10.1 Live Preview: show partial scores as user answers
function updateLivePreview() {
  const box = document.getElementById('survey-preview');
  const body = document.getElementById('survey-preview-body');
  const earlyBtn = document.getElementById('btn-early-result');
  if (!box || !body) return;
  
  // Count answered
  let answered = 0;
  Object.values(state.responses || {}).forEach(m => { answered += Object.keys(m || {}).length; });
  
  // Show preview after 5+ answers
  if (answered < 5) {
    box.style.display = 'none';
    if (earlyBtn) earlyBtn.style.display = 'none';
    return;
  }
  box.style.display = 'block';
  if (earlyBtn && answered >= 10) earlyBtn.style.display = 'inline-flex';
  
  // Compute per-module partial percentages
  const partials = [];
  state.selectedModules.forEach(mid => {
    const m = EMBEDDED_MODULES[mid];
    if (!m || !m.questions) return;
    const resp = state.responses[mid] || {};
    const answeredCt = Object.keys(resp).length;
    if (answeredCt === 0) return;
    const totalForMod = m.questions.length;
    const sum = Object.values(resp).reduce((a, v) => a + (parseFloat(v) || 0), 0);
    // Max possible score per question (assume max is max of response option values)
    let maxPerQ = 3;
    if (m.questions[0] && m.questions[0].response_options) {
      maxPerQ = Math.max(...m.questions[0].response_options.map(o => o.value || 0));
    }
    const maxPossible = answeredCt * maxPerQ;
    const pct = maxPossible > 0 ? Math.round(sum/maxPossible*100) : 0;
    const meta = m._meta || {};
    partials.push({
      name: (state.lang === 'ko' ? (meta.display_name_ko || meta.display_name) : meta.display_name) || mid,
      pct,
      answered: answeredCt,
      total: totalForMod
    });
  });
  partials.sort((a,b) => b.pct - a.pct);
  if (partials.length === 0) {
    body.innerHTML = (state.lang === 'ko' ? '답변 누적 중...' : 'Collecting responses...');
    return;
  }
  body.innerHTML = partials.slice(0, 5).map(p => {
    const barColor = p.pct >= 70 ? '#EF4444' : (p.pct >= 40 ? '#F59E0B' : '#10B981');
    return `<div style="display:flex;align-items:center;gap:10px;margin:4px 0">
      <span style="min-width:160px;font-weight:700">${p.name}</span>
      <div style="flex:1;background:#E5E7EB;border-radius:100px;height:10px;overflow:hidden;max-width:200px">
        <div style="width:${p.pct}%;background:${barColor};height:100%;border-radius:100px"></div>
      </div>
      <span style="font-weight:800;color:${barColor};min-width:45px;text-align:right">${p.pct}%</span>
      <span style="font-size:0.78em;color:#6B7280">${p.answered}/${p.total}</span>
    </div>`;
  }).join('');
}

function answerQ(value) {
  if (!state.allQuestions || !state.allQuestions.length) { _surveyNeedsModules(); return; }
  const q = state.allQuestions[state.currentQIndex];
  if (!state.responses[q.module_id]) state.responses[q.module_id] = {};
  state.responses[q.module_id][q.id] = value;
  renderQuestion();
  // v10.1: update dashboard status (answered count)
  try { updateDashboard(); } catch(e) {}
  // Auto-advance
  setTimeout(() => {
    if (state.currentQIndex < state.allQuestions.length - 1) {
      nextQuestion();
    }
  }, 300);
}

function nextQuestion() {
  if (!state.allQuestions || !state.allQuestions.length) { _surveyNeedsModules(); return; }
  // Check if we have unanswered current question (optional: allow skip)
  if (state.currentQIndex < state.allQuestions.length - 1) {
    state.currentQIndex++;
    renderQuestion();
  } else {
    // Last question - go to results
    console.log('[nextQuestion] Last question, going to results panel');
    try {
      if(typeof window.scStartDifferential==='function'){window.scStartDifferential();}else if(typeof switchSymptomTab==='function'){switchSymptomTab('s-re');}
    } catch(e) {
      console.error('[nextQuestion] Error going to Panel 6:', e);
      alert((state.lang === 'ko' ? '결과 페이지로 이동 중 오류: ' : 'Error navigating to results: ') + e.message);
    }
  }
}

function _surveyNeedsModules(){
  var _nav=document.getElementById('survey-nav'); if(_nav) _nav.style.display='none';
  var c=document.getElementById('question-container');
  if(c) c.innerHTML='<div class="survey-empty"><span class="ko-text">먼저 <b>입력 탭</b>에서 AI 모듈(우울·불안 등)을 선택한 뒤 <b>설문 시작</b>을 누르세요.</span><span class="en-text">Select AI modules (depression, anxiety, …) in the <b>Intake</b> tab, then click <b>Start Survey</b>.</span></div>';
}
function prevQuestion() {
  if (state.currentQIndex > 0) {
    state.currentQIndex--;
    renderQuestion();
  }
}

// ============================================================================
// COMPUTE RESULTS
// ============================================================================

/* scStartSurvey — 모듈 선택 확인 후 설문 시작/새로고침 (탭 진입 버튼용) */
function scStartSurvey(){
  if(!state.selectedModules || state.selectedModules.size===0){
    var _nav=document.getElementById('survey-nav'); if(_nav) _nav.style.display='none';
    var c=document.getElementById('question-container');
    if(c) c.innerHTML='<div class="survey-empty"><span class="ko-text">먼저 입력 탭에서 AI 모듈을 선택하세요.</span><span class="en-text">Select AI modules in the Intake tab first.</span></div>';
    var pg=document.getElementById('q-progress'); if(pg) pg.style.width='0%';
    var qt=document.getElementById('q-text'); if(qt) qt.textContent='';
    var pv=document.getElementById('survey-preview'); if(pv) pv.style.display='none';
    return;
  }
  prepareSurvey();
  renderQuestion();
}


/* ============================================================================
 * DIFFERENTIAL ENGINE — verbatim from triage.html
 * computeResults orchestrates FiveLensEngine + FingerprintEngine + FusionEngine
 * (loaded as separate <script> UMD globals). Topomap stubbed (QEEG tab owns it).
 * _persistAssessment is a no-op unless window.patientStore is wired.
 * ==========================================================================*/
/* topomap stubs — 감별 결과에선 QEEG탭 토포맵 재사용 안 함(빈 반환). */
function renderBrainTopoFromRealData(){ return ''; }
function renderBrainTopo(){ return ''; }
function _pickNarrativeLang(slot) {
  if (!slot) return '';
  if (typeof slot === 'string') return slot.trim();
  const lang = (typeof state !== 'undefined' && state.lang === 'ko') ? 'ko' : 'en';
  return (slot[lang] || slot.en || slot.ko || '').trim();
}

function getDiagnosisNarrative(diagnosisId) {
  if (typeof CLINICAL_NARRATIVES === 'undefined' || !diagnosisId) return null;
  return (CLINICAL_NARRATIVES.diagnoses || {})[diagnosisId.toLowerCase()] || null;
}

function getModuleNarrative(moduleId) {
  if (typeof CLINICAL_NARRATIVES === 'undefined' || !moduleId) return null;
  return (CLINICAL_NARRATIVES.modules || {})[moduleId] || null;
}

function getNFProtocol(diagnosisId) {
  if (typeof CLINICAL_NARRATIVES === 'undefined' || !diagnosisId) return null;
  return (CLINICAL_NARRATIVES.nf_protocols || {})[diagnosisId.toLowerCase()] || null;
}

// i18n: Korean translations for fingerprint match labels
function _matchLabelI18n(label) {
  const isKo = (typeof state !== 'undefined' && state.lang === 'ko');
  if (!isKo) return label || '';
  const map = {
    'Strong Match': '강한 매칭',
    'Moderate Match': '중등도 매칭',
    'Weak Match': '약한 매칭',
    'No Match': '매칭 없음'
  };
  return map[label] || label || '';
}

// Render structured NF protocol table inside diagnosis narrative panel
function renderNFProtocolBlock(diagnosisId) {
  const p = getNFProtocol(diagnosisId);
  const isKo = (typeof state !== 'undefined' && state.lang === 'ko');
  if (!p) return '';
  const L = {
    header: isKo ? '🧠 추천 뉴로피드백 프로토콜 (BCN 임상가 검토 필요)' : '🧠 Recommended Neurofeedback Protocol (BCN clinician review required)',
    ch:     isKo ? '채널' : 'Channels',
    target: isKo ? '목표 주파수' : 'Target',
    sess:   isKo ? '세션' : 'Sessions',
    equip:  isKo ? '장비' : 'Equipment',
    cite:   isKo ? '근거' : 'Citation',
    contra: isKo ? '금기' : 'Contraindication',
    disc:   isKo
      ? '이 프로토콜은 AI 기반 추천입니다. 임상가가 직접 평가 후 적용할 자리. Boston Neuromind 스코프 = BCN+PhD wellness/coaching. 약물 추천 ❌.'
      : 'This protocol is an AI-generated suggestion. Requires direct clinician evaluation before application. Boston Neuromind scope = BCN+PhD wellness/coaching. No medication recommendations.'
  };

  const row = (label, val, valColor) => {
    if (!val) return '';
    return `<tr>
      <td style="padding:10px 14px;font-weight:700;color:#993C1D;font-size:0.95em;white-space:nowrap;vertical-align:top;border-bottom:1px solid #F3F4F6">${label}</td>
      <td style="padding:10px 14px;color:${valColor || '#2A1108'};font-size:1.02em;line-height:1.7;border-bottom:1px solid #F3F4F6">${val}</td>
    </tr>`;
  };

  const contraText = _pickNarrativeLang(p.contraindication);
  const contraColor = contraText.includes('⚠️') ? '#991B1B' : '#2A1108';

  return `<details open style="margin-top:14px;border-top:1px solid #E5E7EB;padding-top:12px">
    <summary style="cursor:pointer;font-weight:700;color:#993C1D;font-size:1.05em;user-select:none;padding:6px 0">${L.header}</summary>
    <div style="margin-top:10px;padding:14px 16px;background:#FFFAF5;border-left:4px solid #CC7A55;border-radius:8px">
      <table style="width:100%;border-collapse:collapse;font-size:1.02em">
        <tbody>
          ${row(L.ch,     _pickNarrativeLang(p.channels))}
          ${row(L.target, _pickNarrativeLang(p.target))}
          ${row(L.sess,   _pickNarrativeLang(p.sessions))}
          ${row(L.equip,  _pickNarrativeLang(p.equipment))}
          ${row(L.cite,   _pickNarrativeLang(p.citation),       '#6B7280')}
          ${row(L.contra, contraText, contraColor)}
        </tbody>
      </table>
      <div style="margin-top:12px;padding:12px 14px;background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:6px;font-size:0.95em;color:#78350F;line-height:1.7">
        <strong>⚖️ Disclaimer:</strong> ${L.disc}
      </div>
    </div>
  </details>`;
}

// Map fingerprint match_label → narrative confidence key
function _matchLabelKey(label) {
  if (!label) return null;
  const l = label.toLowerCase();
  if (l.includes('strong')) return 'strong';
  if (l.includes('moderate')) return 'moderate';
  if (l.includes('weak')) return 'weak';
  return null;
}

// Render one narrative slot as labeled section. Returns '' if slot missing.
function _narrativeSlot(label, text, accentColor) {
  if (!text) return '';
  const color = accentColor || '#6B7280';
  return `<div style="margin-top:12px;padding:14px 16px;background:#FAFAFA;border-left:4px solid ${color};border-radius:8px">
    <div style="font-weight:700;color:${color};font-size:0.95em;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">${label}</div>
    <div style="white-space:pre-line;font-size:1.02em;color:#2A1108;line-height:1.7">${text}</div>
  </div>`;
}

// Diagnosis narrative panel (for fingerprint + fusion diagnosis cards)
function renderDiagnosisNarrativePanel(diagnosisId, matchLabel, accentColor) {
  const n = getDiagnosisNarrative(diagnosisId);
  const isKo = (typeof state !== 'undefined' && state.lang === 'ko');
  if (!n) {
    return `<details style="margin-top:10px"><summary style="cursor:pointer;font-size:0.85em;color:#9CA3AF;font-style:italic">${isKo ? '📋 임상 narrative — Phase C에서 박힘' : '📋 Clinical narrative — coming in Phase C'}</summary>
      <div style="margin-top:6px;padding:8px 12px;background:#F9FAFB;border-radius:6px;font-size:0.82em;color:#6B7280">
        ${isKo ? '이 진단의 상세 임상 narrative (DSM 정의 / 핵심 증상 / 신경생리 기반 / 감별진단 / 치료)는 Phase C에서 추가됩니다. 현재는 점수 + 일치 features만 표시.' : 'Detailed clinical narrative (DSM definition / core symptoms / neurophysiology / differential / treatment) for this diagnosis arrives in Phase C. Currently shows score + matched features only.'}
      </div>
    </details>` + renderNFProtocolBlock(diagnosisId);
  }

  const L = {
    title: isKo ? '🧠 임상 설명 (Boston Neuromind)' : '🧠 Clinical Detail (Boston Neuromind)',
    dsm: isKo ? 'DSM-5-TR 정의' : 'DSM-5-TR Definition',
    core: isKo ? '핵심 증상' : 'Core Symptoms',
    neuro: isKo ? '신경생리 기반' : 'Neurophysiological Basis',
    match: isKo ? '이 환자의 매칭 해석' : 'Match Interpretation for This Patient',
    diff: isKo ? '감별 진단' : 'Differential Diagnosis',
    add: isKo ? '권장 추가 측정' : 'Recommended Additional Assessment',
    tx: isKo ? '치료 옵션 (BCN 스코프)' : 'Treatment Options (BCN scope)'
  };

  const matchKey = _matchLabelKey(matchLabel);
  const matchText = matchKey && n.match_confidence ? _pickNarrativeLang(n.match_confidence[matchKey]) : '';

  let html = `<details open style="margin-top:12px;border-top:1px solid #E5E7EB;padding-top:10px">
    <summary style="cursor:pointer;font-weight:700;color:${accentColor || '#1F2937'};font-size:0.88em;user-select:none">${L.title}</summary>
    <div style="margin-top:8px">`;
  html += _narrativeSlot(L.dsm,   _pickNarrativeLang(n.dsm_definition),         accentColor || '#1F2937');
  html += _narrativeSlot(L.core,  _pickNarrativeLang(n.core_symptoms),          '#3B82F6');
  html += _narrativeSlot(L.neuro, _pickNarrativeLang(n.neurophysiology),        '#8B5CF6');
  html += _narrativeSlot(L.match, matchText,                                    accentColor || '#10B981');
  html += _narrativeSlot(L.diff,  _pickNarrativeLang(n.differential_diagnosis), '#F59E0B');
  html += _narrativeSlot(L.add,   _pickNarrativeLang(n.recommended_additional), '#06B6D4');
  html += _narrativeSlot(L.tx,    _pickNarrativeLang(n.treatment_options),      '#059669');
  html += `</div></details>`;
  // Append structured NF protocol block (own collapsible section, even if narrative is missing)
  html += renderNFProtocolBlock(diagnosisId);
  return html;
}

// Module narrative panel (for module score cards)
function renderModuleNarrativePanel(moduleId, scoreBandRange, accentColor) {
  const n = getModuleNarrative(moduleId);
  const isKo = (typeof state !== 'undefined' && state.lang === 'ko');
  if (!n) {
    return `<details style="margin-top:8px"><summary style="cursor:pointer;font-size:0.82em;color:#9CA3AF;font-style:italic">${isKo ? '📋 임상 설명 — Phase C에서 박힘' : '📋 Clinical detail — coming in Phase C'}</summary>
      <div style="margin-top:6px;padding:8px 12px;background:#F9FAFB;border-radius:6px;font-size:0.82em;color:#6B7280">
        ${isKo ? '이 모듈의 점수대별 해석, 서브척도 narrative, 신경생리 상관, 다음 단계는 Phase C에서 박힘.' : 'Score-band interpretation, subscale narrative, neurophysiological correlates, and next steps for this module arrive in Phase C.'}
      </div>
    </details>`;
  }

  const L = {
    title: isKo ? '🧠 임상 설명' : '🧠 Clinical Detail',
    band: isKo ? '점수의 임상적 의미' : 'Clinical Meaning of Score',
    sub: isKo ? '서브척도 해석' : 'Subscale Interpretation',
    neuro: isKo ? '신경생리 상관' : 'Neurophysiological Correlates',
    next: isKo ? '다음 평가 단계' : 'Next Assessment Steps'
  };

  const bandText = scoreBandRange && n.score_band_clinical ? _pickNarrativeLang(n.score_band_clinical[scoreBandRange]) : '';

  let html = `<details open style="margin-top:10px;border-top:1px solid #E5E7EB;padding-top:8px">
    <summary style="cursor:pointer;font-weight:700;color:${accentColor || '#1F2937'};font-size:0.85em;user-select:none">${L.title}</summary>
    <div style="margin-top:8px">`;
  html += _narrativeSlot(L.band,  bandText,                                          accentColor || '#10B981');
  html += _narrativeSlot(L.sub,   _pickNarrativeLang(n.subscale_interpretation),     '#3B82F6');
  html += _narrativeSlot(L.neuro, _pickNarrativeLang(n.neurophysiological_correlates), '#8B5CF6');
  html += _narrativeSlot(L.next,  _pickNarrativeLang(n.next_assessment),             '#06B6D4');
  html += `</div></details>`;
  return html;
}

// ============================================================================
// FINGERPRINT ENGINE — Async Bootstrap
// ============================================================================
function computeResults() {
  console.log('[computeResults] Starting...');
  // Guard: objective data is optional (survey-only is the common path) and is never assigned,
  // so keep it an object. computeAxes() reads objData.hrv_rmssd UNGUARDED and runs OUTSIDE the
  // fusion try/catch — an undefined here throws and blocks `state.results = results`, which makes
  // the "run differential first" gate persist and the AI deep analysis never run.
  state.objectiveData = state.objectiveData || {};
  let bpsFeatures = {};
  try { bpsFeatures = computeBPSFeatures(); } catch(e) { console.warn('BPS compute failed:', e); }
  
  const results = {
    patient: state.patient,
    bpsFeatures,
    objectiveData: state.objectiveData || {},
    eegData: state.eegData || null,
    hrvData: state.hrvData || null,
    eegQeegData: state.eegQeegData || null,
    eegZScores: state.eegZScores || null,
    modulesAnalyzed: [],
    diagnoses: [],
    comorbidities: [],
    treatments: [],
    axes: null,
    moduleScores: {},
    timestamp: new Date().toISOString()
  };
  
  // Compute raw scores per module (works without engines)
  state.selectedModules.forEach(mid => {
    const module = EMBEDDED_MODULES[mid];
    const resp = state.responses[mid] || {};
    if (module && module.questions) {
      let total = 0, answered = 0;
      module.questions.forEach(q => {
        if (resp[q.id] !== undefined) {
          total += resp[q.id];
          answered++;
        }
      });
      results.moduleScores[mid] = {
        total_score: total,
        items_answered: answered,
        total_items: module.questions.length,
        completion: answered / module.questions.length
      };
      
      // Interpret via module's scoring.interpretation
      if (module.scoring && module.scoring.interpretation) {
        const interp = module.scoring.interpretation;
        let level = null, levelInfo = null;
        for (const range of Object.keys(interp)) {
          const [lo, hi] = range.split('-').map(Number);
          if (total >= lo && total <= (hi || 999)) {
            level = range;
            levelInfo = interp[range];
            break;
          }
        }
        results.moduleScores[mid].level = level;
        results.moduleScores[mid].level_info = levelInfo;
      }
    }
  });
  
  // Run FiveLensEngine on each module if available
  // FiveLensEngine is a singleton object (not a class) - use init().analyze() pattern
  if (typeof FiveLensEngine !== 'undefined' && FiveLensEngine.init) {
    state.selectedModules.forEach(mid => {
      const moduleData = EMBEDDED_MODULES[mid];
      const responses = state.responses[mid] || {};
      try {
        // Initialize engine with module data, then analyze with patient data
        const analysis = FiveLensEngine.init(moduleData).analyze({
          responses: responses,
          age: state.patient.age,
          gender: state.patient.gender,
          personal_history: null
        });
        results.modulesAnalyzed.push({
          module_id: mid,
          module_name: moduleData._meta.display_name,
          module_name_ko: moduleData._meta.display_name_ko,
          result: analysis,
          ...analysis
        });
      } catch(e) {
        console.warn('Module analysis failed:', mid, e);
        // Fallback: at least compute total score
        try {
          const total = Object.values(responses).reduce((a,b) => a + (b||0), 0);
          const maxPossible = moduleData.questions.reduce((a,q) => a + Math.max(...q.response_options.map(o => o.value)), 0);
          results.modulesAnalyzed.push({
            module_id: mid,
            module_name: moduleData._meta.display_name,
            module_name_ko: moduleData._meta.display_name_ko,
            total_score: total,
            max_score: maxPossible,
            percentage: maxPossible > 0 ? Math.round(total/maxPossible*100) : 0,
            error: e.message
          });
        } catch(e2) {}
      }
    });
  }

  // === FingerprintEngine — Multi-modal pattern matching (parallel to Fusion) ===
  // No fusion injection: result stays in results.fingerprint only.
  if (_fingerprintReady && typeof FingerprintEngine !== 'undefined') {
    try {
      const eegD = state.eegData && state.eegData.qeeg && state.eegData.qeeg.derived;
      const patientData = {
        age: state.patient.age,
        // Handedness drives QEEG interpretation downstream (frontal alpha
        // asymmetry valence + language lateralization). Map the registration
        // code (R/L/A) to the canonical token FingerprintEngine expects.
        dominant_hand: ({R:'right',L:'left',A:'ambidextrous'})[state.patient.handedness] || null,
        qeeg: {
          theta_beta_Fz:      eegD ? eegD.frontal_theta_beta       : state.objectiveData.theta_beta_ratio,
          alpha_peak_freq:    state.objectiveData.alpha_peak_freq,
          alpha_power_Pz:     eegD ? eegD.posterior_alpha_zscore   : state.objectiveData.posterior_alpha,
          frontal_alpha_asym: eegD ? eegD.frontal_alpha_asymmetry  : state.objectiveData.frontal_alpha_asym,
          beta_power_Cz:      state.objectiveData.beta_power_Cz,
          P300_amplitude:     state.objectiveData.P300_amplitude,
          P300_latency:       state.objectiveData.P300_latency
        },
        hrv: state.hrvData ? {
          RMSSD:       state.hrvData.rmssd_ms,
          SDNN:        state.hrvData.sdnn_ms,
          LF_HF_ratio: state.hrvData.lf_hf_ratio
        } : (state.objectiveData.hrv_rmssd ? {
          RMSSD: state.objectiveData.hrv_rmssd,
          SDNN:  state.objectiveData.hrv_sdnn
        } : undefined),
        cognitive: {
          CPT_rt_variability: state.objectiveData.cpt_rt_variability,
          CPT_omission:       state.objectiveData.cpt_omission,
          digit_span_back:    state.objectiveData.digit_span_back
        },
        symptoms: extractSymptomScoresFromModules(results.modulesAnalyzed)
      };
      // Strip undefined keys so buildPatientVector skips them cleanly
      ['qeeg','hrv','cognitive','symptoms'].forEach(sec => {
        if (patientData[sec]) {
          Object.keys(patientData[sec]).forEach(k => {
            if (patientData[sec][k] === undefined || patientData[sec][k] === null) {
              delete patientData[sec][k];
            }
          });
          if (Object.keys(patientData[sec]).length === 0) delete patientData[sec];
        }
      });
      results.fingerprint = FingerprintEngine.matchAll(patientData);
    } catch (e) {
      console.warn('FingerprintEngine matching failed:', e);
    }
  }

  // Fusion - FusionEngine is also a singleton object
  if (typeof FusionEngine !== 'undefined' && FusionEngine.fuse && results.modulesAnalyzed.length > 0) {
    try {
      const fusionResult = FusionEngine.fuse(results.modulesAnalyzed, state.patient);
      // [glue] fusion rankings 키 정규화 → renderResults가 읽는 name/diagnosis_id/probability로 매핑
      // (fusion: diagnosis/diagnosis_ko/posterior  ↔  render: name/name_ko/probability)
      results.diagnoses = (fusionResult.diagnoses || fusionResult.rankings || []).map(function(d){
        return Object.assign({}, d, {
          name:         d.name        || d.diagnosis,
          name_ko:      d.name_ko     || d.diagnosis_ko,
          diagnosis_id: d.diagnosis_id|| d.diagnosis,
          probability:  (d.probability !== undefined ? d.probability : d.posterior)
        });
      });
      // [glue] comorbidity 키 정규화 (fusion: primary/secondary/known_rate ↔ render: dx1/dx2/confidence)
      results.comorbidities = (fusionResult.comorbidities || []).map(function(c){
        return Object.assign({}, c, {
          dx1: c.dx1 || c.primary_ko || c.primary,
          dx2: c.dx2 || c.secondary_ko || c.secondary,
          confidence: (c.confidence !== undefined ? c.confidence : (c.known_rate || 0))
        });
      });
      // FusionEngine.fuse returns recommendations as an OBJECT
      // ({immediate, diagnostic, treatment, follow_up, catcher_routing}), whose items carry
      // action/next_steps/details — NOT an array of {name, description}. Flatten the buckets
      // and map the fields so the "Treatment Recommendations" section actually renders.
      var _rec = fusionResult.treatments || fusionResult.recommendations;
      var _recList = Array.isArray(_rec) ? _rec
        : (_rec && typeof _rec === 'object')
          ? [].concat(_rec.immediate||[], _rec.diagnostic||[], _rec.treatment||[], _rec.follow_up||[])
          : [];
      results.treatments = _recList.map(function(t){
        return (t && typeof t==='object')
          ? Object.assign({}, t, {
              name: t.name || t.action || t.type || t.label,
              description: t.description || t.next_steps || t.details || t.rationale || t.note || ''
            })
          : { name:String(t), description:'' };
      });
    } catch(e) {
      console.warn('Fusion failed:', e);
    }
  }
  
  // Compute 3-axis BPS
  results.axes = computeAxes(bpsFeatures, state.objectiveData, state.eegData, state.hrvData);
  
  state.results = results;
  renderResults(results);

  // Phase D: persist this assessment to the per-patient history (IndexedDB
  // assessments store). Only saves if an active patient is set; otherwise the
  // result is in-memory only (state.results) and lost on navigation.
  _persistAssessment(results);
}

// Capture a snapshot of the current results as an assessment record and save
// it to patientStore.saveAssessment(). Best-effort — failures log to console.
function _persistAssessment(results) {
  if (!window.patientStore) return;
  const activeId = (sessionManager && sessionManager.activePatientId) || (window.patientStore.getActiveId && window.patientStore.getActiveId());
  if (!activeId) {
    console.info('[assessment] no active patient — skipping save (set an active patient in the Directory bar to enable history)');
    return;
  }
  const fp = results && results.fingerprint ? {
    top_3: (results.fingerprint.top_3 || []).map(r => ({
      diagnosis_id: r.diagnosis_id, name: r.name, name_ko: r.name_ko,
      similarity: r.similarity, match_label: r.match_label,
      confidence: r.confidence, fingerprint_confidence: r.fingerprint_confidence
    })),
    measured_features: (results.fingerprint.measured_features || []).length,
    feature_coverage: results.fingerprint.feature_coverage || 0,
    low_confidence: !!results.fingerprint.low_confidence
  } : null;
  const fusion = (results && results.diagnoses ? results.diagnoses.slice(0, 5) : []).map(d => ({
    diagnosis_id: d.diagnosis_id, diagnosis: d.diagnosis,
    name: d.name, name_ko: d.name_ko, diagnosis_ko: d.diagnosis_ko,
    probability: d.probability, score: d.score
  }));
  const topDxForNF = (fp && fp.top_3 && fp.top_3[0]) ? fp.top_3[0].diagnosis_id : (fusion[0] && (fusion[0].diagnosis_id || fusion[0].diagnosis));
  let nfProto = null;
  try { if (topDxForNF && typeof getNFProtocol === 'function') nfProto = { diagnosis_id: topDxForNF, protocol: getNFProtocol(topDxForNF) }; } catch(e){}

  // EO/EC alpha attenuation at posterior channels (Pz, O1, O2)
  let eoEc = null;
  if (state.eegEO && state.eegEC) {
    eoEc = {};
    ['Pz', 'O1', 'O2'].forEach(ch => {
      const eo = state.eegEO.qeegData[ch], ec = state.eegEC.qeegData[ch];
      if (eo && ec && ec.alpha > 0) {
        eoEc[ch] = +(((ec.alpha - eo.alpha) / ec.alpha) * 100).toFixed(1);
      }
    });
    if (Object.keys(eoEc).length === 0) eoEc = null;
  }

  const assessment = {
    assessment_id: 'asm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    patient_id: activeId,
    assessment_date: new Date().toISOString(),
    fingerprint: fp,
    fusion: fusion,
    coverage: {
      modules: state.selectedModules ? state.selectedModules.size : 0,
      total_responses: results.totalResponses || 0
    },
    eo_ec_attenuation: eoEc,
    nf_protocol: nfProto,
    eeg_source: state.eegSource || null,
    notes: ''
  };
  window.patientStore.saveAssessment(assessment).then(() => {
    console.info('[assessment] saved', assessment.assessment_id, 'for patient', activeId);
  }).catch(e => console.warn('[assessment] save failed:', e));
}

// ============================================================================
// FINGERPRINT — Symptom score extraction from module results
// ============================================================================
// Maps EMBEDDED_MODULES module_id → fingerprint symptom feature
// Confirmed module IDs (from EMBEDDED_MODULES keys):
//   mood_catcher_9       → depression_score
//   anxi_catcher_7       → anxiety_score
//   trauma_catcher_20    → ptsd_score
//   attend_catcher_18    → attention_score
//   insomnia_catcher_8   → sleep_quality
function extractSymptomScoresFromModules(mods) {
  if (!mods || mods.length === 0) return {};
  const map = {
    mood_catcher_9:     'depression_score',
    anxi_catcher_7:     'anxiety_score',
    trauma_catcher_20:  'ptsd_score',
    attend_catcher_18:  'attention_score',
    insomnia_catcher_8: 'sleep_quality'
  };
  const out = {};
  mods.forEach(m => {
    const key = map[m.module_id];
    if (!key) return;
    const total = m.total_score !== undefined ? m.total_score
                : (m.scoring && m.scoring.total) !== undefined ? m.scoring.total
                : null;
    if (total !== null && total !== undefined) out[key] = total;
  });
  return out;
}

function computeAxes(bpsFeats, objData, eegData, hrvData) {
  // Simplified BPS axis calculation inspired by ADHD Catcher
  const attn = bpsFeats.bps_attention || 0;
  const hyp = bpsFeats.bps_hyperactivity || 0;
  const sleep = bpsFeats.sleep_quality || 50;
  const emo = bpsFeats.emotional_regulation || 50;
  // Use parsed HRV RMSSD if available, fallback to manual input
  const rmssd = (hrvData && hrvData.rmssd_ms) || objData.hrv_rmssd;
  
  const bio = Math.round(
    (sleep * 0.4) +
    (rmssd ? Math.min(100, rmssd * 2) * 0.4 : 40) +
    (20) // baseline
  );
  const psycho = Math.round(
    (100 - attn) * 0.3 +
    (100 - hyp) * 0.25 +
    emo * 0.3 +
    (15) // baseline
  );
  const social = Math.round(
    emo * 0.4 +
    (100 - hyp) * 0.3 +
    (30) // baseline
  );
  
  return {
    Bio: Math.max(0, Math.min(100, bio)),
    Psycho: Math.max(0, Math.min(100, psycho)),
    Social: Math.max(0, Math.min(100, social))
  };
}

// ============================================================================
// RENDER RESULTS
// ============================================================================
function renderResults(r) {
  console.log('[renderResults] Rendering with data:', r);
  const c = document.getElementById('results-container');
  if (!c) { console.error('No results-container!'); return; }
  const dxColors = ['#EF4444','#F59E0B','#CC7A55','#3B82F6','#10B981'];
  
  let html = '';
  
  // Patient info
  html += `<div class="form-section" style="background:linear-gradient(135deg,#FFF8F3,#F8E8D8);border-left-color:#CC7A55">
    <div class="form-section-title">👤 <span class="ko-text">환자 정보</span><span class="en-text">Patient</span></div>
    <p><strong>${r.patient.name || '(anonymous)'}</strong> · ${r.patient.age}y · ${(r.patient.gender || r.patient.sex) || (state.lang==='ko'?'미상':'—')} · ID: ${r.patient.id || '—'}</p>
    ${r.patient.chiefComplaint ? `<p style="margin-top:6px;font-size:0.88em;color:#6B7280"><strong>${state.lang==='ko'?'주호소':'Chief Complaint'}:</strong> ${r.patient.chiefComplaint}</p>` : ''}
  </div>`;
  
  // 3-axis BPS
  if (r.axes) {
    html += `<div class="form-section">
      <div class="form-section-title">🌱 <span class="ko-text">Bio-Psycho-Social 분석</span><span class="en-text">Bio-Psycho-Social Analysis</span></div>
      <div class="axis-scores">
        <div class="axis-score-card bio">
          <div class="axis-label">🧬 Bio</div>
          <div class="axis-value">${r.axes.Bio}<span class="axis-unit">/100</span></div>
        </div>
        <div class="axis-score-card psycho">
          <div class="axis-label">🧠 Psycho</div>
          <div class="axis-value">${r.axes.Psycho}<span class="axis-unit">/100</span></div>
        </div>
        <div class="axis-score-card social">
          <div class="axis-label">👥 Social</div>
          <div class="axis-value">${r.axes.Social}<span class="axis-unit">/100</span></div>
        </div>
      </div>
    </div>`;
  }
  
  // Brain Topographic (if QEEG data or EEG upload)
  if (r.eegZScores && Object.keys(r.eegZScores).length > 0) {
    html += renderBrainTopoFromRealData(r.eegZScores);
  } else if (Object.keys(r.objectiveData).some(k => k.startsWith('theta_') || k.startsWith('frontal_') || k.startsWith('posterior_'))) {
    html += renderBrainTopo(r.objectiveData);
  }
  
  // Module-level scores (ALWAYS show, even if fusion fails)
  if (r.modulesAnalyzed && r.modulesAnalyzed.length > 0) {
    html += `<div class="form-section">
      <div class="form-section-title">📊 <span class="ko-text">모듈별 점수</span><span class="en-text">Module Scores</span></div>`;
    r.modulesAnalyzed.forEach(m => {
      const score = m.total_score !== undefined ? m.total_score : (m.scoring && m.scoring.total) || 0;
      const maxScore = m.max_score !== undefined ? m.max_score : (m.scoring && m.scoring.max) || 100;
      const pct = m.percentage !== undefined ? m.percentage : Math.round(score / maxScore * 100);
      // Severity color
      let sevColor = '#10B981'; // green
      if (pct >= 70) sevColor = '#EF4444'; // red
      else if (pct >= 50) sevColor = '#F59E0B'; // orange
      else if (pct >= 30) sevColor = '#FCD34D'; // yellow
      const sevLabel = m.severity_label || (pct >= 70 ? '심각' : pct >= 50 ? '중등도' : pct >= 30 ? '경증' : '정상');
      html += `<div style="background:white;padding:12px 16px;border-radius:10px;margin-bottom:8px;border-left:4px solid ${sevColor}">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <strong>${state.lang==='ko' ? (m.module_name_ko || m.module_name) : m.module_name}</strong>
            <span style="color:#6B7280;font-size:0.85em;margin-left:8px">· ${score}/${maxScore}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:1.2em;font-weight:900;color:${sevColor}">${pct}%</span>
            <span style="background:${sevColor};color:white;padding:3px 10px;border-radius:100px;font-size:0.78em;font-weight:700">${sevLabel}</span>
          </div>
        </div>
        ${m.clinical_impression ? `<p style="margin-top:6px;font-size:0.88em;color:#4B5563">${m.clinical_impression}</p>` : ''}
      </div>`;
    });
    html += `</div>`;
  }
  
  // Module scores (per-module interpretation)
  if (r.moduleScores && Object.keys(r.moduleScores).length > 0) {
    html += `<div class="form-section">
      <div class="form-section-title">📊 <span class="ko-text">모듈별 점수</span><span class="en-text">Module Scores</span></div>`;
    Object.keys(r.moduleScores).forEach(mid => {
      const ms = r.moduleScores[mid];
      const mod = EMBEDDED_MODULES[mid];
      if (!mod) return;
      const name = mod._meta.display_name_ko || mod._meta.display_name;
      const color = ms.level_info && ms.level_info.color ? ms.level_info.color : '#CC7A55';
      const levelKo = ms.level_info && ms.level_info.level_ko ? ms.level_info.level_ko : '';
      const levelEn = ms.level_info && ms.level_info.level ? ms.level_info.level.replace(/_/g, ' ') : '';
      html += `<div class="diagnosis-card" style="--dx-color:${color}">
        <span class="diagnosis-name">${name}</span>
        <span class="diagnosis-prob" style="color:${color}">${ms.total_score}<span style="font-size:0.6em;color:#6B7280;font-weight:500">/${ms.total_items * 4}</span></span>
        <div class="diagnosis-detail">
          <span style="color:${color};font-weight:700">
            <span class="ko-text">${levelKo}</span>
            <span class="en-text">${levelEn}</span>
          </span>
          · ${ms.items_answered}/${ms.total_items} ${state.lang === 'ko' ? '문항 응답' : 'answered'}
        </div>
      </div>
      ${renderModuleNarrativePanel(mid, ms.level, color)}`;
    });
    html += `</div>`;
  }
  
  // EEG upload summary
  if (r.eegQeegData) {
    const chs = Object.keys(r.eegQeegData);
    html += `<div class="form-section" style="border-left-color:#993C1D">
      <div class="form-section-title">🧠 <span class="ko-text">QEEG 분석 (파일 업로드)</span><span class="en-text">QEEG Analysis (from file)</span></div>
      <div style="font-size:0.9em;color:#4B5563">
        ✅ ${state.lang === 'ko' ? '채널' : 'Channels'}: ${chs.length}/19 · ${state.eegSource || ''}
      </div>
      ${renderQEEGTable(r.eegQeegData, r.eegZScores)}
    </div>`;
  }
  
  // Diagnoses
  if (r.diagnoses && r.diagnoses.length > 0) {
    html += `<div class="form-section">
      <div class="form-section-title">🎯 <span class="ko-text">진단 순위</span><span class="en-text">Diagnosis Ranking</span></div>`;
    r.diagnoses.slice(0,5).forEach((d,i) => {
      const color = dxColors[i % dxColors.length];
      const dxId = d.diagnosis_id || d.diagnosis || (d.name || '').toLowerCase().replace(/\s+/g, '_');
      const isKo = state.lang === 'ko';
      const dxName = isKo
        ? (d.diagnosis_ko || d.name_ko || d.name || d.diagnosis_id)
        : (d.name || d.diagnosis_id);
      html += `<div class="diagnosis-card" style="--dx-color:${color}">
        <span class="diagnosis-rank">${i+1}</span>
        <span class="diagnosis-name">${dxName}</span>
        <span class="diagnosis-prob">${Math.round((d.probability || d.score || 0) * 100)}%</span>
        ${d.explanation ? `<div class="diagnosis-detail">${d.explanation}</div>` : ''}
      </div>
      ${renderDiagnosisNarrativePanel(dxId, null, color)}`;
    });
    html += `</div>`;
  } else {
    html += `<div class="info-box"><span class="ko-text">진단 분석에 충분한 데이터가 없습니다. 더 많은 모듈을 선택하거나 설문을 완료해주세요.</span><span class="en-text">Insufficient data for diagnosis. Select more modules or complete survey.</span></div>`;
  }

  // === Fingerprint matching results (parallel to Fusion) ===
  if (r.fingerprint && r.fingerprint.top_3 && r.fingerprint.top_3.length > 0) {
    const fp = r.fingerprint;
    const coveragePct = Math.round((fp.feature_coverage || 0) * 100);
    const thresholdPct = Math.round((fp.min_coverage_threshold || 0.5) * 100);
    const lowConf = !!fp.low_confidence;
    const isKo = state.lang === 'ko';
    html += `<div class="form-section" style="border-left-color:#993C1D">
      <div class="form-section-title">🧬 <span class="ko-text">패턴 지문 매칭 (Multi-modal)</span><span class="en-text">Pattern Fingerprint Matching</span></div>
      <p style="font-size:0.85em;color:#6B7280;margin-bottom:10px">
        <span class="ko-text">측정된 feature: ${fp.measured_features.length} · 커버리지: ${coveragePct}%</span>
        <span class="en-text">Measured features: ${fp.measured_features.length} · Coverage: ${coveragePct}%</span>
      </p>`;

    // Bug 5: prominent warning when coverage below threshold — engine output is
    // statistically meaningless and must not be presented as a diagnostic ranking.
    if (lowConf) {
      html += `<div style="background:#FEE2E2;border:2px solid #DC2626;border-left-width:6px;border-radius:10px;padding:14px 16px;margin-bottom:14px;color:#7F1D1D">
        <div style="font-weight:800;font-size:1.0em;margin-bottom:6px">${isKo ? '⚠️ 데이터 부족 — 진단 신뢰도 낮음' : '⚠️ Insufficient data — diagnostic confidence is low'}</div>
        <div style="font-size:0.88em;line-height:1.55">
          ${isKo
            ? `현재 측정된 feature가 진단 모델의 <strong>${coveragePct}%</strong>밖에 되지 않습니다 (임계: ${thresholdPct}%). 아래 매칭 결과는 통계적으로 유의미하지 않으며 — 진단 결정에 사용하면 안 됩니다. 객관 데이터 추가 측정 필요:<br>
            • QEEG 19채널 (theta/beta, alpha peak, FAA)<br>
            • HRV 24h (RMSSD, SDNN)<br>
            • ERP P300 (amplitude, latency)<br>
            • CPT (Conners)`
            : `Only <strong>${coveragePct}%</strong> of the fingerprint feature space is measured (threshold: ${thresholdPct}%). The matches below are <strong>not statistically meaningful</strong> and must <strong>not</strong> be used for diagnostic decisions. Additional objective measurement required:<br>
            • 19-channel QEEG (theta/beta, alpha peak, FAA)<br>
            • HRV 24h (RMSSD, SDNN)<br>
            • ERP P300 (amplitude, latency)<br>
            • CPT (Conners)`}
        </div>
      </div>`;
    }

    // Render matches. When low-confidence, gray them out and collapse the
    // narrative panel so the warning above is the visible signal.
    fp.top_3.forEach((rank, i) => {
      const simPct = Math.round((rank.similarity || 0) * 100);
      let labelColor = '#9CA3AF';
      if (rank.match_label === 'Strong Match')       labelColor = '#10B981';
      else if (rank.match_label === 'Moderate Match') labelColor = '#F59E0B';
      else if (rank.match_label === 'Weak Match')     labelColor = '#FCD34D';
      // Mute palette when low confidence
      const displayColor = lowConf ? '#9CA3AF' : labelColor;
      const name = isKo ? (rank.name_ko || rank.name) : rank.name;
      const matchLabelI18n = _matchLabelI18n(rank.match_label);
      html += `<div class="diagnosis-card" style="--dx-color:${displayColor};${lowConf ? 'opacity:0.65;' : ''}">
        <span class="diagnosis-rank">${i+1}</span>
        <span class="diagnosis-name">${name}</span>
        <span class="diagnosis-prob" style="color:${displayColor}">${simPct}%</span>
        <div class="diagnosis-detail">
          <span style="background:${displayColor};color:white;padding:2px 8px;border-radius:100px;font-size:0.78em;font-weight:700">${matchLabelI18n}</span>
          ${rank.confidence ? ` · ${isKo ? '근거 신뢰도' : 'Evidence confidence'}: ${rank.fingerprint_confidence || rank.confidence}` : ''}
          ${rank.evidence ? `<div style="margin-top:4px;font-size:0.82em;color:#6B7280">${rank.evidence}</div>` : ''}
        </div>
      </div>
      ${lowConf ? '' : renderDiagnosisNarrativePanel(rank.diagnosis_id, rank.match_label, labelColor)}`;
    });
    html += `</div>`;
  }

  // === Consensus Diagnosis — appears in BOTH Fusion top-3 AND Fingerprint top-3 ===
  if (r.diagnoses && r.diagnoses.length > 0 && r.fingerprint && r.fingerprint.top_3 && r.fingerprint.top_3.length > 0) {
    const fusionTop3 = r.diagnoses.slice(0, 3).map(d => (d.diagnosis || d.diagnosis_id || d.name || '').toLowerCase());
    const consensus = [];
    r.fingerprint.top_3.forEach(fpDx => {
      const fpId = (fpDx.diagnosis_id || '').toLowerCase();
      // Match by diagnosis_id substring or exact match (fusion uses keys like 'mdd', fingerprint uses 'mdd' too)
      const fusionMatch = fusionTop3.find(fid => fid === fpId || fid.includes(fpId) || fpId.includes(fid));
      if (fusionMatch) {
        const fusionRank = r.diagnoses.find(d => {
          const did = (d.diagnosis || d.diagnosis_id || d.name || '').toLowerCase();
          return did === fpId || did.includes(fpId) || fpId.includes(did);
        });
        consensus.push({
          name: state.lang === 'ko' ? (fpDx.name_ko || fpDx.name) : fpDx.name,
          fp_similarity: Math.round((fpDx.similarity || 0) * 100),
          fp_label: fpDx.match_label,
          fusion_prob: Math.round(((fusionRank && (fusionRank.probability || fusionRank.score)) || 0) * 100)
        });
      }
    });
    if (consensus.length > 0) {
      html += `<div class="form-section" style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-left-color:#059669;border:2px solid #10B981">
        <div class="form-section-title">⭐ <span class="ko-text">합의 진단 (두 엔진 일치)</span><span class="en-text">Consensus Diagnosis (Both Engines Agree)</span></div>
        <p style="font-size:0.85em;color:#065F46;margin-bottom:10px">
          <span class="ko-text">Fusion(Bayesian)과 Fingerprint(패턴 유사도) 두 엔진의 상위 3위에 모두 포함된 진단입니다. 진단 신뢰도가 높습니다.</span>
          <span class="en-text">Diagnoses appearing in top-3 of both Fusion (Bayesian) and Fingerprint (pattern similarity). High diagnostic confidence.</span>
        </p>`;
      consensus.forEach(cx => {
        html += `<div style="background:white;padding:12px 16px;border-radius:10px;margin-bottom:8px;border-left:4px solid #059669">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <strong style="color:#065F46">${cx.name}</strong>
            <div style="display:flex;gap:8px;font-size:0.85em">
              <span style="background:#CC7A55;color:white;padding:3px 10px;border-radius:100px;font-weight:700">Fusion ${cx.fusion_prob}%</span>
              <span style="background:#993C1D;color:white;padding:3px 10px;border-radius:100px;font-weight:700">Fingerprint ${cx.fp_similarity}% · ${cx.fp_label}</span>
            </div>
          </div>
        </div>`;
      });
      html += `</div>`;
    }
  }

  // Comorbidities
  if (r.comorbidities && r.comorbidities.length > 0) {
    html += `<div class="form-section" style="border-left-color:#F59E0B">
      <div class="form-section-title">🔗 <span class="ko-text">공존 질환</span><span class="en-text">Comorbidities</span></div>`;
    r.comorbidities.forEach(c => {
      html += `<p>• ${c.pair || (c.dx1 + ' + ' + c.dx2)}: ${Math.round((c.confidence||0)*100)}%</p>`;
    });
    html += `</div>`;
  }
  
  // Treatment recommendations
  if (r.treatments && r.treatments.length > 0) {
    html += `<div class="form-section" style="border-left-color:#10B981">
      <div class="form-section-title">💊 <span class="ko-text">치료 권고</span><span class="en-text">Treatment Recommendations</span></div>`;
    r.treatments.forEach(t => {
      html += `<p>• <strong>${t.name || t.type}</strong>: ${t.description || t.rationale || ''}</p>`;
    });
    html += `</div>`;
  }
  
  // (AI 심층분석은 별도 AI분석 탭[tab-s-ai]에서 실행)

  c.innerHTML = html;
}

// ============================================================================
// AI DEEP ANALYSIS  (premium — C-① scaffold: login/subscription gate placeholder)
// 무료 도식 결과(위 11섹션) 뒤에 얹는 프리미엄 존. C-②에서 실제 로그인 토큰 게이트 +
// AI 종합 호출(learning qeeg-cna 패턴: 캐시-우선/미스만 유료)로 교체.
// ============================================================================
function aiDeepUnlocked() {
  // 결제 게이트 자리 — 오픈 단계에선 미사용(실행은 requestAIDeepUnlock이 바로 호출).
  // modality 완료 후 결제 붙일 때 여기에 구독/SUPER 검증 연결.
  return !!window.BNM_AI_DEEP_UNLOCKED;
}

// state.results → symptom-ai-deep EF payload (클라↔EF 계약)
window.saveAiPdf=function(){ if(window.savePDF) savePDF('ai-deep-body','symptom_ai_report.pdf'); };
function buildAiPayload(r){
  return {
    lang: state.lang,
    patient: { age:r.patient.age, sex:(r.patient.gender||r.patient.sex||''), handedness:r.patient.handedness },
    tier1_survey: {
      modules: (r.modulesAnalyzed||[]).map(function(m){ return {
        id:m.module_id, name:m.module_name, name_ko:m.module_name_ko,
        score:(m.scoring&&m.scoring.total), max:(m.scoring&&m.scoring.max), level:(m.scoring&&m.scoring.level),
        diagnostic_likelihood:(m.integration&&m.integration.diagnostic_likelihood),
        dominant_subscale:(m.lenses&&m.lenses.lens5&&m.lenses.lens5.dominant_subscale&&m.lenses.lens5.dominant_subscale.name),
        safety:(m.safety&&m.safety.overall_safe)
      };}),
      diagnoses: (r.diagnoses||[]).slice(0,5).map(function(d){ return { name:d.name, name_ko:d.name_ko, posterior:d.probability, confidence:d.confidence, rank:d.rank };}),
      comorbidities: (r.comorbidities||[]).map(function(c){ return { dx1:c.dx1, dx2:c.dx2, note:c.clinical_note };}),
      bps_axes: r.axes
    },
    tier2_qeeg: (r.eegQeegData || state.eegQeegData) ? { present:true, zscores:(r.eegZScores||state.eegZScores||null) } : { present:false },
    fingerprint: (r.fingerprint&&r.fingerprint.top_3) ? { top_3:r.fingerprint.top_3.slice(0,3) } : null,
    // AI depth by access tier: paid (BNM_AI_DEEP_UNLOCKED) gets deeper output; free keeps the
    // current EF-default level (no regression). EF clamps to 8000; model stays EF default.
    max_tokens: (typeof aiDeepUnlocked === 'function' && aiDeepUnlocked()) ? 8000 : 6000
  };
}

// 경량 마크다운 → HTML
function _aiInline(s){ return String(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>'); }
function _aiMd(md){
  if(!md) return '';
  var lines=String(md).split(/\n/), html='', ul=[];
  function flush(){ if(ul.length){ html+='<ul style="margin:4px 0;padding-left:20px">'+ul.join('')+'</ul>'; ul=[]; } }
  function _cells(row){ return row.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(function(c){return c.trim();}); }
  for(var i=0;i<lines.length;i++){
    var t=lines[i].trim();
    // GitHub-style table: |head| row, then a |---| separator, then data rows.
    if(/^\|.*\|$/.test(t) && i+1<lines.length && /^\|[\s:|-]+\|$/.test(lines[i+1].trim())){
      flush();
      var head=_cells(t);
      html+='<table style="width:100%;border-collapse:collapse;font-size:0.9em;margin:8px 0"><thead><tr>'+head.map(function(c){return '<th style="border:1px solid #E2E8F0;padding:6px 8px;background:#F5F0FA;text-align:left;font-weight:700">'+_aiInline(c)+'</th>';}).join('')+'</tr></thead><tbody>';
      i+=2;
      while(i<lines.length && /^\|.*\|$/.test(lines[i].trim())){
        html+='<tr>'+_cells(lines[i]).map(function(c){return '<td style="border:1px solid #E2E8F0;padding:6px 8px">'+_aiInline(c)+'</td>';}).join('')+'</tr>';
        i++;
      }
      i--;
      html+='</tbody></table>';
      continue;
    }
    if(!t){ flush(); continue; }
    if(/^#{1,6}\s/.test(t)){ flush(); html+='<h4 style="color:#6D28D9;margin:10px 0 4px">'+_aiInline(t.replace(/^#{1,6}\s/,''))+'</h4>'; }
    else if(/^[-*]\s/.test(t)){ ul.push('<li>'+_aiInline(t.replace(/^[-*]\s/,''))+'</li>'); }
    else { flush(); html+='<p style="margin:6px 0">'+_aiInline(t)+'</p>'; }
  }
  flush();
  return html;
}

// EF 응답(report) → HTML (개별 섹션 뿌리기)
function renderAiReport(rep, isKo){
  if(!rep) return '<p>'+(isKo?'분석 결과를 받지 못했습니다.':'No analysis returned.')+'</p>';
  var h=''; function sec(s){ if(!s) return ''; return '<div style="margin-top:12px"><div style="font-weight:800;color:#5B21B6">'+(s.title||'')+'</div>'+_aiMd(s.markdown)+'</div>'; }
  h+=sec(rep.tier1); if(rep.tier2) h+=sec(rep.tier2); if(rep.integrated) h+=sec(rep.integrated);
  if(rep.differential_considerations && rep.differential_considerations.length){
    h+='<div style="margin-top:12px"><div style="font-weight:800;color:#5B21B6">'+(isKo?'감별 고려 대상':'Differential considerations')+'</div><ul style="margin:4px 0;padding-left:20px">';
    rep.differential_considerations.forEach(function(d){ h+='<li>'+(isKo?(d.name_ko||d.name):d.name)+(d.note?' — '+d.note:'')+'</li>'; });
    h+='</ul></div>';
  }
  if(rep.strengths) h+='<div style="margin-top:12px"><div style="font-weight:800;color:#5B21B6">'+(isKo?'강점·자원':'Strengths & resources')+'</div>'+_aiMd(rep.strengths)+'</div>';
  if(rep.next_steps) h+='<div style="margin-top:12px"><div style="font-weight:800;color:#5B21B6">'+(isKo?'권장 다음 단계':'Recommended next steps')+'</div>'+_aiMd(rep.next_steps)+'</div>';
  if(rep.disclaimer) h+='<p style="margin-top:14px;font-size:0.82em;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:8px">'+rep.disclaimer+'</p>';
  return h;
}

// AI 심층 실행 (오픈: 인증 없이. SYMPTOM_AI_URL은 alex가 실 EF URL로 설정)
window.requestAIDeepUnlock = function(){
  var r=state.results;
  if(!r){ var _b=document.getElementById('ai-deep-result'); if(_b) _b.innerHTML='<p style="color:#6B7280">'+((state.lang==='ko')?'먼저 감별분석 탭에서 분석을 실행하세요.':'Run the differential first.')+'</p>'; return; }
  var box=document.getElementById('ai-deep-result'), btn=document.getElementById('ai-deep-btn'), isKo=(state.lang==='ko');
  if(box) box.innerHTML='<div style="height:8px;background:#EDE7F6;border-radius:100px;overflow:hidden"><div id="ai-prog-bar" style="width:4%;height:100%;background:linear-gradient(90deg,#7C3AED,#A78BFA);border-radius:100px;transition:width .7s ease"></div></div><p style="color:#6D28D9;font-size:0.85em;margin-top:8px">\u23F3 '+(isKo?'AI 심층 분석 생성 중\u2026 (약 2분 예상)':'Generating AI deep analysis\u2026 (~2 min)')+'</p>';
  if(btn){ btn.disabled=true; btn.style.opacity=0.5; }
  var _prog=4, _progInt=setInterval(function(){ var _pb=document.getElementById('ai-prog-bar'); if(!_pb){ clearInterval(_progInt); return; } _prog=Math.min(92,_prog+(_prog<55?1.1:0.45)); _pb.style.width=_prog+'%'; }, 1100);
  var url=window.SYMPTOM_AI_URL || '/functions/v1/symptom-ai-deep';
  var _h={'content-type':'application/json'};
  if(window.SEPIERA_ANON){ _h['apikey']=window.SEPIERA_ANON; _h['Authorization']='Bearer '+window.SEPIERA_ANON; }
  fetch(url,{method:'POST',headers:_h,body:JSON.stringify(buildAiPayload(r))})
    .then(function(res){return res.json();})
    .then(function(j){
      if(btn){ btn.disabled=false; btn.style.opacity=1; }
      if(j && j.ok && j.report){ box.innerHTML='<div id="ai-deep-body">'+renderAiReport(j.report,isKo)+(j.partial?'<p style="font-size:0.8em;color:#D97706;margin-top:8px">'+(isKo?'\u26A0 일부 섹션이 생략되었습니다.':'\u26A0 Some sections were truncated.')+'</p>':'')+'</div><div class="result-actions" style="margin-top:12px"><button class="save-btn" onclick="saveAiPdf()">📄 <span class="ko-text">PDF 저장</span><span class="en-text">Save PDF</span></button></div>';
        // [triage-save] 임상가 환자 연결 시 매칭 AI 저장(sepiera adhd_qeeg_results dept='symptom'). 익명=client_id 없으면 no-op. AI 실행 로직 무접촉.
        try{ var _tcid=(state&&state.patient&&state.patient.client_id)||null; if(_tcid&&window.ADHD_DB&&ADHD_DB.saveQeegResult){ ADHD_DB.saveQeegResult({ client_id:_tcid, dept:'symptom', ai_deep:JSON.stringify(j.report), source_meta:JSON.stringify(state.results||null), ai_lang:state.lang }).catch(function(){}); } }catch(e){}
      }
      else { box.innerHTML='<p style="color:#DC2626">'+(isKo?'분석 실패: ':'Analysis failed: ')+((j&&j.error)||'unknown')+'</p>'; }
    })
    .catch(function(e){ if(btn){btn.disabled=false;btn.style.opacity=1;} if(box) box.innerHTML='<p style="color:#DC2626">'+(isKo?'네트워크 오류: ':'Network error: ')+e.message+'</p>'; });
};

function renderAIDeepSection(r){
  // 오픈 단계: 인증/결제 없이 실행 버튼 + 결과 컨테이너. (결제 게이트는 aiDeepUnlocked 훅에 나중 부착)
  return '<div class="form-section" style="border-left-color:#7C3AED;background:linear-gradient(135deg,#FAF5FF,#F3E8FF)">' +
    '<div class="form-section-title">\uD83E\uDD16 <span class="ko-text">AI 심층 분석</span><span class="en-text">AI Deep Analysis</span></div>' +
    '<p style="font-size:0.9em;color:#6B21A8;margin-bottom:10px">' +
      '<span class="ko-text">위 도식은 즉시 산출됩니다. AI 심층 분석은 설문\u00B7(QEEG) 패턴을 하나의 참고용 해석으로 종합합니다.</span>' +
      '<span class="en-text">The panels above are instant. AI deep analysis synthesizes survey\u00B7(QEEG) patterns into one reference-level interpretation.</span>' +
    '</p>' +
    '<button id="ai-deep-btn" onclick="requestAIDeepUnlock()" style="background:#7C3AED;color:white;border:none;padding:10px 20px;border-radius:100px;font-weight:700;cursor:pointer">' +
      '\u2728 <span class="ko-text">AI 심층 분석 실행</span><span class="en-text">Run AI Deep Analysis</span>' +
    '</button>' +
    '<div id="ai-deep-result" style="margin-top:14px"></div>' +
    '</div>';
}

/* fingerprint async bootstrap (복원) */
let _fingerprintReady = false;
(async function initFingerprint() {
  if (typeof FingerprintEngine === 'undefined') return;
  try {
    const [fpRes, hpRes] = await Promise.all([
      fetch('data/diagnostic_fingerprints.json'),
      fetch('data/healthy_population_db.json')
    ]);
    if (!fpRes.ok || !hpRes.ok) throw new Error('fetch status: ' + fpRes.status + '/' + hpRes.status);
    const fpData = await fpRes.json();
    const hpData = await hpRes.json();
    FingerprintEngine.init(fpData, hpData);
    _fingerprintReady = true;
    console.log('✅ FingerprintEngine ready:', fpData.fingerprints.length, 'diagnoses');
  } catch (e) {
    console.warn('FingerprintEngine init failed (likely file:// or missing data):', e);
  }
})();

function scStartDifferential(){
  if(typeof switchSymptomTab==='function') switchSymptomTab('s-re');
  if(!state.responses || Object.keys(state.responses).length===0){
    var c=document.getElementById('results-container');
    if(c) c.innerHTML='<div class="survey-empty"><span class="ko-text">먼저 설문을 완료하세요.</span><span class="en-text">Complete the survey first.</span></div>';
    return;
  }
  try{ computeResults(); }
  catch(e){ console.error('[computeResults]',e); var c2=document.getElementById('results-container'); if(c2) c2.innerHTML='<div class="survey-empty">분석 오류 / analysis error: '+(e&&e.message)+'</div>'; }
}

/* ===== public API bridge =============================================== */
window.toggleModule    = toggleModule;
window.showModuleInfo  = showModuleInfo;
window.jumpToCategory  = jumpToCategory;
window.selectCategory  = selectCategory;
window.applyPreset     = applyPreset;
window.removeModule    = removeModule;
window.clearAllModules = clearAllModules;
window.scRenderModuleGrid = function () { renderCategories(); };
window.scStartSurvey  = scStartSurvey;
window.prepareSurvey  = prepareSurvey;
window.answerQ        = answerQ;
window.nextQuestion   = nextQuestion;
window.prevQuestion   = prevQuestion;
window.scStartDifferential = scStartDifferential;
window.buildAiPayload = buildAiPayload;
window.renderAiReport = renderAiReport;
window.computeResults = computeResults;

})();
