/**
 * ============================================================================
 * 5-LENS AI ANALYSIS ENGINE
 * ============================================================================
 * 
 * "AI의 힘을 나타내는" Cohort + Normative DB 기반 심층 분석 엔진
 * 
 * 5개의 Lens로 환자 데이터를 동시에 분석:
 *   Lens 1: General Population (일반 인구 대비)
 *   Lens 2: Age-Gender Cohort (연령/성별 코호트)
 *   Lens 3: Symptom-Profile Cohort (유사 증상군)
 *   Lens 4: Personal Baseline (개인 기준선)
 *   Lens 5: Item-Level Pattern (항목 수준 패턴)
 * 
 * → 전통 도구 대비 격이 다른 정보 제공
 * 
 * Author: Boston Neuromind LLC
 * Version: 1.0.0
 * ============================================================================
 */

(function(global) {
  'use strict';
  
  const FiveLensEngine = {
    
    module: null,
    normativeData: null,
    
    /**
     * Initialize with AI module data
     */
    init(moduleData) {
      this.module = moduleData;
      this.normativeData = moduleData.normative_data;
      console.log(`🔬 5-Lens Engine initialized for ${moduleData._meta.display_name}`);
      return this;
    },
    
    /**
     * Main analysis — run all 5 lenses
     */
    analyze(patientData) {
      const { responses, age, gender, personal_history } = patientData;
      
      // Calculate total score + subscales
      const scoring = this._calculateScores(responses);
      
      // Run 5 lenses
      const lens1 = this._lens1_GeneralPopulation(scoring.total);
      const lens2 = this._lens2_CohortComparison(scoring.total, age, gender);
      const lens3 = this._lens3_SymptomProfile(scoring);
      const lens4 = this._lens4_PersonalBaseline(scoring.total, personal_history);
      const lens5 = this._lens5_ItemPattern(responses, scoring);
      
      // Integrate evidence
      const integration = this._integrateEvidence([lens1, lens2, lens3, lens4, lens5]);
      
      // Safety check
      const safety = this._checkSafety(responses);
      
      // Generate final interpretation
      const interpretation = this._generateInterpretation(scoring, {
        lens1, lens2, lens3, lens4, lens5
      }, integration, safety);
      
      return {
        scoring,
        lenses: { lens1, lens2, lens3, lens4, lens5 },
        integration,
        safety,
        interpretation,
        timestamp: new Date().toISOString()
      };
    },
    
    /**
     * Calculate total + subscale scores
     */
    _calculateScores(responses) {
      const scoring = this.module.scoring;
      let total = 0;
      const itemScores = {};
      
      // Iterate through responses
      Object.keys(responses).forEach(qid => {
        const value = responses[qid];
        itemScores[qid] = value;
        total += value;
      });
      
      // Subscale scores (optional)
      const subscales = {};
      if (scoring.subscales && typeof scoring.subscales === 'object') {
        Object.keys(scoring.subscales).forEach(subscaleKey => {
          const subscale = scoring.subscales[subscaleKey];
          if (!subscale || !subscale.items) return;
          subscales[subscaleKey] = {
            name: subscale.name_ko,
            score: subscale.items.reduce((sum, itemId) => sum + (itemScores[itemId] || 0), 0),
            max: subscale.items.length * 3,
            items: subscale.items
          };
        });
      }
      
      // Determine level
      let level = 'minimal', levelData = null;
      Object.keys(scoring.interpretation).forEach(range => {
        const [min, max] = range.split('-').map(Number);
        if (total >= min && total <= max) {
          level = range;
          levelData = scoring.interpretation[range];
        }
      });
      
      return {
        total,
        max: scoring.total_range[1],
        level,
        level_label: levelData?.level_ko || 'unknown',
        color: levelData?.color || '#9CA3AF',
        item_scores: itemScores,
        subscales
      };
    },
    
    /**
     * LENS 1: General Population Z-score
     */
    _lens1_GeneralPopulation(totalScore) {
      const norm = this.normativeData.general_population;
      const z = (totalScore - norm.mean) / norm.sd;
      const percentile = this._zToPercentile(z);
      
      return {
        lens_id: 'lens_1_general',
        name: '일반 인구 대비',
        z_score: z,
        percentile: percentile,
        interpretation: this._interpretZ(z, 'general'),
        comparison_group: {
          n: norm.n,
          mean: norm.mean,
          sd: norm.sd
        },
        severity: this._zToSeverity(z)
      };
    },
    
    /**
     * LENS 2: Age-Gender Cohort
     */
    _lens2_CohortComparison(totalScore, age, gender) {
      // Determine cohort key
      let cohortKey = this._getCohortKey(age, gender);
      const cohortDb = this.normativeData.cohorts_by_age_gender;
      
      if (!cohortDb) {
        return {
          lens_id: 'lens_2_cohort',
          name: '연령/성별 코호트',
          available: false,
          message: '이 모듈에 코호트 DB 없음'
        };
      }
      
      const cohort = cohortDb[cohortKey];
      
      if (!cohort) {
        return {
          lens_id: 'lens_2_cohort',
          name: '연령/성별 코호트',
          available: false,
          message: '해당 코호트 데이터 없음'
        };
      }
      
      const z = (totalScore - cohort.mean) / cohort.sd;
      const percentile = this._zToPercentile(z);
      
      return {
        lens_id: 'lens_2_cohort',
        name: '연령/성별 코호트',
        available: true,
        cohort_key: cohortKey,
        z_score: z,
        percentile: percentile,
        interpretation: this._interpretZ(z, 'cohort'),
        comparison_group: {
          description: this._cohortDescription(cohortKey),
          n: cohort.n,
          mean: cohort.mean,
          sd: cohort.sd
        },
        severity: this._zToSeverity(z)
      };
    },
    
    /**
     * LENS 3: Symptom-Profile Cohort
     */
    _lens3_SymptomProfile(scoring) {
      // Determine symptom profile based on subscales
      const subscales = scoring.subscales;
      const emotional = subscales.emotional?.score || 0;
      const somatic = subscales.somatic?.score || 0;
      const cognitive = subscales.cognitive?.score || 0;
      
      // Classify profile
      let profileKey = 'mixed_anxiety_depression';
      let profileName = '혼합 양상';
      
      const total = emotional + somatic + cognitive;
      if (total > 0) {
        const emoRatio = emotional / total;
        const somRatio = somatic / total;
        
        if (emoRatio > 0.5) {
          profileKey = 'emotional_dominant';
          profileName = '정서 우세';
        } else if (somRatio > 0.5) {
          profileKey = 'somatic_dominant';
          profileName = '신체 우세';
        } else if (somatic >= 5 && cognitive < 2) {
          profileKey = 'low_energy_sleep_problems';
          profileName = '저에너지/수면 문제';
        }
      }
      
      const profileCohorts = this.normativeData.symptom_profile_cohorts;
      if (!profileCohorts) {
        return { lens_id: 'lens_3_symptom_profile', available: false, message: 'Profile cohorts data not available' };
      }
      
      const profile = profileCohorts[profileKey];
      if (!profile) {
        // Fall back to first available profile
        const firstKey = Object.keys(profileCohorts)[0];
        if (!firstKey) {
          return { lens_id: 'lens_3_symptom_profile', available: false };
        }
        const fallbackProfile = profileCohorts[firstKey];
        const z = (scoring.total - fallbackProfile.mean) / fallbackProfile.sd;
        return {
          lens_id: 'lens_3_symptom_profile',
          name: '증상 프로파일 코호트',
          available: true,
          profile_key: firstKey,
          profile_name: firstKey,
          z_score: z,
          percentile: this._zToPercentile(z),
          interpretation: this._interpretZ(z, 'profile'),
          comparison_group: { n: fallbackProfile.n, mean: fallbackProfile.mean, sd: fallbackProfile.sd },
          severity: this._zToSeverity(z)
        };
      }
      
      const z = (scoring.total - profile.mean) / profile.sd;
      const percentile = this._zToPercentile(z);
      
      return {
        lens_id: 'lens_3_symptom_profile',
        name: '증상 프로파일 코호트',
        available: true,
        profile_key: profileKey,
        profile_name: profileName,
        z_score: z,
        percentile: percentile,
        interpretation: this._interpretZ(z, 'profile'),
        comparison_group: {
          description: `${profileName} 환자군`,
          n: profile.n,
          mean: profile.mean,
          sd: profile.sd
        },
        severity: this._zToSeverity(z)
      };
    },
    
    /**
     * LENS 4: Personal Baseline
     */
    _lens4_PersonalBaseline(totalScore, personalHistory) {
      if (!personalHistory || !personalHistory.previous_scores || personalHistory.previous_scores.length === 0) {
        return {
          lens_id: 'lens_4_personal_baseline',
          name: '개인 기준선',
          available: false,
          message: '이전 측정 기록 없음 — 첫 방문'
        };
      }
      
      const scores = personalHistory.previous_scores;
      const baseline = scores.reduce((a, b) => a + b, 0) / scores.length;
      const personalSd = Math.sqrt(scores.reduce((acc, s) => acc + Math.pow(s - baseline, 2), 0) / scores.length);
      const delta = totalScore - baseline;
      const personalZ = personalSd > 0 ? delta / personalSd : 0;
      
      let direction = 'stable';
      if (delta > 3) direction = 'worsened';
      else if (delta < -3) direction = 'improved';
      
      return {
        lens_id: 'lens_4_personal_baseline',
        name: '개인 기준선',
        available: true,
        baseline_mean: baseline,
        baseline_sd: personalSd,
        current_score: totalScore,
        delta: delta,
        personal_z: personalZ,
        direction: direction,
        interpretation: this._interpretPersonalChange(delta, direction),
        history_length: scores.length,
        trend: this._analyzeTrend(scores.concat([totalScore]))
      };
    },
    
    /**
     * LENS 5: Item-Level Pattern Analysis
     */
    _lens5_ItemPattern(responses, scoring) {
      const subscales = scoring.subscales;
      
      // Graceful fallback if no subscales defined
      if (!subscales || Object.keys(subscales).length === 0) {
        const extremeItems = [];
        Object.keys(responses).forEach(qid => {
          const val = responses[qid];
          if (val >= 3) {
            const q = this.module.questions.find(q => q.id === qid);
            if (q) {
              extremeItems.push({
                qid: qid,
                domain: q.domain || 'general',
                text_ko: (q.text_ko || q.text_en || '').substring(0, 40) + '...'
              });
            }
          }
        });
        return {
          lens_id: 'lens_5_item_pattern',
          name: '항목 수준 패턴',
          available: true,
          dominant_subscale: null,
          secondary_subscale: null,
          extreme_items: extremeItems,
          clinical_patterns: [],
          profile_type: '항목 수준 분석 (subscale 없음)'
        };
      }
      
      // Identify dominant subscale
      const sorted = Object.keys(subscales).map(key => ({
        key,
        ratio: subscales[key].score / Math.max(subscales[key].max, 1)
      })).sort((a, b) => b.ratio - a.ratio);
      
      const dominant = sorted[0];
      const secondary = sorted[1];
      
      // Identify extreme items (3 = max)
      const extremeItems = [];
      Object.keys(responses).forEach(qid => {
        if (responses[qid] === 3) {
          const q = this.module.questions.find(q => q.id === qid);
          if (q) {
            extremeItems.push({
              qid: qid,
              domain: q.domain,
              text_ko: q.text_ko.substring(0, 40) + '...'
            });
          }
        }
      });
      
      // Check for concerning patterns
      const patterns = [];
      
      // Melancholic pattern: psychomotor + anhedonia + early morning waking
      if (responses.MC9_Q1 >= 2 && responses.MC9_Q8 >= 2) {
        patterns.push({ type: 'melancholic', severity: 'moderate_to_high' });
      }
      
      // Atypical pattern: increased appetite + hypersomnia
      if (responses.MC9_Q5 >= 2 && responses.MC9_Q3 >= 2) {
        patterns.push({ type: 'atypical', severity: 'moderate' });
      }
      
      // Mixed features: agitation markers
      if (responses.MC9_Q8 >= 2 && responses.MC9_Q3 >= 2) {
        patterns.push({ type: 'possible_mixed_features', severity: 'high_warning' });
      }
      
      return {
        lens_id: 'lens_5_item_pattern',
        name: '항목 수준 패턴',
        available: true,
        dominant_subscale: dominant ? {
          name: dominant.key,
          name_ko: subscales[dominant.key]?.name || dominant.key,
          ratio: dominant.ratio,
          score: subscales[dominant.key]?.score || 0,
          max: subscales[dominant.key]?.max || 0
        } : null,
        secondary_subscale: secondary ? {
          name: secondary.key,
          name_ko: subscales[secondary.key]?.name || secondary.key,
          ratio: secondary.ratio
        } : null,
        extreme_items: extremeItems,
        clinical_patterns: patterns,
        profile_type: this._classifyProfileType(subscales)
      };
    },
    
    /**
     * Integrate evidence from all lenses
     */
    _integrateEvidence(lenses) {
      const zScores = [];
      const severities = [];
      
      lenses.forEach(lens => {
        if (lens.available !== false && typeof lens.z_score === 'number') {
          zScores.push(lens.z_score);
          severities.push(lens.severity);
        }
      });
      
      // Aggregate severity
      const highConcernCount = severities.filter(s => s === 'high').length;
      const moderateCount = severities.filter(s => s === 'moderate').length;
      
      let overallLevel = 'low';
      let confidence = 'moderate';
      
      if (highConcernCount >= 2) {
        overallLevel = 'high';
        confidence = 'high';
      } else if (highConcernCount === 1 || moderateCount >= 2) {
        overallLevel = 'moderate';
        confidence = 'moderate';
      }
      
      // Convergent evidence check
      const convergent = zScores.length >= 2 && zScores.every(z => Math.abs(z) > 1.0);
      
      return {
        lenses_used: lenses.filter(l => l.available !== false).length,
        lenses_available: lenses.length,
        overall_level: overallLevel,
        confidence: confidence,
        convergent_evidence: convergent,
        mean_z: zScores.length > 0 ? zScores.reduce((a,b) => a+b, 0) / zScores.length : 0,
        diagnostic_likelihood: this._computeDiagnosticLikelihood(zScores, severities)
      };
    },
    
    _computeDiagnosticLikelihood(zScores, severities) {
      // Simple Bayesian-inspired aggregation
      if (zScores.length === 0) return 0.5;
      
      const meanZ = zScores.reduce((a,b) => a+b, 0) / zScores.length;
      
      // Convert z-score to probability-like scale
      // z=0 → 0.5, z=2 → 0.9, z=3 → 0.99
      const prob = 1 / (1 + Math.exp(-meanZ * 1.5));
      return Math.max(0, Math.min(1, prob));
    },
    
    /**
     * Safety check
     */
    _checkSafety(responses) {
      const suicideScore = responses.MC9_Q9 || 0;
      
      let action = 'none';
      let alertLevel = 'none';
      
      if (suicideScore >= 3) {
        action = 'emergency_contact_required';
        alertLevel = 'critical';
      } else if (suicideScore >= 2) {
        action = 'immediate_safety_plan';
        alertLevel = 'high';
      } else if (suicideScore >= 1) {
        action = 'urgent_clinical_review';
        alertLevel = 'moderate';
      }
      
      return {
        suicide_score: suicideScore,
        alert_level: alertLevel,
        action_required: action,
        safe: suicideScore === 0,
        message_ko: suicideScore === 0 ? '안전 위험 신호 없음' : 
                    suicideScore === 1 ? '자살 사고 존재 — 임상 평가 필요' :
                    suicideScore === 2 ? '빈번한 자살 사고 — 즉시 안전 계획 수립' :
                    '심각한 자살 사고 — 응급 평가 필요'
      };
    },
    
    /**
     * Generate final interpretation
     */
    _generateInterpretation(scoring, lenses, integration, safety) {
      const parts = [];
      
      // Total score
      parts.push(`총점 ${scoring.total}/${scoring.max} — ${scoring.level_label}`);
      
      // Safety first
      if (!safety.safe) {
        parts.push(`⚠️ ${safety.message_ko}`);
      }
      
      // Lens 1
      if (lenses.lens1) {
        const p = Math.round(lenses.lens1.percentile);
        parts.push(`📊 일반 인구 상위 ${100 - p}%`);
      }
      
      // Lens 2
      if (lenses.lens2.available) {
        const p = Math.round(lenses.lens2.percentile);
        parts.push(`👥 동 연령대 상위 ${100 - p}%`);
      }
      
      // Lens 3
      if (lenses.lens3.available) {
        parts.push(`🎭 증상 프로파일: ${lenses.lens3.profile_name}`);
      }
      
      // Lens 4
      if (lenses.lens4.available) {
        parts.push(`👤 개인 기준 대비: ${lenses.lens4.direction === 'worsened' ? '악화' : lenses.lens4.direction === 'improved' ? '호전' : '안정'} (Δ${lenses.lens4.delta.toFixed(1)})`);
      }
      
      // Lens 5
      if (lenses.lens5.clinical_patterns && lenses.lens5.clinical_patterns.length > 0) {
        lenses.lens5.clinical_patterns.forEach(p => {
          parts.push(`🔬 임상 패턴: ${p.type} (${p.severity})`);
        });
      }
      
      return {
        summary: parts.join('\n'),
        clinical_recommendation: this._generateClinicalRecommendation(scoring, integration, safety, lenses)
      };
    },
    
    _generateClinicalRecommendation(scoring, integration, safety, lenses) {
      const recs = [];
      
      if (!safety.safe) {
        recs.push('🚨 안전 평가 최우선 수행');
      }
      
      if (integration.overall_level === 'high') {
        recs.push('📋 정신과 전문의 평가 권장');
        recs.push('💊 약물 치료 고려');
      } else if (integration.overall_level === 'moderate') {
        recs.push('🧠 인지행동치료 (CBT) 고려');
        recs.push('🧘 신경피드백 (Alpha-Theta) 고려');
      }
      
      // Pattern-specific
      const patterns = lenses.lens5?.clinical_patterns || [];
      patterns.forEach(p => {
        if (p.type === 'melancholic') {
          recs.push('⚠️ Melancholic features — SSRI + 생활 규칙화');
        } else if (p.type === 'atypical') {
          recs.push('🍽️ Atypical features — MAOI 검토');
        } else if (p.type === 'possible_mixed_features') {
          recs.push('🌀 Mixed features 의심 — 양극성 감별 필수!');
        }
      });
      
      // Follow-up
      if (lenses.lens4?.direction === 'worsened') {
        recs.push('📅 2주 내 추적 관찰');
      } else {
        recs.push('📅 4주 후 재평가');
      }
      
      return recs;
    },
    
    /* ===== UTILITY FUNCTIONS ===== */
    
    _zToPercentile(z) {
      // Standard normal CDF approximation
      const t = 1 / (1 + 0.2316419 * Math.abs(z));
      const d = 0.3989423 * Math.exp(-z * z / 2);
      const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return z > 0 ? (1 - p) * 100 : p * 100;
    },
    
    _zToSeverity(z) {
      if (z >= 2.0) return 'high';
      if (z >= 1.0) return 'moderate';
      if (z >= 0) return 'low';
      return 'below_average';
    },
    
    _interpretZ(z, context) {
      if (z >= 2.5) return '매우 심각 (상위 1%)';
      if (z >= 2.0) return '심각 (상위 2.3%)';
      if (z >= 1.5) return '상당히 높음 (상위 7%)';
      if (z >= 1.0) return '평균 이상 (상위 16%)';
      if (z >= 0) return '평균 수준';
      return '평균 이하';
    },
    
    _interpretPersonalChange(delta, direction) {
      if (direction === 'worsened') {
        if (delta > 8) return '🚨 급격한 악화';
        if (delta > 5) return '⚠️ 주목할 악화';
        return '📉 경미한 악화';
      } else if (direction === 'improved') {
        if (delta < -8) return '🎉 큰 호전';
        if (delta < -5) return '✅ 유의미한 호전';
        return '📈 경미한 호전';
      }
      return '➡️ 안정 유지';
    },
    
    _analyzeTrend(scores) {
      if (scores.length < 3) return 'insufficient_data';
      const recent = scores.slice(-3);
      const trend = recent[2] - recent[0];
      if (trend > 3) return 'increasing';
      if (trend < -3) return 'decreasing';
      return 'stable';
    },
    
    _getCohortKey(age, gender) {
      const g = gender === 'F' ? 'female' : gender === 'M' ? 'male' : 'male'; // default
      if (age < 30) return `adult_18_29_${g}`;
      if (age < 50) return `adult_30_49_${g}`;
      if (age < 65) return `adult_50_64_${g}`;
      return 'senior_65_plus';
    },
    
    _cohortDescription(key) {
      const descriptions = {
        'adult_18_29_male': '18-29세 남성',
        'adult_18_29_female': '18-29세 여성',
        'adult_30_49_male': '30-49세 남성',
        'adult_30_49_female': '30-49세 여성',
        'adult_50_64_male': '50-64세 남성',
        'adult_50_64_female': '50-64세 여성',
        'senior_65_plus': '65세 이상'
      };
      return descriptions[key] || key;
    },
    
    _classifyProfileType(subscales) {
      const emo = subscales.emotional?.score || 0;
      const som = subscales.somatic?.score || 0;
      const cog = subscales.cognitive?.score || 0;
      const risk = subscales.risk?.score || 0;
      
      const dominants = [];
      if (emo >= 5) dominants.push('정서');
      if (som >= 5) dominants.push('신체');
      if (cog >= 4) dominants.push('인지');
      if (risk >= 1) dominants.push('위험');
      
      return dominants.length > 0 ? dominants.join(' + ') + ' 우세' : '경미';
    }
  };
  
  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FiveLensEngine;
  } else {
    global.FiveLensEngine = FiveLensEngine;
  }
  
})(typeof window !== 'undefined' ? window : global);
