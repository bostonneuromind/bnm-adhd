/**
 * ============================================================================
 * CLINICAL NARRATIVES — Phase B (priority 6 diagnoses + 6 modules)
 * ============================================================================
 * Source: CLINICAL_NARRATIVES.md (Claude draft, BCN-approved 2026-05-24)
 * Loaded by: triage.html, used by renderClinicalNarrative() helpers
 *
 * Diagnoses (6): adhd, mdd, gad, ptsd, insomnia, mci
 * Modules (6):   insomnia_catcher_8, attend_catcher_18, trauma_catcher_20,
 *                mood_catcher_9, anxi_catcher_7, obsess_catcher_10
 *
 * Phase C will add: 6 remaining diagnoses (adhd_inattentive, panic, ocd, asd,
 * bipolar_1, schizophrenia) + 25 remaining modules.
 * Missing entries render a "Phase C" placeholder fallback.
 * ============================================================================
 */

const CLINICAL_NARRATIVES = {
  _meta: {
    version: '1.0.0',
    last_updated: '2026-05-24',
    phase: 'B',
    diagnoses_count: 6,
    modules_count: 6
  },

  diagnoses: {

    // ========================================================================
    // ADHD - Combined Type
    // ========================================================================
    adhd: {
      dsm_definition: {
        ko: `DSM-5-TR 314.01 (F90.2) — ADHD 복합형. 부주의 증상 5개 이상 + 과잉행동·충동성 5개 이상 (17세 이상; 17세 미만은 각각 6개 이상). 12세 이전 발병. 2개 이상 환경(가정/학교/직장)에서 발현. 6개월 이상 지속, 사회적·학업적·직업적 기능에 명확한 손상.`,
        en: `DSM-5-TR 314.01 (F90.2) — ADHD Combined Presentation. ≥5 inattention AND ≥5 hyperactive-impulsive symptoms (age 17+; ≥6 each for <17). Onset before age 12. Present in ≥2 settings. ≥6 months, with clear social/academic/occupational impairment.`
      },
      core_symptoms: {
        ko: `• 주의 지속력 ↓ (sustained attention deficit) — 환자의 attention_score ↑가 이를 반영
• 작업 기억 ↓ (working memory deficit) — digit_span_back z=-1.2로 일치
• 행동 억제 ↓ (response inhibition deficit) — CPT 충동 오류 증가
• 처리 속도 변동성 ↑ (intra-individual variability) — CPT_rt_variability z=+2.0, 핵심 marker`,
        en: `• Sustained attention deficit — reflected in elevated attention_score
• Working memory deficit — digit_span_back z=-1.2 consistent
• Response inhibition deficit — CPT commission errors elevated
• Intra-individual response time variability — CPT_rt_variability z=+2.0, core marker`
      },
      neurophysiology: {
        ko: `Frontal θ/β > 2.5 = 전두엽 피질 저각성 (cortical underarousal), Default Mode Network 과활성 반영 (Arns 2013, Snyder 2008). Alpha peak frequency 둔화 = maturational lag (뇌 성숙 지연). P300 진폭 ↓ = 주의 자원 할당 결손, 잠복기 ↑ = 처리 속도 지연. CPT 반응시간 변동성 ↑ = 가장 robust한 ADHD endophenotype (Faraone 2015). RMSSD 경미 저하 = parasympathetic regulation 미세 결손.`,
        en: `Frontal θ/β > 2.5 = cortical underarousal, reflecting Default Mode Network hyperactivity (Arns 2013, Snyder 2008). Slowed alpha peak frequency = maturational lag. P300 amplitude ↓ = attention resource allocation deficit; latency ↑ = processing speed delay. CPT RT variability ↑ = most robust ADHD endophenotype (Faraone 2015). Mild RMSSD reduction = subtle parasympathetic regulation deficit.`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): 핵심 EEG marker (theta/beta ratio, alpha peak), 행동 점수, CPT 변동성이 모두 일치. 임상 진단을 강력하게 지지. 즉시 치료 계획 수립 가능.`,
          en: `Strong Match (≥85%): Core EEG markers (theta/beta, alpha peak), behavioral scores, and CPT variability all align. Strongly supports clinical diagnosis. Treatment planning can proceed.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): 일부 marker 일치하나 다른 marker 부재 또는 측정 ❌. 추가 객관적 측정 (CPT, full QEEG) 권장. 단독으로 진단 결정 ❌.`,
          en: `Moderate Match (65-84%): Some markers align, others absent or unmeasured. Additional objective testing (CPT, full QEEG) recommended. Not sufficient for diagnosis alone.`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분 일치 또는 데이터 부족. 진단 미정 — 전체 평가 배터리 필요. 다른 진단(GAD, MDD, MCI) 가능성도 함께 평가.`,
          en: `Weak Match (40-64%): Partial alignment or insufficient data. Diagnosis undetermined — full evaluation battery needed. Also screen for alternative diagnoses (GAD, MDD, MCI).`
        }
      },
      differential_diagnosis: {
        ko: `• vs ASD: 사회적 인지 결손 부재 → ADHD; 사회 의사소통 결손 우세 → ASD (공존 흔함)
• vs MDD: anhedonia/우울 기분 우세 → MDD; 주의 결손 평생 → ADHD
• vs MCI: 12세 이전 발병 → ADHD; 후기 발병 + 인지 저하 → MCI
• vs GAD: 걱정 패턴 우세 → GAD; 외부 자극 분산 → ADHD (공존 30%+)
• vs Bipolar: mania/hypomania episode → Bipolar; chronic 만성 → ADHD
• vs Substance use: 약물 사용 stopped 후에도 지속 시 → ADHD`,
        en: `• vs ASD: Social cognition preserved → ADHD; social communication deficit predominant → ASD
• vs MDD: Anhedonia/depressed mood predominant → MDD; lifelong attention deficit → ADHD
• vs MCI: Onset before 12 → ADHD; late-life onset with decline → MCI
• vs GAD: Worry-driven → GAD; external distractibility → ADHD (>30% comorbid)
• vs Bipolar: Discrete mood episodes → Bipolar; chronic baseline → ADHD
• vs Substance use: Persists after substance cessation → ADHD`
      },
      recommended_additional: {
        ko: `• Conners CPT-3 (객관적 주의 변동성)
• Full 19-channel QEEG with frontal theta/beta + FAA 정량화
• 발달력 인터뷰 (부모/배우자 보고)
• 학교/직장 기록 (12세 이전 증상 확인)
• Conners-3 또는 BAARS-IV (행동 평가)
• 동반 평가: GAD-7, PHQ-9, sleep screen`,
        en: `• Conners CPT-3 (objective RT variability)
• Full 19-channel QEEG with frontal theta/beta + FAA quantification
• Developmental history interview (parent/spouse report)
• School/work records (confirm pre-age-12 symptoms)
• Conners-3 or BAARS-IV (behavioral rating)
• Comorbidity screen: GAD-7, PHQ-9, sleep screen`
      },
      treatment_options: {
        ko: `• 뉴로피드백: SMR↑ (C3/C4) + theta↓ (Fz) 프로토콜, 30-40 sessions (Arns 2014 meta)
• 인지 훈련: working memory training (Cogmed, 25 sessions)
• HRV biofeedback: RMSSD < 30ms 시 (자율신경 회복)
• 약물 평가: methylphenidate/amphetamine 평가 위해 정신과 referral
• 행동 개입: 환경 조정, 시간 관리, 외부 보조 도구
• 동반 평가: 수면, 영양, 운동 (유산소 30min × 5/주)`,
        en: `• Neurofeedback: SMR↑ (C3/C4) + theta↓ (Fz) protocol, 30-40 sessions (Arns 2014 meta)
• Cognitive training: working memory (Cogmed, 25 sessions)
• HRV biofeedback: if RMSSD < 30ms (autonomic regulation)
• Medication evaluation: psychiatric referral for stimulant assessment
• Behavioral: environmental modifications, time management, external scaffolds
• Lifestyle: sleep optimization, nutrition, aerobic exercise (30min × 5/week)`
      }
    },

    // ========================================================================
    // MDD - Major Depressive Disorder
    // ========================================================================
    mdd: {
      dsm_definition: {
        ko: `DSM-5-TR 296.2x/296.3x (F32/F33) — 주요우울장애. 9개 증상 중 5개 이상 (반드시 우울 기분 또는 흥미 상실 포함), 2주 이상, 거의 매일 종일 지속. 사회적·직업적 기능에 명확한 손상. 양극성 episode 부재, 약물/의학적 원인 배제.`,
        en: `DSM-5-TR 296.2x/296.3x (F32/F33) — Major Depressive Disorder. ≥5 of 9 symptoms (must include depressed mood OR anhedonia), ≥2 weeks, nearly every day, most of the day. Clear social/occupational impairment. No history of mania/hypomania. Rule out substance/medical causes.`
      },
      core_symptoms: {
        ko: `• 우울 기분 또는 흥미·즐거움 상실 (anhedonia) — MDD 핵심
• 수면 변화 (불면 또는 과다수면)
• 식욕/체중 변화 (감소 또는 증가)
• 피로 또는 에너지 상실
• 무가치감 또는 과도한 죄책감
• 집중력 저하 또는 결정 곤란
• 정신운동 초조 또는 지연
• 반복적 죽음/자살 사고`,
        en: `• Depressed mood OR loss of interest/pleasure (anhedonia) — core
• Sleep changes (insomnia or hypersomnia)
• Appetite/weight changes
• Fatigue or loss of energy
• Feelings of worthlessness or excessive guilt
• Concentration deficit or indecisiveness
• Psychomotor agitation or retardation
• Recurrent thoughts of death/suicide`
      },
      neurophysiology: {
        ko: `Frontal Alpha Asymmetry (FAA) 좌측 hypoactivation = 접근 동기 결손, 우울증 hallmark (Henriques & Davidson 1991). Alpha power Pz ↑ = 인지적 disengagement, cortical idling. Alpha peak 둔화 = 처리 속도 지연 (Cook 1999). RMSSD ↓ = vagal tone 저하, 우울증의 vagal hypothesis (Thayer 2012; meta-analysis). HRV 저하 = 심혈관 위험 증가. CPT RT 변동성 경미 ↑ = 인지 통제 결손.`,
        en: `Frontal Alpha Asymmetry (FAA) leftward hypoactivation = approach motivation deficit, hallmark of depression (Henriques & Davidson 1991). Alpha power Pz ↑ = cognitive disengagement, cortical idling. Alpha peak slowing (Cook 1999). RMSSD ↓ = vagal tone reduction; vagal hypothesis of depression (Thayer 2012 meta-analysis). HRV reduction also predicts cardiovascular risk. Mild CPT RT variability ↑ = cognitive control deficit.`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): FAA + RMSSD + 우울 점수 모두 일치. 신경생물학적 우울증 표지가 명확. 즉시 치료 + 자살 위험 평가 필수.`,
          en: `Strong Match (≥85%): FAA + RMSSD + depression scores all align. Clear neurobiological depression signature. Immediate treatment + suicide risk assessment essential.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): FAA 또는 HRV 일치, 일부 marker 부재. Bipolar 감별 위해 mania 과거력 평가 필수.`,
          en: `Moderate Match (65-84%): FAA OR HRV aligned, some markers absent. Mandatory mania history screen to rule out Bipolar.`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분 일치. Adjustment disorder, dysthymia, 또는 medical 원인 (갑상선, B12, vitD) 평가 필요.`,
          en: `Weak Match (40-64%): Partial alignment. Evaluate adjustment disorder, dysthymia, or medical causes (thyroid, B12, vitD).`
        }
      },
      differential_diagnosis: {
        ko: `• vs Bipolar I/II: mania/hypomania 과거력 → Bipolar (MDQ 필수)
• vs Persistent Depressive (Dysthymia): 2년 이상 chronic 저강도 → PDD
• vs Adjustment Disorder: 스트레스 요인 명확 + 6개월 내 발병
• vs GAD: worry 우세 → GAD; anhedonia 우세 → MDD (공존 60%+)
• vs Pseudodementia: 노년 인지 호소 + 우울 → MDD 치료 후 인지 회복
• vs Medical: 갑상선저하, B12/folate 결핍, vitD ↓, 약물 부작용 배제
• vs Bereavement: 정상 사별 vs 병적 grief 구분`,
        en: `• vs Bipolar I/II: History of mania/hypomania → Bipolar (MDQ mandatory)
• vs Persistent Depressive Disorder: ≥2 years chronic low-grade → PDD
• vs Adjustment Disorder: Clear stressor + onset within 6 months
• vs GAD: Worry-predominant → GAD; anhedonia-predominant → MDD (>60% comorbid)
• vs Pseudodementia: Elderly with cognitive complaints + depression → MDD; cognition recovers with treatment
• vs Medical: Rule out hypothyroidism, B12/folate, vitD, medication effects
• vs Bereavement: Distinguish normal grief from pathological`
      },
      recommended_additional: {
        ko: `• PHQ-9 또는 BDI-II (자가 보고)
• C-SSRS 또는 Columbia 자살 위험 평가 (필수)
• MDQ (Mood Disorder Questionnaire — bipolar 감별)
• 갑상선 (TSH), B12, folate, vitD, CBC referral
• EEG with FAA 정량화 (F3/F4 alpha asymmetry)
• HRV 24h (resting RMSSD + autonomic profile)
• 인지 평가 (pseudodementia 의심 시)`,
        en: `• PHQ-9 or BDI-II (self-report)
• C-SSRS or Columbia suicide risk assessment (mandatory)
• MDQ (Mood Disorder Questionnaire — bipolar rule-out)
• TSH, B12, folate, vitD, CBC referral
• EEG with FAA quantification (F3/F4 alpha asymmetry)
• HRV 24h (resting RMSSD + autonomic profile)
• Cognitive assessment (if pseudodementia suspected)`
      },
      treatment_options: {
        ko: `• FAA 뉴로피드백: F4 alpha ↑ 또는 F3 alpha ↓ (좌측 접근 시스템 활성화), 20-40 sessions (Baehr 2001 protocol)
• HRV biofeedback: resonance frequency breathing (~6 breaths/min), RMSSD 회복
• CBT / Behavioral Activation referral (1차 권고)
• 운동 처방: 유산소 30-45min × 3-5/주 (항우울 효과 SSRI 비견)
• 약물 평가: 정신과 referral (SSRI/SNRI)
• 광 치료: 계절성 패턴 시
• 안전 계획: 자살 사고 ≥1 시 즉시`,
        en: `• FAA Neurofeedback: F4 alpha ↑ or F3 alpha ↓ (left approach system activation), 20-40 sessions (Baehr 2001 protocol)
• HRV biofeedback: resonance frequency breathing (~6 breaths/min), RMSSD recovery
• CBT / Behavioral Activation referral (first-line)
• Exercise prescription: aerobic 30-45min × 3-5/week (effect size comparable to SSRI)
• Medication evaluation: psychiatric referral (SSRI/SNRI)
• Light therapy: if seasonal pattern
• Safety planning: mandatory if suicidal ideation ≥1`
      }
    },

    // ========================================================================
    // GAD - Generalized Anxiety Disorder
    // ========================================================================
    gad: {
      dsm_definition: {
        ko: `DSM-5-TR 300.02 (F41.1) — 범불안장애. 다양한 사건/활동에 대한 과도한 불안과 걱정, 6개월 이상, 통제 어려움. 6가지 신체/심리 증상 중 3개 이상 (성인; 아동 1개 이상): 안절부절, 쉽게 피로, 집중 곤란, 과민성, 근육 긴장, 수면 곤란. 기능 손상.`,
        en: `DSM-5-TR 300.02 (F41.1) — Generalized Anxiety Disorder. Excessive anxiety and worry about multiple events/activities, ≥6 months, difficult to control. ≥3 of 6 symptoms (adults; ≥1 children): restlessness, easily fatigued, concentration difficulty, irritability, muscle tension, sleep disturbance. Functional impairment.`
      },
      core_symptoms: {
        ko: `• 통제 안 되는 만성 걱정 (uncontrollable worry) — 핵심
• 안절부절못함 또는 긴장감
• 쉽게 피로해짐
• 집중 곤란, 마음이 텅 비는 느낌
• 과민성
• 근육 긴장 (목, 어깨, 두통)
• 수면 곤란 (입면 또는 유지)`,
        en: `• Chronic uncontrollable worry — core
• Restlessness or feeling on edge
• Easily fatigued
• Concentration difficulty, mind going blank
• Irritability
• Muscle tension (neck, shoulders, headaches)
• Sleep disturbance (onset or maintenance)`
      },
      neurophysiology: {
        ko: `Beta power Cz ↑ = cortical hyperarousal, 인지적 over-activation (Hannesdóttir 2010). Alpha power Pz ↓ = 휴식 시 disengagement 불능, 지속적 cognitive engagement. Frontal alpha asymmetry 경미 좌측 → 우울 동반 가능성. RMSSD ↓ + SDNN ↓ = parasympathetic withdrawal. LF/HF ratio ↑ = sympathetic dominance, 자율신경 불균형 (Kemp 2010 meta). 이 패턴 = "always on" 상태, GAD의 핵심 자율신경 특징.`,
        en: `Beta power Cz ↑ = cortical hyperarousal, cognitive over-activation (Hannesdóttir 2010). Alpha power Pz ↓ = inability to disengage at rest, persistent cognitive engagement. Mild leftward frontal alpha asymmetry → possible depression comorbidity. RMSSD ↓ + SDNN ↓ = parasympathetic withdrawal. LF/HF ratio ↑ = sympathetic dominance, autonomic imbalance (Kemp 2010 meta). Pattern reflects "always on" state, hallmark of GAD.`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): Beta↑ + alpha↓ + HRV 저하 + 불안 점수 모두 일치. 자율신경 과활성 패턴 명확. 치료 우선순위: HRV-BFB + alpha training.`,
          en: `Strong Match (≥85%): Beta↑ + alpha↓ + HRV reduction + anxiety scores all align. Clear autonomic hyperarousal pattern. Treatment priority: HRV-BFB + alpha training.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): EEG 또는 HRV 한쪽만 일치. Panic disorder 감별 위해 acute attack 과거력 평가.`,
          en: `Moderate Match (65-84%): EEG OR HRV partially aligned. Screen panic attack history to rule out Panic Disorder.`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분 일치. PTSD (trauma 과거력), specific phobia, social anxiety 감별 필요.`,
          en: `Weak Match (40-64%): Partial alignment. Rule out PTSD (trauma history), specific phobia, social anxiety disorder.`
        }
      },
      differential_diagnosis: {
        ko: `• vs Panic Disorder: discrete acute attacks → Panic; chronic baseline worry → GAD
• vs MDD: anhedonia/저에너지 우세 → MDD; worry 우세 → GAD (공존 60%+)
• vs PTSD: trauma 연결된 hypervigilance → PTSD; 광범위한 worry → GAD
• vs OCD: intrusive thoughts ego-dystonic + ritual → OCD; ego-syntonic worry → GAD
• vs Specific Phobia: 특정 자극에 한정 → Phobia; 다양한 영역 → GAD
• vs Hyperthyroid/Pheochromocytoma: 의학적 원인 배제 (TSH, catecholamines)`,
        en: `• vs Panic Disorder: Discrete acute attacks → Panic; chronic baseline worry → GAD
• vs MDD: Anhedonia/low energy predominant → MDD; worry predominant → GAD (>60% comorbid)
• vs PTSD: Trauma-linked hypervigilance → PTSD; broad worry → GAD
• vs OCD: Ego-dystonic intrusions + rituals → OCD; ego-syntonic worry → GAD
• vs Specific Phobia: Limited to specific stimulus → Phobia; broad domains → GAD
• vs Medical (hyperthyroid, pheochromocytoma): rule out (TSH, catecholamines)`
      },
      recommended_additional: {
        ko: `• GAD-7 (gold standard 자가 보고)
• PSWQ (Penn State Worry Questionnaire — worry 특성 정량화)
• PDSS (Panic Disorder Severity — panic 감별)
• HRV 24h (resting + paced breathing)
• TSH (갑상선 항진 배제)
• Polysomnography (수면 동반 시)
• 카페인/약물 사용 평가`,
        en: `• GAD-7 (gold standard self-report)
• PSWQ (Penn State Worry Questionnaire — quantify worry trait)
• PDSS (Panic Disorder Severity — rule out panic)
• HRV 24h (resting + paced breathing)
• TSH (rule out hyperthyroid)
• Polysomnography (if sleep comorbidity)
• Caffeine/substance use evaluation`
      },
      treatment_options: {
        ko: `• Alpha uptraining 뉴로피드백: Pz/Oz alpha ↑, 20-30 sessions
• HRV biofeedback: resonance frequency breathing (~6/min), vagal tone 회복 (1차)
• CBT (worry exposure, cognitive restructuring) referral
• MBSR / mindfulness (8주 프로그램)
• Progressive Muscle Relaxation (PMR) 일일 훈련
• 약물 평가: 정신과 referral (SSRI/SNRI 또는 buspirone)
• 카페인 제한 (<200mg/day), 운동 처방`,
        en: `• Alpha uptraining neurofeedback: Pz/Oz alpha ↑, 20-30 sessions
• HRV biofeedback: resonance frequency breathing (~6/min), vagal tone recovery (first-line)
• CBT (worry exposure, cognitive restructuring) referral
• MBSR / mindfulness (8-week program)
• Progressive Muscle Relaxation (PMR) daily
• Medication evaluation: psychiatric referral (SSRI/SNRI or buspirone)
• Caffeine restriction (<200mg/day), exercise prescription`
      }
    },

    // ========================================================================
    // PTSD - Post-Traumatic Stress Disorder
    // ========================================================================
    ptsd: {
      dsm_definition: {
        ko: `DSM-5-TR 309.81 (F43.10) — 외상후스트레스장애. Criterion A: 실제 또는 위협적 죽음/심각한 손상/성폭력에 노출. 4개 증상군 모두: ≥1 B(재경험), ≥1 C(회피), ≥2 D(인지·정서), ≥2 E(과각성). 1개월 이상 지속, 기능 손상. 약물/의학적 원인 배제.`,
        en: `DSM-5-TR 309.81 (F43.10) — PTSD. Criterion A: exposure to actual or threatened death, serious injury, or sexual violence. ALL 4 symptom clusters: ≥1 B (intrusion), ≥1 C (avoidance), ≥2 D (negative cognitions/mood), ≥2 E (arousal/reactivity). ≥1 month, functional impairment. Rule out substance/medical.`
      },
      core_symptoms: {
        ko: `• B 재경험: flashback, 악몽, 침습적 기억, 외상 연상 시 강한 신체 반응
• C 회피: 외상 관련 생각/감정 회피, 사람/장소/활동 회피
• D 인지·정서: 자기/타인/세상에 대한 부정적 신념, 죄책감, 정서 마비, 분리감
• E 과각성: hypervigilance, 과장된 놀람 반응, 짜증/분노 폭발, 수면 곤란, 집중 곤란, 무모한 행동`,
        en: `• B Intrusion: flashbacks, nightmares, intrusive memories, intense physical reactions to reminders
• C Avoidance: of trauma-related thoughts/feelings, people/places/activities
• D Cognitions/Mood: negative beliefs about self/others/world, guilt, emotional numbing, detachment
• E Arousal: hypervigilance, exaggerated startle, irritability/anger, sleep disturbance, concentration deficit, reckless behavior`
      },
      neurophysiology: {
        ko: `Alpha power Pz 심한 ↓ (z=-2.0) = posterior cortical hyperarousal, "ready for threat" 상태 (Wahbeh 2013). Beta Cz ↑ = 지속적 cortical activation. Frontal alpha asymmetry ↓ = 좌측 hypoactivation (우울 동반). RMSSD ↓↓ (z=-2.5) + SDNN ↓↓ = severe autonomic dysregulation, vagal tone 붕괴 (Sripada 2013 meta-analysis). 이 HRV 패턴 = PTSD의 가장 robust한 자율신경 marker. 수면 장애 (REM 분열) 흔함.`,
        en: `Alpha power Pz severely ↓ (z=-2.0) = posterior cortical hyperarousal, "ready for threat" state (Wahbeh 2013). Beta Cz ↑ = sustained cortical activation. FAA ↓ = leftward hypoactivation (depression comorbidity). RMSSD ↓↓ (z=-2.5) + SDNN ↓↓ = severe autonomic dysregulation, vagal collapse (Sripada 2013 meta-analysis). This HRV pattern is the most robust autonomic marker of PTSD. Sleep disturbance (REM fragmentation) common.`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): Alpha 억제 + 심한 HRV 저하 + PTSD 점수 + 수면 곤란 모두 일치. 외상 노출 과거력 + 4 cluster 충족 확인 → 진단 강력 지지. 즉시 trauma-focused 치료 시작.`,
          en: `Strong Match (≥85%): Alpha suppression + severe HRV reduction + PTSD scores + sleep disturbance all align. Confirm trauma exposure history + all 4 clusters → strong diagnostic support. Begin trauma-focused treatment immediately.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): 일부 marker 일치. Acute Stress Disorder (<1개월) 또는 Adjustment Disorder 감별 필요. CPTSD 가능성 평가.`,
          en: `Moderate Match (65-84%): Some markers align. Rule out Acute Stress Disorder (<1 month) or Adjustment. Assess for CPTSD.`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분 일치. Dissociative Disorder, Panic, MDD with trauma history 감별 필요. 외상 노출 자세히 평가.`,
          en: `Weak Match (40-64%): Partial alignment. Rule out Dissociative Disorder, Panic, MDD with trauma history. Detailed trauma exposure interview needed.`
        }
      },
      differential_diagnosis: {
        ko: `• vs Acute Stress Disorder: <1개월 → ASD; ≥1개월 → PTSD
• vs CPTSD (ICD-11): + Disturbances in Self-Organization (정서조절·관계·자기개념) → CPTSD (만성·반복 외상)
• vs Dissociative Disorders: 해리 증상 우세 → DID/DDNOS
• vs MDD with trauma history: 핵심 PTSD 증상군 없으면 → MDD
• vs Panic Disorder: discrete panic + trauma 무관 → Panic
• vs Adjustment Disorder: 비-외상 스트레스 + PTSD 기준 미충족
• vs Borderline PD: trauma 흔하나 정체성·관계 불안정 + 자해 → BPD`,
        en: `• vs Acute Stress Disorder: <1 month → ASD; ≥1 month → PTSD
• vs CPTSD (ICD-11): + Disturbances in Self-Organization (affect regulation, relationships, self-concept) → CPTSD (chronic/repeated trauma)
• vs Dissociative Disorders: predominant dissociation → DID/DDNOS
• vs MDD with trauma history: no core PTSD symptom clusters → MDD
• vs Panic Disorder: discrete panic unrelated to trauma → Panic
• vs Adjustment Disorder: non-traumatic stressor + PTSD criteria unmet
• vs Borderline PD: trauma common but identity/relationship instability + self-harm → BPD`
      },
      recommended_additional: {
        ko: `• CAPS-5 (Clinician-Administered PTSD Scale — gold standard)
• PCL-5 (자가 보고)
• DES-II (Dissociative Experiences — dissociation 평가)
• HRV 24h (resting + reactivity)
• Alpha topographic mapping
• 동반 평가: MDD (PHQ-9), substance use, suicide risk
• Polysomnography (수면 분열 의심 시)`,
        en: `• CAPS-5 (Clinician-Administered PTSD Scale — gold standard)
• PCL-5 (self-report)
• DES-II (Dissociative Experiences — assess dissociation)
• HRV 24h (resting + reactivity)
• Alpha topographic mapping
• Comorbidity: MDD (PHQ-9), substance use, suicide risk
• Polysomnography (if sleep fragmentation suspected)`
      },
      treatment_options: {
        ko: `• Alpha-theta 뉴로피드백 (Peniston-Kulkosky protocol — PTSD/중독 evidence base)
• HRV biofeedback: vagal tone 회복 핵심, resonance frequency breathing
• EMDR referral (1차 권고, APA guideline)
• Trauma-focused CBT (Prolonged Exposure 또는 Cognitive Processing Therapy) referral
• Mindfulness/MBSR (보조)
• 약물 평가: 정신과 referral (SSRI 1차, prazosin 악몽 시)
• 안전 계획 + 위기 자원`,
        en: `• Alpha-theta neurofeedback (Peniston-Kulkosky protocol — PTSD/addiction evidence base)
• HRV biofeedback: vagal tone recovery essential, resonance frequency breathing
• EMDR referral (first-line, APA guideline)
• Trauma-focused CBT (Prolonged Exposure or Cognitive Processing Therapy) referral
• Mindfulness/MBSR (adjunctive)
• Medication evaluation: psychiatric referral (SSRI first-line, prazosin for nightmares)
• Safety planning + crisis resources`
      }
    },

    // ========================================================================
    // Insomnia Disorder
    // ========================================================================
    insomnia: {
      dsm_definition: {
        ko: `DSM-5-TR 780.52 (G47.00) — 불면장애. 입면 곤란, 수면 유지 곤란, 또는 조기각성 후 재입면 불가능 중 하나 이상. 주 3회 이상, 3개월 이상. 충분한 sleep opportunity에도 불구하고 발생. 주간 기능 손상 (피로, 집중↓, 기분 변화 등). 다른 수면장애나 약물 효과로 설명 ❌.`,
        en: `DSM-5-TR 780.52 (G47.00) — Insomnia Disorder. ≥1 of: difficulty initiating sleep, maintaining sleep, or early-morning awakening with inability to return to sleep. ≥3 nights/week, ≥3 months. Occurs despite adequate sleep opportunity. Daytime impairment (fatigue, concentration↓, mood changes). Not explained by other sleep disorder or substance.`
      },
      core_symptoms: {
        ko: `• 입면 잠복 시간 > 30분 (sleep onset latency)
• 야간 각성 후 재입면 곤란 (wake after sleep onset, WASO > 30min)
• 의도한 시간보다 일찍 깨어 재입면 불가능
• 주간 피로, 졸음, 집중력 저하
• 수면에 대한 불안 (sleep-related anxiety)
• 침대에서 시계 보기, 잠 못 잘 것 같은 예기 불안`,
        en: `• Sleep onset latency > 30 min
• Wake after sleep onset (WASO > 30 min) with difficulty returning
• Early-morning awakening earlier than intended
• Daytime fatigue, sleepiness, concentration deficit
• Sleep-related anxiety
• Clock-watching, anticipatory anxiety about sleep`
      },
      neurophysiology: {
        ko: `Beta power Cz ↑ pre-sleep = cognitive hyperarousal, "racing thoughts" 신경 substrate (Riemann 2010). Alpha peak 둔화 = 각성도 조절 결손. RMSSD ↓ pre-sleep = sympathetic dominance, parasympathetic disengagement 실패 (Bonnet & Arand 1998). High-frequency EEG (>16Hz) during sleep onset = "hyperarousal model" of insomnia (Perlis 2001). QEEG 24h beta 비율 = treatment response 예측 가능.`,
        en: `Beta power Cz ↑ pre-sleep = cognitive hyperarousal, neural substrate of "racing thoughts" (Riemann 2010). Alpha peak slowing = arousal regulation deficit. RMSSD ↓ pre-sleep = sympathetic dominance, failure of parasympathetic disengagement (Bonnet & Arand 1998). High-frequency EEG (>16Hz) during sleep onset = "hyperarousal model" (Perlis 2001). 24h beta ratio = treatment response predictor.`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): Beta ↑ + HRV ↓ + 수면 점수 + 만성 패턴 모두 일치. Primary insomnia 강력 지지. CBT-I 즉시 시작.`,
          en: `Strong Match (≥85%): Beta ↑ + HRV ↓ + sleep scores + chronic pattern all align. Strong support for primary insomnia. Initiate CBT-I.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): 일부 marker 일치. Sleep apnea, circadian disorder 감별 필요. Comorbid insomnia (MDD/GAD 동반) 평가.`,
          en: `Moderate Match (65-84%): Some markers align. Rule out sleep apnea, circadian disorder. Assess comorbid insomnia (MDD/GAD).`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분 일치. 다른 수면장애 (apnea, RLS, narcolepsy) 또는 medical 원인 (갑상선, pain) 평가 필요.`,
          en: `Weak Match (40-64%): Partial alignment. Rule out other sleep disorders (apnea, RLS, narcolepsy) or medical causes (thyroid, pain).`
        }
      },
      differential_diagnosis: {
        ko: `• vs Obstructive Sleep Apnea: 코골이 + 호흡 정지 + 주간 졸음 → OSA (PSG 필수)
• vs Circadian Rhythm Disorders: sleep timing 변화 (지연/전진형) → CRSD
• vs Restless Legs Syndrome: 다리 불편감 + 움직임 욕구 → RLS
• vs Hypersomnia: 반대 패턴 (과다 수면 + 주간 졸음)
• vs Anxiety-related: GAD 우세 → GAD with insomnia
• vs Depression-related: 조기각성 + anhedonia → MDD with insomnia
• vs Substance-induced: 카페인, 알코올, 약물 효과 배제`,
        en: `• vs Obstructive Sleep Apnea: snoring + apnea + daytime sleepiness → OSA (PSG required)
• vs Circadian Rhythm Disorders: sleep timing shifted (delayed/advanced) → CRSD
• vs Restless Legs Syndrome: leg discomfort + urge to move → RLS
• vs Hypersomnia: opposite pattern (excessive sleep + daytime sleepiness)
• vs Anxiety-related: GAD predominant → GAD with insomnia
• vs Depression-related: early-morning awakening + anhedonia → MDD with insomnia
• vs Substance-induced: rule out caffeine, alcohol, medications`
      },
      recommended_additional: {
        ko: `• 2주 sleep diary (consensus 권장)
• Actigraphy 14일 (객관적 sleep pattern)
• PSG (sleep apnea/RLS 의심 시)
• sleep_apnea_catcher_7 ≥15 시 PSG 필수
• HRV 24h (resting + pre-sleep)
• 동반 평가: GAD-7, PHQ-9, MDQ
• 갑상선 (TSH), iron (RLS 의심 시 ferritin)`,
        en: `• 2-week sleep diary (consensus recommended)
• Actigraphy 14 days (objective sleep pattern)
• PSG (if sleep apnea/RLS suspected)
• PSG mandatory if sleep_apnea_catcher_7 ≥15
• HRV 24h (resting + pre-sleep)
• Comorbidity: GAD-7, PHQ-9, MDQ
• Thyroid (TSH), iron/ferritin (if RLS suspected)`
      },
      treatment_options: {
        ko: `• CBT-I (1차 권고, AASM guideline): stimulus control + sleep restriction + cognitive restructuring + sleep hygiene
• SMR 뉴로피드백 (C4/Cz, 12-15Hz uptraining), 20+ sessions (Hauri 1981 evidence base)
• HRV biofeedback 취침 전 (resonance breathing)
• Sleep hygiene 교육 (모든 환자)
• 광 노출 (아침 햇빛 30min) — circadian 정렬
• 약물 평가: 정신과 referral (단기 hypnotics, 만성에는 ❌)
• Mindfulness for insomnia`,
        en: `• CBT-I (first-line, AASM guideline): stimulus control + sleep restriction + cognitive restructuring + sleep hygiene
• SMR neurofeedback (C4/Cz, 12-15Hz uptraining), 20+ sessions (Hauri 1981 evidence base)
• HRV biofeedback pre-sleep (resonance breathing)
• Sleep hygiene education (all patients)
• Light exposure (morning sunlight 30 min) — circadian alignment
• Medication evaluation: psychiatric referral (short-term hypnotics, not for chronic)
• Mindfulness for insomnia`
      }
    },

    // ========================================================================
    // MCI - Mild Neurocognitive Disorder
    // ========================================================================
    mci: {
      dsm_definition: {
        ko: `DSM-5-TR 331.83 (G31.84) — 경도신경인지장애. 1개 이상 인지 영역(주의, 실행기능, 학습/기억, 언어, 시공간, 사회 인지)에서 modest decline. 본인/정보 제공자/임상가 보고 + 객관적 인지 검사 (1-2 SD 저하). 일상 활동 독립성 보존 (도구적 활동 일부 효율↓ 가능). 섬망 부재. 다른 정신질환으로 설명 ❌.`,
        en: `DSM-5-TR 331.83 (G31.84) — Mild Neurocognitive Disorder. Modest decline in ≥1 cognitive domain (attention, executive function, learning/memory, language, perceptual-motor, social cognition). Concern from patient/informant/clinician + objective testing (1-2 SD below norms). Independence preserved (IADLs may require greater effort). Not due to delirium. Not better explained by another mental disorder.`
      },
      core_symptoms: {
        ko: `• Episodic memory ↓ (특히 새로운 정보 학습/회상)
• 실행 기능 ↓ (계획, 문제 해결, 작업 기억)
• 처리 속도 ↓
• 주의 ↓ (특히 분할 주의)
• 인지 호소 + 객관적 측정 둘 다 (subjective + objective)
• 도구적 활동에서 더 많은 노력/시간 필요하나 독립성 유지`,
        en: `• Episodic memory ↓ (especially new learning/recall)
• Executive function ↓ (planning, problem-solving, working memory)
• Processing speed ↓
• Attention ↓ (particularly divided attention)
• Subjective complaint + objective evidence both required
• IADLs require greater effort/time but independence maintained`
      },
      neurophysiology: {
        ko: `Alpha peak frequency 둔화 (<9Hz) = preclinical AD biomarker (Babiloni 2006), thalamo-cortical loop dysfunction 반영. Alpha power Pz ↓ = posterior cortical 결손. P300 amp ↓ + latency ↑ (Jelic 2000) = working memory + attention allocation 결손, AD 진행 예측. Digit span backward ↓ = working memory 핵심 결손. CPT RT variability ↑ = 주의 변동성. 이 EEG 패턴 = 정상 노화와 구분되는 신경병리학적 표지.`,
        en: `Alpha peak frequency slowing (<9Hz) = preclinical AD biomarker (Babiloni 2006), reflects thalamo-cortical loop dysfunction. Alpha power Pz ↓ = posterior cortical deficit. P300 amplitude ↓ + latency ↑ (Jelic 2000) = working memory + attention allocation deficit, predicts AD progression. Digit span backward ↓ = core working memory deficit. CPT RT variability ↑ = attention fluctuation. This EEG pattern distinguishes neuropathology from normal aging.`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): Alpha slowing + P300 변화 + working memory ↓ + 인지 호소 모두 일치. AD 또는 다른 neurodegenerative 과정 강하게 의심. 즉시 neurology/노인정신과 referral.`,
          en: `Strong Match (≥85%): Alpha slowing + P300 changes + working memory ↓ + cognitive complaint all align. Strong suspicion of AD or other neurodegenerative process. Immediate neurology/geriatric psychiatry referral.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): 일부 marker 일치. Pseudodementia (MDD 동반), B12/갑상선 결핍, sleep apnea 감별 필요.`,
          en: `Moderate Match (65-84%): Some markers align. Rule out pseudodementia (MDD), B12/thyroid deficiency, sleep apnea.`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분 일치. 정상 노화 vs subjective cognitive decline (SCD) vs preclinical MCI 구분. Full neuropsych battery 필수.`,
          en: `Weak Match (40-64%): Partial alignment. Distinguish normal aging vs subjective cognitive decline (SCD) vs preclinical MCI. Full neuropsychological battery mandatory.`
        }
      },
      differential_diagnosis: {
        ko: `• vs Major NCD (Dementia): IADL 독립성 손실 → Major NCD
• vs Pseudodementia: 우울 동반 + 인지 호소, 치료 후 인지 회복 → MDD primary
• vs Normal Aging: 동연령 norm 1 SD 이내 → normal
• vs Delirium: 급성 변화 + 의식 변동 → Delirium (의학적 응급)
• vs Medical: B12, folate, vitD, 갑상선, 약물 부작용 (anticholinergics, BZD)
• vs Sleep Apnea: PSG로 OSA 배제 (인지 저하 가역적)
• vs Subjective Cognitive Decline: 호소 있으나 객관 검사 정상`,
        en: `• vs Major NCD (Dementia): Loss of IADL independence → Major NCD
• vs Pseudodementia: Depression + cognitive complaints, cognition recovers with treatment → MDD primary
• vs Normal Aging: Within 1 SD of age norms → normal
• vs Delirium: Acute change + fluctuating consciousness → Delirium (medical emergency)
• vs Medical: B12, folate, vitD, thyroid, medication side effects (anticholinergics, BZD)
• vs Sleep Apnea: PSG to rule out OSA (cognitive deficit reversible)
• vs Subjective Cognitive Decline: complaint without objective deficit`
      },
      recommended_additional: {
        ko: `• MoCA (≥26 정상; <26 추가 평가)
• MMSE (보조)
• Full neuropsychological battery (RBANS, CVLT, Trail Making, WAIS-IV subtests)
• Brain MRI (volumetric, hippocampal volume)
• AD biomarkers referral: CSF Aβ42/p-tau, amyloid PET, tau PET
• B12, folate, TSH, vitD, CBC, metabolic panel
• PHQ-9 (depression screen)
• PSG (sleep apnea 의심 시)`,
        en: `• MoCA (≥26 normal; <26 further evaluation)
• MMSE (supplemental)
• Full neuropsych battery (RBANS, CVLT, Trail Making, WAIS-IV subtests)
• Brain MRI (volumetric, hippocampal volume)
• AD biomarker referral: CSF Aβ42/p-tau, amyloid PET, tau PET
• B12, folate, TSH, vitD, CBC, metabolic panel
• PHQ-9 (depression screen)
• PSG (if sleep apnea suspected)`
      },
      treatment_options: {
        ko: `• Peak Alpha Frequency 뉴로피드백 (PAF uptraining to ~10.5Hz), 20-40 sessions
• 다영역 인지 훈련 (multimodal: memory + executive + processing speed)
• 유산소 운동 (150min/주 — hippocampal volume 보존 evidence)
• Mediterranean diet
• Sleep optimization (sleep apnea 치료 시 인지 회복 가능)
• 사회 참여 (cognitive reserve)
• Neurology / 노인정신과 referral (필수)
• 약물 평가: cholinesterase inhibitor (AD 진행 시 정신과 referral)`,
        en: `• Peak Alpha Frequency neurofeedback (PAF uptraining to ~10.5Hz), 20-40 sessions
• Multimodal cognitive training (memory + executive + processing speed)
• Aerobic exercise (150 min/week — hippocampal volume preservation evidence)
• Mediterranean diet
• Sleep optimization (sleep apnea treatment may recover cognition)
• Social engagement (cognitive reserve)
• Neurology / geriatric psychiatry referral (mandatory)
• Medication evaluation: cholinesterase inhibitor (psychiatric referral if AD progresses)`
      }
    },

    // ========================================================================
    // Phase C — ADHD Predominantly Inattentive
    // ========================================================================
    adhd_inattentive: {
      dsm_definition: {
        ko: `DSM-5-TR 314.00 (F90.0) — ADHD 주의력 결핍 우세형. 부주의 증상 6개 이상 (17세 이상 5개 이상), 과잉행동·충동성 증상 6개 미만. 12세 이전 발병. 2개 이상 환경. 6개월 이상 지속, 기능 손상.`,
        en: `DSM-5-TR 314.00 (F90.0) — ADHD Predominantly Inattentive Presentation. ≥6 inattention symptoms (≥5 if age 17+) AND <6 hyperactive-impulsive symptoms. Onset before age 12. Present in ≥2 settings. ≥6 months, functional impairment.`
      },
      core_symptoms: {
        ko: `• 주의 지속력 ↓, 세부 사항 놓침
• 작업 기억 ↓ (지시 따르기 곤란, 분실)
• 처리 속도 ↓ (느린 인지 템포 — sluggish cognitive tempo)
• 정신적 노력 회피, 시작 곤란
• 외부 자극에 쉽게 분산
• 일상적 망각 — 약속/일정/물건`,
        en: `• Sustained attention deficit, misses details
• Working memory deficit (difficulty following instructions, loses items)
• Slowed processing (sluggish cognitive tempo)
• Avoidance of mental effort, task initiation difficulty
• Easily distracted by external stimuli
• Daily forgetfulness — appointments, schedules, items`
      },
      neurophysiology: {
        ko: `Frontal θ/β ↑ (combined보다 덜 명확), alpha peak frequency 둔화 (maturational lag). P300 진폭 ↓ Pz = 주의 자원 결손. CPT 반응시간 변동성 ↑. Default Mode Network 과활성 (introspective drift). 운동 hyperarousal 부재 — sluggish cognitive tempo 패턴 (Barkley 2014). 성인 + 여성에서 가장 흔한 표현형, 진단 누락 잦음.`,
        en: `Frontal θ/β ↑ (less pronounced than Combined), slowed alpha peak frequency (maturational lag). P300 amplitude ↓ Pz = attention resource deficit. CPT RT variability ↑. Default Mode Network hyperactivity (introspective drift). Absent motor hyperarousal — sluggish cognitive tempo pattern (Barkley 2014). Most common phenotype in adults + females; frequently underdiagnosed.`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): theta/beta 상승 + P300 ↓ + 주의 점수 ↑ + 과잉행동 점수 정상. 임상 진단 강력 지지. ADHD-PI 명확.`,
          en: `Strong Match (≥85%): theta/beta elevated + P300 ↓ + attention scores ↑ + hyperactivity scores normal. Strongly supports ADHD-PI diagnosis.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): 일부 marker 일치. 우울/불안 동반 시 가성 부주의 감별 필요.`,
          en: `Moderate Match (65-84%): Some markers align. Screen for depression/anxiety mimicking inattention.`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분 일치. SCT (sluggish cognitive tempo), MDD, MCI, learning disability 감별.`,
          en: `Weak Match (40-64%): Partial alignment. Rule out SCT (sluggish cognitive tempo), MDD, MCI, learning disability.`
        }
      },
      differential_diagnosis: {
        ko: `• vs ADHD-C: 과잉행동·충동성 6개 미만 → PI
• vs ASD: 사회 인지 결손 + 제한적 행동 우세 → ASD
• vs MDD: anhedonia + 무망감 우세 → MDD (인지 호소 가성)
• vs GAD: worry 우세 → GAD; 외부 분산 → PI
• vs MCI: 후기 발병 + 점진적 저하 → MCI
• vs Learning Disability: 특정 영역 결손 → SLD
• vs Hearing impairment: 청력 검사 우선`,
        en: `• vs ADHD-C: <6 hyperactive-impulsive symptoms → PI
• vs ASD: social cognition + restricted behavior predominant → ASD
• vs MDD: anhedonia + hopelessness predominant → MDD (pseudo cognitive complaint)
• vs GAD: worry-driven → GAD; external distractibility → PI
• vs MCI: late onset + progressive decline → MCI
• vs Learning Disability: domain-specific deficit → SLD
• vs Hearing impairment: audiology screen first`
      },
      recommended_additional: {
        ko: `• Conners CPT-3 (RT variability, omission errors)
• BAARS-IV 또는 Conners-3 (성인/아동)
• Full QEEG with theta/beta + alpha peak
• 발달력 (12세 이전 증상 확인, 학교 기록)
• 청력/시력 검사 (배제)
• 동반 평가: PHQ-9, GAD-7, sleep, learning, ASD screen
• 가족력 (ADHD/ASD)`,
        en: `• Conners CPT-3 (RT variability, omission errors)
• BAARS-IV or Conners-3 (adult/pediatric)
• Full QEEG with theta/beta + alpha peak
• Developmental history (confirm pre-12 symptoms, school records)
• Audiology/vision screen (rule out)
• Comorbidity: PHQ-9, GAD-7, sleep, learning, ASD screen
• Family history (ADHD/ASD)`
      },
      treatment_options: {
        ko: `• 뉴로피드백: SMR↑ (C3/C4) + theta↓ (Fz) 30-40 sessions (Arns 2014 protocol)
• Peak Alpha Frequency 훈련 (Pz, 주의 향상)
• 인지 훈련: working memory (Cogmed), processing speed
• 환경 조정: 외부 보조, 시간 관리, task initiation 도구
• 약물 평가: 정신과 referral (methylphenidate 또는 atomoxetine — SCT 시 atomoxetine 효과적)
• 운동 처방: 유산소 30min × 5/주
• 수면 위생 강화`,
        en: `• Neurofeedback: SMR↑ (C3/C4) + theta↓ (Fz) 30-40 sessions (Arns 2014)
• Peak Alpha Frequency training (Pz, attention enhancement)
• Cognitive training: working memory (Cogmed), processing speed
• Environmental: external scaffolds, time management, task initiation tools
• Medication evaluation: psychiatric referral (methylphenidate or atomoxetine — atomoxetine effective for SCT)
• Exercise prescription: aerobic 30 min × 5/week
• Sleep hygiene reinforcement`
      }
    },

    // ========================================================================
    // Phase C — Panic Disorder
    // ========================================================================
    panic: {
      dsm_definition: {
        ko: `DSM-5-TR 300.01 (F41.0) — 공황장애. 반복적 예기치 못한 공황 발작 + ≥1개월 간 다음 중 1개: 추가 발작에 대한 지속적 걱정, 발작 결과에 대한 부적응적 행동 변화. 약물/의학적 원인 배제, 다른 정신질환으로 설명 ❌.`,
        en: `DSM-5-TR 300.01 (F41.0) — Panic Disorder. Recurrent unexpected panic attacks + ≥1 month of ≥1: persistent concern about additional attacks, maladaptive behavioral change related to attacks. Rule out substance/medical; not better explained by another disorder.`
      },
      core_symptoms: {
        ko: `• 공황 발작: 10분 이내 최고조 + 4개 이상 (심계항진, 발한, 떨림, 호흡곤란, 질식감, 흉통, 메스꺼움, 어지러움, 한기/열감, 감각이상, 비현실감, 통제 상실 두려움, 죽음 두려움)
• 예기 불안 (다음 발작 두려움)
• 회피 행동 (장소/상황)
• Agoraphobia 동반 가능`,
        en: `• Panic attack: peaks within 10 min + ≥4 symptoms (palpitations, sweating, trembling, dyspnea, choking, chest pain, nausea, dizziness, chills/heat, paresthesias, derealization, fear of losing control, fear of dying)
• Anticipatory anxiety (fear of next attack)
• Avoidance behaviors (places/situations)
• Possible agoraphobia comorbidity`
      },
      neurophysiology: {
        ko: `RMSSD ↓↓ severely during/post attack, LF/HF ↑↑ = sympathetic surge (Kim 2018). Beta_Cz ↑ during attack, alpha_Pz ↓ (cortical hyperarousal). Locus coeruleus hyperactivity 가설 (Charney 1990). Interoceptive amygdala 회로 과민. 발작 사이 baseline HRV도 ↓ (Cohen 2000 meta).`,
        en: `RMSSD ↓↓ severely during/post-attack, LF/HF ↑↑ = sympathetic surge (Kim 2018). Beta_Cz ↑ during attack, alpha_Pz ↓ (cortical hyperarousal). Locus coeruleus hyperactivity hypothesis (Charney 1990). Hypersensitive interoceptive amygdala circuit. Inter-ictal baseline HRV also ↓ (Cohen 2000 meta).`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): HRV 심한 ↓ + LF/HF↑ + panic 점수 + 회피 모두 일치. HRV biofeedback 즉시 시작 권장.`,
          en: `Strong Match (≥85%): Severe HRV ↓ + LF/HF↑ + panic scores + avoidance all align. Immediate HRV biofeedback recommended.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): 부분 일치. GAD with panic episodes 감별 필요. 발작 빈도/예측 불가능성 확인.`,
          en: `Moderate Match (65-84%): Partial alignment. Distinguish from GAD with panic episodes. Confirm attack frequency/unpredictability.`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분. 의학적 원인 (갑상선, pheo, MVP), 약물 (카페인, 코카인) 우선 배제.`,
          en: `Weak Match (40-64%): Partial. Rule out medical (thyroid, pheochromocytoma, MVP), substances (caffeine, cocaine) first.`
        }
      },
      differential_diagnosis: {
        ko: `• vs GAD: chronic worry → GAD; discrete attacks → Panic
• vs Agoraphobia: 단독 회피 → specific phobia 또는 agoraphobia
• vs PTSD: trauma trigger → PTSD
• vs Specific Phobia: 특정 자극 → phobia
• vs Cardiac (MVP, arrhythmia): EKG/echo 우선
• vs Pheochromocytoma: 24h urine metanephrines
• vs Hyperthyroid: TSH/T4
• vs Substance (카페인, 코카인, 금단): tox screen`,
        en: `• vs GAD: chronic worry → GAD; discrete attacks → Panic
• vs Agoraphobia: avoidance alone → specific phobia or agoraphobia
• vs PTSD: trauma trigger → PTSD
• vs Specific Phobia: specific stimulus → phobia
• vs Cardiac (MVP, arrhythmia): EKG/echo first
• vs Pheochromocytoma: 24h urine metanephrines
• vs Hyperthyroid: TSH/T4
• vs Substance (caffeine, cocaine, withdrawal): tox screen`
      },
      recommended_additional: {
        ko: `• PDSS (Panic Disorder Severity Scale)
• Mobility inventory (회피 정도)
• HRV 24h + paced breathing test
• EKG, TSH, T4, 24h urine metanephrines (의학적 배제)
• Cardiac evaluation 의심 시
• 동반: GAD-7, PHQ-9, agoraphobia screen, substance use
• Sleep panic 의심 시 PSG`,
        en: `• PDSS (Panic Disorder Severity Scale)
• Mobility inventory (degree of avoidance)
• HRV 24h + paced breathing test
• EKG, TSH, T4, 24h urine metanephrines (medical rule-out)
• Cardiac evaluation if suspected
• Comorbidity: GAD-7, PHQ-9, agoraphobia screen, substance use
• PSG if nocturnal panic suspected`
      },
      treatment_options: {
        ko: `• HRV biofeedback: resonance frequency breathing (~6/min) — 1차 (Meuret 2017)
• Capnometry-assisted breathing training (CO2 normalization)
• CBT for panic (interoceptive exposure, cognitive restructuring) referral
• 알파 uptraining (Pz/Oz) 보조
• 약물 평가: 정신과 referral (SSRI 1차, benzodiazepine은 단기만)
• 카페인 제거 (<100mg/day), 알코올 제한
• 안전 계획 + 위기 자원`,
        en: `• HRV biofeedback: resonance frequency breathing (~6/min) — first-line (Meuret 2017)
• Capnometry-assisted breathing training (CO2 normalization)
• CBT for panic (interoceptive exposure, cognitive restructuring) referral
• Alpha uptraining (Pz/Oz) adjunct
• Medication evaluation: psychiatric referral (SSRI first-line, benzodiazepine short-term only)
• Caffeine elimination (<100mg/day), alcohol restriction
• Safety planning + crisis resources`
      }
    },

    // ========================================================================
    // Phase C — Obsessive-Compulsive Disorder
    // ========================================================================
    ocd: {
      dsm_definition: {
        ko: `DSM-5-TR 300.3 (F42.2) — 강박장애. 강박사고 (obsessions) 또는 강박행동 (compulsions), 또는 둘 다. 시간 소모 (>1시간/일) 또는 명확한 distress/기능 손상. Insight specifier: good/fair, poor, absent (delusional). 약물/의학적 원인 배제.`,
        en: `DSM-5-TR 300.3 (F42.2) — OCD. Obsessions and/or compulsions. Time-consuming (>1 hour/day) or causes distress/impairment. Insight specifier: good/fair, poor, absent (delusional). Rule out substance/medical.`
      },
      core_symptoms: {
        ko: `• 강박사고 (obsessions): 침습적·반복적 사고/충동/이미지 — ego-dystonic
• 강박행동 (compulsions): 반복적 행동/정신적 행위 — 불안 감소 목적
• 5 차원: 대칭, 오염/세척, 금지/공격 사고, 체크, 저장 (Mataix-Cols 2005)
• 통찰 가변 (대부분 양호, 일부 poor/absent)
• 가족적 동반 (Tic, ASD)`,
        en: `• Obsessions: intrusive recurrent thoughts/urges/images — ego-dystonic
• Compulsions: repetitive behaviors/mental acts — anxiety-reducing
• 5 dimensions: symmetry, contamination/washing, forbidden/aggressive, checking, hoarding (Mataix-Cols 2005)
• Variable insight (mostly good, some poor/absent)
• Familial comorbidity (Tic, ASD)`
      },
      neurophysiology: {
        ko: `Frontal high beta (18-30Hz) ↑ (Min 2006). Error-Related Negativity (ERN) ↑ amplitude — over-active error monitoring, OCD의 가장 robust한 ERP marker (Riesel 2019 meta). Cortico-Striato-Thalamo-Cortical (CSTC) loop dysfunction (Saxena 2003). Basal ganglia + ACC + OFC 과활성. Glutamate 시스템 이상.`,
        en: `Frontal high beta (18-30Hz) ↑ (Min 2006). Error-Related Negativity (ERN) ↑ amplitude — over-active error monitoring, most robust OCD ERP marker (Riesel 2019 meta). Cortico-Striato-Thalamo-Cortical (CSTC) loop dysfunction (Saxena 2003). Basal ganglia + ACC + OFC hyperactivity. Glutamate system abnormalities.`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): Beta ↑ + ERN ↑ + obsess 점수 + ritual 점수 모두 일치. Y-BOCS 확정 + ERP CBT 즉시.`,
          en: `Strong Match (≥85%): Beta ↑ + ERN ↑ + obsessive scores + ritual scores all align. Confirm with Y-BOCS + initiate ERP CBT.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): 부분 일치. GAD with intrusive thoughts, BDD, hoarding disorder 감별.`,
          en: `Moderate Match (65-84%): Partial alignment. Distinguish from GAD with intrusive thoughts, BDD, hoarding disorder.`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분. ASD restricted/repetitive 패턴, Tic, 정신병 (delusional OCD) 감별.`,
          en: `Weak Match (40-64%): Partial. Rule out ASD restricted/repetitive patterns, Tic, psychosis (delusional OCD).`
        }
      },
      differential_diagnosis: {
        ko: `• vs GAD: ego-syntonic worry → GAD; ego-dystonic + ritual → OCD
• vs BDD: 외모 집착 → BDD (OCD spectrum)
• vs Hoarding: 저장 단독 → Hoarding Disorder
• vs Tic: 단순 운동/음성 → Tic (공존 흔함)
• vs ASD: 의례적 행동 + 사회 인지 결손 → ASD
• vs Psychosis: insight absent (delusional) → 정신병 OCD vs psychosis
• vs Trichotillomania/Excoriation: 신체 집중 반복 행동`,
        en: `• vs GAD: ego-syntonic worry → GAD; ego-dystonic + ritual → OCD
• vs BDD: appearance preoccupation → BDD (OCD spectrum)
• vs Hoarding: hoarding alone → Hoarding Disorder
• vs Tic: simple motor/vocal → Tic (often comorbid)
• vs ASD: ritualistic behavior + social cognition deficit → ASD
• vs Psychosis: insight absent (delusional) → distinguish OCD from psychosis
• vs Trichotillomania/Excoriation: body-focused repetitive behaviors`
      },
      recommended_additional: {
        ko: `• Y-BOCS (Yale-Brown OCD Scale, gold standard, clinician-administered)
• OCI-R (자가 보고)
• DOCS (Dimensional OCD Scale — 5 차원 분석)
• BDD-YBOCS (BDD 감별)
• tic_catcher_5 (Tic 감별)
• Insight specifier 평가 (good/fair/poor/absent)
• 가족력 (OCD/Tic/ASD)
• 동반: GAD-7, PHQ-9, ASD screen`,
        en: `• Y-BOCS (Yale-Brown OCD Scale, gold standard, clinician-administered)
• OCI-R (self-report)
• DOCS (Dimensional OCD Scale — 5-dimension analysis)
• BDD-YBOCS (BDD rule-out)
• tic_catcher_5 (Tic rule-out)
• Insight specifier assessment (good/fair/poor/absent)
• Family history (OCD/Tic/ASD)
• Comorbidity: GAD-7, PHQ-9, ASD screen`
      },
      treatment_options: {
        ko: `• Exposure and Response Prevention (ERP) CBT — 1차 권고 (APA)
• 뉴로피드백: frontal high beta ↓ at Fz + SMR ↑ at Cz, 30-40 sessions (Hammond 2003)
• 약물 평가: 정신과 referral (고용량 SSRI — fluoxetine ≥60mg, sertraline ≥200mg; clomipramine 대안)
• 가족 교육 (accommodation 패턴 차단)
• Treatment-resistant: TMS, ketamine, DBS (extreme cases) — 정신과 협진
• 인지 재구조화 (강박 신념)
• Mindfulness 보조`,
        en: `• Exposure and Response Prevention (ERP) CBT — first-line (APA)
• Neurofeedback: frontal high beta ↓ at Fz + SMR ↑ at Cz, 30-40 sessions (Hammond 2003)
• Medication evaluation: psychiatric referral (high-dose SSRI — fluoxetine ≥60mg, sertraline ≥200mg; clomipramine alternative)
• Family education (block accommodation patterns)
• Treatment-resistant: TMS, ketamine, DBS (extreme cases) — psychiatric coordination
• Cognitive restructuring (obsessive beliefs)
• Mindfulness adjunctive`
      }
    },

    // ========================================================================
    // Phase C — Autism Spectrum Disorder
    // ========================================================================
    asd: {
      dsm_definition: {
        ko: `DSM-5-TR 299.00 (F84.0) — 자폐스펙트럼장애. 사회 의사소통/상호작용 결손 (3개 모두: 사회·정서 상호 작용, 비언어적 의사소통, 관계 발달) + 제한적·반복적 행동 패턴 (4개 중 2개: 상동/반복, 동일성 고집, 제한적 관심, 감각 비정형성). 초기 발달기 발현. 기능 손상. Severity level: 1/2/3.`,
        en: `DSM-5-TR 299.00 (F84.0) — Autism Spectrum Disorder. Social communication/interaction deficits (all 3: social-emotional reciprocity, nonverbal communication, developing relationships) + restricted repetitive behavior patterns (≥2 of 4: stereotyped/repetitive, insistence on sameness, restricted interests, sensory atypicality). Early developmental onset. Functional impairment. Severity level 1/2/3.`
      },
      core_symptoms: {
        ko: `• 사회·정서 상호성 결손 (대화 주고받기, 정서 공유)
• 비언어 의사소통 결손 (눈맞춤, 표정, 제스처)
• 관계 발달/유지 곤란
• 상동·반복 행동 (rocking, hand-flapping)
• 동일성 고집, 일상 변화에 강한 거부
• 제한적·강렬한 관심
• 감각 과민 또는 둔감 (소리, 빛, 촉각)`,
        en: `• Social-emotional reciprocity deficits (back-and-forth conversation, sharing affect)
• Nonverbal communication deficits (eye contact, expression, gestures)
• Difficulty developing/maintaining relationships
• Stereotyped/repetitive behaviors (rocking, hand-flapping)
• Insistence on sameness, distress at change
• Restricted/intense interests
• Sensory hyper- or hypo-reactivity (sound, light, touch)`
      },
      neurophysiology: {
        ko: `Mu rhythm (8-13Hz, central) suppression 결손 → mirror neuron 가설 (Oberman 2005). Theta ↑ posterior (Coben 2008). P300 amplitude/latency 비정형 (자극별 반응 차이). Frontal alpha asymmetry — variable. Functional connectivity: 국소 과연결 + 장거리 저연결 (Just 2012). 감각 처리 비전형: SEP/AEP 증가된 N1.`,
        en: `Mu rhythm (8-13Hz, central) suppression deficit → mirror neuron hypothesis (Oberman 2005). Posterior theta ↑ (Coben 2008). Atypical P300 amplitude/latency (variable response by stimulus). FAA variable. Functional connectivity: local hyperconnectivity + long-range hypoconnectivity (Just 2012). Atypical sensory processing: increased N1 SEP/AEP.`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): mu suppression 결손 + theta ↑ + 사회 의사소통 점수 + 제한적 행동 점수 모두 일치. ADOS-2 확진 필수.`,
          en: `Strong Match (≥85%): mu suppression deficit + theta ↑ + social communication scores + restricted behavior scores all align. ADOS-2 confirmation mandatory.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): 부분 일치. Social Communication Disorder (SCD — RRB 없음), ADHD, intellectual disability 감별.`,
          en: `Moderate Match (65-84%): Partial alignment. Distinguish from Social Communication Disorder (no RRB), ADHD, intellectual disability.`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분. Reactive attachment, selective mutism, schizoid PD, anxiety-driven social withdrawal 감별.`,
          en: `Weak Match (40-64%): Partial. Rule out reactive attachment, selective mutism, schizoid PD, anxiety-driven social withdrawal.`
        }
      },
      differential_diagnosis: {
        ko: `• vs Social Communication Disorder: RRB 없음 → SCD
• vs ADHD: 주의 결손 + 충동성 우세, 사회 인지 양호 → ADHD (공존 30-50%)
• vs Intellectual Disability: 인지 수준에 비례 → IDD (공존 가능)
• vs Schizoid PD: 사회 회피 + 자발 선택 → 성인 발병
• vs Selective Mutism: 특정 상황 한정 → SM
• vs Reactive Attachment: 외상 배경 + 양육 결핍 → RAD
• vs Anxiety: 사회 불안 → SAD (사회 인지는 정상)`,
        en: `• vs Social Communication Disorder: no RRB → SCD
• vs ADHD: attention deficit + impulsivity predominant, social cognition intact → ADHD (30-50% comorbid)
• vs Intellectual Disability: proportional to cognitive level → IDD (can coexist)
• vs Schizoid PD: social avoidance + voluntary choice → adult onset
• vs Selective Mutism: situation-specific → SM
• vs Reactive Attachment: trauma background + caregiving deprivation → RAD
• vs Anxiety: social anxiety → SAD (social cognition intact)`
      },
      recommended_additional: {
        ko: `• ADOS-2 (Autism Diagnostic Observation Schedule, gold standard, clinician-administered)
• ADI-R (Autism Diagnostic Interview — parent/caregiver)
• Vineland-3 (적응 행동)
• IQ 평가 (WAIS-IV/WISC-V/WPPSI)
• 감각 프로파일 (Dunn Sensory Profile)
• 청력 검사 (배제)
• 동반: ADHD, anxiety, intellectual disability, gastrointestinal, sleep
• Genetic referral (Fragile X, chromosomal microarray)`,
        en: `• ADOS-2 (Autism Diagnostic Observation Schedule, gold standard, clinician-administered)
• ADI-R (Autism Diagnostic Interview — parent/caregiver)
• Vineland-3 (adaptive behavior)
• IQ assessment (WAIS-IV/WISC-V/WPPSI)
• Sensory profile (Dunn Sensory Profile)
• Audiology (rule out)
• Comorbidity: ADHD, anxiety, intellectual disability, GI, sleep
• Genetic referral (Fragile X, chromosomal microarray)`
      },
      treatment_options: {
        ko: `• 뉴로피드백: SMR ↑ at Cz + theta ↓ + mu suppression training at C3/C4, 40+ sessions (Coben 2010)
• Early intensive behavioral intervention (EIBI, 아동) — ABA referral
• Social Skills Training (성인/아동)
• 감각 통합 치료 (작업치료 referral)
• Speech-language therapy referral
• 약물 평가: 정신과 referral (irritability/aggression: risperidone/aripiprazole; ADHD 동반: stimulants)
• 가족 지원 + 부모 훈련
• Special education accommodations (IEP/504)`,
        en: `• Neurofeedback: SMR ↑ at Cz + theta ↓ + mu suppression training at C3/C4, 40+ sessions (Coben 2010)
• Early intensive behavioral intervention (EIBI, pediatric) — ABA referral
• Social Skills Training (adult/pediatric)
• Sensory integration therapy (occupational therapy referral)
• Speech-language therapy referral
• Medication evaluation: psychiatric referral (irritability/aggression: risperidone/aripiprazole; if ADHD comorbid: stimulants)
• Family support + parent training
• Special education accommodations (IEP/504)`
      }
    },

    // ========================================================================
    // Phase C — Bipolar I Disorder
    // ========================================================================
    bipolar_1: {
      dsm_definition: {
        ko: `DSM-5-TR 296.4x (F31.x) — 제I형 양극성장애. ≥1 manic episode (≥7일 또는 입원 필요, A 기분 상승/과민 + B 7개 중 ≥3개 [4개 if 과민 only]). MDE 이력 흔하나 진단 필수 ❌. 약물/의학적 원인 배제. Specifier: with mixed features, rapid cycling, psychotic features.`,
        en: `DSM-5-TR 296.4x (F31.x) — Bipolar I Disorder. ≥1 manic episode (≥7 days OR requires hospitalization; Criterion A elevated/irritable mood + Criterion B ≥3 of 7 [≥4 if irritable only]). MDE history common but not required. Rule out substance/medical. Specifiers: mixed features, rapid cycling, psychotic features.`
      },
      core_symptoms: {
        ko: `Mania (Criterion A + B):
• 상승/팽창적 또는 과민한 기분
• 자존감 ↑ 또는 과대성
• 수면 욕구 ↓ (3시간 자고 활기참)
• 말 많아짐, pressured speech
• 사고 비약, racing thoughts
• 산만성
• 목표 지향 활동 ↑ (사회/직업/성/정신운동 초조)
• 위험 행동 (과소비, 무모한 성, 무분별 투자)`,
        en: `Mania (Criterion A + B):
• Elevated/expansive or irritable mood
• Inflated self-esteem or grandiosity
• Decreased sleep need (rested after 3 hr)
• More talkative, pressured speech
• Flight of ideas, racing thoughts
• Distractibility
• Increased goal-directed activity (social/work/sexual/psychomotor agitation)
• Risky behaviors (spending sprees, reckless sex, foolish investments)`
      },
      neurophysiology: {
        ko: `State-dependent — 진단 패턴 변동:
• Mania: frontal alpha ↓, beta_Cz ↑↑ (hyperarousal), RMSSD ↓ (sympathetic surge), gamma synchrony 비정형 (Bahk 2014)
• Depression (BD): FAA 좌측 hypoactivation, RMSSD ↓, alpha_Pz ↑
• Baseline (euthymia): subtle frontal asymmetry, slight HRV ↓
• Circadian disruption — 핵심 marker
• PFC-amygdala connectivity 비정형 (Phillips 2003)`,
        en: `State-dependent — pattern shifts with phase:
• Mania: frontal alpha ↓, beta_Cz ↑↑ (hyperarousal), RMSSD ↓ (sympathetic surge), atypical gamma synchrony (Bahk 2014)
• BD depression: leftward FAA, RMSSD ↓, alpha_Pz ↑
• Baseline (euthymia): subtle frontal asymmetry, slight HRV ↓
• Circadian disruption — core marker
• Atypical PFC-amygdala connectivity (Phillips 2003)`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): mania 점수 + EEG hyperarousal + 수면 욕구 ↓ + risky 행동 모두 일치. 정신과 즉시 referral — 약물 치료 핵심.`,
          en: `Strong Match (≥85%): mania scores + EEG hyperarousal + decreased sleep need + risky behaviors all align. Immediate psychiatric referral — medication is core treatment.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): 부분 일치. Bipolar II (경조증만), schizoaffective, substance-induced mania 감별. MDQ 필수.`,
          en: `Moderate Match (65-84%): Partial alignment. Distinguish Bipolar II (hypomania only), schizoaffective, substance-induced mania. MDQ mandatory.`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분. ADHD (chronic, not episodic), BPD (affective instability), substance use, hyperthyroid 감별.`,
          en: `Weak Match (40-64%): Partial. Rule out ADHD (chronic, not episodic), BPD (affective instability), substance use, hyperthyroid.`
        }
      },
      differential_diagnosis: {
        ko: `• vs Bipolar II: 경조증만 (입원 없음) → BD-II
• vs MDD (depressed phase): mania 이력 없으면 MDD; 한 번이라도 있으면 BD-I로 재분류
• vs Schizoaffective: 정신병이 기분 episode 없이 ≥2주 → SAD
• vs ADHD: chronic (not episodic), <12세 발병 → ADHD
• vs BPD: 시간 단위 정서 변동 (vs days) → BPD
• vs Substance-induced: 사용 중에만 → SIMD
• vs Cyclothymia: 역치 이하 변동 2년+
• vs Hyperthyroid: TSH/T4
• vs Steroid-induced mania`,
        en: `• vs Bipolar II: hypomania only (no hospitalization) → BD-II
• vs MDD (depressed phase): no mania history = MDD; any past mania = BD-I
• vs Schizoaffective: psychosis ≥2 weeks without mood episode → SAD
• vs ADHD: chronic (not episodic), onset <12 → ADHD
• vs BPD: hours-scale affective shifts (vs days) → BPD
• vs Substance-induced: only during use → SIMD
• vs Cyclothymia: subthreshold shifts ≥2 years
• vs Hyperthyroid: TSH/T4
• vs Steroid-induced mania`
      },
      recommended_additional: {
        ko: `• MDQ (Mood Disorder Questionnaire, gold standard 자가 screen)
• YMRS (Young Mania Rating Scale, clinician-administered)
• C-SSRS (자살 위험 — mixed states에서 ↑)
• Mood charting (일일, 최소 4주)
• Sleep diary
• TSH, T4, drug screen (substance-induced 배제)
• 가족력 (Bipolar/MDD 1차 친족)
• Brain MRI (의심 시 second-line)
• Polysomnography (수면 무호흡 동반 시)`,
        en: `• MDQ (Mood Disorder Questionnaire, gold standard self-screen)
• YMRS (Young Mania Rating Scale, clinician-administered)
• C-SSRS (suicide risk — elevated in mixed states)
• Mood charting (daily, ≥4 weeks)
• Sleep diary
• TSH, T4, drug screen (rule out substance-induced)
• Family history (Bipolar/MDD 1st-degree relatives)
• Brain MRI (second-line if suspected)
• Polysomnography (if sleep apnea comorbid)`
      },
      treatment_options: {
        ko: `⚠️ 약물 치료가 핵심 — NFB는 보조 역할만:
• 정신과 즉시 referral — 기분 안정제 (lithium 1차, valproate, lamotrigine, carbamazepine)
• 비정형 항정신병약 (psychotic features 또는 acute mania 시)
• ⚠️ NFB 안정기에만: SMR ↑ at Cz, slow cortical potentials. 활성 mania 시 절대 ❌
• 사회 리듬 치료 (IPSRT, Frank 2005) — circadian 안정화
• Mood charting (일일)
• 수면 위생 엄격 (수면 박탈 = mania trigger)
• 가족 치료 (family-focused therapy)
• 안전 계획 + 위기 자원`,
        en: `⚠️ Medication is core — NFB is adjunctive only:
• Immediate psychiatric referral — mood stabilizers (lithium first-line, valproate, lamotrigine, carbamazepine)
• Atypical antipsychotics (if psychotic features or acute mania)
• ⚠️ NFB stable phase only: SMR ↑ at Cz, slow cortical potentials. Absolutely contraindicated in active mania
• Interpersonal Social Rhythm Therapy (IPSRT, Frank 2005) — circadian stabilization
• Mood charting (daily)
• Strict sleep hygiene (sleep deprivation = mania trigger)
• Family-focused therapy
• Safety planning + crisis resources`
      }
    },

    // ========================================================================
    // Phase C — Schizophrenia
    // ========================================================================
    schizophrenia: {
      dsm_definition: {
        ko: `DSM-5-TR 295.x (F20.x) — 조현병. Criterion A: ≥2개 (활성기 1개월 중 상당 부분) — (1) 망상, (2) 환각, (3) 와해된 언어, (4) 매우 와해된/긴장성 행동, (5) 음성 증상. ≥1개는 (1)/(2)/(3). Criterion B: 기능 손상. C: 연속 징후 ≥6개월 (전구기/잔여기 포함). D-F: 조현정동, 약물, 의학, ASD/communication disorder 배제.`,
        en: `DSM-5-TR 295.x (F20.x) — Schizophrenia. Criterion A: ≥2 symptoms (significant portion of 1-month active phase) — (1) delusions, (2) hallucinations, (3) disorganized speech, (4) grossly disorganized/catatonic behavior, (5) negative symptoms. ≥1 must be (1)/(2)/(3). Criterion B: functional impairment. C: continuous signs ≥6 months (incl. prodromal/residual). D-F: rule out schizoaffective, substance, medical, ASD/communication disorder.`
      },
      core_symptoms: {
        ko: `Positive symptoms (Criterion A 1-4):
• 망상 (편집, 종교, 신체, 관계, 통제)
• 환각 (청각 우세 — 명령환각, 평가환각)
• 와해된 언어 (탈선, 비논리, 응고)
• 와해된/긴장성 행동
Negative symptoms (Criterion A 5):
• 정서 둔마 (affective flattening)
• 무의지 (avolition), 무쾌감 (anhedonia)
• 무언증 (alogia)
• 사회적 위축 (asociality)
Cognitive deficits: working memory, attention, executive function (전반적)`,
        en: `Positive symptoms (Criterion A 1-4):
• Delusions (paranoid, religious, somatic, referential, control)
• Hallucinations (auditory predominant — command, commentary)
• Disorganized speech (derailment, illogical, incoherence)
• Disorganized/catatonic behavior
Negative symptoms (Criterion A 5):
• Affective flattening
• Avolition, anhedonia
• Alogia (poverty of speech)
• Asociality
Cognitive deficits: working memory, attention, executive function (broad)`
      },
      neurophysiology: {
        ko: `P50 sensory gating 결손 (filter dysfunction, Adler 1982 — robust marker). P300 amp ↓ (positive + negative 모두). Gamma synchrony 감소 (40Hz, Spencer 2004). Mismatch Negativity (MMN) ↓ — early auditory processing 결손. Frontal hypoactivation (hypofrontality). Alpha 감소 (특히 anterior). Smooth pursuit eye movement (SPEM) 비정형. 신경발달적 요소 — dorsolateral PFC 비전형, NMDA receptor hypofunction 가설.`,
        en: `P50 sensory gating deficit (filter dysfunction, Adler 1982 — robust marker). P300 amplitude ↓ (positive + negative). Gamma synchrony reduction (40Hz, Spencer 2004). Mismatch Negativity (MMN) ↓ — early auditory processing deficit. Frontal hypoactivation (hypofrontality). Alpha reduction (especially anterior). Atypical smooth pursuit eye movement (SPEM). Neurodevelopmental component — atypical dorsolateral PFC, NMDA receptor hypofunction hypothesis.`
      },
      match_confidence: {
        strong: {
          ko: `Strong Match (≥85%): positive 점수 + 음성 점수 + 인지 결손 + P50/P300/gamma 비정형 일치. 정신과 즉시 referral — 항정신병약이 생명 구함. NFB는 절대 ❌ 대체.`,
          en: `Strong Match (≥85%): positive symptoms + negative symptoms + cognitive deficits + P50/P300/gamma atypical patterns align. Immediate psychiatric referral — antipsychotics are life-saving. NEVER substitute NFB.`
        },
        moderate: {
          ko: `Moderate Match (65-84%): 부분 일치. Schizoaffective (기분 episode 동반), bipolar with psychotic features, brief psychotic, substance-induced 감별.`,
          en: `Moderate Match (65-84%): Partial alignment. Distinguish schizoaffective (concurrent mood episodes), bipolar with psychotic features, brief psychotic, substance-induced.`
        },
        weak: {
          ko: `Weak Match (40-64%): 부분. Prodromal phase, delusional disorder, schizotypal PD, OCD (delusional insight), ASD 감별.`,
          en: `Weak Match (40-64%): Partial. Rule out prodromal phase, delusional disorder, schizotypal PD, OCD (delusional insight), ASD.`
        }
      },
      differential_diagnosis: {
        ko: `• vs Schizoaffective: 정신병 + 주요 기분 episode 동반 + 정신병 ≥2주 단독 → SAD
• vs Bipolar with psychotic features: 정신병이 기분 episode 동안만 → BD
• vs Brief Psychotic Disorder: 1일-1개월, 완전 회복 → BPD
• vs Schizophreniform: 1-6개월 → SFD (조기 진단명)
• vs Delusional Disorder: 망상만, 기능 보존 → DD
• vs Substance/Medication-Induced Psychosis: tox + 시간 관계
• vs Psychosis due to Medical (encephalitis, NMDA receptor antibodies, tumor): MRI, LP, autoimmune workup
• vs Schizotypal PD: 정신병 역치 미만 + 만성
• vs OCD (insight absent): 강박 핵심
• vs ASD: 사회 인지 + 발달기 발병`,
        en: `• vs Schizoaffective: psychosis + concurrent major mood episode + psychosis alone ≥2 weeks → SAD
• vs Bipolar with psychotic features: psychosis only during mood episodes → BD
• vs Brief Psychotic Disorder: 1 day-1 month, full recovery → BPD
• vs Schizophreniform: 1-6 months → SFD (provisional)
• vs Delusional Disorder: delusions only, function preserved → DD
• vs Substance/Medication-Induced Psychosis: tox + temporal relationship
• vs Psychosis due to Medical (encephalitis, NMDA receptor antibodies, tumor): MRI, LP, autoimmune workup
• vs Schizotypal PD: subthreshold + chronic
• vs OCD (insight absent): obsessions core
• vs ASD: social cognition + developmental onset`
      },
      recommended_additional: {
        ko: `• PANSS (Positive and Negative Syndrome Scale, clinician)
• SAPS/SANS (전문 척도)
• MATRICS Consensus Cognitive Battery (인지)
• Brain MRI (구조)
• EEG with P50/P300/MMN
• Drug screen (substance-induced 배제)
• Autoimmune workup (NMDA receptor antibodies — anti-NMDA encephalitis 감별)
• 가족력 (조현병 1차 친족 위험 10x)
• 동반: depression, substance use, OCD, anxiety (높은 동반율)`,
        en: `• PANSS (Positive and Negative Syndrome Scale, clinician)
• SAPS/SANS (specialized scales)
• MATRICS Consensus Cognitive Battery (cognition)
• Brain MRI (structural)
• EEG with P50/P300/MMN
• Drug screen (rule out substance-induced)
• Autoimmune workup (NMDA receptor antibodies — anti-NMDA encephalitis rule-out)
• Family history (1st-degree relatives 10× risk)
• Comorbidity: depression, substance use, OCD, anxiety (high rates)`
      },
      treatment_options: {
        ko: `⚠️ 항정신병약이 핵심 — NFB는 보조 역할만, 절대 대체 ❌:
• 정신과 즉시 referral — 항정신병약 (atypical 1차: risperidone, olanzapine, aripiprazole; clozapine 치료 저항 시)
• ⚠️ NFB 안정기에만: alpha-theta (조심), SMR, P50 gating 훈련 — augmentation only (Sürmeli 2012)
• 인지 재활 (Cognitive Remediation Therapy — Wykes 2011)
• 가족 심리교육 (relapse 25% 감소)
• 사회 기술 훈련
• Vocational rehabilitation (supported employment)
• 안전 계획 + 위기 자원 + community mental health
• 신체 건강 모니터링 (metabolic syndrome, 흡연, 심혈관)
• ⚠️ 활성 정신증 시 NFB 절대 ❌ — 정신과 응급`,
        en: `⚠️ Antipsychotics are core — NFB is adjunctive only, NEVER substitute:
• Immediate psychiatric referral — antipsychotics (atypical first-line: risperidone, olanzapine, aripiprazole; clozapine for treatment-resistant)
• ⚠️ NFB stable phase only: cautious alpha-theta, SMR, P50 gating training — augmentation only (Sürmeli 2012)
• Cognitive Remediation Therapy (Wykes 2011)
• Family psychoeducation (25% relapse reduction)
• Social skills training
• Vocational rehabilitation (supported employment)
• Safety planning + crisis resources + community mental health
• Physical health monitoring (metabolic syndrome, smoking, cardiovascular)
• ⚠️ Active psychosis = absolute NFB contraindication — psychiatric emergency`
      }
    }
  },

  modules: {

    // ========================================================================
    // insomnia_catcher_8
    // ========================================================================
    insomnia_catcher_8: {
      score_band_clinical: {
        '0-6': {
          ko: `정상 수면 범위. 임상 개입 불필요. 일반 sleep hygiene 교육 정도 권장.`,
          en: `Normal sleep range. No clinical intervention needed. General sleep hygiene education suggested.`
        },
        '7-12': {
          ko: `경미한 불면 (subthreshold). 임상 진단 기준 미충족이나 모니터링 필요. 수면 위생 교육, 2주 sleep diary, 1개월 후 재평가. 스트레스 요인 평가.`,
          en: `Subthreshold insomnia. Below clinical threshold but warrants monitoring. Sleep hygiene education, 2-week sleep diary, reassess in 1 month. Evaluate stressors.`
        },
        '13-20': {
          ko: `중등도 불면 (ISI 기준 임상적 유의). DSM-5-TR Insomnia Disorder 기준 가능성 높음. CBT-I 1차 권고. 동반 정신과 평가 (GAD/MDD). 약물 사용 평가.`,
          en: `Moderate insomnia (clinically significant per ISI). DSM-5-TR Insomnia Disorder criteria likely met. CBT-I first-line recommended. Concurrent psychiatric assessment (GAD/MDD). Medication use evaluation.`
        },
        '21-32': {
          ko: `심한 불면. 즉시 임상 개입 필요. CBT-I + sleep_apnea_catcher_7 동시 평가. PSG 강력 권장. 정신과 협진 (단기 hypnotic 필요 시). 안전 평가 (운전, 직업 위험).`,
          en: `Severe insomnia. Immediate clinical intervention required. CBT-I + concurrent sleep_apnea_catcher_7 assessment. PSG strongly recommended. Psychiatric consultation (if short-term hypnotic needed). Safety assessment (driving, occupational risk).`
        }
      },
      subscale_interpretation: {
        ko: `• 핵심증상 우세 (>8/12): primary insomnia 가능성. DSM A1-A3 직접 충족.
• 만성도 ↑ (>2/4): 3개월 이상 chronic. 만성 패턴 치료 (CBT-I 필수).
• 기능손상 ↑ (>2/4): 주간 기능 평가 필수 (학업/직업/안전).
• 유지요인 ↑ (>6/12): 수면 위생 또는 conditioned arousal 문제. CBT-I stimulus control + sleep restriction이 특히 효과적.`,
        en: `• Core symptoms predominant (>8/12): possible primary insomnia. DSM A1-A3 directly met.
• Chronicity ↑ (>2/4): ≥3 months chronic. Chronic pattern treatment (CBT-I essential).
• Impact ↑ (>2/4): mandatory daytime function assessment (school/work/safety).
• Maintaining factors ↑ (>6/12): sleep hygiene or conditioned arousal issues. CBT-I stimulus control + sleep restriction particularly effective.`
      },
      neurophysiological_correlates: {
        ko: `예측되는 객관적 marker:
• EEG: beta_power_Cz ↑ (hyperarousal, "racing thoughts" substrate)
• EEG: alpha_power_Pz ↓ (cortical disengagement 실패)
• HRV: RMSSD ↓ pre-sleep (parasympathetic disengagement 실패)
• PSG: 입면 잠복 ↑ (>30min), WASO ↑, sleep efficiency <85%
→ QEEG + HRV로 hyperarousal 패턴 객관화 권장.`,
        en: `Predicted objective markers:
• EEG: beta_power_Cz ↑ (hyperarousal, "racing thoughts" substrate)
• EEG: alpha_power_Pz ↓ (failure of cortical disengagement)
• HRV: RMSSD ↓ pre-sleep (failure of parasympathetic disengagement)
• PSG: sleep onset latency ↑ (>30 min), WASO ↑, sleep efficiency <85%
→ Recommend QEEG + HRV to objectively quantify hyperarousal.`
      },
      next_assessment: {
        ko: `• 2주 sleep diary (consensus 1차)
• Actigraphy 14일
• sleep_apnea_catcher_7 — 동시 박음
• PSG (apnea 의심, BMI ↑, 코골이, 또는 점수 ≥21)
• HRV 24h (resting + pre-sleep)
• 동반 screen: GAD-7, PHQ-9, MDQ, substance use
• Sleep environment 평가 (light, noise, temperature)`,
        en: `• 2-week sleep diary (consensus first-line)
• Actigraphy 14 days
• sleep_apnea_catcher_7 — concurrent
• PSG (if apnea suspected, BMI ↑, snoring, or score ≥21)
• HRV 24h (resting + pre-sleep)
• Comorbidity screen: GAD-7, PHQ-9, MDQ, substance use
• Sleep environment assessment (light, noise, temperature)`
      }
    },

    // ========================================================================
    // attend_catcher_18
    // ========================================================================
    attend_catcher_18: {
      score_band_clinical: {
        '0-14': {
          ko: `정상 범위. ADHD 가능성 낮음. 모니터링만 권장.`,
          en: `Normal range. ADHD unlikely. Monitoring only.`
        },
        '15-24': {
          ko: `경증 ADHD 증상. Subthreshold. 환경 조정 + 행동 전략. 3개월 후 재평가. 12세 이전 발병 + 2개 환경 여부 확인.`,
          en: `Mild ADHD symptoms. Subthreshold. Environmental modifications + behavioral strategies. Reassess in 3 months. Confirm pre-age-12 onset + ≥2 settings.`
        },
        '25-39': {
          ko: `중등도 ADHD 가능성 높음. Conners CPT + QEEG 객관 측정 권장. 임상 인터뷰 (DSM-5-TR 18 criteria 체계적 평가). 동반 평가 (GAD, MDD, sleep, learning disability).`,
          en: `Moderate ADHD likely. Conners CPT + QEEG objective measurement recommended. Clinical interview (systematic DSM-5-TR 18 criteria assessment). Comorbidity screen (GAD, MDD, sleep, learning disability).`
        },
        '40-72': {
          ko: `심한 ADHD likely (Combined Type 가능성). 약물 평가 referral (정신과). NFB protocol 시작. 학업/직업 accommodation 평가. 자해/위험 행동 평가.`,
          en: `Severe ADHD likely (possible Combined Type). Medication evaluation referral (psychiatry). Initiate NFB protocol. Assess academic/occupational accommodations. Screen for self-harm/risk behaviors.`
        }
      },
      subscale_interpretation: {
        ko: `자동 서브타입 분류:
• Inattention ≥15 + Hyperactivity <15 → ADHD-PI (Predominantly Inattentive, 314.00) — 조용한 패턴, 여성/성인에서 흔함. 우울/불안 공존 ↑.
• Inattention <15 + Hyperactivity ≥15 → ADHD-PH (Predominantly Hyperactive, 314.01) — 아동기 흔함, 성인에서 변형 가능.
• 둘 다 ≥15 → ADHD-C (Combined, 314.01) — 가장 흔한 표현형, 기능 손상 ↑.
이는 DSM-5-TR 서브타입 분류와 일치.`,
        en: `Automatic subtype classification:
• Inattention ≥15 + Hyperactivity <15 → ADHD-PI (Predominantly Inattentive, 314.00) — quiet pattern, common in females/adults. Higher depression/anxiety comorbidity.
• Inattention <15 + Hyperactivity ≥15 → ADHD-PH (Predominantly Hyperactive, 314.01) — common in childhood, may transform in adults.
• Both ≥15 → ADHD-C (Combined, 314.01) — most common phenotype, greater functional impairment.
Consistent with DSM-5-TR subtype classification.`
      },
      neurophysiological_correlates: {
        ko: `예측되는 객관적 marker:
• EEG: theta/beta ratio Fz ↑ (>2.5 성인; >3.0 아동) — cortical underarousal
• EEG: alpha peak frequency ↓ — maturational lag
• ERP: P300 amplitude ↓ Pz, latency ↑ — 주의 자원 + 처리 속도
• CPT: response time variability ↑ — 가장 robust marker (Arns 2013, Faraone 2015)
• HRV: RMSSD 경미 ↓ — autonomic regulation 결손`,
        en: `Predicted objective markers:
• EEG: theta/beta ratio Fz ↑ (>2.5 adults; >3.0 children) — cortical underarousal
• EEG: alpha peak frequency ↓ — maturational lag
• ERP: P300 amplitude ↓ Pz, latency ↑ — attention resources + processing speed
• CPT: response time variability ↑ — most robust marker (Arns 2013, Faraone 2015)
• HRV: mild RMSSD ↓ — autonomic regulation deficit`
      },
      next_assessment: {
        ko: `• Conners CPT-3 (객관적 주의/충동성, gold standard)
• Conners-3 (parent/teacher rating, 아동)
• BAARS-IV (Barkley Adult ADHD Rating, 성인)
• Full 19-channel QEEG with theta/beta + FAA
• 발달력 인터뷰 (12세 이전 증상 확인 필수)
• 학교/직장 기록 (객관적 증거)
• 동반 screen: GAD-7, PHQ-9, sleep, substance, learning
• IQ + 학업 성취 검사 (learning disability 감별)`,
        en: `• Conners CPT-3 (objective attention/impulsivity, gold standard)
• Conners-3 (parent/teacher rating, pediatric)
• BAARS-IV (Barkley Adult ADHD Rating, adult)
• Full 19-channel QEEG with theta/beta + FAA
• Developmental history interview (confirm pre-age-12 symptoms, mandatory)
• School/work records (objective evidence)
• Comorbidity screen: GAD-7, PHQ-9, sleep, substance, learning
• IQ + academic achievement testing (rule out learning disability)`
      }
    },

    // ========================================================================
    // trauma_catcher_20
    // ========================================================================
    trauma_catcher_20: {
      score_band_clinical: {
        '0-19': {
          ko: `정상 범위. PTSD 진단 ❌ likely. 외상 노출 있어도 회복 진행 또는 resilience. 외상 노출 있다면 6개월 후 재평가 (만성 발현 가능).`,
          en: `Normal range. PTSD diagnosis unlikely. Even with trauma exposure, recovery in progress or resilience. If trauma exposure present, reassess in 6 months (delayed onset possible).`
        },
        '20-32': {
          ko: `경증 PTSD 증상 (subthreshold). 일부 증상군 충족하나 진단 기준 미충족. 모니터링 + 지지 치료. 외상 처리 작업 시작 가능.`,
          en: `Mild PTSD symptoms (subthreshold). Some clusters met but full criteria not met. Monitoring + supportive therapy. Trauma processing work may begin.`
        },
        '33-49': {
          ko: `중등도 PTSD. 진단 threshold 충족 가능성 높음 (4 cluster 모두 ≥1 item ≥2 확인 필요). CAPS-5 인터뷰 권장. Trauma-focused 치료 (EMDR, PE, CPT) 시작. 동반 평가.`,
          en: `Moderate PTSD. Likely meets diagnostic threshold (confirm all 4 clusters have ≥1 item ≥2). CAPS-5 interview recommended. Initiate trauma-focused treatment (EMDR, PE, CPT). Comorbidity assessment.`
        },
        '50-80': {
          ko: `심한 PTSD. 즉시 trauma-focused 치료 필수. 정신과 referral. 자살 위험 + dissociation 평가 필수. 안전 계획. 약물 평가 (SSRI, prazosin).`,
          en: `Severe PTSD. Immediate trauma-focused treatment essential. Psychiatric referral. Mandatory suicide risk + dissociation assessment. Safety planning. Medication evaluation (SSRI, prazosin).`
        }
      },
      subscale_interpretation: {
        ko: `4 cluster 균형 분석:
• Arousal (E) 우세: hyperarousal subtype — HRV/sleep 개입 우선
• Avoidance (C) 우세: avoidant subtype — exposure therapy 핵심
• Cognition/Mood (D) 우세 + chronic 외상: CPTSD (ICD-11) 의심 — 정서조절 + 관계 + 자기개념 평가 필수
• Intrusion (B) 우세: re-experiencing — EMDR/PE 효과적
• 한 cluster 0: DSM-5-TR PTSD 진단 ❌ — Adjustment 또는 Other Specified Trauma
이는 dx threshold (PTSD probable = Total ≥33 AND 모든 cluster ≥1 item ≥2)에 통합.`,
        en: `4-cluster balance analysis:
• Arousal (E) predominant: hyperarousal subtype — HRV/sleep intervention priority
• Avoidance (C) predominant: avoidant subtype — exposure therapy central
• Cognition/Mood (D) predominant + chronic trauma: suspect CPTSD (ICD-11) — mandatory affect regulation + relationships + self-concept assessment
• Intrusion (B) predominant: re-experiencing — EMDR/PE effective
• Any cluster 0: DSM-5-TR PTSD diagnosis ❌ — Adjustment or Other Specified Trauma
Integrated with dx threshold (PTSD probable = Total ≥33 AND all clusters ≥1 item ≥2).`
      },
      neurophysiological_correlates: {
        ko: `예측되는 객관적 marker:
• EEG: alpha_power_Pz ↓↓ (z=-2.0) — posterior cortical hyperarousal (Wahbeh 2013)
• EEG: beta_power_Cz ↑ — sustained cortical activation
• EEG: FAA ↓ leftward — 우울 동반 흔함
• HRV: RMSSD ↓↓ (z=-2.5) + SDNN ↓↓ — severe autonomic dysregulation, PTSD의 가장 robust marker (Sripada 2013 meta)
• PSG: REM 분열, 악몽 빈도 ↑`,
        en: `Predicted objective markers:
• EEG: alpha_power_Pz ↓↓ (z=-2.0) — posterior cortical hyperarousal (Wahbeh 2013)
• EEG: beta_power_Cz ↑ — sustained cortical activation
• EEG: FAA ↓ leftward — depression comorbidity common
• HRV: RMSSD ↓↓ (z=-2.5) + SDNN ↓↓ — severe autonomic dysregulation, most robust PTSD marker (Sripada 2013 meta)
• PSG: REM fragmentation, nightmare frequency ↑`
      },
      next_assessment: {
        ko: `• CAPS-5 (Clinician-Administered, gold standard)
• PCL-5 (자가, 5-item DSM-5-TR criteria 확인)
• DES-II (Dissociative Experiences) — 해리 평가
• HRV 24h (resting + reactivity to trauma cues)
• Alpha topographic QEEG
• Trauma history detailed interview (외상 유형, 만성도, 발달기)
• 동반 평가: PHQ-9, MDQ, substance, suicide risk (C-SSRS)
• PSG (수면 분열 의심 시)`,
        en: `• CAPS-5 (Clinician-Administered, gold standard)
• PCL-5 (self-report, 5-item DSM-5-TR criteria)
• DES-II (Dissociative Experiences) — assess dissociation
• HRV 24h (resting + reactivity to trauma cues)
• Alpha topographic QEEG
• Detailed trauma history interview (type, chronicity, developmental period)
• Comorbidity: PHQ-9, MDQ, substance, suicide risk (C-SSRS)
• PSG (if sleep fragmentation suspected)`
      }
    },

    // ========================================================================
    // mood_catcher_9
    // ========================================================================
    mood_catcher_9: {
      score_band_clinical: {
        '0-4': {
          ko: `정상 범위. 우울 증상 minimal.`,
          en: `Normal range. Minimal depressive symptoms.`
        },
        '5-9': {
          ko: `경증 우울 (PHQ-9 기준). 임상적 우울 진단 ❌ 가능성. 스트레스 관리 + 모니터링. 2주 후 재평가. 위험 평가 (자살 사고).`,
          en: `Mild depression (per PHQ-9). Likely below clinical threshold. Stress management + monitoring. Reassess in 2 weeks. Risk assessment (suicidal ideation).`
        },
        '10-14': {
          ko: `중등도 우울. 치료 권고. CBT 또는 BA 1차. 약물 평가 고려. 운동 처방. 자살 위험 평가 필수.`,
          en: `Moderate depression. Treatment recommended. CBT or BA first-line. Consider medication evaluation. Exercise prescription. Mandatory suicide risk assessment.`
        },
        '15-19': {
          ko: `중등도-심함 우울. Active treatment 필수. 정신과 referral (약물 평가). FAA NFB 시작. Bipolar 감별 (MDQ).`,
          en: `Moderately severe depression. Active treatment essential. Psychiatric referral (medication evaluation). Initiate FAA NFB. Rule out bipolar (MDQ).`
        },
        '20-27': {
          ko: `심한 우울. 즉시 정신과 referral. 자살 위험 평가 + 안전 계획 필수. 약물 + 심리치료 병행. 입원 평가 (suicidal 위험 시).`,
          en: `Severe depression. Immediate psychiatric referral. Mandatory suicide risk assessment + safety planning. Medication + psychotherapy combined. Hospitalization evaluation (if suicidal risk).`
        }
      },
      subscale_interpretation: {
        ko: `• 정서형 (emotional 우세: anhedonia + 우울 기분 + 무가치감): typical MDD, FAA NFB + BA 효과적.
• 신체형 (somatic 우세: sleep + appetite + fatigue): atypical features 가능, 갑상선/B12 평가, 수면 평가.
• 인지형 (cognitive 우세: 집중 + 정신운동): pseudodementia 감별 (노인), MCI 동반 평가.
• 위험 (suicide ideation ≥1): 즉시 안전 평가, C-SSRS, 안전 계획. ≥2 시 정신과 즉시 referral.`,
        en: `• Emotional type (anhedonia + depressed mood + worthlessness): typical MDD, FAA NFB + BA effective.
• Somatic type (sleep + appetite + fatigue): possible atypical features, evaluate thyroid/B12, sleep assessment.
• Cognitive type (concentration + psychomotor): rule out pseudodementia (elderly), assess MCI comorbidity.
• Risk (suicide ideation ≥1): immediate safety assessment, C-SSRS, safety plan. ≥2 → immediate psychiatric referral.`
      },
      neurophysiological_correlates: {
        ko: `예측되는 객관적 marker:
• EEG: Frontal Alpha Asymmetry (FAA) ↓ leftward (F3 hypoactivation) — 접근 동기 결손 (Henriques & Davidson 1991)
• EEG: alpha_power_Pz ↑ — 인지적 disengagement
• EEG: alpha peak frequency ↓
• HRV: RMSSD ↓ + SDNN ↓ — vagal hypothesis (Thayer 2012)
• Sleep: REM latency ↓, REM density ↑ (atypical features 시)`,
        en: `Predicted objective markers:
• EEG: Frontal Alpha Asymmetry (FAA) ↓ leftward (F3 hypoactivation) — approach motivation deficit (Henriques & Davidson 1991)
• EEG: alpha_power_Pz ↑ — cognitive disengagement
• EEG: alpha peak frequency ↓
• HRV: RMSSD ↓ + SDNN ↓ — vagal hypothesis (Thayer 2012)
• Sleep: REM latency ↓, REM density ↑ (if atypical features)`
      },
      next_assessment: {
        ko: `• C-SSRS (Columbia Suicide Severity Rating) — 위험 평가 필수
• PHQ-9 또는 BDI-II (보조)
• MDQ (Mood Disorder Questionnaire) — bipolar 감별 필수
• 갑상선 (TSH), B12, folate, vitD, CBC
• EEG with FAA (F3/F4 alpha asymmetry 정량화)
• HRV 24h
• 인지 평가 (≥60세 + 인지 호소 시 — pseudodementia 감별)
• GAD-7 (불안 동반)`,
        en: `• C-SSRS (Columbia Suicide Severity Rating) — mandatory risk assessment
• PHQ-9 or BDI-II (supplemental)
• MDQ (Mood Disorder Questionnaire) — mandatory bipolar rule-out
• TSH, B12, folate, vitD, CBC
• EEG with FAA (F3/F4 alpha asymmetry quantification)
• HRV 24h
• Cognitive assessment (≥60 + cognitive complaints — rule out pseudodementia)
• GAD-7 (anxiety comorbidity)`
      }
    },

    // ========================================================================
    // anxi_catcher_7
    // ========================================================================
    anxi_catcher_7: {
      score_band_clinical: {
        '0-4': {
          ko: `정상 범위. 임상적 불안 ❌.`,
          en: `Normal range. No clinical anxiety.`
        },
        '5-9': {
          ko: `경증 불안 (GAD-7 기준). Subthreshold. 스트레스 관리 + 자기 모니터링. 1개월 후 재평가.`,
          en: `Mild anxiety (per GAD-7). Subthreshold. Stress management + self-monitoring. Reassess in 1 month.`
        },
        '10-14': {
          ko: `중등도 불안. 치료 권고. CBT 1차. HRV biofeedback 시작. Panic + PTSD 감별. 카페인 제한.`,
          en: `Moderate anxiety. Treatment recommended. CBT first-line. Initiate HRV biofeedback. Rule out panic + PTSD. Caffeine restriction.`
        },
        '15-21': {
          ko: `심한 불안. Active treatment + 정신과 referral. Alpha NFB + HRV-BFB 시작. 약물 평가 (SSRI/SNRI/buspirone). 의학적 원인 배제 (갑상선, pheochromocytoma).`,
          en: `Severe anxiety. Active treatment + psychiatric referral. Initiate alpha NFB + HRV-BFB. Medication evaluation (SSRI/SNRI/buspirone). Rule out medical causes (hyperthyroid, pheochromocytoma).`
        }
      },
      subscale_interpretation: {
        ko: `• 인지형 (cognitive 우세: worry + uncontrollable worry + worry spread): classic GAD, CBT worry exposure 핵심.
• 신체형 (somatic 우세: tension + restlessness): 자율신경 우세, HRV-BFB + PMR 효과적.
• 회피형 (behavioral 우세: avoidance): 회피 행동 강화 패턴, exposure therapy 필요.
균형 패턴 = 가장 흔한 GAD 표현.`,
        en: `• Cognitive type (worry + uncontrollable worry + worry spread predominant): classic GAD, CBT worry exposure central.
• Somatic type (tension + restlessness predominant): autonomic predominant, HRV-BFB + PMR effective.
• Behavioral type (avoidance predominant): avoidance reinforcement pattern, exposure therapy needed.
Balanced pattern = most common GAD presentation.`
      },
      neurophysiological_correlates: {
        ko: `예측되는 객관적 marker:
• EEG: beta_power_Cz ↑ — cortical hyperarousal (Hannesdóttir 2010)
• EEG: alpha_power_Pz ↓ — disengagement 불능
• HRV: RMSSD ↓ + SDNN ↓ — parasympathetic withdrawal
• HRV: LF/HF ratio ↑ — sympathetic dominance (Kemp 2010 meta)
• Skin conductance: ↑ baseline reactivity`,
        en: `Predicted objective markers:
• EEG: beta_power_Cz ↑ — cortical hyperarousal (Hannesdóttir 2010)
• EEG: alpha_power_Pz ↓ — inability to disengage
• HRV: RMSSD ↓ + SDNN ↓ — parasympathetic withdrawal
• HRV: LF/HF ratio ↑ — sympathetic dominance (Kemp 2010 meta)
• Skin conductance: ↑ baseline reactivity`
      },
      next_assessment: {
        ko: `• GAD-7 (gold standard)
• PSWQ (Penn State Worry — trait worry 정량화)
• PDSS (Panic Disorder Severity) — panic 감별
• trauma_catcher_20 — PTSD 감별
• HRV 24h (resting + paced breathing)
• TSH, T4 (갑상선 항진 배제)
• 카페인/약물 사용 평가
• Polysomnography (수면 동반 시)`,
        en: `• GAD-7 (gold standard)
• PSWQ (Penn State Worry — trait worry quantification)
• PDSS (Panic Disorder Severity) — rule out panic
• trauma_catcher_20 — rule out PTSD
• HRV 24h (resting + paced breathing)
• TSH, T4 (rule out hyperthyroid)
• Caffeine/substance use evaluation
• Polysomnography (if sleep comorbidity)`
      }
    },

    // ========================================================================
    // obsess_catcher_10
    // ========================================================================
    obsess_catcher_10: {
      score_band_clinical: {
        '0-7': {
          ko: `역치 이하 (subclinical). Intrusive thoughts는 정상 인구에도 흔함. 임상 개입 ❌.`,
          en: `Subclinical. Intrusive thoughts common in normal population. No clinical intervention needed.`
        },
        '8-15': {
          ko: `경증 OCD 증상. Subthreshold. 모니터링 + 자가 학습 (ERP 개념). 1개월 후 재평가. Tic, BDD, hoarding 감별.`,
          en: `Mild OCD symptoms. Subthreshold. Monitoring + psychoeducation (ERP concepts). Reassess in 1 month. Rule out tic, BDD, hoarding.`
        },
        '16-23': {
          ko: `중등도 OCD. 치료 권고 (Y-BOCS 임상 유의). ERP CBT 1차. 약물 평가 (SSRI 고용량). 5 차원 분석 (대칭/오염/금지/체크/저장).`,
          en: `Moderate OCD. Treatment recommended (Y-BOCS clinically significant). ERP CBT first-line. Medication evaluation (high-dose SSRI). 5-dimension analysis (symmetry/contamination/forbidden/checking/hoarding).`
        },
        '24-31': {
          ko: `심한 OCD. Active treatment 필수. 정신과 + ERP 치료자 referral. 약물 (SSRI 고용량 또는 clomipramine). 가족 교육 (accommodation 패턴).`,
          en: `Severe OCD. Active treatment essential. Psychiatric + ERP therapist referral. Medication (high-dose SSRI or clomipramine). Family education (accommodation patterns).`
        },
        '32-40': {
          ko: `극심한 OCD. 즉시 ERP + 약물 시작. 입원 평가 (기능 마비, 자해 위험). Treatment-resistant 고려 (TMS, ketamine, DBS referral).`,
          en: `Extreme OCD. Immediate ERP + medication. Hospitalization evaluation (functional paralysis, self-harm risk). Consider treatment-resistant pathways (TMS, ketamine, DBS referral).`
        }
      },
      subscale_interpretation: {
        ko: `• Obsessions 우세 (obsessions > compulsions): "pure-O" 패턴, 정신적 ritual + 회피가 compulsion 역할. 인지 ERP 핵심.
• 균형 (obsessions ≈ compulsions): 전형 OCD, 행동 ERP + cognitive 둘 다.
• Compulsions 우세: ritualistic, 행동 ERP 우선. Hoarding/체크 패턴 가능.
Resistance 항목 (Q4, Q9) 낮음 = ego-syntonic 변화 → 만성 + 통찰 결손, 예후 ↓.`,
        en: `• Obsessions predominant (obsessions > compulsions): "pure-O" pattern, mental rituals + avoidance serve as compulsions. Cognitive ERP central.
• Balanced (obsessions ≈ compulsions): typical OCD, behavioral ERP + cognitive both.
• Compulsions predominant: ritualistic, behavioral ERP priority. Possible hoarding/checking pattern.
Low resistance scores (Q4, Q9) = shift to ego-syntonic → chronic + poor insight, poorer prognosis.`
      },
      neurophysiological_correlates: {
        ko: `예측되는 객관적 marker:
• EEG: beta power ↑ (frontal, cortical hyperarousal)
• EEG: Cortico-Striato-Thalamo-Cortical (CSTC) loop dysfunction — fMRI 영역
• ERP: Error-Related Negativity (ERN) ↑ amplitude — 오류 감지 과활성 (OCD 핵심 marker)
• HRV: RMSSD ↓ (불안 동반 시)
• QEEG: Min (2006) — beta elevation pattern`,
        en: `Predicted objective markers:
• EEG: beta power ↑ (frontal, cortical hyperarousal)
• EEG: Cortico-Striato-Thalamo-Cortical (CSTC) loop dysfunction — fMRI domain
• ERP: Error-Related Negativity (ERN) ↑ amplitude — error detection hyperactivity (core OCD marker)
• HRV: RMSSD ↓ (if anxiety comorbid)
• QEEG: Min (2006) — beta elevation pattern`
      },
      next_assessment: {
        ko: `• Y-BOCS (Yale-Brown OCD Scale, gold standard, clinician-administered)
• OCI-R (자가 보고, 5 차원 분석)
• DOCS (Dimensional Obsessive-Compulsive Scale)
• BDD-YBOCS (BDD 감별)
• tic_catcher_5 (Tourette/Tic 감별)
• 동반 평가: GAD-7, PHQ-9, ASD screen (ASD 동반 흔함)
• 가족력 (OCD/Tic/ASD)
• 통찰 평가 (insight specifier: good/fair/poor/absent)`,
        en: `• Y-BOCS (Yale-Brown OCD Scale, gold standard, clinician-administered)
• OCI-R (self-report, 5-dimension analysis)
• DOCS (Dimensional Obsessive-Compulsive Scale)
• BDD-YBOCS (BDD rule-out)
• tic_catcher_5 (Tourette/Tic rule-out)
• Comorbidity: GAD-7, PHQ-9, ASD screen (ASD comorbid common)
• Family history (OCD/Tic/ASD)
• Insight assessment (insight specifier: good/fair/poor/absent)`
      }
    },

    // ========================================================================
    // Phase C — alcohol_use_catcher_10
    // ========================================================================
    alcohol_use_catcher_10: {
      score_band_clinical: {
        '0-7':   { ko: `저위험 사용 또는 절주. 임상 개입 ❌. 일반 교육.`,                                                            en: `Low-risk use or abstinent. No clinical intervention. General education.` },
        '8-15':  { ko: `위험 음주 (hazardous). brief intervention 권고 (motivational interviewing 5-10분).`,                          en: `Hazardous drinking. Brief intervention recommended (motivational interviewing 5-10 min).` },
        '16-24': { ko: `AUD 가능성 높음 (DSM-5-TR 기준 2개 이상). 정식 평가 + 치료 권고. 의학적 합병증 평가.`,                          en: `AUD likely (≥2 DSM-5-TR criteria). Formal assessment + treatment recommended. Evaluate medical complications.` },
        '25-40': { ko: `중증 AUD. 즉시 전문 치료 (해독 + 재활). 금단 위험 평가 필수. 정신과 + 내과 협진.`,                              en: `Severe AUD. Immediate specialized treatment (detox + rehab). Mandatory withdrawal risk assessment. Psychiatric + internal medicine.` }
      },
      subscale_interpretation: {
        ko: `• 사용량/빈도 우세: 위험 음주 패턴
• 통제 상실 우세: AUD 핵심 (DSM A1-A2)
• 갈망 우세: AUD A4
• 내성/금단 우세: 생리적 의존 (DSM A10-A11) — 의학적 응급 위험`,
        en: `• Quantity/frequency predominant: hazardous drinking pattern
• Loss of control predominant: AUD core (DSM A1-A2)
• Craving predominant: AUD A4
• Tolerance/withdrawal predominant: physiological dependence (DSM A10-A11) — medical emergency risk`
      },
      neurophysiological_correlates: {
        ko: `예측: alpha power ↓ (전전두엽), beta ↑ (Bauer 2001). P300 amp ↓ — alcohol risk endophenotype (Begleiter 1984). HRV ↓ (chronic). Frontal hypoactivation — executive control 결손. Reward circuit dysregulation.`,
        en: `Predicted: alpha power ↓ (prefrontal), beta ↑ (Bauer 2001). P300 amplitude ↓ — alcohol risk endophenotype (Begleiter 1984). HRV ↓ (chronic). Frontal hypoactivation — executive control deficit. Reward circuit dysregulation.`
      },
      next_assessment: {
        ko: `• AUDIT (gold standard, WHO)
• CAGE 또는 CAGE-AID
• Liver function (AST/ALT, GGT), CBC, MCV, B12/folate
• Withdrawal screen (CIWA-Ar if recent cessation)
• 동반: PHQ-9, GAD-7, PTSD screen, substance_use_catcher_8
• 가족력 (AUD)`,
        en: `• AUDIT (gold standard, WHO)
• CAGE or CAGE-AID
• Liver function (AST/ALT, GGT), CBC, MCV, B12/folate
• Withdrawal screen (CIWA-Ar if recent cessation)
• Comorbidity: PHQ-9, GAD-7, PTSD screen, substance_use_catcher_8
• Family history (AUD)`
      }
    },

    // ========================================================================
    // Phase C — anorexia_catcher_6
    // ========================================================================
    anorexia_catcher_6: {
      score_band_clinical: {
        '0-4':   { ko: `정상 범위. 식이/체중 우려 ❌.`,                                                                              en: `Normal range. No eating/weight concerns.` },
        '5-9':   { ko: `우려 수준 (subthreshold). disordered eating 가능. 모니터링 + 영양 교육.`,                                      en: `Subthreshold concern. Possible disordered eating. Monitoring + nutrition education.` },
        '10-16': { ko: `섭식장애 가능성. BMI + 체중 변화 + 의학적 평가 필수. 영양사 referral.`,                                          en: `Eating disorder likely. Mandatory BMI + weight history + medical workup. Nutritionist referral.` },
        '17-24': { ko: `심한 섭식장애 — 즉시 평가. 의학적 응급 가능성 (electrolyte, bradycardia, hypotension). 입원 평가.`,              en: `Severe eating disorder — immediate evaluation. Medical emergency possible (electrolytes, bradycardia, hypotension). Hospitalization assessment.` }
      },
      subscale_interpretation: {
        ko: `핵심 영역: (1) 체중·체형 왜곡, (2) 비만 두려움, (3) 제한적 식이 패턴, (4) 체중 ↓ 또는 발달 정체. 모든 영역 평가 박은 자리 — 단일 영역 우세는 AN 진단 ❌.`,
        en: `Core domains: (1) weight/shape distortion, (2) fear of obesity, (3) restrictive eating, (4) weight loss or growth arrest. All domains evaluated — single-domain predominance ≠ AN diagnosis.`
      },
      neurophysiological_correlates: {
        ko: `예측: alpha peak frequency 둔화 (영양 결핍 시), P300 ↓ (cognitive). RMSSD ↓ (체중 ↓ + 자율신경 조절). EEG slowing (B12/folate 결핍 시). MRI: 회백질 위축 (회복 가능).`,
        en: `Predicted: alpha peak slowing (with nutritional deficiency), P300 ↓ (cognitive). RMSSD ↓ (low weight + autonomic dysregulation). EEG slowing (if B12/folate deficient). MRI: gray matter atrophy (reversible).`
      },
      next_assessment: {
        ko: `• EDE-Q 또는 EAT-26 (자가)
• EDE (interview, gold standard)
• BMI, 체중 history (% 감소)
• 의학적 panel: electrolytes, BUN/Cr, LFT, EKG (QTc), DEXA (long-standing), TSH
• 부인과 평가 (amenorrhea)
• 동반: depression (PHQ-9), anxiety (GAD-7), OCD
• 영양사 + 정신과 협진`,
        en: `• EDE-Q or EAT-26 (self-report)
• EDE (interview, gold standard)
• BMI, weight history (% loss)
• Medical panel: electrolytes, BUN/Cr, LFT, EKG (QTc), DEXA (long-standing), TSH
• Gynecology evaluation (amenorrhea)
• Comorbidity: depression (PHQ-9), anxiety (GAD-7), OCD
• Nutritionist + psychiatry referral`
      }
    },

    // ========================================================================
    // Phase C — antisocial_catcher_7
    // ========================================================================
    antisocial_catcher_7: {
      score_band_clinical: {
        '0-4':   { ko: `가능성 낮음. ASPD 진단 ❌.`,                                                                                   en: `Low likelihood. No ASPD diagnosis.` },
        '5-11':  { ko: `일부 반사회 특성 (subthreshold). 충동성/규범 위반 모니터링. 동반 SUD/ADHD 평가.`,                                  en: `Some antisocial traits (subthreshold). Monitor impulsivity/norm violations. Assess SUD/ADHD comorbidity.` },
        '12-19': { ko: `ASPD 가능성. 18세 이후 진단 박힘 (18세 미만 = Conduct Disorder). Forensic 평가 고려.`,                              en: `ASPD likely. Diagnosed only at 18+ (under 18 = Conduct Disorder). Consider forensic evaluation.` },
        '20-28': { ko: `심한 ASPD + 가능 psychopathy. 안전 평가 (타인/자신). 법적/사회적 영향 평가. 전문 치료 (효과 제한적).`,                en: `Severe ASPD + possible psychopathy. Safety assessment (others/self). Legal/social impact assessment. Specialized treatment (limited efficacy).` }
      },
      subscale_interpretation: {
        ko: `핵심 영역: (1) 법 위반/체포, (2) 사기/조작, (3) 충동성, (4) 공격성, (5) 무책임, (6) 무양심. DSM-5-TR ASPD = 15세 이전 Conduct Disorder + 18세 이후 ≥3 ASPD criteria.`,
        en: `Core domains: (1) law violations/arrests, (2) deceit/manipulation, (3) impulsivity, (4) aggression, (5) irresponsibility, (6) lack of remorse. DSM-5-TR ASPD = Conduct Disorder before age 15 + ≥3 ASPD criteria at age 18+.`
      },
      neurophysiological_correlates: {
        ko: `예측: frontal alpha ↑ (under-arousal, Raine 1996), 낮은 P300 amp (Patrick 2006). HRV — 양극단 (낮음 = reactive, 높음 = predatory). 피질 두께 감소 (vmPFC, OFC — Yang 2009). Skin conductance reactivity ↓ (Hare 1965). MAOA low-activity variant 위험.`,
        en: `Predicted: frontal alpha ↑ (under-arousal, Raine 1996), low P300 amplitude (Patrick 2006). HRV — bipolar pattern (low = reactive, high = predatory). Reduced cortical thickness (vmPFC, OFC — Yang 2009). Skin conductance reactivity ↓ (Hare 1965). MAOA low-activity variant risk.`
      },
      next_assessment: {
        ko: `• PCL-R (Hare Psychopathy Checklist, forensic)
• MMPI-2-RF (Aggressiveness, Antisocial Behavior scales)
• 발달력 (CD 증상 15세 이전 확인 필수)
• 법적 기록 review
• 동반 평가 필수: SUD (높음), ADHD, depression, suicide risk
• Family/collateral interview (self-report 신뢰도 ↓)
• 안전 평가 박는 자리 우선`,
        en: `• PCL-R (Hare Psychopathy Checklist, forensic)
• MMPI-2-RF (Aggressiveness, Antisocial Behavior scales)
• Developmental history (mandatory: confirm CD symptoms pre-15)
• Legal records review
• Mandatory comorbidity: SUD (high rate), ADHD, depression, suicide risk
• Family/collateral interview (self-report reliability ↓)
• Prioritize safety assessment`
      }
    },

    // ========================================================================
    // Phase C — autism_catcher_10
    // ========================================================================
    autism_catcher_10: {
      score_band_clinical: {
        '0-8':   { ko: `가능성 낮음. ASD 진단 가능성 ❌.`,                                                                            en: `Low likelihood. ASD unlikely.` },
        '9-17':  { ko: `일부 ASD 특성 (subthreshold). Broader Autism Phenotype (BAP) 가능. 모니터링.`,                                  en: `Some ASD traits (subthreshold). Possible Broader Autism Phenotype (BAP). Monitoring.` },
        '18-27': { ko: `ASD 가능성 높음. ADOS-2 정식 평가 권고. 발달력 + 적응 행동 평가.`,                                                en: `ASD likely. ADOS-2 formal evaluation recommended. Developmental history + adaptive behavior assessment.` },
        '28-40': { ko: `ASD 매우 유력 — 정식 평가 필수. Severity level 결정 (1/2/3). 동반 IDD, ADHD, anxiety 평가.`,                       en: `ASD highly likely — mandatory formal evaluation. Determine severity level (1/2/3). Assess IDD, ADHD, anxiety comorbidity.` }
      },
      subscale_interpretation: {
        ko: `• Social Communication (DSM A): 사회·정서 상호작용 + 비언어 + 관계 결손 — 3개 모두 필요
• Restricted/Repetitive (DSM B): 4개 중 2개 필요 (상동, 동일성, 제한적 관심, 감각)
• Criteria Validity: 초기 발달기 발현 (C), 기능 손상 (D), 다른 진단으로 설명 ❌ (E)
모든 cluster 충족 박힌 자리 = DSM-5-TR ASD 진단 가능.`,
        en: `• Social Communication (DSM A): social-emotional reciprocity + nonverbal + relationships — all 3 required
• Restricted/Repetitive (DSM B): ≥2 of 4 required (stereotyped, sameness, restricted interests, sensory)
• Criteria Validity: early developmental onset (C), impairment (D), not better explained (E)
All clusters met = DSM-5-TR ASD diagnosable.`
      },
      neurophysiological_correlates: {
        ko: `예측: mu rhythm suppression 결손 (Oberman 2005, mirror neuron 가설), posterior theta ↑ (Coben 2008), P300 atypical, frontal alpha asymmetry 다양. Functional connectivity 비전형 (Just 2012 — local 과연결, long-range 저연결). 감각 처리: SEP N1 ↑ (감각 과민).`,
        en: `Predicted: mu rhythm suppression deficit (Oberman 2005, mirror neuron hypothesis), posterior theta ↑ (Coben 2008), atypical P300, variable frontal alpha asymmetry. Atypical functional connectivity (Just 2012 — local hyperconnectivity, long-range hypoconnectivity). Sensory processing: SEP N1 ↑ (sensory hypersensitivity).`
      },
      next_assessment: {
        ko: `• ADOS-2 (gold standard, clinician-administered)
• ADI-R (parent/caregiver interview)
• Vineland-3 (adaptive behavior)
• IQ (WAIS-IV/WISC-V/WPPSI)
• Sensory Profile (Dunn)
• Audiology (배제)
• 동반 평가: ADHD, anxiety, OCD, IDD, GI, sleep
• Genetic referral (Fragile X, chromosomal microarray)`,
        en: `• ADOS-2 (gold standard, clinician-administered)
• ADI-R (parent/caregiver interview)
• Vineland-3 (adaptive behavior)
• IQ (WAIS-IV/WISC-V/WPPSI)
• Sensory Profile (Dunn)
• Audiology (rule out)
• Comorbidity: ADHD, anxiety, OCD, IDD, GI, sleep
• Genetic referral (Fragile X, chromosomal microarray)`
      }
    },

    // ========================================================================
    // Phase C — avoidant_dependent_catcher_8
    // ========================================================================
    avoidant_dependent_catcher_8: {
      score_band_clinical: {
        '0-6':   { ko: `Cluster C PD 가능성 낮음. 일반 수줍음/의존성 박힌 자리 정상 범위.`,                                              en: `Cluster C PD unlikely. Normal range shyness/dependency.` },
        '7-13':  { ko: `일부 특성. 사회 불안 또는 의존성 패턴 모니터링.`,                                                              en: `Some traits. Monitor social anxiety or dependency patterns.` },
        '14-22': { ko: `Avoidant 또는 Dependent PD 가능성. 정식 평가 권고. 동반 social anxiety, MDD 평가.`,                              en: `Avoidant or Dependent PD likely. Formal evaluation recommended. Assess social anxiety, MDD comorbidity.` },
        '23-32': { ko: `심한 Cluster C PD. 정신과 referral. 장기 심리치료 (schema therapy) 권고.`,                                       en: `Severe Cluster C PD. Psychiatric referral. Long-term psychotherapy (schema therapy) recommended.` }
      },
      subscale_interpretation: {
        ko: `• Avoidant subscale 우세: AvPD — 사회 회피, 부적절감, 비판 두려움 (DSM-5-TR 4개 이상)
• Dependent subscale 우세: DPD — 의존, 결정 곤란, 분리 두려움 (DSM-5-TR 5개 이상)
• 두 영역 모두 ↑: 혼합 Cluster C 또는 PDNOS
• 사회 회피만 = Social Anxiety Disorder (PD ❌)`,
        en: `• Avoidant subscale predominant: AvPD — social avoidance, inadequacy, fear of criticism (DSM-5-TR ≥4 criteria)
• Dependent subscale predominant: DPD — dependency, decision difficulty, fear of separation (DSM-5-TR ≥5 criteria)
• Both elevated: mixed Cluster C or PDNOS
• Social avoidance only = Social Anxiety Disorder (not PD)`
      },
      neurophysiological_correlates: {
        ko: `예측: alpha asymmetry 우측 우세 (위축, withdrawal motivation), RMSSD ↓ (anxiety component), startle reflex ↑ (사회 자극에). PFC-amygdala connectivity 비전형. Cortisol awakening response ↑ (chronic stress).`,
        en: `Predicted: rightward alpha asymmetry (withdrawal motivation), RMSSD ↓ (anxiety component), elevated startle reflex (to social stimuli). Atypical PFC-amygdala connectivity. Elevated cortisol awakening response (chronic stress).`
      },
      next_assessment: {
        ko: `• SCID-5-PD (structured clinical interview for PD, gold standard)
• MCMI-IV (Millon Clinical Multiaxial Inventory)
• Liebowitz Social Anxiety Scale (LSAS) — Social Anxiety 감별
• 동반: PHQ-9, GAD-7, ASD screen (AvPD vs ASD 감별)
• 발달력 (애착 패턴, 양육)
• 사회적 기능 평가`,
        en: `• SCID-5-PD (structured clinical interview for PD, gold standard)
• MCMI-IV (Millon Clinical Multiaxial Inventory)
• Liebowitz Social Anxiety Scale (LSAS) — rule out Social Anxiety
• Comorbidity: PHQ-9, GAD-7, ASD screen (AvPD vs ASD differential)
• Developmental history (attachment, caregiving)
• Social functioning assessment`
      }
    },

    // ========================================================================
    // Phase C — binge_eating_catcher_5
    // ========================================================================
    binge_eating_catcher_5: {
      score_band_clinical: {
        '0-3':   { ko: `정상 범위. BED 진단 ❌.`,                                                                                     en: `Normal range. No BED diagnosis.` },
        '4-8':   { ko: `역치 이하. Loss of control eating 모니터링. emotional eating 패턴 평가.`,                                       en: `Subthreshold. Monitor loss-of-control eating. Assess emotional eating patterns.` },
        '9-13':  { ko: `BED 가능성. ≥주 1회 폭식 + 3개 이상 (빠르게/포만감 후/혼자/수치심/혐오감). CBT-E 또는 IPT 권고.`,                  en: `BED likely. ≥1×/week binges + ≥3 of (rapid/past-fullness/alone/disgust/shame). CBT-E or IPT recommended.` },
        '14-20': { ko: `심한 BED — 즉시 평가. 비만/대사 합병증 평가. 영양사 + 정신과 협진.`,                                                en: `Severe BED — immediate evaluation. Assess obesity/metabolic complications. Nutritionist + psychiatry referral.` }
      },
      subscale_interpretation: {
        ko: `핵심: (1) 폭식 빈도/양 (주 1회 이상 × 3개월), (2) loss of control, (3) 수반 행동 (5개 중 3개), (4) distress. 보상 행동 (purging/restriction) = ❌ → BED. 있음 = BN.`,
        en: `Core: (1) binge frequency/quantity (≥1×/week × 3 months), (2) loss of control, (3) associated behaviors (≥3 of 5), (4) distress. NO compensatory behaviors (purging/restriction) → BED. If present → BN.`
      },
      neurophysiological_correlates: {
        ko: `예측: reward circuit dysregulation (Stice 2008 — striatal hyperresponse to food cues). HRV ↓ (자율신경 조절). Frontal hypoactivation (executive control 결손). Leptin/ghrelin 비정상 가능. 비만 동반 시 metabolic markers.`,
        en: `Predicted: reward circuit dysregulation (Stice 2008 — striatal hyperresponse to food cues). HRV ↓ (autonomic dysregulation). Frontal hypoactivation (executive control deficit). Possible leptin/ghrelin abnormalities. Metabolic markers if obesity comorbid.`
      },
      next_assessment: {
        ko: `• EDE-Q 또는 BES (Binge Eating Scale)
• Food/mood diary (2주)
• BMI + 체중 history
• Metabolic panel (lipid, A1C, LFT)
• 동반: depression (PHQ-9), anxiety (GAD-7), trauma (ACE)
• 영양사 referral`,
        en: `• EDE-Q or BES (Binge Eating Scale)
• Food/mood diary (2 weeks)
• BMI + weight history
• Metabolic panel (lipid, A1C, LFT)
• Comorbidity: depression (PHQ-9), anxiety (GAD-7), trauma (ACE)
• Nutritionist referral`
      }
    },

    // ========================================================================
    // Phase C — borderline_catcher_9
    // ========================================================================
    borderline_catcher_9: {
      score_band_clinical: {
        '0-7':   { ko: `BPD 가능성 낮음. 일반 정서 변동 정상 범위.`,                                                                  en: `BPD unlikely. Normal range affective variability.` },
        '8-15':  { ko: `일부 특성. emotional dysregulation 모니터링. ACE/trauma 평가.`,                                                en: `Some traits. Monitor emotional dysregulation. Assess ACE/trauma.` },
        '16-25': { ko: `BPD 가능성. DSM-5-TR 9개 중 5개 이상 필요. DBT 1차 권고. 자해/자살 위험 평가 필수.`,                              en: `BPD likely. DSM-5-TR ≥5 of 9 criteria required. DBT first-line. Mandatory self-harm/suicide assessment.` },
        '26-36': { ko: `심한 BPD. 즉시 DBT 또는 MBT. 안전 계획 + 위기 자원. 정신과 referral. 입원 평가 (자해 시).`,                       en: `Severe BPD. Immediate DBT or MBT. Safety plan + crisis resources. Psychiatric referral. Hospitalization assessment if self-harm.` }
      },
      subscale_interpretation: {
        ko: `핵심 영역 (DSM 9 criteria, ≥5 필요):
• 정서 영역: 정서 불안정, 만성 공허감, 강한 분노
• 행동 영역: 충동성, 자해/자살 행동
• 자기 영역: 정체감 혼란
• 관계 영역: 유기 두려움, 불안정한 강렬 관계
• 인지 영역: 일시적 편집 사고/해리 (스트레스 시)`,
        en: `Core domains (DSM 9 criteria, ≥5 required):
• Affective: affective instability, chronic emptiness, intense anger
• Behavioral: impulsivity, self-harm/suicidal behavior
• Self: identity disturbance
• Relational: fear of abandonment, unstable intense relationships
• Cognitive: transient paranoid ideation/dissociation under stress`
      },
      neurophysiological_correlates: {
        ko: `예측: amygdala 과활성 (정서 자극에, Donegan 2003), PFC-amygdala connectivity 결손 → 정서 조절 곤란. HRV ↓ (Koenig 2016 meta — BPD 특징). Cortisol dysregulation. 트라우마 history 흔함 (90%+ ACE).`,
        en: `Predicted: amygdala hyperactivity (to emotional stimuli, Donegan 2003), PFC-amygdala connectivity deficit → emotion regulation impairment. HRV ↓ (Koenig 2016 meta — BPD signature). Cortisol dysregulation. Trauma history common (90%+ ACE).`
      },
      next_assessment: {
        ko: `• SCID-5-PD 또는 DIB-R (Diagnostic Interview for Borderlines, gold standard)
• MSI-BPD (자가 선별)
• C-SSRS (자살 위험 — BPD에서 매우 ↑, 10% 자살 사망)
• ACE 평가 (trauma history)
• 동반: MDD, GAD, PTSD, eating disorder, SUD, dissociative
• 자해 history (NSSI vs suicidal intent 구분)
• 안전 계획`,
        en: `• SCID-5-PD or DIB-R (Diagnostic Interview for Borderlines, gold standard)
• MSI-BPD (self-screen)
• C-SSRS (suicide risk — very high in BPD, 10% suicide mortality)
• ACE assessment (trauma history)
• Comorbidity: MDD, GAD, PTSD, eating disorder, SUD, dissociative
• Self-harm history (distinguish NSSI vs suicidal intent)
• Safety plan`
      }
    },

    // ========================================================================
    // Phase C — brief_psychotic_catcher_5
    // ========================================================================
    brief_psychotic_catcher_5: {
      score_band_clinical: {
        '0-4':   { ko: `정신병적 증상 ❌. 진단 가능성 낮음.`,                                                                          en: `No psychotic symptoms. Diagnosis unlikely.` },
        '5-9':   { ko: `가능성 있음. 모니터링. 약물/물질 사용 확인.`,                                                                  en: `Possible. Monitor. Verify substance/medication use.` },
        '10-14': { ko: `Brief Psychotic Disorder 유력. 정신과 응급 referral. 안전 평가.`,                                                en: `Brief Psychotic Disorder likely. Psychiatric emergency referral. Safety assessment.` },
        '15-20': { ko: `매우 유력 — 즉시 평가. 입원 평가. 의학적 원인 (encephalitis, drug toxicity) 배제 우선.`,                          en: `Highly likely — immediate evaluation. Hospitalization assessment. Rule out medical causes (encephalitis, drug toxicity) first.` }
      },
      subscale_interpretation: {
        ko: `핵심: (1) 정신병 증상 (망상, 환각, 와해된 언어), (2) 기간 1일-1개월, (3) 완전 회복. 1개월 이상 → Schizophreniform. 6개월 이상 → Schizophrenia. Specifier: with/without marked stressor, postpartum onset.`,
        en: `Core: (1) psychotic symptoms (delusions, hallucinations, disorganized speech), (2) duration 1 day-1 month, (3) full recovery. >1 month → Schizophreniform. >6 months → Schizophrenia. Specifier: with/without marked stressor, postpartum onset.`
      },
      neurophysiological_correlates: {
        ko: `예측 (조현병과 유사하나 일시적): P50 sensory gating 결손 (가역적), gamma synchrony 변동, frontal hypoactivation. EEG: focal slowing 시 encephalitis 의심. MRI 정상 (대조 schizophrenia).`,
        en: `Predicted (similar to schizophrenia but transient): P50 sensory gating deficit (reversible), gamma synchrony fluctuation, frontal hypoactivation. EEG: focal slowing suggests encephalitis. MRI normal (vs schizophrenia).`
      },
      next_assessment: {
        ko: `• 정신과 응급 평가 우선
• Drug screen, alcohol level (substance-induced 배제)
• CBC, electrolyte, LFT, TSH, B12
• MRI 뇌 (의심 시) — encephalitis/tumor 배제
• LP (anti-NMDA receptor encephalitis 의심 시)
• Postpartum 시 추가 평가
• 안전 평가 + 입원 평가`,
        en: `• Psychiatric emergency evaluation first
• Drug screen, alcohol level (rule out substance-induced)
• CBC, electrolytes, LFT, TSH, B12
• Brain MRI (if suspected) — rule out encephalitis/tumor
• LP (if anti-NMDA receptor encephalitis suspected)
• Postpartum: additional evaluation
• Safety + hospitalization assessment`
      }
    },

    // ========================================================================
    // Phase C — bulimia_catcher_6
    // ========================================================================
    bulimia_catcher_6: {
      score_band_clinical: {
        '0-4':   { ko: `정상 범위. BN 진단 ❌.`,                                                                                      en: `Normal range. No BN diagnosis.` },
        '5-9':   { ko: `우려 수준. binge 또는 purge subthreshold. 모니터링.`,                                                          en: `Subthreshold concern. Binge or purge subthreshold. Monitoring.` },
        '10-15': { ko: `BN 가능성. ≥주 1회 binge + 보상 행동 × 3개월. CBT-E 1차. 의학적 평가 (electrolyte) 필수.`,                       en: `BN likely. ≥1×/week binge + compensatory × 3 months. CBT-E first-line. Mandatory medical (electrolytes) workup.` },
        '16-24': { ko: `심한 BN — 즉시 평가. 의학적 응급 위험 (hypokalemia, esophageal tear, dental erosion). 정신과 + 내과.`,            en: `Severe BN — immediate evaluation. Medical emergency risk (hypokalemia, esophageal tear, dental erosion). Psychiatry + internal medicine.` }
      },
      subscale_interpretation: {
        ko: `핵심: (1) 폭식 (loss of control), (2) 부적절한 보상 행동 (purging, laxative, fasting, exercise), (3) ≥주 1회 × 3개월, (4) 자아 평가가 체형/체중에 과도 의존. AN과 달리 정상 체중 박힐 자리 흔함.`,
        en: `Core: (1) binge eating (loss of control), (2) inappropriate compensatory behaviors (purging, laxatives, fasting, exercise), (3) ≥1×/week × 3 months, (4) self-evaluation overly tied to shape/weight. Unlike AN, often normal weight.`
      },
      neurophysiological_correlates: {
        ko: `예측: serotonin dysregulation (Kaye 2009), reward circuit 비정형, frontal control 결손. Electrolyte 이상 (purging) → EEG slowing 가능. ECG: QT 연장, arrhythmia 위험. 치아 부식 (gastric acid).`,
        en: `Predicted: serotonin dysregulation (Kaye 2009), atypical reward circuit, frontal control deficit. Electrolyte abnormalities (purging) → possible EEG slowing. ECG: QT prolongation, arrhythmia risk. Dental erosion (gastric acid).`
      },
      next_assessment: {
        ko: `• EDE-Q 또는 BULIT-R
• EDE (interview, gold standard)
• Electrolyte (K+, Na+, Cl-, HCO3-, Mg)
• EKG (QTc), 치과 평가
• Amylase (parotid swelling)
• 동반: MDD, anxiety, BPD, SUD
• 영양사 + 정신과 referral`,
        en: `• EDE-Q or BULIT-R
• EDE (interview, gold standard)
• Electrolytes (K+, Na+, Cl-, HCO3-, Mg)
• EKG (QTc), dental evaluation
• Amylase (parotid swelling)
• Comorbidity: MDD, anxiety, BPD, SUD
• Nutritionist + psychiatry referral`
      }
    },

    // ========================================================================
    // Phase C — circadian_catcher_5
    // ========================================================================
    circadian_catcher_5: {
      score_band_clinical: {
        '0-4':   { ko: `정상 리듬. 일주기 문제 ❌.`,                                                                                  en: `Normal rhythm. No circadian issues.` },
        '5-9':   { ko: `경미한 불일치. sleep hygiene + 광 노출 권고.`,                                                                 en: `Mild misalignment. Sleep hygiene + light exposure recommended.` },
        '10-14': { ko: `상당한 일주기 문제. Delayed/Advanced Sleep Phase, Shift Work, Jet Lag 감별. Actigraphy 14일.`,                    en: `Significant circadian issue. Differentiate Delayed/Advanced Sleep Phase, Shift Work, Jet Lag. Actigraphy 14 days.` },
        '15-20': { ko: `심한 일주기 장애. Sleep medicine 협진. Chronotherapy + 광 치료 + melatonin 평가.`,                                en: `Severe circadian disorder. Sleep medicine consultation. Chronotherapy + light therapy + melatonin evaluation.` }
      },
      subscale_interpretation: {
        ko: `Subtype (DSM-5-TR):
• Delayed Sleep Phase (DSPS): 새벽 입면 + 늦은 기상
• Advanced Sleep Phase (ASPS): 이른 입면 + 새벽 기상 (노인 흔함)
• Irregular Sleep-Wake: 불규칙 패턴 (NCD/IDD)
• Non-24-hour: 자유주행 (시각 장애 흔함)
• Shift Work: 직업 관련
• Jet Lag: 시차`,
        en: `Subtypes (DSM-5-TR):
• Delayed Sleep Phase (DSPS): late onset + late waking
• Advanced Sleep Phase (ASPS): early onset + early waking (common in elderly)
• Irregular Sleep-Wake: erratic (NCD/IDD)
• Non-24-hour: free-running (common in blind)
• Shift Work: occupational
• Jet Lag: travel-related`
      },
      neurophysiological_correlates: {
        ko: `예측: cortisol awakening response shifted, melatonin secretion 위상 변동. EEG: 활동 시간대와 sleep architecture 불일치. Suprachiasmatic nucleus (SCN) 조절 결손. DLMO (dim light melatonin onset) 측정 (전문 lab).`,
        en: `Predicted: shifted cortisol awakening response, melatonin secretion phase shift. EEG: mismatch between activity time and sleep architecture. Suprachiasmatic nucleus (SCN) regulation deficit. DLMO (dim light melatonin onset) measurement (specialized lab).`
      },
      next_assessment: {
        ko: `• 2주 sleep diary
• Actigraphy 14일 (객관적)
• Morningness-Eveningness Questionnaire (MEQ)
• DLMO (salivary melatonin, 의심 시)
• 동반: depression, anxiety, ADHD (DSPS와 연관)
• Shift work history`,
        en: `• 2-week sleep diary
• Actigraphy 14 days (objective)
• Morningness-Eveningness Questionnaire (MEQ)
• DLMO (salivary melatonin, if suspected)
• Comorbidity: depression, anxiety, ADHD (linked to DSPS)
• Shift work history`
      }
    },

    // ========================================================================
    // Phase C — cognitive_decline_catcher_8
    // ========================================================================
    cognitive_decline_catcher_8: {
      score_band_clinical: {
        '0-3':   { ko: `정상 인지. 노화 정상 범위.`,                                                                                   en: `Normal cognition. Within normal aging range.` },
        '4-8':   { ko: `주관적 우려 (SCD). 객관 검사는 정상일 가능성. 1년 후 재평가.`,                                                  en: `Subjective Cognitive Decline (SCD). Objective tests likely normal. Reassess in 1 year.` },
        '9-15':  { ko: `MCI 가능성. 신경심리 전체 평가 필수. MoCA + neuropsych battery. AD biomarker referral 고려.`,                     en: `MCI likely. Full neuropsychological evaluation mandatory. MoCA + neuropsych battery. Consider AD biomarker referral.` },
        '16-28': { ko: `치매 가능성. 신경과 즉시 referral. 일상 활동 평가 (IADL). 안전 (운전, 약물) 평가.`,                                en: `Dementia likely. Immediate neurology referral. ADL/IADL evaluation. Safety (driving, medications) assessment.` }
      },
      subscale_interpretation: {
        ko: `핵심 영역 (DSM-5-TR 6 인지 영역):
• Memory (특히 episodic — AD pattern)
• Executive function (frontotemporal, vascular)
• Language (PPA — primary progressive aphasia)
• Visuospatial (LBD, posterior cortical)
• Social cognition (FTD-behavioral)
• Complex attention
영역별 패턴 = subtype 시사 (AD/VaD/LBD/FTD/MD)`,
        en: `Core domains (DSM-5-TR 6 cognitive domains):
• Memory (especially episodic — AD pattern)
• Executive function (frontotemporal, vascular)
• Language (PPA — primary progressive aphasia)
• Visuospatial (LBD, posterior cortical)
• Social cognition (behavioral FTD)
• Complex attention
Pattern by domain suggests subtype (AD/VaD/LBD/FTD/MD)`
      },
      neurophysiological_correlates: {
        ko: `예측: alpha peak frequency 둔화 (<9Hz, AD biomarker, Babiloni 2006), P300 latency ↑ + amplitude ↓ (Jelic 2000), digit span backward ↓. AD 특이: posterior alpha + temporo-parietal slowing. FTD: frontal slowing. LBD: alpha 변동성. VaD: focal abnormalities.`,
        en: `Predicted: alpha peak frequency slowing (<9Hz, AD biomarker, Babiloni 2006), P300 latency ↑ + amplitude ↓ (Jelic 2000), digit span backward ↓. AD-specific: posterior alpha + temporoparietal slowing. FTD: frontal slowing. LBD: alpha variability. VaD: focal abnormalities.`
      },
      next_assessment: {
        ko: `• MoCA (≥26 정상)
• MMSE (보조)
• Full neuropsych (RBANS, CVLT, Trail Making, WAIS subtests)
• Brain MRI (volumetric, hippocampal)
• AD biomarkers referral: CSF Aβ42/p-tau, amyloid PET, tau PET
• B12, folate, TSH, vitD, RPR
• PHQ-9 (pseudodementia 배제)
• PSG (sleep apnea 의심 시)
• 운전 평가 (의심 시)`,
        en: `• MoCA (≥26 normal)
• MMSE (supplemental)
• Full neuropsych (RBANS, CVLT, Trail Making, WAIS subtests)
• Brain MRI (volumetric, hippocampal)
• AD biomarker referral: CSF Aβ42/p-tau, amyloid PET, tau PET
• B12, folate, TSH, vitD, RPR
• PHQ-9 (rule out pseudodementia)
• PSG (if sleep apnea suspected)
• Driving evaluation (if suspected)`
      }
    },

    // ========================================================================
    // Phase C — dissociative_catcher_8
    // ========================================================================
    dissociative_catcher_8: {
      score_band_clinical: {
        '0-4':   { ko: `정상 범위. 해리 ❌.`,                                                                                          en: `Normal range. No dissociation.` },
        '5-10':  { ko: `경미한 해리 (mild). 스트레스 관련 가능. ACE/trauma 평가.`,                                                     en: `Mild dissociation. Possibly stress-related. Assess ACE/trauma.` },
        '11-18': { ko: `유의한 해리. DPDR, DID, dissociative amnesia 감별. 전문가 평가 필수.`,                                          en: `Significant dissociation. Differentiate DPDR, DID, dissociative amnesia. Mandatory specialist evaluation.` },
        '19-32': { ko: `심한 해리 — 전문 평가. SCID-D referral. Trauma-focused 치료 (phased approach). 안전 평가.`,                       en: `Severe dissociation — specialist evaluation. SCID-D referral. Trauma-focused treatment (phased approach). Safety assessment.` }
      },
      subscale_interpretation: {
        ko: `Subtype (DSM-5-TR):
• Dissociative Identity Disorder (DID): 2개+ 인격 상태 + 기억 격차
• Depersonalization/Derealization (DPDR): 자기 분리 + 비현실감 (외부 관찰자)
• Dissociative Amnesia: 자전적 기억 결손 (정상 망각 초과)
• PTSD with Dissociative Subtype: PTSD + DPDR
• Other Specified Dissociative Disorder`,
        en: `Subtypes (DSM-5-TR):
• Dissociative Identity Disorder (DID): ≥2 personality states + memory gaps
• Depersonalization/Derealization (DPDR): self-detachment + unreality (external observer)
• Dissociative Amnesia: autobiographical memory gap (exceeds normal forgetting)
• PTSD with Dissociative Subtype: PTSD + DPDR
• Other Specified Dissociative Disorder`
      },
      neurophysiological_correlates: {
        ko: `예측: PFC hyperactivation + limbic hypoactivation (Lanius 2010 — DPDR pattern; PTSD overmodulation). HRV pattern — 변동적 (acute dissociation 시 ↑ vagal 또는 freeze response). EEG: gamma 비정형. Cortisol blunted (chronic).`,
        en: `Predicted: PFC hyperactivation + limbic hypoactivation (Lanius 2010 — DPDR pattern; PTSD overmodulation). HRV variable (acute dissociation: ↑ vagal or freeze). EEG: atypical gamma. Blunted cortisol (chronic).`
      },
      next_assessment: {
        ko: `• DES-II (Dissociative Experiences Scale)
• SCID-D (structured interview, gold standard)
• MID (Multidimensional Inventory of Dissociation)
• Trauma history (TLEQ, LEC-5) — 거의 항상 동반
• 동반: PTSD (CAPS-5), MDD, BPD, eating, SUD
• 안전 + suicide risk (높음)
• Trauma 전문가 referral`,
        en: `• DES-II (Dissociative Experiences Scale)
• SCID-D (structured interview, gold standard)
• MID (Multidimensional Inventory of Dissociation)
• Trauma history (TLEQ, LEC-5) — almost always comorbid
• Comorbidity: PTSD (CAPS-5), MDD, BPD, eating, SUD
• Safety + suicide risk (high)
• Trauma specialist referral`
      }
    },

    // ========================================================================
    // Phase C — hypersomnia_catcher_6
    // ========================================================================
    hypersomnia_catcher_6: {
      score_band_clinical: {
        '0-4':   { ko: `정상 수면. 과다수면 ❌.`,                                                                                      en: `Normal sleep. No hypersomnia.` },
        '5-10':  { ko: `경증 과다수면. 수면 빚 또는 일상 피로 가능. sleep hygiene + sleep diary.`,                                       en: `Mild hypersomnia. Possible sleep debt or daily fatigue. Sleep hygiene + sleep diary.` },
        '11-16': { ko: `중등도 과다수면 (DSM-5-TR Hypersomnolence Disorder 가능). PSG + MSLT (Multiple Sleep Latency Test) 권고.`,        en: `Moderate hypersomnia (possible DSM-5-TR Hypersomnolence Disorder). PSG + MSLT recommended.` },
        '17-24': { ko: `심한 과다수면. Narcolepsy, Idiopathic Hypersomnia, Kleine-Levin 감별. Sleep medicine 즉시 referral.`,              en: `Severe hypersomnia. Differentiate Narcolepsy, Idiopathic Hypersomnia, Kleine-Levin. Immediate sleep medicine referral.` }
      },
      subscale_interpretation: {
        ko: `Subtypes:
• Hypersomnolence Disorder (DSM): >9h 수면 + 주간 졸음 × 3개월
• Narcolepsy Type 1 (hypocretin deficient): EDS + cataplexy
• Narcolepsy Type 2: EDS without cataplexy
• Idiopathic Hypersomnia: 청정 수면에도 EDS
• Kleine-Levin: 반복적 episode (희귀)
• Sleep insufficiency: 수면 시간 부족`,
        en: `Subtypes:
• Hypersomnolence Disorder (DSM): >9h sleep + daytime sleepiness × 3 months
• Narcolepsy Type 1 (hypocretin deficient): EDS + cataplexy
• Narcolepsy Type 2: EDS without cataplexy
• Idiopathic Hypersomnia: EDS despite clean sleep
• Kleine-Levin: recurrent episodes (rare)
• Sleep insufficiency: inadequate sleep time`
      },
      neurophysiological_correlates: {
        ko: `예측: PSG — sleep latency ↓, total sleep time ↑, SOREMP (sleep-onset REM, narcolepsy). MSLT: mean sleep latency <8min + ≥2 SOREMPs = narcolepsy. CSF orexin/hypocretin ↓ (Narcolepsy Type 1). EEG: 깊은 수면 ↑, 미세각성.`,
        en: `Predicted: PSG — sleep latency ↓, total sleep time ↑, SOREMP (sleep-onset REM, narcolepsy). MSLT: mean sleep latency <8min + ≥2 SOREMPs = narcolepsy. CSF orexin/hypocretin ↓ (Narcolepsy Type 1). EEG: deep sleep ↑, microarousals.`
      },
      next_assessment: {
        ko: `• Epworth Sleepiness Scale (ESS)
• 2주 sleep diary
• Actigraphy
• PSG + MSLT (gold standard)
• HLA-DQB1*0602 (narcolepsy genetic marker)
• CSF orexin (의심 시)
• 동반: MDD, sleep apnea, circadian
• Iron/ferritin (RLS 동반)`,
        en: `• Epworth Sleepiness Scale (ESS)
• 2-week sleep diary
• Actigraphy
• PSG + MSLT (gold standard)
• HLA-DQB1*0602 (narcolepsy genetic marker)
• CSF orexin (if suspected)
• Comorbidity: MDD, sleep apnea, circadian
• Iron/ferritin (RLS comorbid)`
      }
    },

    // ========================================================================
    // Phase C — hypomania_catcher_6
    // ========================================================================
    hypomania_catcher_6: {
      score_band_clinical: {
        '0-4':   { ko: `경조증 증상 ❌. 정상 정서 범위.`,                                                                              en: `No hypomanic symptoms. Normal affective range.` },
        '5-9':   { ko: `경조증 가능성. 4일 이상 지속 episode 평가. MDQ + mood charting.`,                                              en: `Possible hypomania. Assess ≥4-day episode. MDQ + mood charting.` },
        '10-15': { ko: `경조증 유력 (DSM-5-TR Bipolar II Criterion 가능). 정신과 referral. mania 이력 확인 (BD-I 감별).`,                  en: `Hypomania likely (possible DSM-5-TR Bipolar II Criterion). Psychiatric referral. Confirm mania history (BD-I differential).` },
        '16-24': { ko: `명확한 경조증 — Bipolar II 의심. 정신과 즉시 평가. 기분 안정제 평가. ⚠️ 자살 위험 (mixed states).`,                 en: `Clear hypomania — Bipolar II suspected. Immediate psychiatric evaluation. Mood stabilizer assessment. ⚠️ Suicide risk (mixed states).` }
      },
      subscale_interpretation: {
        ko: `핵심 영역:
• core_symptoms: mood 상승/팽창적 또는 과민 (4일 이상)
• behavioral: 활동 ↑, 수면 욕구 ↓, 말 많아짐, 사고 비약
• pattern: episode 명확, 평소와 다른 명백한 변화
• functional: 명확하나 입원 불필요, 정신병 ❌ (있으면 mania → BD-I)
4 이상 영역 박힘 = BD-II 평가 필수`,
        en: `Core domains:
• core_symptoms: elevated/expansive or irritable mood (≥4 days)
• behavioral: increased activity, decreased sleep need, more talkative, flight of ideas
• pattern: distinct episode, observable change from baseline
• functional: clear but no hospitalization, no psychosis (if present, mania → BD-I)
≥4 domains positive = mandatory BD-II evaluation`
      },
      neurophysiological_correlates: {
        ko: `예측: frontal alpha ↓, beta_Cz ↑, HRV ↓ (state-dependent). Bipolar I보다 덜 명확. Circadian disruption marker. PFC-amygdala connectivity 변동.`,
        en: `Predicted: frontal alpha ↓, beta_Cz ↑, HRV ↓ (state-dependent). Less pronounced than Bipolar I. Circadian disruption marker. PFC-amygdala connectivity variability.`
      },
      next_assessment: {
        ko: `• MDQ (Mood Disorder Questionnaire — gold standard self-screen)
• YMRS (Young Mania Rating Scale)
• Hypomania Checklist (HCL-32)
• Mood charting (최소 4주)
• 가족력 (Bipolar)
• 동반: MDD, ADHD, SUD, anxiety
• Mania 이력 확인 (있으면 BD-I 재분류)
• 정신과 referral`,
        en: `• MDQ (Mood Disorder Questionnaire — gold standard self-screen)
• YMRS (Young Mania Rating Scale)
• Hypomania Checklist (HCL-32)
• Mood charting (≥4 weeks)
• Family history (Bipolar)
• Comorbidity: MDD, ADHD, SUD, anxiety
• Confirm mania history (reclassify as BD-I if present)
• Psychiatric referral`
      }
    },

    // ========================================================================
    // Phase C — learning_catcher_6
    // ========================================================================
    learning_catcher_6: {
      score_band_clinical: {
        '0-4':   { ko: `정상 학습. SLD ❌.`,                                                                                          en: `Normal learning. No SLD.` },
        '5-9':   { ko: `경미한 우려. 학습 difficulty 모니터링. 학교 평가 권고.`,                                                       en: `Mild concern. Monitor learning difficulty. School evaluation recommended.` },
        '10-16': { ko: `SLD 가능성. 정식 평가 (psychoeducational) 필수. IQ + 성취 + 인지 처리 검사. IEP/504 평가.`,                       en: `SLD likely. Mandatory formal psychoeducational evaluation. IQ + achievement + cognitive processing testing. IEP/504 evaluation.` },
        '17-24': { ko: `심한 SLD. specialized 평가 + 학교 협진. 학습 전략 + accommodation 박을 자리. ADHD/IDD 감별.`,                     en: `Severe SLD. Specialized evaluation + school collaboration. Learning strategies + accommodations. Differentiate ADHD/IDD.` }
      },
      subscale_interpretation: {
        ko: `DSM-5-TR Specifiers:
• Reading (dyslexia): word reading, fluency, comprehension
• Written expression: spelling, grammar, organization
• Mathematics (dyscalculia): number sense, fact retrieval, calculation, reasoning
영역 우세에 따라 specifier 결정. 한 영역만 또는 여러 영역. 일반 IQ는 정상 범위 (IDD 감별).`,
        en: `DSM-5-TR Specifiers:
• Reading (dyslexia): word reading, fluency, comprehension
• Written expression: spelling, grammar, organization
• Mathematics (dyscalculia): number sense, fact retrieval, calculation, reasoning
Specifier determined by domain predominance. Single or multiple domains. General IQ in normal range (rule out IDD).`
      },
      neurophysiological_correlates: {
        ko: `예측: dyslexia — left temporo-parietal hypoactivation (Shaywitz 1998), phonological 처리 결손. dyscalculia — IPS (intraparietal sulcus) 비정형. P300 latency ↑. ERP N400 (semantic) 결손 가능. fMRI 영역.`,
        en: `Predicted: dyslexia — left temporoparietal hypoactivation (Shaywitz 1998), phonological processing deficit. Dyscalculia — atypical IPS (intraparietal sulcus). P300 latency ↑. Possible ERP N400 (semantic) deficit. fMRI domain.`
      },
      next_assessment: {
        ko: `• WIAT-4 또는 WJ-IV Achievement (성취 검사)
• WISC-V/WAIS-IV (IQ, IDD 감별)
• CTOPP-2 (phonological — dyslexia)
• KeyMath-3 (mathematics)
• 학교 기록 review (성적, 교사 보고)
• Vision/hearing 배제
• 동반 평가: ADHD (높은 동반율), anxiety, language disorder
• IEP/504 plan`,
        en: `• WIAT-4 or WJ-IV Achievement (achievement testing)
• WISC-V/WAIS-IV (IQ, rule out IDD)
• CTOPP-2 (phonological — dyslexia)
• KeyMath-3 (mathematics)
• School records review (grades, teacher reports)
• Vision/hearing rule-out
• Comorbidity: ADHD (high rate), anxiety, language disorder
• IEP/504 plan`
      }
    },

    // ========================================================================
    // Phase C — mania_catcher_7
    // ========================================================================
    mania_catcher_7: {
      score_band_clinical: {
        '0-5':   { ko: `조증 ❌. 정상 범위.`,                                                                                          en: `No mania. Normal range.` },
        '6-11':  { ko: `역치 이하. 일부 mania 특성. 모니터링. MDQ.`,                                                                   en: `Subthreshold. Some manic traits. Monitoring. MDQ.` },
        '12-19': { ko: `경조증 가능성 (BD-II). 정신과 referral. mania (BD-I) 이력 확인.`,                                                en: `Hypomania likely (BD-II). Psychiatric referral. Confirm mania (BD-I) history.` },
        '20-28': { ko: `Mania 가능성 (BD-I). 정신과 응급 referral. ⚠️ 안전 평가 (risky behavior, psychosis 위험). 기분 안정제 평가.`,        en: `Mania likely (BD-I). Psychiatric emergency referral. ⚠️ Safety assessment (risky behavior, psychosis risk). Mood stabilizer evaluation.` }
      },
      subscale_interpretation: {
        ko: `Subscales (DSM-5-TR Criterion A + B):
• core_mood: 기분 상승/팽창 또는 과민
• behavioral: 활동 ↑, 수면 욕구 ↓, 말 많아짐, risky behavior
• cognitive: 사고 비약, 산만성, 과대성
• impact: 입원/정신병 (BD-I 기준) vs 기능 유지 (BD-II 기준)
Impact 영역이 결정적 — 입원/정신병 = BD-I, 유지 = BD-II`,
        en: `Subscales (DSM-5-TR Criterion A + B):
• core_mood: elevated/expansive or irritable mood
• behavioral: increased activity, decreased sleep need, more talkative, risky behavior
• cognitive: flight of ideas, distractibility, grandiosity
• impact: hospitalization/psychosis (BD-I criterion) vs functioning preserved (BD-II)
Impact domain decisive — hospitalization/psychosis = BD-I, preserved = BD-II`
      },
      neurophysiological_correlates: {
        ko: `예측: state-dependent — frontal alpha ↓↓, beta ↑↑ (hyperarousal), RMSSD ↓ (sympathetic surge), gamma 비정형 (Bahk 2014). Circadian disruption 심함. PFC-amygdala connectivity 결손.`,
        en: `Predicted: state-dependent — frontal alpha ↓↓, beta ↑↑ (hyperarousal), RMSSD ↓ (sympathetic surge), atypical gamma (Bahk 2014). Severe circadian disruption. PFC-amygdala connectivity deficit.`
      },
      next_assessment: {
        ko: `• YMRS (Young Mania Rating Scale, clinician)
• MDQ (gold standard 자가 screen)
• C-SSRS (mixed states에서 자살 위험 ↑)
• Mood charting (일일, 4주+)
• TSH, T4, drug screen (substance-induced 배제)
• Brain MRI (의심 시)
• 가족력 (Bipolar/MDD)
• 정신과 즉시 referral
• 안전 계획`,
        en: `• YMRS (Young Mania Rating Scale, clinician)
• MDQ (gold standard self-screen)
• C-SSRS (suicide risk elevated in mixed states)
• Mood charting (daily, ≥4 weeks)
• TSH, T4, drug screen (rule out substance-induced)
• Brain MRI (if suspected)
• Family history (Bipolar/MDD)
• Immediate psychiatric referral
• Safety plan`
      }
    },

    // ========================================================================
    // Phase C — narcissistic_catcher_7
    // ========================================================================
    narcissistic_catcher_7: {
      score_band_clinical: {
        '0-5':   { ko: `NPD 가능성 낮음. 일반 자존감 범위.`,                                                                          en: `NPD unlikely. Normal self-esteem range.` },
        '6-12':  { ko: `일부 자기애 특성. healthy narcissism subthreshold.`,                                                           en: `Some narcissistic traits. Subthreshold healthy narcissism.` },
        '13-20': { ko: `NPD 가능성. 정식 평가 (SCID-5-PD). Grandiose vs vulnerable subtype 감별.`,                                       en: `NPD likely. Formal evaluation (SCID-5-PD). Distinguish grandiose vs vulnerable subtype.` },
        '21-28': { ko: `심한 NPD. 정신과 referral. 동반 MDD (deflation), substance, BPD overlap 평가. 치료 동기 ↓.`,                       en: `Severe NPD. Psychiatric referral. Assess MDD (deflation), substance, BPD overlap comorbidity. Low treatment motivation.` }
      },
      subscale_interpretation: {
        ko: `Subtypes (Pincus & Lukowitsky 2010):
• Grandiose: 과시, 권리 의식, 우월감 (DSM 전형)
• Vulnerable: 수치심, 과민함, 위축 (덜 알려짐, 더 distress)
• 혼합 (대부분): 외부 grandiose + 내부 vulnerable
DSM-5-TR 9개 중 5개 이상. 18세 이후, 일관된 패턴.`,
        en: `Subtypes (Pincus & Lukowitsky 2010):
• Grandiose: exhibitionism, entitlement, superiority (DSM typical)
• Vulnerable: shame, hypersensitivity, withdrawal (less known, more distress)
• Mixed (most): outer grandiose + inner vulnerable
DSM-5-TR ≥5 of 9 criteria. Age 18+, consistent pattern.`
      },
      neurophysiological_correlates: {
        ko: `예측: insula 비정형 (interoceptive 결손, Schulze 2013), reward circuit hyper-responsive to praise. HRV ↓ (vulnerable subtype에서). PFC-amygdala connectivity. Empathy task에서 mirror neuron deficit.`,
        en: `Predicted: atypical insula (interoceptive deficit, Schulze 2013), reward circuit hyper-responsive to praise. HRV ↓ (in vulnerable subtype). PFC-amygdala connectivity. Mirror neuron deficit on empathy tasks.`
      },
      next_assessment: {
        ko: `• SCID-5-PD (gold standard)
• PNI (Pathological Narcissism Inventory) — grandiose + vulnerable
• NPI (Narcissistic Personality Inventory) — primarily grandiose
• MMPI-2-RF
• 동반: depression, substance, BPD, social anxiety (vulnerable에서)
• Collateral interview (자기 보고 신뢰도 ↓)
• 발달력 (양육 — overvaluation 또는 cold)`,
        en: `• SCID-5-PD (gold standard)
• PNI (Pathological Narcissism Inventory) — grandiose + vulnerable
• NPI (Narcissistic Personality Inventory) — primarily grandiose
• MMPI-2-RF
• Comorbidity: depression, substance, BPD, social anxiety (in vulnerable)
• Collateral interview (self-report reliability ↓)
• Developmental history (parenting — overvaluation or cold)`
      }
    },

    // ========================================================================
    // Phase C — nightmare_catcher_5
    // ========================================================================
    nightmare_catcher_5: {
      score_band_clinical: {
        '0-3':   { ko: `정상 범위. 간헐적 악몽 정상.`,                                                                                en: `Normal range. Occasional nightmares normal.` },
        '4-8':   { ko: `간헐적 악몽 (가끔). 스트레스 관련 가능. sleep hygiene + stress management.`,                                   en: `Occasional nightmares. Possibly stress-related. Sleep hygiene + stress management.` },
        '9-13':  { ko: `유의한 악몽 문제. PTSD 연관 가능. trauma_catcher_20 동시 평가. IRT (imagery rehearsal therapy) 권고.`,            en: `Significant nightmare problems. Possibly PTSD-linked. Concurrent trauma_catcher_20 assessment. IRT (imagery rehearsal therapy) recommended.` },
        '14-20': { ko: `Nightmare Disorder 또는 RBD 평가. PSG (RBD 의심 시 — REM atonia 손실). 정신과/sleep medicine.`,                    en: `Evaluate Nightmare Disorder or RBD. PSG (if RBD suspected — REM atonia loss). Psychiatry/sleep medicine.` }
      },
      subscale_interpretation: {
        ko: `Subtypes:
• Nightmare Disorder (DSM-5-TR): 반복적 악몽 (보통 REM, 늦은 밤), 각성 후 빠른 회복, distress
• REM Sleep Behavior Disorder (RBD): REM atonia 손실 + 행동화 (꿈 재연) — α-synucleinopathy 전구체 (Parkinson, LBD 위험 ↑)
• PTSD-related nightmares: trauma 내용, 일관됨
• Night terrors (NREM): 어린이, 회복 ❌`,
        en: `Subtypes:
• Nightmare Disorder (DSM-5-TR): recurrent nightmares (usually REM, late night), rapid recovery on waking, distress
• REM Sleep Behavior Disorder (RBD): loss of REM atonia + dream enactment — α-synucleinopathy prodrome (↑ Parkinson, LBD risk)
• PTSD-related nightmares: trauma content, consistent
• Night terrors (NREM): pediatric, no recovery`
      },
      neurophysiological_correlates: {
        ko: `예측: PSG REM density ↑, REM fragmentation. RBD: REM atonia 손실 (chin EMG persistent). PTSD nightmares: amygdala 과활성, PFC 결손. Noradrenergic surge (LC). Cortisol awakening response ↑.`,
        en: `Predicted: PSG REM density ↑, REM fragmentation. RBD: loss of REM atonia (persistent chin EMG). PTSD nightmares: amygdala hyperactivity, PFC deficit. Noradrenergic surge (LC). Elevated cortisol awakening response.`
      },
      next_assessment: {
        ko: `• Nightmare Effects Survey
• 2주 nightmare diary
• PSG (RBD 의심 시 필수 — α-synucleinopathy 평가)
• trauma_catcher_20 (PTSD 감별)
• 동반: PTSD, MDD, anxiety, substance
• 약물 review (β-blockers, SSRIs, withdrawal effects)
• Neurological 평가 (RBD 시 — Parkinson screen)`,
        en: `• Nightmare Effects Survey
• 2-week nightmare diary
• PSG (mandatory if RBD suspected — assess α-synucleinopathy)
• trauma_catcher_20 (rule out PTSD)
• Comorbidity: PTSD, MDD, anxiety, substance
• Medication review (β-blockers, SSRIs, withdrawal effects)
• Neurological evaluation (if RBD — Parkinson screen)`
      }
    },

    // ========================================================================
    // Phase C — odd_conduct_catcher_8 (DisruptiveCatcher8)
    // ========================================================================
    odd_conduct_catcher_8: {
      score_band_clinical: {
        '0-5':   { ko: `정상 범위. 파괴적 행동 ❌.`,                                                                                  en: `Normal range. No disruptive behavior.` },
        '6-12':  { ko: `경미한 우려. 발달 단계별 normal vs pathological 구분. parent training 권고.`,                                  en: `Mild concern. Distinguish developmentally normal vs pathological. Parent training recommended.` },
        '13-21': { ko: `파괴적 행동장애 가능성. ODD/CD/IED 감별. 학교/가정 패턴 평가. 동반 ADHD 평가 필수.`,                              en: `Disruptive behavior disorder likely. Differentiate ODD/CD/IED. Assess school/home patterns. Mandatory ADHD comorbidity assessment.` },
        '22-32': { ko: `심한 파괴적 행동. 정신과 referral. 안전 평가 (타인 + 동물 학대 시 CD severe). 가족 치료.`,                          en: `Severe disruptive behavior. Psychiatric referral. Safety assessment (cruelty to others/animals = severe CD). Family therapy.` }
      },
      subscale_interpretation: {
        ko: `Subtypes (DSM-5-TR):
• ODD (Oppositional Defiant Disorder): 분노/짜증, 논쟁/반항, 복수심 — 만성 패턴
• Conduct Disorder (CD): 타인 권리 침해 + 사회 규범 위반 (공격, 재산 파괴, 사기, 규칙 위반) — 18세 미만, 15세 이전 = ASPD 전구체
• Intermittent Explosive Disorder (IED): 충동적 폭발 episode (12회/년 또는 3회 심한)
ODD/CD에서 callous-unemotional traits 평가 (예후 ↓)`,
        en: `Subtypes (DSM-5-TR):
• ODD (Oppositional Defiant Disorder): anger/irritability, argumentative/defiant, vindictiveness — chronic pattern
• Conduct Disorder (CD): violation of others' rights + social norms (aggression, property destruction, deceit, rule violations) — under 18; pre-15 = ASPD precursor
• Intermittent Explosive Disorder (IED): impulsive explosive episodes (12×/year or 3 severe)
Assess callous-unemotional traits in ODD/CD (worse prognosis)`
      },
      neurophysiological_correlates: {
        ko: `예측: PFC hypoactivation (특히 vmPFC, OFC), amygdala 비정형. Resting HR ↓ (Raine 2002 — CD 특징). Skin conductance reactivity ↓ (callous-unemotional traits). Cortisol blunted (chronic). MAOA low-activity 위험.`,
        en: `Predicted: PFC hypoactivation (especially vmPFC, OFC), atypical amygdala. Resting HR ↓ (Raine 2002 — CD signature). Skin conductance reactivity ↓ (callous-unemotional traits). Blunted cortisol (chronic). MAOA low-activity risk.`
      },
      next_assessment: {
        ko: `• Conners CBRS (Comprehensive Behavior Rating Scales)
• ECBI (Eyberg Child Behavior Inventory)
• Antisocial Process Screening Device (callous-unemotional)
• 발달력 + 학교/가정 record
• 동반 평가 필수: ADHD (50%+ 동반), depression, anxiety, SUD, learning
• 가족 환경 평가 (parenting, ACE)
• 안전 평가 (자해 + 타해 + 동물 학대)`,
        en: `• Conners CBRS (Comprehensive Behavior Rating Scales)
• ECBI (Eyberg Child Behavior Inventory)
• Antisocial Process Screening Device (callous-unemotional)
• Developmental history + school/home records
• Mandatory comorbidity: ADHD (>50% comorbid), depression, anxiety, SUD, learning
• Family environment assessment (parenting, ACE)
• Safety (self-harm + harm to others + animal cruelty)`
      }
    },

    // ========================================================================
    // Phase C — psychosis_catcher_12
    // ========================================================================
    psychosis_catcher_12: {
      score_band_clinical: {
        '0-5':   { ko: `정신병 증상 ❌.`,                                                                                              en: `No psychotic symptoms.` },
        '6-12':  { ko: `역치 이하 / 주의 관찰. attenuated psychotic symptoms 가능 (UHR — Ultra High Risk).`,                              en: `Subthreshold / monitor. Possible attenuated psychotic symptoms (UHR — Ultra High Risk).` },
        '13-24': { ko: `정신병 가능성. 정신과 즉시 referral. SIPS/SOPS (구조화 인터뷰). 안전 평가.`,                                       en: `Psychosis likely. Immediate psychiatric referral. SIPS/SOPS (structured interview). Safety assessment.` },
        '25-48': { ko: `유의한 정신병 증상 — 정신과 응급. 입원 평가. 의학적 원인 (encephalitis, drug) 배제 우선. 안전 + 항정신병약 평가.`,    en: `Significant psychotic symptoms — psychiatric emergency. Hospitalization assessment. Rule out medical (encephalitis, drug) first. Safety + antipsychotic evaluation.` }
      },
      subscale_interpretation: {
        ko: `Subscales:
• positive_symptoms: 망상 + 환각 (DSM A 1-2) — antipsychotic 1차 표적
• disorganization: 와해된 언어/행동 (DSM A 3-4) — 인지 기능 ↓ 표시
• negative_symptoms: 정서 둔마, 무의지, 무쾌감 (DSM A 5) — 가장 치료 저항
• prodromal: 초기 변화 (UHR criteria — attenuated symptoms, BLIPS, genetic risk + functional decline)
Positive + disorganization 우세 = acute. Negative 우세 = chronic/residual.`,
        en: `Subscales:
• positive_symptoms: delusions + hallucinations (DSM A 1-2) — primary antipsychotic target
• disorganization: disorganized speech/behavior (DSM A 3-4) — indicates cognitive decline
• negative_symptoms: affective flattening, avolition, anhedonia (DSM A 5) — most treatment-resistant
• prodromal: early changes (UHR criteria — attenuated symptoms, BLIPS, genetic risk + functional decline)
Positive + disorganization predominant = acute. Negative predominant = chronic/residual.`
      },
      neurophysiological_correlates: {
        ko: `예측: P50 sensory gating 결손 (Adler 1982), P300 ↓, gamma synchrony ↓ (40Hz, Spencer 2004), MMN ↓ (조기 청각 처리 결손), frontal hypoactivation, alpha ↓ (anterior). Smooth pursuit eye movement 비정형. NMDA receptor hypofunction 가설.`,
        en: `Predicted: P50 sensory gating deficit (Adler 1982), P300 ↓, gamma synchrony ↓ (40Hz, Spencer 2004), MMN ↓ (early auditory deficit), frontal hypoactivation, alpha ↓ (anterior). Atypical smooth pursuit eye movement. NMDA receptor hypofunction hypothesis.`
      },
      next_assessment: {
        ko: `• PANSS (Positive and Negative Syndrome Scale, clinician)
• SIPS/SOPS (Structured Interview for Prodromal Syndromes)
• MATRICS Cognitive Battery
• Brain MRI (구조)
• EEG with P50/P300/MMN
• Drug screen (substance-induced 배제)
• Autoimmune workup (NMDA receptor antibodies)
• 가족력 (조현병 1차 친족)
• 정신과 즉시 referral + 안전 평가`,
        en: `• PANSS (Positive and Negative Syndrome Scale, clinician)
• SIPS/SOPS (Structured Interview for Prodromal Syndromes)
• MATRICS Cognitive Battery
• Brain MRI (structural)
• EEG with P50/P300/MMN
• Drug screen (rule out substance-induced)
• Autoimmune workup (NMDA receptor antibodies)
• Family history (1st-degree relatives with schizophrenia)
• Immediate psychiatric referral + safety assessment`
      }
    },

    // ========================================================================
    // Phase C — schizoaffective_catcher_8
    // ========================================================================
    schizoaffective_catcher_8: {
      score_band_clinical: {
        '0-7':   { ko: `SAD 가능성 낮음.`,                                                                                              en: `SAD unlikely.` },
        '8-15':  { ko: `가능성 있음. MDE 또는 mania + 정신병 증상 동반 평가.`,                                                          en: `Possible. Assess MDE or mania + concurrent psychotic symptoms.` },
        '16-23': { ko: `SAD 유력. ⚠️ 핵심 criterion: 정신병 ≥2주 단독 (기분 episode 없이) 박혀야. 정신과 referral 필수.`,                 en: `SAD likely. ⚠️ Key criterion: psychosis ≥2 weeks without mood episode required. Psychiatric referral mandatory.` },
        '24-32': { ko: `매우 유력. 전문의 확진 필요 (정신과). 항정신병약 + 기분 안정제 또는 항우울제 평가.`,                               en: `Highly likely. Specialist confirmation needed (psychiatrist). Antipsychotic + mood stabilizer or antidepressant evaluation.` }
      },
      subscale_interpretation: {
        ko: `Subscales:
• diagnostic_core: 정신병 증상 (DSM Criterion A schizophrenia) + 주요 기분 episode 동반
• subtype: Bipolar type (mania) vs Depressive type
• pattern: 정신병이 기분 episode 없이 ≥2주 (필수) + 기분 episode가 전체 활성기의 대부분 (필수)
• treatment_ruleout: 약물/물질 ❌
모든 영역 박힘 = SAD 진단. 정신병이 기분 episode 동안만 = Bipolar/MDD with psychotic features (SAD ❌).`,
        en: `Subscales:
• diagnostic_core: psychotic symptoms (DSM Criterion A schizophrenia) + concurrent major mood episode
• subtype: Bipolar type (mania) vs Depressive type
• pattern: psychosis ≥2 weeks without mood episode (mandatory) + mood episode predominant portion of active phase (mandatory)
• treatment_ruleout: not substance/medication
All domains met = SAD. Psychosis only during mood episode = Bipolar/MDD with psychotic features (not SAD).`
      },
      neurophysiological_correlates: {
        ko: `예측: 조현병 + 기분장애 markers 결합. P50 결손 (psychotic component), gamma 비정형, frontal asymmetry (mood component), HRV ↓ (depression/mania), state-dependent variation.`,
        en: `Predicted: combined schizophrenia + mood disorder markers. P50 deficit (psychotic component), atypical gamma, frontal asymmetry (mood component), HRV ↓ (depression/mania), state-dependent variation.`
      },
      next_assessment: {
        ko: `• SCID-5 (structured clinical interview)
• PANSS (정신병 증상)
• YMRS + MADRS 또는 HAM-D (기분 episode)
• Mood charting (필수 — 시간 관계 확인)
• Brain MRI
• Drug screen
• 가족력 (SAD/조현병/bipolar)
• 정신과 referral 필수`,
        en: `• SCID-5 (structured clinical interview)
• PANSS (psychotic symptoms)
• YMRS + MADRS or HAM-D (mood episodes)
• Mood charting (mandatory — confirm temporal relationship)
• Brain MRI
• Drug screen
• Family history (SAD/schizophrenia/bipolar)
• Mandatory psychiatric referral`
      }
    },

    // ========================================================================
    // Phase C — sleep_apnea_catcher_7
    // ========================================================================
    sleep_apnea_catcher_7: {
      score_band_clinical: {
        '0-5':   { ko: `OSA 저위험. 추가 평가 ❌.`,                                                                                    en: `Low OSA risk. No further assessment.` },
        '6-11':  { ko: `중간 위험. 증상 (코골이, EDS) 모니터링. BMI/체중 관리.`,                                                       en: `Moderate risk. Monitor symptoms (snoring, EDS). BMI/weight management.` },
        '12-19': { ko: `고위험 — PSG (수면다원검사) 강력 권고. CPAP titration 가능성 ↑. 심혈관 위험 평가.`,                                en: `High risk — PSG (polysomnography) strongly recommended. Possible CPAP titration. Cardiovascular risk assessment.` },
        '20-28': { ko: `매우 고위험 — 즉시 평가 필요. STOP-BANG ≥5 = 중증 OSA 가능성 매우 ↑. Sleep medicine 즉시 referral.`,               en: `Very high risk — immediate evaluation. STOP-BANG ≥5 = very high severe OSA probability. Immediate sleep medicine referral.` }
      },
      subscale_interpretation: {
        ko: `STOP-BANG 8 components (positive ≥3 = moderate risk, ≥5 = high):
• S — Snoring 큼
• T — Tired 주간
• O — Observed apnea (목격)
• P — high blood Pressure
• B — BMI >35
• A — Age >50
• N — Neck circumference >40cm
• G — male Gender
다중 양성 = PSG 필수. 동반: HTN, AFib, stroke, MI 위험 ↑.`,
        en: `STOP-BANG 8 components (positive ≥3 = moderate risk, ≥5 = high):
• S — loud Snoring
• T — daytime Tired
• O — Observed apnea
• P — high blood Pressure
• B — BMI >35
• A — Age >50
• N — Neck circumference >40cm
• G — male Gender
Multiple positive = PSG mandatory. Comorbid: HTN, AFib, stroke, MI risk ↑.`
      },
      neurophysiological_correlates: {
        ko: `예측: PSG — AHI (Apnea-Hypopnea Index) ≥5 = OSA, ≥15 moderate, ≥30 severe. ODI (Oxygen Desaturation Index) ↑. Sleep fragmentation. EEG: arousal-induced ↑ beta. 주간: P300 latency ↑, alpha peak ↓ (chronic hypoxemia). HRV ↓ + autonomic dysregulation. 인지 손상 (가역적 — CPAP 후 회복).`,
        en: `Predicted: PSG — AHI (Apnea-Hypopnea Index) ≥5 = OSA, ≥15 moderate, ≥30 severe. ODI (Oxygen Desaturation Index) ↑. Sleep fragmentation. EEG: arousal-induced ↑ beta. Daytime: P300 latency ↑, alpha peak ↓ (chronic hypoxemia). HRV ↓ + autonomic dysregulation. Cognitive impairment (reversible — recovers with CPAP).`
      },
      next_assessment: {
        ko: `• PSG (gold standard) 또는 HSAT (home sleep apnea test)
• Berlin Questionnaire 또는 ESS (Epworth)
• EKG, echo (cardiovascular)
• BMI, neck circumference
• 동반: HTN, diabetes, insomnia, depression
• 음주/약물 검토 (수면 시 호흡 억제)
• Sleep medicine referral`,
        en: `• PSG (gold standard) or HSAT (home sleep apnea test)
• Berlin Questionnaire or ESS (Epworth)
• EKG, echo (cardiovascular)
• BMI, neck circumference
• Comorbidity: HTN, diabetes, insomnia, depression
• Alcohol/medication review (respiratory depression during sleep)
• Sleep medicine referral`
      }
    },

    // ========================================================================
    // Phase C — somatic_catcher_8
    // ========================================================================
    somatic_catcher_8: {
      score_band_clinical: {
        '0-5':   { ko: `정상 범위. SSD/IAD/FND ❌.`,                                                                                   en: `Normal range. No SSD/IAD/FND.` },
        '6-12':  { ko: `경미한 우려. 신체 증상에 대한 적응적 관심 vs 비적응적 평가. 의학적 평가 우선.`,                                  en: `Mild concern. Adaptive vs maladaptive attention to somatic symptoms. Medical workup first.` },
        '13-20': { ko: `SSD/IAD 가능성. DSM-5-TR criteria 평가. CBT-S 또는 CBT-IAD 권고. 의사-환자 관계 강화.`,                            en: `SSD/IAD likely. Assess DSM-5-TR criteria. CBT-S or CBT-IAD recommended. Strengthen physician-patient relationship.` },
        '21-32': { ko: `심한 신체증상장애. 다학제 접근 (1차 의료 + 정신과). 불필요한 검사 박지 마. 기능 회복 목표.`,                       en: `Severe somatic symptom disorder. Multidisciplinary (primary care + psychiatry). Avoid unnecessary testing. Functional recovery goal.` }
      },
      subscale_interpretation: {
        ko: `Subscales (DSM-5-TR):
• somatic_symptoms: SSD — 신체 증상 + 과도한 사고/감정/행동 (시간/에너지)
• illness_anxiety: IAD — 심각한 병에 대한 집착 (증상 mild 또는 없음)
• conversion: FND — 신경학적 증상 (운동, 감각, 발작) + 의학적 설명 ❌
일부 환자는 mixed presentation. SSD/IAD = 환자 증상 진실됨 (꾀병 ❌, factitious ❌).`,
        en: `Subscales (DSM-5-TR):
• somatic_symptoms: SSD — somatic symptoms + excessive thoughts/feelings/behaviors (time/energy)
• illness_anxiety: IAD — preoccupation with serious illness (symptoms mild or absent)
• conversion: FND — neurological symptoms (motor, sensory, seizures) + no medical explanation
Mixed presentations common. SSD/IAD = symptoms genuine (not malingering, not factitious).`
      },
      neurophysiological_correlates: {
        ko: `예측: insula 과활성 (interoceptive amplification), default mode network 비정형, 신체 자극에 amygdala 과반응. HRV ↓ (somatic vigilance). Functional somatic syndromes (CFS, IBS, fibromyalgia) 동반 흔함. FND: motor/sensory representation 비정형 (Voon 2010).`,
        en: `Predicted: insula hyperactivity (interoceptive amplification), atypical default mode network, amygdala hyperresponsivity to somatic stimuli. HRV ↓ (somatic vigilance). Functional somatic syndromes (CFS, IBS, fibromyalgia) commonly comorbid. FND: atypical motor/sensory representation (Voon 2010).`
      },
      next_assessment: {
        ko: `• PHQ-15 (somatic symptom severity)
• SHAI (Short Health Anxiety Inventory) — IAD
• Whiteley Index
• 의학적 평가 우선 (배제 — 그러나 무한 검사 ❌)
• 동반: MDD, anxiety, PTSD, trauma history (FND에서 흔함)
• Functional impairment 평가
• 1차 의료 + 정신과 협진`,
        en: `• PHQ-15 (somatic symptom severity)
• SHAI (Short Health Anxiety Inventory) — IAD
• Whiteley Index
• Medical workup first (rule out — but no infinite testing)
• Comorbidity: MDD, anxiety, PTSD, trauma history (common in FND)
• Functional impairment assessment
• Primary care + psychiatry coordination`
      }
    },

    // ========================================================================
    // Phase C — substance_use_catcher_8
    // ========================================================================
    substance_use_catcher_8: {
      score_band_clinical: {
        '0-5':   { ko: `저위험 사용 또는 무사용.`,                                                                                     en: `Low-risk use or abstinent.` },
        '6-12':  { ko: `경증 SUD (DSM 2-3 criteria). brief intervention + 모니터링.`,                                                  en: `Mild SUD (DSM 2-3 criteria). Brief intervention + monitoring.` },
        '13-20': { ko: `중등도 SUD (DSM 4-5 criteria). 전문 치료 referral. 동반 정신질환 평가.`,                                          en: `Moderate SUD (DSM 4-5 criteria). Specialized treatment referral. Assess comorbid mental disorders.` },
        '21-32': { ko: `중증 SUD (DSM 6+ criteria). 즉시 치료 + 의학적 평가 (해독 위험). 안전 평가.`,                                       en: `Severe SUD (DSM 6+ criteria). Immediate treatment + medical evaluation (detox risk). Safety assessment.` }
      },
      subscale_interpretation: {
        ko: `DSM-5-TR 11 criteria:
• 통제 결손 (4): 의도보다 많이, 조절 시도 실패, 시간 소모, 갈망
• 사회적 손상 (3): 의무 실패, 대인 문제, 활동 포기
• 위험한 사용 (2): 위험 상황 사용, 신체적 해 인지 후 지속
• 약리학적 (2): 내성, 금단
2-3 mild / 4-5 moderate / 6+ severe.`,
        en: `DSM-5-TR 11 criteria:
• Impaired control (4): more than intended, failed regulation attempts, time-consuming, craving
• Social impairment (3): role failure, interpersonal problems, activities given up
• Risky use (2): hazardous situations, continued despite physical harm
• Pharmacological (2): tolerance, withdrawal
2-3 mild / 4-5 moderate / 6+ severe.`
      },
      neurophysiological_correlates: {
        ko: `예측: substance-specific. Stimulants: dopamine surge → hypofrontality (chronic). Alcohol/opioids: GABA/μ-opioid receptor downregulation. EEG: alpha ↑ baseline (chronic alcohol), beta ↑ (acute stimulant). P300 ↓ (vulnerability marker). HRV ↓. Reward circuit dysregulation.`,
        en: `Predicted: substance-specific. Stimulants: dopamine surge → chronic hypofrontality. Alcohol/opioids: GABA/μ-opioid receptor downregulation. EEG: alpha ↑ baseline (chronic alcohol), beta ↑ (acute stimulant). P300 ↓ (vulnerability marker). HRV ↓. Reward circuit dysregulation.`
      },
      next_assessment: {
        ko: `• Substance-specific scales (AUDIT, DAST-10, opioid risk tool)
• Urine drug screen
• CIWA-Ar (alcohol withdrawal), COWS (opioid withdrawal)
• Liver function, CBC
• 동반: MDD, anxiety, PTSD (높은 동반율), ASPD
• 가족력 (SUD)
• 안전 + suicide risk
• Specialized treatment referral`,
        en: `• Substance-specific scales (AUDIT, DAST-10, opioid risk tool)
• Urine drug screen
• CIWA-Ar (alcohol withdrawal), COWS (opioid withdrawal)
• Liver function, CBC
• Comorbidity: MDD, anxiety, PTSD (high rates), ASPD
• Family history (SUD)
• Safety + suicide risk
• Specialized treatment referral`
      }
    },

    // ========================================================================
    // Phase C — tic_catcher_5
    // ========================================================================
    tic_catcher_5: {
      score_band_clinical: {
        '0-3':   { ko: `틱 ❌. 일반적 운동 정상 범위.`,                                                                                en: `No tics. Normal motor range.` },
        '4-8':   { ko: `경미한 틱 (단순 운동/음성). Transient Tic Disorder 가능 (<1년). 모니터링.`,                                    en: `Mild tics (simple motor/vocal). Possible Transient Tic Disorder (<1 year). Monitoring.` },
        '9-13':  { ko: `만성 틱 (≥1년). Persistent (Chronic) Motor or Vocal Tic Disorder. Habit Reversal Training (HRT) 권고.`,            en: `Chronic tics (≥1 year). Persistent (Chronic) Motor or Vocal Tic Disorder. Habit Reversal Training (HRT) recommended.` },
        '14-20': { ko: `뚜렛 가능성 (운동 + 음성 틱 ≥1년, 18세 전 발병). 신경과/정신과 referral. CBIT + 약물 평가.`,                       en: `Tourette likely (motor + vocal tics ≥1 year, onset <18). Neurology/psychiatry referral. CBIT + medication evaluation.` }
      },
      subscale_interpretation: {
        ko: `DSM-5-TR Tic Disorders 위계:
• Provisional Tic Disorder: 단일 또는 다중 운동/음성 틱, <1년
• Persistent Motor OR Vocal Tic Disorder: 한 종류만, ≥1년
• Tourette's Disorder: 운동 + 음성 둘 다, ≥1년, 18세 전 발병
• Other Specified Tic Disorder
모든 박힌 자리 발병 18세 전 + 약물/의학 원인 ❌`,
        en: `DSM-5-TR Tic Disorders hierarchy:
• Provisional Tic Disorder: single or multiple motor/vocal tics, <1 year
• Persistent Motor OR Vocal Tic Disorder: one type only, ≥1 year
• Tourette's Disorder: both motor + vocal, ≥1 year, onset <18
• Other Specified Tic Disorder
All require onset <18 + not substance/medical`
      },
      neurophysiological_correlates: {
        ko: `예측: basal ganglia (특히 striatum) volume 비정형 (Peterson 2003), Cortico-Striato-Thalamo-Cortical (CSTC) loop dysfunction (OCD와 유사). Dopamine D2 receptor 비정형. SMA (supplementary motor area) 과활성 — 틱 발생 전 Bereitschaftspotential ↑. PMR 단계에서 EEG 변화.`,
        en: `Predicted: atypical basal ganglia (especially striatum) volume (Peterson 2003), Cortico-Striato-Thalamo-Cortical (CSTC) loop dysfunction (similar to OCD). Atypical dopamine D2 receptors. SMA (supplementary motor area) hyperactivation — Bereitschaftspotential ↑ before tic. EEG changes during PMR phase.`
      },
      next_assessment: {
        ko: `• YGTSS (Yale Global Tic Severity Scale, gold standard)
• PUTS (Premonitory Urge for Tics Scale)
• 영상 (HD video tic count)
• 동반 평가 필수: ADHD (50%+), OCD (50%+), anxiety, depression, learning, autism
• 가족력 (Tic/OCD/ASD — 유전적 연관)
• 약물 검토 (stimulants가 틱 악화 가능 — controversial)
• 신경과 referral (severe 또는 진단 불명확 시)`,
        en: `• YGTSS (Yale Global Tic Severity Scale, gold standard)
• PUTS (Premonitory Urge for Tics Scale)
• Video (HD video tic count)
• Mandatory comorbidity: ADHD (>50%), OCD (>50%), anxiety, depression, learning, autism
• Family history (Tic/OCD/ASD — genetic linkage)
• Medication review (stimulants may worsen tics — controversial)
• Neurology referral (severe or unclear diagnosis)`
      }
    }
  },

  // ==========================================================================
  // NEUROFEEDBACK PROTOCOLS — 12 diagnoses
  // BCN+PhD wellness/coaching scope. No medication. Clinician review required.
  // Equipment: Thought Technology + Mitsar 19-channel + Neuroguide normative DB.
  // ==========================================================================
  nf_protocols: {

    adhd: {
      channels: 'Cz, C3, C4 (sensorimotor strip); Fz for theta',
      target: {
        ko: 'Theta (4-7Hz) ↓ at Fz/Cz + SMR (12-15Hz) ↑ at Cz/C4. 과잉행동 subtype의 경우 C4 beta enhancement (15-18Hz).',
        en: 'Theta (4-7Hz) ↓ at Fz/Cz + SMR (12-15Hz) ↑ at Cz/C4. Beta enhancement (15-18Hz) at C4 for hyperactive subtype.'
      },
      sessions: { ko: '30-40 sessions, 주 2-3회, 30-45분/세션', en: '30-40 sessions, 2-3×/week, 30-45 min/session' },
      equipment: 'Thought Technology ProComp Infiniti; Mitsar EEG-201; Neuroguide normative DB',
      citation: 'Arns et al. 2014 (meta-analysis); Monastra et al. 2005; Lubar 1991',
      contraindication: { ko: '조절되지 않은 간질 (서파 강화 시 발작 위험), 활성 두부외상 회복기', en: 'Uncontrolled epilepsy (slow-wave protocol seizure risk), acute TBI recovery' }
    },

    adhd_inattentive: {
      channels: 'Fz, Cz, Pz',
      target: {
        ko: 'Theta ↓ + SMR (12-15Hz) ↑ at Cz; 주의 향상 위해 Pz peak alpha frequency ↑.',
        en: 'Theta ↓ + SMR (12-15Hz) ↑ at Cz; Pz peak alpha frequency ↑ for attention.'
      },
      sessions: { ko: '30-40 sessions, 주 2-3회', en: '30-40 sessions, 2-3×/week' },
      equipment: 'Thought Technology ProComp Infiniti; Mitsar EEG-201',
      citation: 'Arns et al. 2014; Monastra 2005',
      contraindication: { ko: '조절되지 않은 간질', en: 'Uncontrolled epilepsy' }
    },

    mdd: {
      channels: 'F3, F4 (frontal alpha asymmetry)',
      target: {
        ko: 'FAA correction: F3 alpha (8-12Hz) ↓ 또는 F4 alpha ↑ (좌측 접근 시스템 활성화). 보조: HRV biofeedback (resonance breathing).',
        en: 'FAA correction: F3 alpha (8-12Hz) ↓ OR F4 alpha ↑ (activate left approach system). Adjunct: HRV biofeedback (resonance breathing).'
      },
      sessions: { ko: '20-40 sessions, 주 2-3회', en: '20-40 sessions, 2-3×/week' },
      equipment: 'Thought Technology (EEG + HRV); Mitsar',
      citation: 'Baehr et al. 2001; Choi et al. 2011; Henriques & Davidson 1991',
      contraindication: { ko: '활성 자살 사고 (먼저 임상 안정화), 양극성 장애 (조증 유발 위험)', en: 'Active suicidal ideation (clinical stabilization first), bipolar disorder (risk of inducing mania)' }
    },

    gad: {
      channels: 'Pz, Oz (alpha); HRV',
      target: {
        ko: 'Pz/Oz alpha ↑ (8-12Hz). HRV biofeedback (resonance frequency ~6 breaths/min) — 1차 권고.',
        en: 'Pz/Oz alpha ↑ (8-12Hz). HRV biofeedback (resonance frequency ~6 breaths/min) — first-line.'
      },
      sessions: { ko: '20-30 sessions, 주 2-3회', en: '20-30 sessions, 2-3×/week' },
      equipment: 'Thought Technology ProComp (EEG + HRV); Mitsar',
      citation: 'Hammond 2005; Kemp et al. 2010 (HRV meta)',
      contraindication: { ko: '심한 공황 (HRV 단독 시작 권장)', en: 'Severe panic (start with HRV alone)' }
    },

    panic: {
      channels: 'Pz, Oz (alpha); HRV (primary)',
      target: {
        ko: 'HRV biofeedback (~6/min resonance breathing) — 1차. Pz alpha ↑ 보조.',
        en: 'HRV biofeedback (~6/min resonance breathing) — primary. Pz alpha ↑ adjunctive.'
      },
      sessions: { ko: '20-30 sessions, 주 2-3회', en: '20-30 sessions, 2-3×/week' },
      equipment: 'Thought Technology HRV + EEG',
      citation: 'Lehrer & Vaschillo 2008; Wheat & Larkin 2010',
      contraindication: { ko: '심부정맥 (사전 심장 평가 필요)', en: 'Cardiac arrhythmia (cardiology clearance first)' }
    },

    ptsd: {
      channels: 'T3/T4 (temporal); Pz (alpha-theta)',
      target: {
        ko: '1단계: T3/T4 alpha (8-12Hz) sync. 2단계: Pz alpha-theta (4-8Hz, 눈 감고) — Peniston-Kulkosky protocol. 보조: HRV biofeedback.',
        en: 'Stage 1: T3/T4 alpha (8-12Hz) sync. Stage 2: Pz alpha-theta (4-8Hz, eyes closed) — Peniston-Kulkosky protocol. Adjunct: HRV biofeedback.'
      },
      sessions: { ko: '30-40+ sessions, 주 2-3회. 외상 처리 단계는 임상 감독 필수.', en: '30-40+ sessions, 2-3×/week. Trauma processing stage requires clinical supervision.' },
      equipment: 'Thought Technology ProComp; Mitsar; HRV adjunct',
      citation: 'Peniston & Kulkosky 1991; van der Kolk et al. 2016; Reiter et al. 2016',
      contraindication: { ko: '활성 해리 (조심스럽게 진행), 최근 재외상화, 통제 어려운 flashback', en: 'Active dissociation (proceed cautiously), recent re-traumatization, uncontrolled flashbacks' }
    },

    ocd: {
      channels: 'Fz, F3, F4 (frontal); Cz (SMR)',
      target: {
        ko: 'Frontal high beta (18-30Hz) ↓ at Fz; SMR (12-15Hz) ↑ at Cz.',
        en: 'Frontal high beta (18-30Hz) ↓ at Fz; SMR (12-15Hz) ↑ at Cz.'
      },
      sessions: { ko: '30-40 sessions, 주 2-3회', en: '30-40 sessions, 2-3×/week' },
      equipment: 'Thought Technology; Mitsar',
      citation: 'Mills 2010; Hammond 2003; Sürmeli & Ertem 2011',
      contraindication: { ko: '심한 우울 동반 (먼저 평가)', en: 'Severe depression comorbidity (treat first)' }
    },

    asd: {
      channels: 'Cz, T3, T4 (mu rhythm sites)',
      target: {
        ko: 'SMR (12-15Hz) ↑ at Cz + theta ↓; mu rhythm suppression training at C3/C4.',
        en: 'SMR (12-15Hz) ↑ at Cz + theta ↓; mu rhythm suppression training at C3/C4.'
      },
      sessions: { ko: '40+ sessions, 주 2-3회', en: '40+ sessions, 2-3×/week' },
      equipment: 'Thought Technology; Mitsar',
      citation: 'Coben & Padolsky 2007; Pineda et al. 2008',
      contraindication: { ko: '심한 감각 과민 (천천히 ramp-up)', en: 'Severe sensory overload (slow ramp-up)' }
    },

    bipolar_1: {
      channels: 'Cz (sensorimotor); 활성 조증/경조증 시 중단',
      target: {
        ko: '⚠️ 안정기에만 — SMR (12-15Hz) ↑ at Cz, 느린 피질 전위 훈련. 정신과 의사 협진 필수.',
        en: '⚠️ STABLE PHASE ONLY — SMR (12-15Hz) ↑ at Cz, slow cortical potentials. Mandatory psychiatric co-management.'
      },
      sessions: { ko: '30+ sessions, 임상 모니터링 동반', en: '30+ sessions, with clinical monitoring' },
      equipment: 'Thought Technology; Mitsar',
      citation: 'Hammond 2005 (cautious literature); limited evidence base',
      contraindication: { ko: '⚠️ 활성 조증/경조증 — 절대 금기. 급속 순환형. 정신과 미관리 상태.', en: '⚠️ ACTIVE MANIA/HYPOMANIA — absolute contraindication. Rapid cycling. Unmanaged by psychiatry.' }
    },

    insomnia: {
      channels: 'Cz, C4 (sensorimotor)',
      target: {
        ko: 'SMR (12-15Hz) ↑ at Cz + beta (16-22Hz) ↓ at Cz. 저녁 시간대 세션 권장.',
        en: 'SMR (12-15Hz) ↑ at Cz + beta (16-22Hz) ↓ at Cz. Evening sessions preferred.'
      },
      sessions: { ko: '20+ sessions, 주 2-3회', en: '20+ sessions, 2-3×/week' },
      equipment: 'Thought Technology; Mitsar',
      citation: 'Hauri 1981; Cortoos et al. 2010',
      contraindication: { ko: '치료받지 않은 수면 무호흡 (PSG 먼저)', en: 'Untreated sleep apnea (PSG first)' }
    },

    mci: {
      channels: 'Pz, Oz (posterior)',
      target: {
        ko: 'Peak Alpha Frequency ↑ (목표 ~10.5Hz) at Pz; alpha power ↑.',
        en: 'Peak Alpha Frequency ↑ (target ~10.5Hz) at Pz; alpha power ↑.'
      },
      sessions: { ko: '20-40 sessions, 주 2-3회. 인지 훈련 + 유산소 운동 병행 권장.', en: '20-40 sessions, 2-3×/week. Combine with cognitive training + aerobic exercise.' },
      equipment: 'Thought Technology; Mitsar; Neuroguide PAF analysis',
      citation: 'Angelakis et al. 2007; Klimesch 1999; Babiloni et al. 2006',
      contraindication: { ko: '활성 섬망 (의학적 평가 우선)', en: 'Active delirium (medical workup first)' }
    },

    schizophrenia: {
      channels: '다양 — 안정기에 한정',
      target: {
        ko: '⚠️ 안정기 보조 치료에만 — alpha-theta (조심) 또는 SMR. 양성 증상 활성 시 ❌. 정신과 직접 감독 필수.',
        en: '⚠️ STABLE PHASE ADJUNCTIVE ONLY — cautious alpha-theta or SMR. ❌ when positive symptoms active. Direct psychiatric supervision required.'
      },
      sessions: { ko: '정신과 협진 하에서만 결정', en: 'Determined only under psychiatric co-management' },
      equipment: 'Thought Technology; Mitsar',
      citation: 'Sürmeli et al. 2012 (limited); Gruzelier 2014 (review — cautious)',
      contraindication: { ko: '⚠️ 활성 정신증, 양성 증상 — 절대 금기. 불안정화 위험 높음. 정신과 referral.', en: '⚠️ ACTIVE PSYCHOSIS, positive symptoms — absolute contraindication. High destabilization risk. Refer to psychiatry.' }
    }
  }
};

if (typeof window !== 'undefined') window.CLINICAL_NARRATIVES = CLINICAL_NARRATIVES;
if (typeof module !== 'undefined' && module.exports) module.exports = CLINICAL_NARRATIVES;
