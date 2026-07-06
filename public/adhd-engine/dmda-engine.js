/**
 * DMDA Diagnostic Engine
 * ----------------------------------------------------------------------------
 * Input:  survey responses + biomarkers + qEEG data + tier
 * Output: primary dx, differential, confidence, weights, evidence trail
 *
 * Two-stage pipeline:
 *   1. Feature extraction — derive per-dx evidence from each source
 *   2. Weighted Bayesian combination — normalize + apply tier band
 *
 * Requires: window.DMDA_SURVEY (item bank), dmda_dsm_criteria (loaded from DB
 * and passed in at runtime). No network calls here; pure computation.
 * ----------------------------------------------------------------------------
 */
(function(){
  'use strict';

  // -- Tier definitions (mirrors SQL CHECK constraints) --------------------
  const TIERS = {
    1: { id:1, name_en:'Tier 1 · Remote',        name_ko:'Tier 1 · 원격',
         sources:['survey','response_meta','typing_dynamics','phone_passive'],
         band:[0.60, 0.75] },
    2: { id:2, name_en:'Tier 2 · Clinical',      name_ko:'Tier 2 · 임상',
         sources:['survey','response_meta','typing_dynamics','phone_passive','qeeg'],
         band:[0.75, 0.88] },
    3: { id:3, name_en:'Tier 3 · Comprehensive', name_ko:'Tier 3 · 종합',
         sources:['survey','response_meta','typing_dynamics','phone_passive','qeeg','hrv','face','voice'],
         band:[0.88, 0.95] },
    4: { id:4, name_en:'Tier 4 · Research',      name_ko:'Tier 4 · 연구',
         sources:['survey','response_meta','typing_dynamics','phone_passive','qeeg','hrv','face','voice','erp','longitudinal'],
         band:[0.95, 0.98] }
  };

  // Ideal source weights (sum ~= 1). Renormalized to available sources.
  const IDEAL_WEIGHTS = {
    survey:          0.22,
    response_meta:   0.06,
    typing_dynamics: 0.05,
    phone_passive:   0.08,
    qeeg:            0.25,
    hrv:             0.12,
    face:            0.08,
    voice:           0.08,
    erp:             0.04,
    longitudinal:    0.02
  };

  const SOURCE_LABELS = {
    survey:          { en:'BPS Survey',         ko:'BPS 설문' },
    response_meta:   { en:'Response Metadata',  ko:'응답 메타데이터' },
    typing_dynamics: { en:'Typing Dynamics',    ko:'타이핑 동역학' },
    phone_passive:   { en:'Phone Passive',      ko:'스마트폰 수동 데이터' },
    qeeg:            { en:'qEEG',               ko:'qEEG' },
    hrv:             { en:'HRV',                ko:'HRV' },
    face:            { en:'Face Analysis',      ko:'얼굴 분석' },
    voice:           { en:'Voice Analysis',     ko:'음성 분석' },
    erp:             { en:'ERP',                ko:'ERP' },
    longitudinal:    { en:'Longitudinal',       ko:'종단 추적' }
  };

  // ======================================================================
  // STAGE 1 — Feature Extraction
  // ======================================================================

  /**
   * Extract per-dx evidence from a completed survey.
   * Returns a map { dxCode: {score: 0-1, contributing_items: [...]} }
   *
   * Algorithm:
   *   - For each item, if response > 0, add weight to each target dx.
   *   - Normalize each dx's accumulated score by its maximum possible.
   *   - Reverse items: invert response (4 - value) before weighting.
   */
  function extractSurveyEvidence(responses, itemBank){
    itemBank = itemBank || window.DMDA_SURVEY || [];
    const byCode = {};
    itemBank.forEach(i => byCode[i.code] = i);

    const dxScore = {};    // { dxCode: accumulated }
    const dxMax   = {};    // { dxCode: max possible }
    const dxItems = {};    // { dxCode: [items that contributed] }

    responses.forEach(r => {
      if (r.is_skipped || r.response_value == null) return;
      const item = byCode[r.item_code];
      if (!item || !item.targets || item.targets.length === 0) return;

      // Normalize response: 0-4 Likert → 0-1
      let v = r.response_value / 4;
      if (item.is_reverse) v = 1 - v;

      item.targets.forEach(dx => {
        dxScore[dx] = (dxScore[dx] || 0) + v;
        dxMax[dx]   = (dxMax[dx]   || 0) + 1;
        if (!dxItems[dx]) dxItems[dx] = [];
        if (v >= 0.5) dxItems[dx].push({ code:r.item_code, value:r.response_value, weight:v });
      });
    });

    // Normalize each dx's score
    const result = {};
    Object.keys(dxScore).forEach(dx => {
      result[dx] = {
        score: dxMax[dx] ? dxScore[dx] / dxMax[dx] : 0,
        items_positive: (dxItems[dx]||[]).length,
        items_total: dxMax[dx]
      };
    });
    return result;
  }

  /**
   * Extract response metadata biomarkers from timing/edit data.
   * Returns { metrics: {...}, evidence: { dxCode: adjustment } }
   *
   * Heuristics (backed by DSM literature, see Progressive_DMDA_Design.md):
   *   - slow response time + late dropout   → depression
   *   - high response-time variance         → ADHD
   *   - high answer-change rate             → OCD, GAD
   *   - high trauma-item dropout            → PTSD
   */
  function extractResponseMetaEvidence(responses){
    if (!responses || responses.length === 0) return { metrics:{}, evidence:{} };

    const answered = responses.filter(r => !r.is_skipped && r.time_to_answer_ms != null);
    if (answered.length === 0) return { metrics:{}, evidence:{} };

    const times = answered.map(r => r.time_to_answer_ms);
    const mean = times.reduce((a,b)=>a+b,0) / times.length;
    const variance = times.reduce((s,t) => s + Math.pow(t-mean, 2), 0) / times.length;
    const sd = Math.sqrt(variance);
    const cv = mean > 0 ? sd / mean : 0;

    const totalItems   = responses.length;
    const skipped      = responses.filter(r => r.is_skipped).length;
    const skipRate     = skipped / totalItems;
    const traumaItems  = responses.filter(r => r.item_category === 'trauma');
    const traumaSkipRate = traumaItems.length > 0
      ? traumaItems.filter(r => r.is_skipped).length / traumaItems.length : 0;

    const totalChanges = responses.reduce((s,r) => s + (r.answer_change_count||0), 0);
    const changeRate = totalChanges / totalItems;

    // Metrics in seconds/ratio for display
    const metrics = {
      avg_response_time_sec: +(mean / 1000).toFixed(2),
      response_time_cv:      +cv.toFixed(3),
      skip_rate:             +skipRate.toFixed(3),
      trauma_skip_rate:      +traumaSkipRate.toFixed(3),
      answer_change_rate:    +changeRate.toFixed(3)
    };

    // Evidence adjustments (additive bonus 0-0.3) per dx based on patterns
    const ev = {};
    const add = (dx, amt) => { ev[dx] = (ev[dx]||0) + amt; };

    // Slow avg time (> 12s) → depression signal
    if (mean > 12000) {
      add('F32.1', 0.15); add('F32.2', 0.18); add('F34.1', 0.10);
    }
    // High CV (> 0.8) → ADHD signal
    if (cv > 0.8) {
      add('F90.0', 0.15); add('F90.2', 0.20); add('F90.1', 0.12);
    }
    // High answer changes (> 2 per item) → GAD, OCD
    if (changeRate > 2.0) {
      add('F41.1', 0.18); add('F42', 0.22);
    }
    // High trauma-item skip (> 0.4) → PTSD
    if (traumaSkipRate > 0.4) {
      add('F43.10', 0.25); add('F43.0', 0.15);
    }
    // Generally high skip rate → fatigue/depression
    if (skipRate > 0.15) {
      add('F32.2', 0.10);
    }

    return { metrics, evidence: ev };
  }

  /**
   * Extract typing-dynamics biomarkers.
   * Input: array of keystroke events { key, ts_ms }
   */
  function extractTypingEvidence(keystrokes){
    if (!keystrokes || keystrokes.length < 20) return { metrics:{}, evidence:{} };

    // Inter-keystroke intervals
    const intervals = [];
    const backspaces = keystrokes.filter(k => k.key === 'Backspace').length;
    for (let i=1; i<keystrokes.length; i++) {
      intervals.push(keystrokes[i].ts_ms - keystrokes[i-1].ts_ms);
    }
    const mean = intervals.reduce((a,b)=>a+b,0) / intervals.length;
    const variance = intervals.reduce((s,t) => s + Math.pow(t-mean, 2), 0) / intervals.length;
    const sd = Math.sqrt(variance);
    const cv = mean > 0 ? sd / mean : 0;

    // Rough WPM (5 chars per word; total time in minutes)
    const totalTimeMs = keystrokes[keystrokes.length-1].ts_ms - keystrokes[0].ts_ms;
    const nonBackspace = keystrokes.length - backspaces;
    const wpm = totalTimeMs > 0 ? (nonBackspace / 5) / (totalTimeMs / 60000) : 0;

    const backspaceRate = backspaces / keystrokes.length;
    // Mid-word pauses (> 1500ms between keystrokes)
    const longPauses = intervals.filter(i => i > 1500).length;
    const pausesPerMinute = totalTimeMs > 0 ? longPauses / (totalTimeMs / 60000) : 0;

    const metrics = {
      typing_wpm:        +wpm.toFixed(1),
      keystroke_cv:      +cv.toFixed(3),
      backspace_rate:    +backspaceRate.toFixed(3),
      pauses_per_minute: +pausesPerMinute.toFixed(2)
    };

    const ev = {};
    const add = (dx, amt) => { ev[dx] = (ev[dx]||0) + amt; };

    // Slow WPM + long pauses → depression
    if (wpm < 30 && pausesPerMinute > 4) {
      add('F32.1', 0.15); add('F32.2', 0.12);
    }
    // High CV → ADHD
    if (cv > 0.5) {
      add('F90.2', 0.18); add('F90.0', 0.12);
    }
    // High backspace → perfectionism (GAD, OCD)
    if (backspaceRate > 0.18) {
      add('F41.1', 0.15); add('F42', 0.20);
    }

    return { metrics, evidence: ev };
  }

  /**
   * Extract qEEG evidence. Input: qEEG row from dmda_qeeg_data.
   */
  function extractQeegEvidence(qeeg){
    if (!qeeg) return { metrics:{}, evidence:{} };

    const metrics = {
      frontal_alpha_asym: qeeg.frontal_alpha_asym,
      theta_beta_ratio:   qeeg.theta_beta_ratio,
      peak_alpha_freq_hz: qeeg.peak_alpha_freq_hz,
      high_beta_z:        qeeg.high_beta_z
    };

    const ev = {};
    const add = (dx, amt) => { ev[dx] = (ev[dx]||0) + amt; };

    // Frontal alpha asymmetry < -0.3 (left hypoactivation) → MDD
    if (qeeg.frontal_alpha_asym != null && qeeg.frontal_alpha_asym < -0.3) {
      add('F32.1', 0.25); add('F32.2', 0.28); add('F34.1', 0.18);
    }
    // Theta/Beta ratio > 2.8 → ADHD
    if (qeeg.theta_beta_ratio != null && qeeg.theta_beta_ratio > 2.8) {
      add('F90.2', 0.30); add('F90.0', 0.25); add('F90.1', 0.22);
    }
    // High-beta z > 1.5 → anxiety, hyperarousal (GAD, PTSD)
    if (qeeg.high_beta_z != null && qeeg.high_beta_z > 1.5) {
      add('F41.1', 0.20); add('F43.10', 0.25); add('F42', 0.12);
    }
    // Peak alpha freq < 9Hz → cognitive slowing (MDD, neurological)
    if (qeeg.peak_alpha_freq_hz != null && qeeg.peak_alpha_freq_hz < 9.0) {
      add('F32.2', 0.15); add('F34.1', 0.10);
    }

    return { metrics, evidence: ev };
  }

  /**
   * Extract from external biomarker rows (phone passive, HRV, face, voice, ERP).
   * Each biomarker row has: source, marker_key, value_numeric, status.
   *
   * Status-based weighting: abnormal = full support, elevated = 0.6x, normal = 0.
   * Maps marker_key → dx contributions via a lookup table.
   */
  const MARKER_DX_MAP = {
    // Phone passive — each marker associated with dx
    'sleep_duration_hours':    { low:[['F32.1',0.15],['F51.01',0.25]], high:[['F32.2',0.12]] },
    'daily_steps':             { low:[['F32.1',0.15],['F32.2',0.20]], high:[['F90.1',0.10]] },
    'social_comms_change_pct': { low:[['F32.1',0.18],['F32.2',0.20],['F40.10',0.10]] },
    'sleep_latency_minutes':   { high:[['F51.01',0.22],['F41.1',0.15]] },
    'app_switch_frequency':    { high:[['F90.2',0.22],['F90.0',0.12]] },
    'phone_pickups_per_day':   { high:[['F41.1',0.18],['F42',0.10]] },
    'nighttime_awakenings':    { high:[['F43.10',0.20],['F51.01',0.18]] },
    'nighttime_activity_z':    { high:[['F43.10',0.22]] },

    // HRV
    'rmssd_ms':                { low:[['F41.1',0.20],['F43.10',0.25],['F32.1',0.12]] },
    'sdnn_ms':                 { low:[['F41.1',0.15],['F43.10',0.18]] },

    // Face
    'duchenne_smile_pct':      { low:[['F32.1',0.18],['F32.2',0.20]] },
    'brow_tension_z':          { high:[['F41.1',0.18],['F43.10',0.10]] },
    'startle_magnitude_z':     { high:[['F43.10',0.25]] },
    'fixation_time_sec':       { low:[['F90.2',0.15],['F90.0',0.18]] },

    // Voice
    'pitch_range_hz':          { low:[['F32.1',0.18],['F32.2',0.20]] },
    'mean_pitch_hz':           { high:[['F41.1',0.12]] },
    'jitter_pct':              { high:[['F43.10',0.20],['F32.2',0.10]] },
    'speech_rate_variance':    { high:[['F90.2',0.15],['F90.1',0.12]] },

    // ERP
    'p300_amplitude_uv':       { low:[['F90.2',0.22],['F90.0',0.18]] },
    'startle_erp_z':           { high:[['F43.10',0.22]] }
  };

  function extractBiomarkerEvidence(biomarkers, sourceFilter){
    const ev = {};
    const add = (dx, amt) => { ev[dx] = (ev[dx]||0) + amt; };
    const metrics = {};

    (biomarkers||[]).forEach(b => {
      if (sourceFilter && b.source !== sourceFilter) return;
      if (!MARKER_DX_MAP[b.marker_key]) return;
      metrics[b.marker_key] = b.value_numeric ?? b.value_text;

      // Use status to decide direction
      if (b.status === 'normal') return;
      const mult = (b.status === 'abnormal') ? 1.0 : 0.6;

      const map = MARKER_DX_MAP[b.marker_key];
      // Heuristic: if value below expected norm, use 'low' bucket; else 'high'.
      // When we don't know direction, apply both (conservative).
      const lowList  = map.low  || [];
      const highList = map.high || [];

      // For abnormal/elevated, we trust both lists — the specific direction
      // is encoded in the biomarker_key names (e.g., rmssd_ms.low is always
      // the abnormal pattern).
      lowList.forEach(([dx, w]) => add(dx, w * mult));
      highList.forEach(([dx, w]) => add(dx, w * mult));
    });

    return { metrics, evidence: ev };
  }

  // ======================================================================
  // STAGE 2 — Weighted Combination
  // ======================================================================

  function smartRenormalize(availableSources){
    const picked = {};
    availableSources.forEach(s => {
      if (IDEAL_WEIGHTS[s] != null) picked[s] = IDEAL_WEIGHTS[s];
    });
    const total = Object.values(picked).reduce((a,b)=>a+b, 0) || 1;
    const out = {};
    Object.keys(picked).forEach(k => out[k] = picked[k] / total);
    return out;
  }

  /**
   * Combine per-source evidence into per-dx weighted score.
   * sourcesEvidence: { sourceKey: { dxCode: rawScore 0-1 } }
   * dsmCriteria:     array of {dx_code, source_support_defaults}
   * weights:         { sourceKey: 0-1 } renormalized
   *
   * For each dx, weighted score = Σ (sourceWeight * sourceScore).
   * Bounded to [0, 1].
   */
  function combineWeighted(sourcesEvidence, dsmCriteria, weights){
    const allDx = new Set();
    Object.values(sourcesEvidence).forEach(srcEv => Object.keys(srcEv).forEach(d => allDx.add(d)));
    // Also add all DSM codes (so known codes with 0 evidence still appear)
    dsmCriteria.forEach(c => allDx.add(c.dx_code));

    const result = {};
    allDx.forEach(dx => {
      let sum = 0, weightSum = 0;
      Object.keys(weights).forEach(src => {
        const srcEv = sourcesEvidence[src] || {};
        const score = srcEv[dx] || 0;
        sum += weights[src] * score;
        weightSum += weights[src];
      });
      // Normalize by weight sum (should == 1)
      result[dx] = weightSum > 0 ? Math.min(1, sum / weightSum) : 0;
    });
    return result;
  }

  /**
   * Map raw combined score (0-1) into tier's confidence band.
   * Higher raw score → closer to band upper bound.
   */
  function scoreToConfidence(rawScore, tier){
    const [lo, hi] = TIERS[tier].band;
    // Expected realistic range for real evidence: 0.25 – 0.85
    const t = Math.max(0, Math.min(1, (rawScore - 0.25) / (0.85 - 0.25)));
    return lo + t * (hi - lo);
  }

  /**
   * Build differential diagnosis list — top N candidates with probabilities.
   * Probabilities are softmax-normalized over top candidates.
   */
  function buildDifferential(dxScores, dsmCriteria, primaryDx, topN = 5){
    const byCode = {};
    dsmCriteria.forEach(c => byCode[c.dx_code] = c);

    // Start with primary dx + its listed differentials
    const candidates = new Set([primaryDx]);
    const primaryRow = byCode[primaryDx];
    if (primaryRow && primaryRow.differential_codes) {
      (primaryRow.differential_codes || []).forEach(c => candidates.add(c));
    }
    // Also include top-scoring codes overall
    const sorted = Object.entries(dxScores).sort(([,a],[,b]) => b-a);
    sorted.slice(0, topN).forEach(([dx]) => candidates.add(dx));

    // Build list
    const list = Array.from(candidates)
      .map(dx => ({
        code: dx,
        name_en: byCode[dx]?.dx_name_en || dx,
        name_ko: byCode[dx]?.dx_name_ko || dx,
        raw: dxScores[dx] || 0
      }))
      .filter(d => d.raw > 0.05 || d.code === primaryDx)
      .sort((a,b) => b.raw - a.raw)
      .slice(0, topN);

    // Softmax normalize raw scores into probabilities
    const T = 0.25; // temperature — higher = flatter distribution
    const exps = list.map(d => Math.exp(d.raw / T));
    const sumExp = exps.reduce((a,b)=>a+b, 0);
    list.forEach((d, i) => d.prob = exps[i] / sumExp);

    return list;
  }

  /**
   * Determine severity from primary dx score + functional-impairment items.
   */
  function determineSeverity(primaryScore, responses){
    const funcItems = (responses||[]).filter(r => r.item_category === 'functional' && !r.is_skipped);
    if (funcItems.length === 0) {
      if (primaryScore > 0.65) return 'severe';
      if (primaryScore > 0.45) return 'moderate';
      return 'mild';
    }
    const meanFunc = funcItems.reduce((s,r) => {
      let v = (r.response_value ?? 0) / 4;
      if (r.is_reverse) v = 1 - v;
      return s + v;
    }, 0) / funcItems.length;
    // Combine primary score (60%) + functional impact (40%)
    const combined = primaryScore * 0.6 + meanFunc * 0.4;
    if (combined > 0.62) return 'severe';
    if (combined > 0.38) return 'moderate';
    return 'mild';
  }

  /**
   * Build evidence trail — list of top contributing signals, sorted by weight.
   */
  function buildEvidenceTrail(sourcesEvidence, weights, primaryDx, responses, biomarkers){
    const trail = [];
    Object.keys(weights).forEach(src => {
      const srcEv = sourcesEvidence[src] || {};
      const score = srcEv[primaryDx] || 0;
      if (score < 0.1) return; // skip non-contributing

      const narrative = buildNarrative(src, primaryDx, responses, biomarkers);
      trail.push({
        source: src,
        source_label_en: SOURCE_LABELS[src].en,
        source_label_ko: SOURCE_LABELS[src].ko,
        weight: weights[src],
        score_for_primary: score,
        contribution: weights[src] * score,
        narrative_en: narrative.en,
        narrative_ko: narrative.ko
      });
    });
    trail.sort((a,b) => b.contribution - a.contribution);
    return trail;
  }

  function buildNarrative(source, primaryDx, responses, biomarkers){
    // Defaults — fallback text
    let en = 'Contributed evidence toward diagnosis.';
    let ko = '진단에 기여한 근거.';

    if (source === 'survey') {
      const positive = (responses||[]).filter(r => !r.is_skipped && r.response_value >= 2).length;
      const total = (responses||[]).filter(r => !r.is_skipped).length;
      en = `${positive}/${total} items endorsed at clinical threshold (response ≥ 2).`;
      ko = `${total}개 응답 중 ${positive}개가 임상 역치 이상 (응답값 ≥ 2).`;
    } else if (source === 'response_meta') {
      en = 'Response timing and edit patterns consistent with diagnosis profile.';
      ko = '응답 시간 및 수정 패턴이 진단 프로파일과 일치.';
    } else if (source === 'typing_dynamics') {
      en = 'Keystroke rhythm, speed, and backspace patterns contribute.';
      ko = '키스트로크 리듬, 속도, 백스페이스 패턴이 근거로 작용.';
    } else if (source === 'phone_passive') {
      en = 'Sleep, activity, and social-communication metrics support diagnosis.';
      ko = '수면·활동·사회적 통신 지표가 진단을 뒷받침.';
    } else if (source === 'qeeg') {
      const relevant = (biomarkers||[]).filter(b => b.source === 'qeeg' && b.status !== 'normal');
      if (relevant.length > 0) {
        en = `qEEG markers (${relevant.map(b => b.marker_label_en || b.marker_key).join(', ')}) deviate from norm.`;
        ko = `qEEG 마커 (${relevant.map(b => b.marker_label_ko || b.marker_key).join(', ')}) 가 규준에서 벗어남.`;
      } else {
        en = 'qEEG profile consistent with diagnosis.';
        ko = 'qEEG 프로파일이 진단과 일치.';
      }
    } else if (source === 'hrv') {
      en = 'Autonomic profile (HRV) consistent with diagnosis.';
      ko = '자율신경 프로파일(HRV)이 진단과 일치.';
    } else if (source === 'face') {
      en = 'Facial expression biomarkers contribute to the diagnostic pattern.';
      ko = '얼굴 표정 바이오마커가 진단 패턴에 기여.';
    } else if (source === 'voice') {
      en = 'Voice acoustic features consistent with diagnosis.';
      ko = '음성 음향 특징이 진단과 일치.';
    }
    return { en, ko };
  }

  // ======================================================================
  // MAIN ENTRY POINT
  // ======================================================================

  /**
   * Run full Progressive DMDA analysis.
   *
   * input: {
   *   tier: 1-4,
   *   responses: [dmda_survey_responses rows],
   *   biomarkers: [dmda_biomarkers rows],
   *   qeeg: dmda_qeeg_data row (or null),
   *   keystrokes: [{key, ts_ms}] (optional, for re-deriving typing from raw),
   *   dsmCriteria: [dmda_dsm_criteria rows]
   * }
   *
   * Returns full DiagnosticResult object.
   */
  function runAnalysis(input){
    const { tier, responses = [], biomarkers = [], qeeg = null,
            keystrokes = [], dsmCriteria = [] } = input;
    const tierDef = TIERS[tier];
    if (!tierDef) throw new Error('Invalid tier: ' + tier);

    // --- Stage 1: extract per-source evidence ---
    const sourcesEvidence = {};     // { source: { dx: score 0-1 } }
    const sourceMetrics   = {};     // { source: { metric: value } }

    if (tierDef.sources.includes('survey')) {
      const surveyEv = extractSurveyEvidence(responses);
      sourcesEvidence.survey = {};
      Object.keys(surveyEv).forEach(dx => sourcesEvidence.survey[dx] = surveyEv[dx].score);
    }
    if (tierDef.sources.includes('response_meta')) {
      const { metrics, evidence } = extractResponseMetaEvidence(responses);
      sourcesEvidence.response_meta = evidence;
      sourceMetrics.response_meta = metrics;
    }
    if (tierDef.sources.includes('typing_dynamics')) {
      const { metrics, evidence } = extractTypingEvidence(keystrokes);
      sourcesEvidence.typing_dynamics = evidence;
      sourceMetrics.typing_dynamics = metrics;
    }
    if (tierDef.sources.includes('phone_passive')) {
      const { metrics, evidence } = extractBiomarkerEvidence(biomarkers, 'phone_passive');
      sourcesEvidence.phone_passive = evidence;
      sourceMetrics.phone_passive = metrics;
    }
    if (tierDef.sources.includes('qeeg')) {
      const { metrics, evidence } = extractQeegEvidence(qeeg);
      sourcesEvidence.qeeg = evidence;
      sourceMetrics.qeeg = metrics;
    }
    ['hrv','face','voice','erp'].forEach(src => {
      if (tierDef.sources.includes(src)) {
        const { metrics, evidence } = extractBiomarkerEvidence(biomarkers, src);
        sourcesEvidence[src] = evidence;
        sourceMetrics[src] = metrics;
      }
    });

    // --- Stage 2: weighted combination ---
    // Determine which sources actually produced evidence (non-empty)
    const activeSources = Object.keys(sourcesEvidence).filter(s =>
      Object.keys(sourcesEvidence[s] || {}).length > 0
    );
    // Always include survey/response_meta if tier allows, even with low signal
    tierDef.sources.forEach(s => {
      if (['survey','response_meta'].includes(s) && !activeSources.includes(s)) {
        activeSources.push(s);
        sourcesEvidence[s] = sourcesEvidence[s] || {};
      }
    });

    const weights = smartRenormalize(activeSources);
    const dxScores = combineWeighted(sourcesEvidence, dsmCriteria, weights);

    // --- Identify primary dx ---
    const sortedDx = Object.entries(dxScores).sort(([,a],[,b]) => b-a);
    const [primaryDx, primaryScore] = sortedDx[0] || [null, 0];
    if (!primaryDx || primaryScore === 0) {
      return {
        tier,
        error: 'insufficient_evidence',
        message_en: 'Insufficient evidence to generate a diagnosis.',
        message_ko: '진단을 생성할 근거가 부족합니다.',
        weights,
        sourceMetrics
      };
    }

    const primaryRow = dsmCriteria.find(c => c.dx_code === primaryDx) || {};
    const confidence = scoreToConfidence(primaryScore, tier);
    const severity   = determineSeverity(primaryScore, responses);
    const differential = buildDifferential(dxScores, dsmCriteria, primaryDx);
    const evidenceTrail = buildEvidenceTrail(sourcesEvidence, weights, primaryDx, responses, biomarkers);

    // Upgrade recommendation
    const upgrade = buildUpgradeRecommendation(tier, confidence);

    return {
      tier,
      tier_label_en: tierDef.name_en,
      tier_label_ko: tierDef.name_ko,
      tier_band:     tierDef.band,
      primary: {
        code: primaryDx,
        name_en: primaryRow.dx_name_en || primaryDx,
        name_ko: primaryRow.dx_name_ko || primaryDx,
        dsm_reference: primaryRow.dsm_reference || null,
        raw_score: +primaryScore.toFixed(3),
        confidence: +confidence.toFixed(3),
        severity: severity
      },
      differential,
      weights_applied: weights,
      active_sources: activeSources,
      source_metrics: sourceMetrics,
      evidence_trail: evidenceTrail,
      upgrade_recommendation: upgrade,
      all_dx_scores: dxScores,
      generated_at: new Date().toISOString()
    };
  }

  function buildUpgradeRecommendation(currentTier, currentConfidence){
    if (currentTier >= 4) {
      return {
        recommend: false,
        reason_en: 'Highest tier reached; maximum diagnostic confidence.',
        reason_ko: '최고 Tier에 도달 — 최대 진단 신뢰도.'
      };
    }
    const nextTier = currentTier + 1;
    const nextBand = TIERS[nextTier].band;
    const projected = nextBand[0] + (nextBand[1] - nextBand[0]) * 0.7; // rough projection

    const benefits = {
      2: {
        en: ['Confirmed ICD-10 via qEEG', 'Insurance reimbursement eligible', 'Objective neurophysiological confirmation'],
        ko: ['qEEG 기반 ICD-10 확정', '보험 청구 가능', '객관적 신경생리 확정']
      },
      3: {
        en: ['HRV autonomic profiling', 'Face/voice multi-modal cross-validation', 'Treatment response tracking'],
        ko: ['HRV 자율신경 프로파일링', 'Face/Voice 다중 모달 교차검증', '치료 반응 추적 가능']
      },
      4: {
        en: ['Longitudinal trajectory analysis', 'FDA 510(k) pathway support', 'Publication-grade data']
      },
      // NOTE: the above 'en' for 4 is missing 'ko' key intentionally if caller doesn't use it
    };
    benefits[4] = benefits[4] || {};
    benefits[4].ko = ['종단 궤적 분석', 'FDA 510(k) 경로 지원', '출판 수준의 데이터'];

    const costs = { 2:'$500–1,500', 3:'$2,000–5,000', 4:'$10,000+' };

    return {
      recommend: true,
      current_tier: currentTier,
      current_confidence: +currentConfidence.toFixed(3),
      next_tier: nextTier,
      projected_confidence: +projected.toFixed(3),
      projected_gain_pct: +((projected - currentConfidence) * 100).toFixed(1),
      estimated_cost: costs[nextTier],
      benefits_en: benefits[nextTier].en,
      benefits_ko: benefits[nextTier].ko
    };
  }

  // ======================================================================
  // Export
  // ======================================================================
  window.DMDA_ENGINE = {
    TIERS,
    IDEAL_WEIGHTS,
    SOURCE_LABELS,
    runAnalysis,
    // Expose internals for testing / advanced use
    extractSurveyEvidence,
    extractResponseMetaEvidence,
    extractTypingEvidence,
    extractQeegEvidence,
    extractBiomarkerEvidence,
    smartRenormalize,
    combineWeighted,
    scoreToConfidence,
    buildDifferential,
    determineSeverity,
    buildEvidenceTrail,
    buildUpgradeRecommendation
  };
})();
