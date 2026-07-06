/**
 * MULTI-MODULE FUSION ENGINE v2.0
 * Supports all 31 AI modules
 */

(function(global) {
  'use strict';
  
  const FusionEngine = {
    
    PRIORS: {
      mdd: 0.083, bipolar_1: 0.010, bipolar_2: 0.011,
      gad: 0.057, panic: 0.028, social_anxiety: 0.068,
      adhd_combined: 0.025, adhd_inattentive: 0.035, adhd_hyperactive: 0.010,
      ptsd: 0.068, acute_stress: 0.020, complex_ptsd: 0.012,
      ocd: 0.023, ocpd: 0.030, bdd: 0.018, tic: 0.010, tourette: 0.005,
      schizophrenia: 0.007, schizoaffective: 0.003, brief_psychotic: 0.002,
      insomnia: 0.100, hypersomnia: 0.010, sleep_apnea: 0.060,
      circadian_disorder: 0.020, delayed_sleep_phase: 0.015,
      nightmare_disorder: 0.040, rbd: 0.010,
      anorexia_nervosa: 0.009, bulimia: 0.015, bed: 0.035,
      aud: 0.140, sud: 0.080,
      asd: 0.022, dyslexia: 0.075,
      odd: 0.035, conduct_disorder: 0.040, ied: 0.025, aspd: 0.035,
      mci: 0.100, dementia: 0.050,
      bpd: 0.028, npd: 0.015, avoidant_pd: 0.025, dependent_pd: 0.010,
      did: 0.015, dpdr: 0.020, dissociative_amnesia: 0.018,
      ssd: 0.050, iad: 0.020, fnd: 0.025
    },
    
    DIAGNOSIS_SOURCES: {
      mdd: ['mood_catcher_9'],
      bipolar_1: ['mania_catcher_7', 'mood_catcher_9'],
      bipolar_2: ['hypomania_catcher_6', 'mood_catcher_9'],
      gad: ['anxi_catcher_7'],
      panic: ['anxi_catcher_7'],
      social_anxiety: ['anxi_catcher_7', 'avoidant_dependent_catcher_8'],
      adhd_combined: ['attend_catcher_18'],
      adhd_inattentive: ['attend_catcher_18'],
      adhd_hyperactive: ['attend_catcher_18'],
      ptsd: ['trauma_catcher_20'],
      complex_ptsd: ['trauma_catcher_20'],
      acute_stress: ['trauma_catcher_20'],
      ocd: ['obsess_catcher_10'],
      ocpd: ['obsess_catcher_10'],
      schizophrenia: ['psychosis_catcher_12'],
      schizoaffective: ['schizoaffective_catcher_8', 'psychosis_catcher_12'],
      brief_psychotic: ['brief_psychotic_catcher_5', 'psychosis_catcher_12'],
      insomnia: ['insomnia_catcher_8'],
      hypersomnia: ['hypersomnia_catcher_6'],
      sleep_apnea: ['sleep_apnea_catcher_7'],
      circadian_disorder: ['circadian_catcher_5'],
      delayed_sleep_phase: ['circadian_catcher_5'],
      nightmare_disorder: ['nightmare_catcher_5'],
      rbd: ['nightmare_catcher_5'],
      anorexia_nervosa: ['anorexia_catcher_6'],
      bulimia: ['bulimia_catcher_6'],
      bed: ['binge_eating_catcher_5'],
      aud: ['alcohol_use_catcher_10'],
      sud: ['substance_use_catcher_8'],
      asd: ['autism_catcher_10'],
      tic: ['tic_catcher_5'],
      tourette: ['tic_catcher_5'],
      dyslexia: ['learning_catcher_6'],
      odd: ['odd_conduct_catcher_8'],
      conduct_disorder: ['odd_conduct_catcher_8'],
      ied: ['odd_conduct_catcher_8'],
      aspd: ['odd_conduct_catcher_8', 'antisocial_catcher_7'],
      mci: ['cognitive_decline_catcher_8'],
      dementia: ['cognitive_decline_catcher_8'],
      bpd: ['borderline_catcher_9'],
      npd: ['narcissistic_catcher_7'],
      avoidant_pd: ['avoidant_dependent_catcher_8'],
      dependent_pd: ['avoidant_dependent_catcher_8'],
      did: ['dissociative_catcher_8'],
      dpdr: ['dissociative_catcher_8'],
      dissociative_amnesia: ['dissociative_catcher_8'],
      ssd: ['somatic_catcher_8'],
      iad: ['somatic_catcher_8'],
      fnd: ['somatic_catcher_8']
    },
    
    COMORBIDITY_RATES: {
      'mdd_gad': 0.60, 'mdd_ptsd': 0.48, 'mdd_ocd': 0.25, 'mdd_bpd': 0.40,
      'mdd_adhd_inattentive': 0.18, 'mdd_insomnia': 0.75, 'mdd_aud': 0.30,
      'gad_mdd': 0.65, 'gad_panic': 0.35, 'gad_ptsd': 0.30, 'gad_ocd': 0.28,
      'gad_ssd': 0.35, 'gad_insomnia': 0.60,
      'ptsd_mdd': 0.50, 'ptsd_did': 0.40, 'ptsd_aud': 0.35,
      'ptsd_bpd': 0.25, 'ptsd_nightmare_disorder': 0.80,
      'adhd_combined_gad': 0.50, 'adhd_combined_mdd': 0.40,
      'adhd_combined_asd': 0.30, 'adhd_inattentive_mdd': 0.45,
      'ocd_mdd': 0.30, 'ocd_gad': 0.40, 'ocd_tic': 0.30, 'ocd_tourette': 0.25,
      'bipolar_1_aud': 0.40, 'bipolar_2_gad': 0.35,
      'anorexia_nervosa_ocd': 0.30, 'bulimia_bpd': 0.25, 'bed_mdd': 0.45,
      'aud_mdd': 0.30, 'sud_aud': 0.40,
      'asd_adhd_combined': 0.30, 'asd_ocd': 0.20,
      'tic_ocd': 0.60, 'tic_adhd_combined': 0.50,
      'bpd_mdd': 0.55, 'bpd_ptsd': 0.30, 'bpd_did': 0.25,
      'npd_aspd': 0.25, 'aspd_sud': 0.60, 'aspd_conduct_disorder': 0.85,
      'did_ptsd': 0.95, 'did_bpd': 0.60,
      'ssd_gad': 0.40, 'ssd_mdd': 0.45,
      'insomnia_mdd': 0.60, 'insomnia_gad': 0.55, 'insomnia_ptsd': 0.75
    },
    
    DDX_RULES: {
      'mdd_vs_bipolar_2': { key_differentiator: 'past hypomanic episode', question: '과거 4일+ 이상 들뜬 기분/활력 시기?', weight_shift: 'If yes → bipolar_2' },
      'mdd_vs_bipolar_1': { key_differentiator: 'history of mania', question: '과거 조증 삽화? 입원?', weight_shift: 'If yes → bipolar_1' },
      'adhd_combined_vs_gad': { key_differentiator: 'onset age', question: '어린 시절부터? (ADHD) vs 최근? (GAD)', weight_shift: 'Childhood → adhd' },
      'ocd_vs_gad': { key_differentiator: 'specific obsessions vs diffuse worry', question: '특정 생각? (OCD) vs 여러 주제? (GAD)', weight_shift: 'Specific → ocd' },
      'ptsd_vs_mdd': { key_differentiator: 'trauma + re-experiencing', question: '외상 사건? 플래시백?', weight_shift: 'Yes → ptsd' },
      'adhd_combined_vs_mci': { key_differentiator: 'lifelong vs late-onset', question: '어린 시절? (ADHD) vs 최근 50+? (MCI)', weight_shift: 'Late → mci' },
      'bpd_vs_bipolar_2': { key_differentiator: 'mood swing duration', question: '시간 단위? (BPD) vs 일 단위? (Bipolar)', weight_shift: 'Hours → bpd' },
      'schizophrenia_vs_schizoaffective': { key_differentiator: 'mood duration', question: '기분 삽화 비중?', weight_shift: 'Major mood → schizoaffective' },
      'schizophrenia_vs_brief_psychotic': { key_differentiator: 'duration', question: '1개월 이내? (BPD) vs 6개월+?', weight_shift: 'Short + recovery → brief' },
      'asd_vs_social_anxiety': { key_differentiator: 'lifelong + rigid interests', question: '평생? (ASD) vs 특정 상황? (SA)', weight_shift: 'Lifelong → asd' },
      'did_vs_schizophrenia': { key_differentiator: 'internal vs external voices', question: '내 안? (DID) vs 외부? (SCZ)', weight_shift: 'Internal + trauma → did' },
      'dementia_vs_mdd': { key_differentiator: 'mood vs cognitive first', question: '우울 먼저? (pseudo) vs 인지 먼저?', weight_shift: 'Mood first → pseudo' },
      'anorexia_nervosa_vs_bulimia': { key_differentiator: 'BMI', question: 'BMI < 18.5?', weight_shift: 'Low BMI → anorexia' }
    },
    
    fuse(moduleResults, patientContext = {}) {
      if (!moduleResults || moduleResults.length === 0) return { error: 'No results' };
      
      const evidence = this._extractEvidence(moduleResults);
      const posteriors = this._computePosteriors(evidence, patientContext);
      const ranked = this._rankDiagnoses(posteriors);
      const comorbidities = this._detectComorbidities(ranked);
      const ddx = this._generateDDx(ranked);
      const crossPatterns = this._analyzeCrossModulePatterns(moduleResults);
      const safety = this._integrateSafety(moduleResults);
      const recommendations = this._generateRecommendations(ranked, comorbidities, ddx, safety);
      
      return {
        input_summary: { modules_used: moduleResults.map(r => r.module_id), module_count: moduleResults.length, patient_context: patientContext },
        evidence, posteriors, rankings: ranked, comorbidities,
        differential_diagnosis: ddx, cross_module_patterns: crossPatterns, safety, recommendations,
        timestamp: new Date().toISOString()
      };
    },
    
    _extractEvidence(moduleResults) {
      const evidence = {};
      const moduleDiagnoses = {};
      Object.keys(this.DIAGNOSIS_SOURCES).forEach(dx => {
        this.DIAGNOSIS_SOURCES[dx].forEach(mod => {
          if (!moduleDiagnoses[mod]) moduleDiagnoses[mod] = [];
          moduleDiagnoses[mod].push(dx);
        });
      });
      
      moduleResults.forEach(mr => {
        const { module_id, result } = mr;
        if (!result) return;
        const baseLikelihood = result.integration?.diagnostic_likelihood || 0.5;
        const totalScore = result.scoring?.total || 0;
        const severity = result.scoring?.level || 'minimal';
        const diagnoses = moduleDiagnoses[module_id] || [];
        
        diagnoses.forEach(dx => {
          if (!evidence[dx]) evidence[dx] = { sources: [] };
          evidence[dx].sources.push({
            module_id, score: totalScore, severity,
            likelihood: this._adjustLikelihood(baseLikelihood, dx, result)
          });
        });
      });
      
      Object.keys(evidence).forEach(dx => {
        const sources = evidence[dx].sources;
        evidence[dx].max_likelihood = Math.max(...sources.map(s => s.likelihood));
        evidence[dx].consensus = this._computeConsensus(sources);
      });
      return evidence;
    },
    
    _adjustLikelihood(base, dx, result) {
      if (dx.includes('inattentive') && result.lenses?.lens5?.dominant_subscale?.name === 'inattention') return Math.min(1, base * 1.2);
      if (dx.includes('hyperactive') && result.lenses?.lens5?.dominant_subscale?.name === 'hyperactivity_impulsivity') return Math.min(1, base * 1.2);
      if (dx === 'complex_ptsd') return base * 0.7;
      return base;
    },
    
    _computeConsensus(sources) {
      if (sources.length < 2) return 'single_source';
      const likelihoods = sources.map(s => s.likelihood);
      const range = Math.max(...likelihoods) - Math.min(...likelihoods);
      if (range < 0.15) return 'strong_consensus';
      if (range < 0.30) return 'moderate_consensus';
      return 'divergent';
    },
    
    _computePosteriors(evidence, patientContext) {
      const posteriors = {};
      Object.keys(evidence).forEach(dx => {
        const prior = this.PRIORS[dx] || 0.01;
        const likelihood = evidence[dx].max_likelihood || 0.5;
        let adjustedPrior = prior;
        if (patientContext.age < 18 && ['mci', 'dementia'].includes(dx)) adjustedPrior = 0.0001;
        if (patientContext.age > 65 && dx === 'adhd_combined') adjustedPrior = prior * 0.3;
        if (patientContext.age < 15 && ['bpd', 'npd', 'aspd'].includes(dx)) adjustedPrior = prior * 0.1;
        
        posteriors[dx] = {
          raw: likelihood * adjustedPrior,
          prior: adjustedPrior, likelihood,
          source_count: evidence[dx].sources.length,
          consensus: evidence[dx].consensus
        };
      });
      
      const totalRaw = Object.values(posteriors).reduce((a, b) => a + b.raw, 0);
      if (totalRaw > 0) Object.keys(posteriors).forEach(dx => { posteriors[dx].normalized = posteriors[dx].raw / totalRaw; });
      return posteriors;
    },
    
    _rankDiagnoses(posteriors) {
      const ranked = Object.keys(posteriors).map(dx => ({
        diagnosis: dx,
        diagnosis_ko: this._getDiagnosisKo(dx),
        posterior: posteriors[dx].normalized || 0,
        likelihood: posteriors[dx].likelihood,
        prior: posteriors[dx].prior,
        source_count: posteriors[dx].source_count,
        consensus: posteriors[dx].consensus,
        confidence: this._computeConfidence(posteriors[dx])
      })).sort((a, b) => b.posterior - a.posterior);
      
      ranked.forEach((item, i) => {
        item.rank = i + 1;
        if (item.posterior >= 0.25) item.label = 'primary';
        else if (item.posterior >= 0.10) item.label = 'secondary';
        else if (item.posterior >= 0.04) item.label = 'possible';
        else item.label = 'unlikely';
      });
      return ranked;
    },
    
    _computeConfidence(p) {
      let score = 0.5;
      if (p.source_count >= 2) score += 0.15;
      if (p.consensus === 'strong_consensus') score += 0.20;
      else if (p.consensus === 'divergent') score -= 0.15;
      if (p.likelihood > 0.8) score += 0.15;
      return Math.max(0, Math.min(1, score));
    },
    
    _getDiagnosisKo(dx) {
      const names = {
        mdd: '주요우울장애', bipolar_1: '제1형 양극성장애', bipolar_2: '제2형 양극성장애',
        gad: '범불안장애', panic: '공황장애', social_anxiety: '사회불안장애',
        adhd_combined: 'ADHD 복합형', adhd_inattentive: 'ADHD 주의력결핍형', adhd_hyperactive: 'ADHD 과잉행동형',
        ptsd: '외상후스트레스장애', acute_stress: '급성스트레스장애', complex_ptsd: '복합 PTSD',
        ocd: '강박장애', ocpd: '강박성 성격장애', bdd: '신체이형장애',
        schizophrenia: '조현병', schizoaffective: '조현정동장애', brief_psychotic: '단기 정신병 장애',
        insomnia: '불면장애', hypersomnia: '과다수면장애', sleep_apnea: '수면무호흡',
        circadian_disorder: '일주기 리듬 장애', delayed_sleep_phase: '지연성 수면위상',
        nightmare_disorder: '악몽장애', rbd: 'REM 수면행동장애',
        anorexia_nervosa: '신경성 식욕부진', bulimia: '신경성 폭식', bed: '폭식장애',
        aud: '알코올 사용장애', sud: '물질 사용장애',
        asd: '자폐스펙트럼장애', tic: '틱장애', tourette: '뚜렛 증후군', dyslexia: '난독증',
        odd: '적대적 반항장애', conduct_disorder: '품행장애', ied: '간헐성 폭발장애', aspd: '반사회성 성격장애',
        mci: '경도인지장애', dementia: '치매',
        bpd: '경계성 성격장애', npd: '자기애성 성격장애',
        avoidant_pd: '회피성 성격장애', dependent_pd: '의존성 성격장애',
        did: '해리성 정체감 장애', dpdr: '이인증/비현실감 장애', dissociative_amnesia: '해리성 기억상실',
        ssd: '신체증상장애', iad: '질병불안장애', fnd: '기능성 신경학적 장애'
      };
      return names[dx] || dx;
    },
    
    _detectComorbidities(ranked) {
      const comorbidities = [];
      if (ranked.length < 2) return comorbidities;
      const primary = ranked[0];
      
      for (let i = 1; i < Math.min(ranked.length, 6); i++) {
        const secondary = ranked[i];
        if (secondary.posterior < 0.10) continue;
        const pair1 = `${primary.diagnosis}_${secondary.diagnosis}`;
        const pair2 = `${secondary.diagnosis}_${primary.diagnosis}`;
        const rate = this.COMORBIDITY_RATES[pair1] || this.COMORBIDITY_RATES[pair2];
        
        if (rate && rate > 0.2) {
          comorbidities.push({
            primary: primary.diagnosis, secondary: secondary.diagnosis,
            primary_ko: primary.diagnosis_ko, secondary_ko: secondary.diagnosis_ko,
            known_rate: rate, both_detected: true,
            clinical_note: this._getComorbidityNote(primary.diagnosis, secondary.diagnosis)
          });
        } else if (secondary.posterior >= 0.15) {
          comorbidities.push({
            primary: primary.diagnosis, secondary: secondary.diagnosis,
            primary_ko: primary.diagnosis_ko, secondary_ko: secondary.diagnosis_ko,
            known_rate: null, both_detected: true,
            clinical_note: '공존 가능성 — 임상 평가 권장'
          });
        }
      }
      return comorbidities;
    },
    
    _getComorbidityNote(dx1, dx2) {
      const notes = {
        'mdd_gad': 'MDD-GAD 공존 흔함. 동시 치료.',
        'ptsd_mdd': 'PTSD+MDD 50%. 외상 치료 우선.',
        'adhd_combined_gad': 'ADHD+불안. 자극제 주의 — SNRI 고려.',
        'ocd_tic': 'OCD-Tic spectrum. 가족력 확인.',
        'did_ptsd': 'DID는 거의 항상 외상 기반. 단계적 치료.',
        'bpd_mdd': 'BPD+우울 흔함. DBT 고려.',
        'asd_adhd_combined': 'ASD+ADHD 30%. 둘 다 평가.',
        'insomnia_mdd': 'Insomnia→MDD 위험. CBT-I.',
        'aud_mdd': 'AUD+MDD. 자살 위험 ↑.',
        'bulimia_bpd': 'BN+BPD. DBT가 유용.',
        'aspd_sud': 'ASPD+SUD 공존 60%.'
      };
      return notes[`${dx1}_${dx2}`] || notes[`${dx2}_${dx1}`] || '임상 평가 권장.';
    },
    
    _generateDDx(ranked) {
      const ddx = [];
      if (ranked.length === 0) return ddx;
      const primary = ranked[0];
      
      Object.keys(this.DDX_RULES).forEach(ruleKey => {
        const rule = this.DDX_RULES[ruleKey];
        const [dx1, dx2] = ruleKey.split('_vs_');
        if (primary.diagnosis === dx1 || primary.diagnosis === dx2 ||
            primary.diagnosis.startsWith(dx1) || primary.diagnosis.startsWith(dx2)) {
          const otherDx = primary.diagnosis === dx1 ? dx2 : dx1;
          const otherRanked = ranked.find(r => r.diagnosis === otherDx || r.diagnosis.startsWith(otherDx));
          if (otherRanked && otherRanked.posterior > 0.04) {
            ddx.push({
              primary: primary.diagnosis, alternative: otherDx,
              key_differentiator: rule.key_differentiator,
              question_to_ask: rule.question, guidance: rule.weight_shift,
              urgency: otherRanked.posterior > 0.15 ? 'high' : 'moderate'
            });
          }
        }
      });
      return ddx;
    },
    
    _analyzeCrossModulePatterns(moduleResults) {
      const patterns = [];
      const highScoreModules = moduleResults.filter(mr => {
        const level = mr.result?.scoring?.level;
        return level && !level.includes('minimal') && !level.includes('normal') && !level.includes('unlikely');
      }).length;
      
      if (highScoreModules >= 3) {
        patterns.push({
          type: 'broad_psychopathology',
          description: `${highScoreModules}개 영역 높은 점수`,
          clinical_meaning: '복합 공존 진단 또는 성격장애 가능성. 종합 평가.'
        });
      }
      
      let criticalCount = 0;
      moduleResults.forEach(mr => { if (mr.result?.safety && !mr.result.safety.safe) criticalCount++; });
      if (criticalCount >= 1) {
        patterns.push({
          type: 'safety_concerns',
          description: `${criticalCount}개 모듈 안전 우려`,
          clinical_meaning: '즉시 안전 평가 필요'
        });
      }
      
      const hasAdhd = moduleResults.some(mr => mr.module_id === 'attend_catcher_18' && mr.result?.scoring?.total >= 25);
      const hasMdd = moduleResults.some(mr => mr.module_id === 'mood_catcher_9' && mr.result?.scoring?.total >= 10);
      if (hasAdhd && hasMdd) {
        patterns.push({
          type: 'adult_adhd_depression',
          description: '성인 ADHD + 우울',
          clinical_meaning: 'ADHD→이차 우울. 어린 시절 ADHD 병력 확인.'
        });
      }
      
      const hasMania = moduleResults.some(mr => mr.module_id === 'mania_catcher_7' && mr.result?.scoring?.total >= 12);
      const hasHypomania = moduleResults.some(mr => mr.module_id === 'hypomania_catcher_6' && mr.result?.scoring?.total >= 10);
      if (hasMdd && (hasMania || hasHypomania)) {
        patterns.push({
          type: 'bipolar_spectrum',
          description: '우울 + 조증/경조증 양상',
          clinical_meaning: '양극성 스펙트럼! 항우울제 단독 주의. 기분 안정제 고려.'
        });
      }
      
      const hasTrauma = moduleResults.some(mr => mr.module_id === 'trauma_catcher_20' && mr.result?.scoring?.total >= 33);
      const hasDiss = moduleResults.some(mr => mr.module_id === 'dissociative_catcher_8' && mr.result?.scoring?.total >= 11);
      if (hasTrauma && hasDiss) {
        patterns.push({
          type: 'complex_trauma_dissociation',
          description: 'PTSD + 해리 = 복합 외상',
          clinical_meaning: '단계적 외상 치료. 전문 치료자 필요.'
        });
      }
      
      return patterns;
    },
    
    _integrateSafety(moduleResults) {
      let maxAlertLevel = 'none';
      const safetyItems = [];
      const levelOrder = { 'none': 0, 'moderate': 1, 'high': 2, 'critical': 3 };
      moduleResults.forEach(mr => {
        if (mr.result?.safety) {
          const s = mr.result.safety;
          if (levelOrder[s.alert_level] > levelOrder[maxAlertLevel]) maxAlertLevel = s.alert_level;
          if (!s.safe) safetyItems.push({ module: mr.module_id, alert: s.alert_level, action: s.action_required, message: s.message_ko });
        }
      });
      return {
        max_alert_level: maxAlertLevel, items: safetyItems,
        overall_safe: maxAlertLevel === 'none',
        integrated_message: maxAlertLevel === 'none' ? '✅ 안전 위험 신호 없음' :
          maxAlertLevel === 'critical' ? '🚨 응급 평가 필요!' :
          maxAlertLevel === 'high' ? '⚠️ 높은 안전 위험' : '⚠️ 안전 평가 필요'
      };
    },
    
    _generateRecommendations(ranked, comorbidities, ddx, safety) {
      const recs = { immediate: [], diagnostic: [], treatment: [], follow_up: [], catcher_routing: null };
      
      if (!safety.overall_safe) {
        recs.immediate.push({ priority: 'critical', action: safety.integrated_message, details: safety.items });
      }
      
      const primary = ranked[0];
      if (primary && primary.posterior >= 0.20) {
        recs.diagnostic.push({
          priority: 'high',
          action: `주진단 평가: ${primary.diagnosis_ko} (${(primary.posterior * 100).toFixed(0)}%)`,
          next_steps: `Catcher 라우팅: ${this._getCatcherSuggestion(primary.diagnosis)}`
        });
        recs.catcher_routing = this._getCatcherSuggestion(primary.diagnosis);
      }
      
      ddx.forEach(d => {
        recs.diagnostic.push({
          priority: d.urgency,
          action: `감별: ${this._getDiagnosisKo(d.alternative)}`,
          next_steps: d.question_to_ask,
          differentiator: d.key_differentiator
        });
      });
      
      comorbidities.forEach(c => {
        recs.treatment.push({
          priority: 'moderate',
          action: `공존: ${c.primary_ko} + ${c.secondary_ko}`,
          details: c.clinical_note
        });
      });
      
      if (primary && primary.posterior >= 0.30) {
        const opts = this._getTreatmentOptions(primary.diagnosis);
        if (opts) recs.treatment.push({
          priority: 'informational',
          action: '치료 옵션 교육',
          details: opts,
          disclaimer: '⚠️ 의사 상담 필수'
        });
      }
      
      if (safety.max_alert_level === 'critical') recs.follow_up.push('📅 24시간 내 추적');
      else if (safety.max_alert_level === 'high' || (primary && primary.posterior >= 0.50)) recs.follow_up.push('📅 1주 내');
      else if (primary && primary.posterior >= 0.25) recs.follow_up.push('📅 2-4주 내');
      else recs.follow_up.push('📅 routine');
      
      return recs;
    },
    
    _getCatcherSuggestion(dx) {
      const routing = {
        adhd_combined: 'ADHD Catcher (available)',
        adhd_inattentive: 'ADHD Catcher (available)',
        adhd_hyperactive: 'ADHD Catcher (available)',
        mdd: 'MDD Catcher (planned)',
        gad: 'GAD Catcher (planned)',
        ptsd: 'PTSD Catcher (planned)',
        ocd: 'OCD Catcher (planned)',
        asd: 'ADOS 정식 평가',
        schizophrenia: '정신과 응급 평가',
        bpd: 'DBT 전문 치료'
      };
      return routing[dx] || '종합 평가 후 결정';
    },
    
    _getTreatmentOptions(dx) {
      const options = {
        mdd: {
          neurofeedback: '🧠 Alpha-Theta, FAA NFB (Boston Neuromind)',
          psychotherapy: '🧘 CBT, IPT',
          medication_classes: '💊 SSRI, SNRI',
          lifestyle: '🏃 운동, 수면 규칙화'
        },
        gad: {
          neurofeedback: '🧠 SMR, HRV Biofeedback',
          psychotherapy: '🧘 CBT, 마음챙김',
          medication_classes: '💊 SSRI, SNRI, 부스피론',
          lifestyle: '🏃 유산소'
        },
        ptsd: {
          neurofeedback: '🧠 Alpha-Theta (Boston Neuromind 특화)',
          psychotherapy: '🧘 EMDR, PE, CPT',
          medication_classes: '💊 SSRI FDA 승인',
          lifestyle: '🏃 요가'
        },
        adhd_combined: {
          neurofeedback: '🧠 SMR/Theta-Beta (Boston Neuromind 핵심!)',
          psychotherapy: '🧘 인지/실행 기능 훈련',
          medication_classes: '💊 자극제, 비자극제',
          lifestyle: '🏃 구조화'
        },
        ocd: {
          neurofeedback: '🧠 Frontal-Striatal NFB',
          psychotherapy: '🧘 ERP (1차)',
          medication_classes: '💊 SSRI 고용량',
          lifestyle: '🏃 스트레스 관리'
        },
        insomnia: {
          neurofeedback: '🧠 SMR (Boston Neuromind)',
          psychotherapy: '🧘 CBT-I (1차)',
          medication_classes: '💊 단기 수면제',
          lifestyle: '🏃 수면 위생'
        },
        bipolar_1: {
          neurofeedback: '🧠 Emotional regulation NFB',
          psychotherapy: '🧘 IPSRT',
          medication_classes: '💊 기분 안정제 (리튬 등)',
          lifestyle: '🏃 규칙적 리듬'
        },
        bpd: {
          neurofeedback: '🧠 Emotional regulation NFB',
          psychotherapy: '🧘 DBT (1차), MBT, TFP',
          medication_classes: '💊 Mood stabilizers',
          lifestyle: '🏃 운동, mindfulness'
        }
      };
      return options[dx] || null;
    }
  };
  
  if (typeof module !== 'undefined' && module.exports) module.exports = FusionEngine;
  else global.FusionEngine = FusionEngine;
})(typeof window !== 'undefined' ? window : global);
