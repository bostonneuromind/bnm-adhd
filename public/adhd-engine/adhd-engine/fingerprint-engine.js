/**
 * ============================================================================
 * STRATEGY 5: PATTERN FINGERPRINTING ENGINE
 * ============================================================================
 * 
 * "각 진단마다 고유한 multi-modal 지문이 있다"
 * 
 * 환자 데이터 (QEEG + HRV + Cognitive + Symptoms) → Z-score 변환
 *   ↓
 * 각 진단의 지문(fingerprint)과 비교
 *   ↓
 * 가중 코사인 유사도 계산 → 0.0 ~ 1.0
 *   ↓
 * 순위 + 신뢰도 + 시각화
 * 
 * Author: Boston Neuromind LLC
 * Version: 1.0.0
 * License: Proprietary
 * ============================================================================
 */

(function(global) {
  'use strict';

  const FingerprintEngine = {
    
    fingerprints: null,
    healthyDB: null,

    // ----- HANDEDNESS-SENSITIVE FEATURES -----
    // These QEEG features are interpreted against normative data drawn almost
    // entirely from right-handers, so they need a handedness modifier:
    //   • frontal_alpha_asym (FAA, F3–F4) → approach/withdrawal affective valence.
    //     The asymmetry-to-affect mapping is weak and can REVERSE in left-/mixed-
    //     handers, so the normative z-score is not interpretable at face value
    //     (Coan & Allen, 2004, Biol Psychol 67:7–50).
    //   • language-lateralization channels (temporal T3–T4, inferior-frontal
    //     F7–F8) assume left-hemisphere language dominance — true in ~96% of
    //     right-handers but only ~73% of left-handers (Knecht et al., 2000,
    //     Brain 123:2512–2518) — so left/mixed handers cannot be compared
    //     against a left-dominant normative DB.
    HANDEDNESS_SENSITIVE: {
      faa: ['frontal_alpha_asym'],
      language_lat: ['lang_lat_T3_T4', 'lang_lat_F7_F8'],
    },

    /**
     * Initialize with fingerprints and healthy population DB
     */
    init(fingerprintsData, healthyPopulationData) {
      this.fingerprints = fingerprintsData;
      this.healthyDB = healthyPopulationData;
      console.log('🔬 Fingerprint Engine initialized');
      console.log(`   - ${this.fingerprints.fingerprints.length} diagnostic fingerprints loaded`);
      console.log(`   - ${this._countFeatures()} total features in space`);
      return this;
    },
    
    _countFeatures() {
      const fs = this.fingerprints.feature_space;
      return (fs.qeeg_features?.length || 0) + 
             (fs.hrv_features?.length || 0) + 
             (fs.cognitive_features?.length || 0) +
             (fs.symptom_features?.length || 0);
    },
    
    /**
     * Compute Z-score from raw value using healthy population norms
     */
    computeZScore(featureId, rawValue, ageStratum) {
      if (!this.healthyDB) return null;
      
      // Find feature in healthy DB (search across categories)
      const norm = this._findNorm(featureId, ageStratum);
      if (!norm) return null;
      
      return (rawValue - norm.mean) / norm.sd;
    },
    
    _findNorm(featureId, ageStratum) {
      const db = this.healthyDB;
      
      // Direct mapping table for feature lookups
      const lookups = {
        'theta_beta_Fz': db.qeeg?.eyes_closed?.theta_beta_ratio_Fz?.strata,
        'alpha_peak_freq': db.qeeg?.eyes_closed?.alpha_peak_frequency?.strata,
        'alpha_power_Pz': db.qeeg?.eyes_closed?.alpha_power_Pz?.strata,
        'frontal_alpha_asym': db.qeeg?.eyes_closed?.frontal_alpha_asymmetry?.strata,
        'beta_power_Cz': db.qeeg?.eyes_closed?.beta_power_Cz?.strata,
        'P300_amplitude': db.qeeg?.erp?.P300_Pz_amplitude?.strata,
        'P300_latency': db.qeeg?.erp?.P300_latency?.strata,
        'RMSSD': db.hrv?.time_domain?.RMSSD?.strata,
        'SDNN': db.hrv?.time_domain?.SDNN?.strata,
        'LF_HF_ratio': db.hrv?.frequency_domain?.LF_HF_ratio?.strata,
        'CPT_rt_variability': db.cognitive_tests?.CPT_rt_variability?.strata,
        'CPT_omission': db.cognitive_tests?.CPT_omission_errors?.strata,
        'digit_span_back': db.cognitive_tests?.Digit_span_backward?.strata
      };
      
      const strata = lookups[featureId];
      if (!strata) return null;
      
      // Try exact stratum, fall back to adult_18_29
      return strata[ageStratum] || strata['adult_18_29'] || Object.values(strata)[0];
    },
    
    /**
     * Get age stratum from age
     */
    getAgeStratum(age) {
      if (age < 13) return 'child_6_12';
      if (age < 18) return 'teen_13_17';
      if (age < 30) return 'adult_18_29';
      if (age < 50) return 'adult_30_49';
      if (age < 65) return 'adult_50_64';
      return 'senior_65_plus';
    },
    
    /**
     * Convert patient raw data to feature vector (z-scores)
     */
    buildPatientVector(patientData) {
      const ageStratum = this.getAgeStratum(patientData.age || 30);
      const vector = {};
      
      // QEEG features
      if (patientData.qeeg) {
        const q = patientData.qeeg;
        if (q.theta_beta_Fz !== undefined) vector.theta_beta_Fz = this.computeZScore('theta_beta_Fz', q.theta_beta_Fz, ageStratum);
        if (q.alpha_peak_freq !== undefined) vector.alpha_peak_freq = this.computeZScore('alpha_peak_freq', q.alpha_peak_freq, ageStratum);
        if (q.alpha_power_Pz !== undefined) vector.alpha_power_Pz = this.computeZScore('alpha_power_Pz', q.alpha_power_Pz, ageStratum);
        if (q.frontal_alpha_asym !== undefined) vector.frontal_alpha_asym = this.computeZScore('frontal_alpha_asym', q.frontal_alpha_asym, ageStratum);
        if (q.beta_power_Cz !== undefined) vector.beta_power_Cz = this.computeZScore('beta_power_Cz', q.beta_power_Cz, ageStratum);
        if (q.P300_amplitude !== undefined) vector.P300_amplitude = this.computeZScore('P300_amplitude', q.P300_amplitude, ageStratum);
        if (q.P300_latency !== undefined) vector.P300_latency = this.computeZScore('P300_latency', q.P300_latency, ageStratum);
      }
      
      // HRV features
      if (patientData.hrv) {
        const h = patientData.hrv;
        if (h.RMSSD !== undefined) vector.RMSSD = this.computeZScore('RMSSD', h.RMSSD, ageStratum);
        if (h.SDNN !== undefined) vector.SDNN = this.computeZScore('SDNN', h.SDNN, ageStratum);
        if (h.LF_HF_ratio !== undefined) vector.LF_HF_ratio = this.computeZScore('LF_HF_ratio', h.LF_HF_ratio, ageStratum);
      }
      
      // Cognitive features
      if (patientData.cognitive) {
        const c = patientData.cognitive;
        if (c.CPT_rt_variability !== undefined) vector.CPT_rt_variability = this.computeZScore('CPT_rt_variability', c.CPT_rt_variability, ageStratum);
        if (c.CPT_omission !== undefined) vector.CPT_omission = this.computeZScore('CPT_omission', c.CPT_omission, ageStratum);
        if (c.digit_span_back !== undefined) vector.digit_span_back = this.computeZScore('digit_span_back', c.digit_span_back, ageStratum);
      }
      
      // Symptom scores - convert to z using rough conversions
      if (patientData.symptoms) {
        const s = patientData.symptoms;
        // PHQ-9: 0-27, mean ~3, sd ~4 (general pop)
        if (s.depression_score !== undefined) vector.depression_score = (s.depression_score - 3.2) / 4.1;
        // GAD-7: 0-21, mean ~3, sd ~4
        if (s.anxiety_score !== undefined) vector.anxiety_score = (s.anxiety_score - 3.0) / 3.9;
        // PCL-5: 0-80, mean ~10, sd ~12
        if (s.ptsd_score !== undefined) vector.ptsd_score = (s.ptsd_score - 10) / 12;
        // ASRS attention 0-24, mean ~5, sd ~4 
        if (s.attention_score !== undefined) vector.attention_score = (s.attention_score - 5.2) / 4.1;
        // PSQI: 0-21, mean ~5, sd ~3 (higher is worse)
        if (s.sleep_quality !== undefined) vector.sleep_quality = (s.sleep_quality - 4.8) / 2.9;
      }
      
      return vector;
    },
    
    /**
     * Compute weighted cosine similarity between patient vector and a fingerprint
     * Now penalizes low feature coverage to avoid misleading "perfect matches" with few features
     */
    computeSimilarity(patientVector, fingerprint) {
      const features = fingerprint.features;
      const featureIds = Object.keys(features).filter(id => patientVector[id] !== undefined && patientVector[id] !== null);
      
      if (featureIds.length === 0) {
        return { similarity: 0, matched_features: 0, total_features: Object.keys(features).length, confidence: 'low' };
      }
      
      let dotProduct = 0;
      let patientNorm = 0;
      let fingerprintNorm = 0;
      let totalWeight = 0;
      
      featureIds.forEach(id => {
        const fpFeature = features[id];
        const weight = fpFeature.weight || 1.0;
        const fpZ = fpFeature.z_score;
        const ptZ = patientVector[id];
        
        const weightedFp = weight * fpZ;
        const weightedPt = weight * ptZ;
        
        dotProduct += weightedFp * weightedPt;
        patientNorm += weightedPt * weightedPt;
        fingerprintNorm += weightedFp * weightedFp;
        totalWeight += weight;
      });
      
      const denominator = Math.sqrt(patientNorm) * Math.sqrt(fingerprintNorm);
      const cosineSim = denominator > 0 ? dotProduct / denominator : 0;
      
      // Normalize cosine [-1,1] to [0,1]
      const normalized = (cosineSim + 1) / 2;
      
      // ----- COVERAGE PENALTY -----
      // Penalize if few features matched - prevents 1-feature "perfect" matches
      const coverage = featureIds.length / Object.keys(features).length;
      
      // Coverage multiplier: sigmoid-like
      // 0% coverage → 0.0 multiplier
      // 50% coverage → 0.7 multiplier  
      // 100% coverage → 1.0 multiplier
      const coverageMultiplier = Math.min(1.0, 0.3 + 0.7 * coverage);
      
      // Final similarity
      const finalSim = normalized * coverageMultiplier;
      
      // Confidence label
      let confidence = 'low';
      if (coverage >= 0.7) confidence = 'high';
      else if (coverage >= 0.4) confidence = 'moderate';
      
      return {
        similarity: Math.max(0, Math.min(1, finalSim)),
        raw_cosine: normalized,
        coverage_multiplier: coverageMultiplier,
        matched_features: featureIds.length,
        total_features: Object.keys(features).length,
        coverage: coverage,
        confidence: confidence
      };
    },
    
    /**
     * Evaluate how handedness should modify QEEG interpretation.
     *   right-handed         → normative DB applies as-is.
     *   left / ambidextrous  → FAA valence flagged (kept but not interpretable),
     *                          language-lateralization normative comparison void.
     * Unknown / missing handedness is treated as right-handed (default normative
     * assumption) but reported as 'unknown' so the consumer can prompt for it.
     * See HANDEDNESS_SENSITIVE for citations (Coan & Allen 2004; Knecht 2000).
     */
    assessHandedness(dominantHand) {
      const hand = (dominantHand || '').toString().toLowerCase();
      const known = hand === 'right' || hand === 'left' || hand === 'ambidextrous';
      const atypical = hand === 'left' || hand === 'ambidextrous';
      return {
        dominant_hand: known ? hand : 'unknown',
        handedness_adjusted: atypical,
        faa_flagged: atypical,
        faa_note: atypical
          ? 'FAA valence interpretation unreliable in non-right-handers (Coan & Allen 2004)'
          : null,
        language_lat_normative_valid: !atypical,
        language_lat_note: atypical
          ? 'Language lateralization not comparable to left-dominant normative DB (Knecht 2000)'
          : null,
        flagged_features: atypical
          ? [...this.HANDEDNESS_SENSITIVE.faa, ...this.HANDEDNESS_SENSITIVE.language_lat]
          : [],
      };
    },

    /**
     * Match patient against ALL fingerprints, return ranked results
     */
    matchAll(patientData) {
      const patientVector = this.buildPatientVector(patientData);

      // ----- HANDEDNESS ADJUSTMENT (Coan & Allen 2004; Knecht 2000) -----
      // Left/ambidextrous: language-lateralization features are removed from the
      // normative cosine entirely (they cannot be scored against a left-dominant
      // DB), and FAA is flagged downstream (kept, but its affective valence is
      // not interpretable). Right-handed / unknown leaves the vector untouched.
      const handedness = this.assessHandedness(patientData.dominant_hand);
      if (handedness.handedness_adjusted) {
        this.HANDEDNESS_SENSITIVE.language_lat.forEach(id => { delete patientVector[id]; });
      }

      const measuredFeatures = Object.keys(patientVector).filter(k => patientVector[k] !== null);
      
      const results = this.fingerprints.fingerprints.map(fp => {
        const matchResult = this.computeSimilarity(patientVector, fp);
        return {
          diagnosis_id: fp.diagnosis_id,
          name: fp.name,
          name_ko: fp.name_ko,
          ...matchResult,
          fingerprint_confidence: fp.confidence,
          evidence: fp.evidence
        };
      });
      
      // Sort by similarity descending
      results.sort((a, b) => b.similarity - a.similarity);
      
      // Add match labels
      results.forEach(r => {
        if (r.similarity >= 0.85) r.match_label = 'Strong Match';
        else if (r.similarity >= 0.65) r.match_label = 'Moderate Match';
        else if (r.similarity >= 0.40) r.match_label = 'Weak Match';
        else r.match_label = 'No Match';
      });
      
      const coverage = measuredFeatures.length / this._countFeatures();
      // Threshold below which the engine refuses to commit to a ranking — too
      // few measured features for the cosine similarity to be informative.
      const MIN_COVERAGE = 0.50;
      const lowConfidence = coverage < MIN_COVERAGE;

      return {
        patient_vector: patientVector,
        measured_features: measuredFeatures,
        feature_coverage: coverage,
        min_coverage_threshold: MIN_COVERAGE,
        low_confidence: lowConfidence,
        // Handedness-adjusted flag + per-feature detail (FAA / language lat).
        handedness_adjusted: handedness.handedness_adjusted,
        handedness: handedness,
        rankings: results,
        top_3: results.slice(0, 3),
        timestamp: new Date().toISOString()
      };
    },
    
    /**
     * Generate human-readable explanation for top match
     */
    explainMatch(matchResult, fingerprintId) {
      const ranking = matchResult.rankings.find(r => r.diagnosis_id === fingerprintId);
      if (!ranking) return null;
      
      const fp = this.fingerprints.fingerprints.find(f => f.diagnosis_id === fingerprintId);
      const patientVector = matchResult.patient_vector;
      
      const supportingFeatures = [];
      const conflictingFeatures = [];
      
      Object.keys(fp.features).forEach(featId => {
        const fpFeat = fp.features[featId];
        const ptZ = patientVector[featId];
        if (ptZ === undefined || ptZ === null) return;
        
        const sameDirection = Math.sign(fpFeat.z_score) === Math.sign(ptZ);
        const magnitude = Math.abs(ptZ);
        
        if (sameDirection && magnitude >= 0.5) {
          supportingFeatures.push({
            feature: featId,
            patient_z: ptZ.toFixed(2),
            expected_z: fpFeat.z_score,
            note: fpFeat.note || ''
          });
        } else if (!sameDirection && magnitude >= 1.0) {
          conflictingFeatures.push({
            feature: featId,
            patient_z: ptZ.toFixed(2),
            expected_z: fpFeat.z_score
          });
        }
      });
      
      return {
        diagnosis: ranking.name,
        similarity_pct: (ranking.similarity * 100).toFixed(0) + '%',
        confidence: ranking.confidence,
        supporting: supportingFeatures,
        conflicting: conflictingFeatures,
        evidence: ranking.evidence
      };
    },
    
    /**
     * Generate sample patient data for testing
     */
    generateSamplePatient(profile) {
      const samples = {
        'classic_adhd': {
          age: 10, sex: 'M',
          qeeg: { theta_beta_Fz: 6.5, alpha_peak_freq: 8.2, P300_amplitude: 7.5 },
          hrv: { RMSSD: 50 },
          cognitive: { CPT_rt_variability: 130, CPT_omission: 8 },
          symptoms: { attention_score: 18, depression_score: 4, anxiety_score: 5 }
        },
        'classic_mdd': {
          age: 35, sex: 'F',
          qeeg: { frontal_alpha_asym: -0.30, alpha_power_Pz: 25 },
          hrv: { RMSSD: 18, SDNN: 30 },
          symptoms: { depression_score: 18, anxiety_score: 12, sleep_quality: 12 }
        },
        'classic_gad': {
          age: 28, sex: 'F',
          qeeg: { beta_power_Cz: 18, alpha_power_Pz: 12 },
          hrv: { RMSSD: 25, SDNN: 38, LF_HF_ratio: 4.5 },
          symptoms: { anxiety_score: 16, depression_score: 8, sleep_quality: 10 }
        },
        'classic_ptsd': {
          age: 32, sex: 'M',
          qeeg: { alpha_power_Pz: 8, beta_power_Cz: 16, frontal_alpha_asym: -0.20 },
          hrv: { RMSSD: 15, SDNN: 25 },
          symptoms: { ptsd_score: 50, depression_score: 15, anxiety_score: 14, sleep_quality: 16 }
        },
        'classic_mci': {
          age: 70, sex: 'M',
          qeeg: { alpha_peak_freq: 7.5, alpha_power_Pz: 8, P300_amplitude: 3.5, P300_latency: 450 },
          cognitive: { CPT_rt_variability: 180, digit_span_back: 3 }
        }
      };
      return samples[profile] || samples['classic_adhd'];
    }
  };
  
  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FingerprintEngine;
  } else {
    global.FingerprintEngine = FingerprintEngine;
  }
  
})(typeof window !== 'undefined' ? window : global);
