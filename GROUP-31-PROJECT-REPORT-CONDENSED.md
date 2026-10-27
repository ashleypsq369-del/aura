UNIVERSITY OF MINES AND TECHNOLOGY (UMaT), TARKWA

SCHOOL OF RAILWAY AND INFRASTRUCTURAL DEVELOPMENT, ESSIKADO CAMPUS

DEPARTMENT OF COMPUTING AND DATA ANALYTICS

(COMPUTER SCIENCE AND ENGINEERING PROGRAMME)

A PROJECT REPORT ENTITLED

AN AI FRAMEWORK FOR PERSONALISED AND EXPLAINABLE
PALLIATIVE CARE SYSTEMS

BY

  PAUL SMITH QUAIDOO
  SRI.41.008.131.22

  ABDUL-BASIT ISSAH
  SRI.41.008.098.22

  ALHASSAN HINA AHMED
  SRI.41.008.023.22

PROJECT REPORT SUBMITTED IN PARTIAL FULFILMENT OF THE REQUIREMENT FOR THE
AWARD OF THE DEGREE OF BACHELOR OF SCIENCE IN COMPUTER SCIENCE AND ENGINEERING

PROJECT SUPERVISOR

…………………………………………………………..
DR ALFRED ADUTWUM AMPONSAH

SEKONDI-TAKORADI, GHANA
MARCH, 2026


---

DECLARATION

We hereby declare that this project work is our own work. It is being submitted for the degree
of Bachelor of Science in Computer Science and Engineering in the University of Mines and
Technology (UMaT), School of Railway and Infrastructural Development (SRID), Essikado.
It has not been submitted for any degree or examination in any other University.

…………………………………………………………
PAUL SMITH QUAIDOO (SRI.41.008.131.22)

…………………………………………………………
ABDUL-BASIT ISSAH (SRI.41.008.098.22)

…………………………………………………………
ALHASSAN HINA AHMED (SRI.41.008.023.22)

…………… day of ……………………………………………… (year) ………………

---

ABSTRACT

This project builds and tests an explainable, AI-powered framework designed to address
the coordination, continuity, and bereavement support gaps in palliative care, with
particular focus on the Ghanaian context. The system has four components: an intelligent
symptom-monitoring and care-management module; an explainable clinical decision-support
module using SHAP-based risk models; a unified coordination dashboard linking patients,
caregivers, and clinicians; and a structured post-bereavement support module absent from
all existing platforms reviewed. A personalisation layer sits across all four parts, deriving
each user's interface language, contrast, font size, and visible features from a short
onboarding questionnaire. Development followed a Waterfall software life cycle. Eight
XGBoost classifiers were trained on synthetic clinical data and evaluated through held-out
testing and SHAP explanations. An API integration test and a manual walkthrough of all
principal runtime flows confirmed that all three specific objectives were met. The choice of
XGBoost over the Random Forest model originally proposed is recorded and justified. The
evaluation is limited to synthetic data; no user study, accessibility audit, or security
penetration test was conducted. These are recommended before any clinical deployment.

---

ACKNOWLEDGEMENTS

Our sincere gratitude goes to our supervisor, Dr. Alfred Adutwum Amponsah, for his
guidance throughout this project. The four years of knowledge provided by the faculty of
the Department of Computing and Data Analytics at UMaT were the foundation for the
technical work reported here. We also acknowledge COMPASS Ghana and the Ghana
Palliative Care Association for the data and statistics that grounded our problem statement.
Our families, friends, and fellow students provided consistent support and we are grateful.

---

TABLE OF CONTENTS

DECLARATION                                                         i
ABSTRACT                                                            ii
ACKNOWLEDGEMENTS                                                    iii
TABLE OF CONTENTS                                                   iv
LIST OF FIGURES                                                     vi
LIST OF TABLES                                                      vii

CHAPTER 1   INTRODUCTION                                            1
  1.1   Background to the Study                                     1
  1.2   Problem Statement                                           2
  1.3   Objectives of the Study                                     2
  1.4   Significance of the Study                                   3
  1.5   Scope of the Study                                          3
  1.6   Organisation of the Work                                    3

CHAPTER 2   LITERATURE REVIEW                                       5
  2.1   Overview                                                    5
  2.2   Theoretical Review                                          5
  2.3   Empirical Review                                            8
  2.4   Summary of Related Works                                    9
  2.5   Research Gap                                               15
  2.6   Summary                                                    16

CHAPTER 3   METHODOLOGY AND SYSTEM DESIGN                          17
  3.1   Introduction                                               17
  3.2   Research Approach                                          17
  3.3   Software Development Life Cycle                            17
  3.4   System Architecture                                        19
  3.5   Database Design                                            21
  3.6   AI Model Design and Explainability                         22
  3.7   Security and Privacy Architecture                          24
  3.8   Tools and Technologies                                     24
  3.9   System Process Flow                                        25
  3.10  Summary                                                    26

CHAPTER 4   SYSTEM IMPLEMENTATION                                  27
  4.1   Introduction                                               27
  4.2   Development and Runtime Environment                        27
  4.3   Data Input Layer                                           28
  4.4   Intelligent Monitoring Core                                29
  4.5   Adaptive Care Guide                                        30
  4.6   Unified Care Dashboard                                     31
  4.7   Additional System Capabilities                             32
    4.7.1  Care Setting System                                     32
    4.7.2  AI Conversational Assistants                            32
    4.7.3  Community and Peer Support Hub                          33
    4.7.4  Push Notifications and PWA                              33
    4.7.5  HIPAA-Aligned Session Management                        33
    4.7.6  Guided Onboarding Tour                                  33
    4.7.7  Continuity Bridge                                       34
  4.8   Real-Time Communication                                    35
  4.9   Security Implementation                                    35
  4.10  Accessibility and Offline Implementation                   36
  4.11  Implementation Challenges and Resolutions                  36
  4.12  Summary                                                    38

CHAPTER 5   RESULTS, TESTING AND EVALUATION                        36
  5.1   Introduction                                               36
  5.2   Testing Strategy                                           36
  5.3   API Integration Test Results                               36
  5.4   Machine Learning Model Results                             37
  5.5   Functional Verification of Runtime Flows                   38
  5.6   Evaluation Against the Objectives                          39
  5.7   Discussion of Results                                      40
  5.8   Limitations of the Evaluation                              40
  5.9   Summary                                                    41

REFERENCES                                                         42


---

LIST OF FIGURES

Figure   Title                                                          Page

3.1      Waterfall Software Development Life Cycle                      18
3.2      System Architecture Showing the Five Cooperating Layers        20
3.3      Entity-Relationship Diagram of the System Database             22
3.4      Explainable AI Pipeline from Input Features to SHAP-Based
         Clinician Output                                               23
3.5      Security and Data Flow Architecture Showing Authentication
         and Access Control Boundaries                                  24
3.6      End-to-End System Process Flow from Patient Data Entry to
         Bereavement Support                                            26
4.1      Patient Symptom Tracking and Data Entry Screen                 29
4.2      Clinician Risk-Prediction View with SHAP-Based Explanation     30
4.3      Adaptive Care Guide Recommendation Screen                      31
4.4      Unified Care Coordination Dashboard                            32
4.5      Bereavement Support Module Screen                              35
4.6      Login and Authentication Screen                                36
5.1      SHAP Feature-Importance Summary Plot for the Risk Prediction
         Models                                                         38
5.2      ROC Curves and Confusion Matrices for the Eight XGBoost
         Models                                                         38

---

LIST OF TABLES

Table    Title                                                          Page

2.1      Summary of Related Works                                        9
3.1      Held-out test performance of the eight XGBoost risk models     23
3.2      Principal tools and technologies by architectural layer        25
4.1      High-level composition of the Project AURA codebase           28
4.2      Clinical weighting applied when combining the eight domain
         models                                                         30
4.3      The six phases of the patient journey                          31
4.4      Representative TanStack Query caching parameters               33
5.1      Results of the API integration smoke test                      37
5.2      Illustrative synthetic feature distributions                   38
5.3      Manual verification outcomes for the principal runtime flows   39
5.4      Achievement of the specific objectives set out in Chapter 1    41

---

CHAPTER 1
INTRODUCTION

1.1 Background to the Study

The World Health Organisation defines palliative care as "an approach that improves the
quality of life of patients and their families facing the problems associated with
life-threatening illness, through the prevention and relief of suffering by means of early
identification and impeccable assessment and treatment of pain and other problems,
physical, psychosocial and spiritual" (WHO, 2024). Palliative care covers anyone living
with a life-threatening illness, not only those close to death. It should run alongside active
treatment and eventually give way to hospice care when cure is no longer possible.

Globally, 56.8 million people need palliative care each year, yet fewer than 14% receive it
(WHO, 2024). The shortfall is worst in West Africa. Ghana is a clear case: palliative care
appears in at least eight national health policies, but services exist only in a handful of
urban hospitals. COMPASS Ghana reports that over 48% of the population pays for care
out of pocket (Anon., 2024a), and the National Health Insurance Authority confirmed in
2025 that 44% of Ghanaians carry no active health insurance, with the worst figures in the
Oti and Northern regions (National Health Insurance Authority, 2025). Patients reach
palliative services only days before death, and community-based care mentioned in policy
has not materialised (Anon., 2024a; Anon., 2024b).

Existing digital tools in this space handle scheduling, billing, and records. Platforms such
as Alora Hospice Software (Alora Health, 2025), CareSmartz360 (CareSmartz360, 2025),
and Netsmart's palliative care EHR system (Netsmart, 2025) offer no clinical decision
support and no bereavement follow-up. When AI is used at all, it produces mortality risk
scores that clinicians cannot interpret (Pinto et al., 2025). The structural gaps span
coordination, clinical decision support, accessibility, and post-death family care.

1.2 Problem Statement

Palliative care requires coordination, continuity, responsiveness, and personalisation, but
in practice these rarely coexist. Records do not travel with patients between care settings.
Decisions are made on incomplete information. Families carry most of the caregiving
burden yet have no formal involvement in the care process. Care ends abruptly when the
patient dies and bereaved relatives receive no follow-up.

Current tools do not close these gaps. AI in palliative care is limited to opaque mortality
models; clinicians will not act on a recommendation they cannot understand (Abbas et al.,
2025; Antoniadi et al., 2021). In Ghana, there are no dedicated inpatient palliative wards
in any teaching hospital, according to the Ghana Palliative Care Association (GPCA)
(Anon., 2024b), referrals arrive too late, and approximately 40% of bereaved people need
bereaved people need more support than family and friends can provide (Finucane et al.,
2024). No platform addresses bereavement once the patient dies.

An integrated system must handle care fragmentation, enable proactive monitoring,
produce transparent AI-driven decisions, and sustain bereavement support within the
resource constraints typical of sub-Saharan Africa.


1.3 Objectives of the Study

1.3.1 Main Objective

To develop and implement an explainable, AI-powered framework that improves
continuity, coordination, and personalised support within palliative care.

1.3.2 Specific Objectives

1.  To build an intelligent palliative care system that enables real-time patient symptom
    tracking, medication management, and scheduling of clinical activities.

2.  To incorporate Explainable Artificial Intelligence (XAI) techniques, specifically
    SHAP-based models, to generate clear and understandable risk predictions that
    clinicians can act on with confidence.

3.  To build a single, user-friendly, web-based platform that improves coordination
    among patients, caregivers, and clinicians, includes a structured post-bereavement
    support module, and protects patient data throughout.

1.4 Significance of the Study

From a computer science standpoint, most XAI work in clinical decision support remains
at the benchmark-dataset level. This project takes SHAP-based explainability out of the
laboratory and integrates it into a working web prototype that covers symptom monitoring,
care coordination, and family support simultaneously. That combination has not been tested
in palliative care before.

From a healthcare standpoint, the project addresses specific structural problems in Ghana.
A single platform combining symptom monitoring, care coordination, decision support, and
bereavement support can make care more proactive and reduce the unsupported burden on
family caregivers. Bereavement support is the feature most consistently absent from
existing platforms, yet an estimated 40% of bereaved people need more help than informal
networks can give (Finucane et al., 2024). This project builds that feature.

The work also contributes to three United Nations Sustainable Development Goals: Goal 3
(Good Health and Well-being), Goal 9 (Industry, Innovation and Infrastructure), and
Goal 10 (Reduced Inequalities), the last being most direct given the system's focus on
communities currently underserved by Ghana's palliative care system.

1.5 Scope of the Study

The project designed, built, and evaluated a software prototype with four components:
an intelligent symptom monitoring and care management module; an explainable AI
clinical decision support module; a unified coordination framework for patients, caregivers,
and clinicians; and a structured digital bereavement support module. There was no clinical
deployment and no clinical trial. AI training and testing used structured synthetic data
within the development environment. The system's light architecture was chosen
deliberately so it can run without enterprise infrastructure, which matters in resource-
limited settings across sub-Saharan Africa.

1.6 Organisation of the Work

Chapter 1 presents background, the problem, objectives, significance, and scope.
Chapter 2 reviews literature across five themes: fragmentation in palliative care, bereavement
support, personalisation and privacy, ethics in healthcare AI, and AI and chatbot systems.
Chapter 3 covers methodology and system design. Chapter 4 describes how that design was
built in code. Chapter 5 reports testing, evaluates the system against the Chapter 1 objectives,
and states the limitations of the evaluation.


---

CHAPTER 2
LITERATURE REVIEW

2.1 Overview

The literature reviewed falls into five groups: fragmentation in palliative care delivery;
bereavement and post-death family support; personalisation, privacy, and user-centred
design; ethics in healthcare AI; and AI and chatbot applications in palliative care. The
Ghanaian context runs through all five rather than standing as a separate theme, because
the local gaps are best understood by contrasting them with what the global literature
describes. Theoretical foundations are covered first, followed by empirical findings. All
reviewed works appear in Table 2.1.

2.2 Theoretical Review

2.2.1 Fragmentation in Palliative Care Systems

Health systems built around specialist, episodic care produce fragmentation as a structural
outcome (Stange, 2009). Palliative care requires the opposite: sustained, whole-patient
continuity. Lewis (2000) shows that when no single professional is accountable for
coordination, gaps appear and nobody fills them. Singer et al. (2016) document the
downstream effect: unnecessary hospitalisations, poorly controlled pain, and poor family
experience.

In Ghana, all of these theoretical failure modes show up in practice. Collaboration between
services is poor, policy integration has not been implemented, and no teaching hospital has
a dedicated palliative ward (Anon., 2024b). COMPASS Ghana data show referrals arrive
late, diagnosis often occurs only days before death, and services remain hospital-based
rather than community-based (Anon., 2024a).

2.2.2 Bereavement and Post-Death Support

WHO guidelines position the family unit as a recipient of care through bereavement (WHO,
2024). This is clinically sound: bereavement is a period of elevated risk for complicated
grief, major depression, PTSD, and suicidal ideation, especially among those who
provided most of the informal caregiving (Finucane et al., 2024). The theoretical basis
for digital bereavement intervention draws on psychological first aid and cognitive-
behavioural theories, both of which support peer networking and structured journalling.

In Ghana, where most caregiving is done by family with no formal support, bereaved carers
are at maximum vulnerability at the exact moment all support stops. This is why the
Continuity Bridge was built: to offer a virtual memory vault, journalling, and access to
professional help at that critical juncture.

2.2.3 Personalisation, Privacy, and User-Centred Design

Population-based AI models perform poorly on individuals from highly variable groups.
Palliative care patients differ sharply in diagnosis, prognosis, cultural background, religious
belief, family structure, and digital literacy. An application designed for an average patient
will fail many actual patients. Templin et al. (2024) identify six failure modes in deploying
personalised health AI: algorithmic bias, privacy violations, hallucinations and errors,
contextual insensitivity, consent deficits, and unequal access. All six are relevant to
palliative care, so the design had to personalise not just content but also consent
procedures, interfaces, and access policies.

Privacy here is not only a compliance issue. Palliative care data includes pain levels,
psychological state, family dynamics, spiritual preferences, and patient wishes around
death. Maguraushe and Ndlovu (2024) found that none of the smart-technology systems
they reviewed had a comprehensive privacy-protection policy. Alamri et al. (2025)
recommend federated learning and encryption as minimum standards for responsible health
AI; this informed the project's choice of role-based access control and HIPAA-compliant
data handling.

2.2.4 Ethics in Healthcare AI

Opacity is the central ethical problem in clinical AI. When a model cannot explain its
output, informed consent cannot be genuine. Gerke et al. (2020) work through the legal and
ethical implications of opaque clinical AI. Hildt (2025) argues that explainability is a
moral obligation, not a technical option, because an uninterpretable recommendation
cannot be consented to or meaningfully evaluated. Tilala et al. (2024) map the four
principles of biomedical ethics - beneficence, non-maleficence, autonomy, and justice  - 
directly onto AI design requirements and show that all four require transparency. Wang et
al. (2023) add that AI in palliative care risks being read as a substitute for clinical empathy,
which it is not built to be.

2.2.5 AI and Chatbot Systems in Palliative Care

Prognostic modelling using Random Forest and gradient boosting algorithms has proven
useful for clinical risk stratification because these methods handle tabular clinical data well
and produce feature importance scores. SHAP, grounded in cooperative game theory,
provides a theoretically sound way to decompose ensemble predictions into individual
feature contributions (Lundberg and Lee, 2017).

Conversational agents can deliver information in a form that is easier for elderly patients,
those with low health literacy, and people in emotional distress than reading a document.
However, Kocaballi et al. (2019) found that most health chatbots lack proper consent,
safety, and privacy structures. Coghlan et al. (2023) document cases of unhealthy chatbot
dependency in distressed users - a specific risk in palliative care settings.


2.3 Empirical Review

2.3.1 Fragmentation and Care Coordination

Wang et al. (2016) found that over 10% of hospice patients had at least one care transition
after enrolment, with hospital admission accounting for 53% of those transitions. Every
handover is a point where information gets lost. Boddaert et al. (2022) showed in a
retrospective cohort study across European sites that late palliative referral is directly
linked to incomplete care plans and poor family preparation. Singer et al. (2016) connect
the absence of multidisciplinary continuity to unnecessary hospitalisation and uncontrolled
pain. Lewis (2000) found that dedicated care coordinators significantly improved both
continuity and family satisfaction.

2.3.2 Bereavement Support

Finucane et al. (2024) reviewed 39 studies on bereavement interventions and found that
approximately 40% of bereaved individuals need support beyond informal networks. Many
experienced complicated grief, major depression, PTSD, and increased suicidal ideation.
Digital bereavement interventions using journalling, peer communication, and access to
mental health resources showed positive outcomes, with participant retention typically
above 70%. Crucially, no platform reviewed integrated bereavement tools into care
coordination - the gap this project fills.

2.3.3 Personalisation, Privacy, and Explainability

Maguraushe and Ndlovu (2024) found that inappropriate data access was a consistent
threat across all smart-technology deployments they studied, and no system had a robust
privacy framework. Alamri et al. (2025) demonstrated that federated learning and
encryption substantially reduce privacy risk. Kocaballi et al. (2019) found that very few
health chatbots implemented adequate consent or safety structures.

2.3.4 Explainability and Clinical Decision Support

Parsons et al. (2025) found that explainability was the requirement most often left unmet
across clinical decision support systems. Abbas et al. (2025), analysing 62 XAI studies,
found that SHAP-based explanations integrated into clinical dashboard interfaces were
especially effective at building clinician trust. Antoniadi et al. (2021) confirmed that
explanation interfaces embedded in existing clinical workflows outperform stand-alone
explanation documents.

2.3.5 AI and Chatbot Applications

Pinto et al. (2025) reviewed AI systems in palliative care communication and found the
field still dominated by mortality prediction tools that provide survival estimates but no
support for care coordination or family preparation. Once the patient dies, such systems
have no further use. None of the reviewed systems met all four criteria of accuracy,
explainability, auditability, and clinician-patient co-design. Coghlan et al. (2023) add that
anthropomorphisation of chatbots by distressed patients creates dependency risks that most
systems were never designed to handle.


2.4 Summary of Related Works

Table 2.1: Summary of Related Works

No.  Author(s) and Year         Title                                    Method                         Key Findings                                                                                    Limitation

1    Wang et al. (2016)         Care Transitions and Fragmentation       Systematic review              10.2% of hospice enrolees had at least one transition post-enrolment;                           No technological solution proposed
                                in Palliative Settings                                                  53.4% of transitions were hospital admissions; fragmentation
                                                                                                        highest in underserved patients.

2    Boddaert et al. (2022)     Late Palliative Care Initiation and      Retrospective cohort           Late referral strongly linked to poor continuity and incomplete                                No AI intervention proposed for early
                                Care Continuity                                                         care plans; worse outcomes for patients referred in final days.                                 deterioration detection.

3    Anon. (2024a)              Palliative Care Access and Service       National programme data        48% of Ghana's population lacks insurance; late referrals; services                            Descriptive only; no technological
                                Gaps in Ghana                                                           concentrated in urban hospitals.                                                               solution proposed.

4    Anon. (2024b)              Palliative Care Development and          Organisational reporting       No dedicated palliative ward in any teaching hospital; poor service                            Descriptive only; no digital solutions
                                Situation in Ghana                                                      integration; no national implementation plan.                                                  proposed.

5    Lewis (2000)               Care Coordinators in Continuity of       Mixed-methods                  Dedicated coordinators significantly improved continuity and                                   Focuses on human coordination; does
                                End-of-Life Care                                                        family satisfaction.                                                                           not address digital coordination.

6    Stange (2009)              The Problem of Fragmentation             Conceptual synthesis           Specialist-dominated systems produce fragmentation; integrative                                Theoretical; no technological solution.
                                                                                                        approaches produce better outcomes.

7    Singer et al. (2016)       Multidisciplinary Continuity and         Prospective longitudinal       Absence of continuity correlated with unnecessary hospitalisations                             Does not evaluate AI-based continuity
                                Quality of End-of-Life Care                                             and uncontrolled pain.                                                                         solutions.

8    Finucane et al. (2024)     Bereavement Outcomes and                 Rapid review (39 studies)      Online bereavement support feasible and effective; retention above                             No dedicated digital platform proposed
                                Palliative Care Support                                                 70%; reduced grief intensity and isolation.                                                    for post-death family support.

9    Templin et al. (2024)      Challenges in Personalised               Narrative review               Six core deployment failures identified: algorithmic bias, privacy                             No specific system proposed addressing
                                Health AI Deployment                                                    violations, hallucination, insensitivity, consent deficits, inequity.                          all six in palliative care.

10   Maguraushe and             Privacy Risks in Smart                   Qualitative case study         Smart health technologies introduced significant privacy risks;                                No privacy-preserving platform proposed
     Ndlovu (2024)              Technologies in Palliative Care                                         no robust privacy framework found in any reviewed system.                                      for palliative care.

11   Alamri et al. (2025)       Privacy-Preserving Architectures         Experimental design            Federated learning and encryption significantly reduced privacy risk;                          Not tested in palliative care settings.
                                for Healthcare AI                                                       role-based access control maintained high performance.

12   Kocaballi et al. (2019)    Conversational Agents in                 Systematic review (41          Most health chatbots lacked consent, safety, and privacy structures.                           No integrated solution proposed.
                                Healthcare                               studies)

13   Gris et al. (2023)         Ethical Challenges of AI in              Ethical analysis               AI tools in vulnerable populations created dignity and consent risks.                          No specific system proposed.
                                Dementia and Palliative Care

14   Gerke et al. (2020)        Ethical and Legal Challenges             Legal and ethical analysis     Opaque AI undermines informed consent and clinical accountability.                             Identifies challenges; no explainable
                                of AI in Healthcare                                                                                                                                                   system implemented.

15   Hildt (2025)               Explainability as a Moral                Philosophical analysis         Explainability in medical AI is a moral obligation.                                           Theoretical; no system implemented.
                                Imperative in Medical AI

16   Tilala et al. (2024)       Biomedical Ethics and the                Systematic ethical analysis    Four biomedical ethics principles mapped onto AI design requirements;                          No system implementing these principles
                                Design of Healthcare AI                                                 systems embedding them produced higher clinician trust.                                        was built.

17   Wang et al. (2023)         Humanistic Ethics in Healthcare AI       Ethical analysis               AI risks substituting for human empathy; should support rather                                No practical design guidance given.
                                                                                                        than replace relational care.

18   Coghlan et al. (2023)      Vulnerability and Affective Risks        Ethical and empirical review   Users in distress develop inappropriate reliance on chatbots; most                             No safeguards or architecture proposed.
                                in Healthcare Chatbots                                                  systems lacked risk mitigation protocols.

19   Pinto et al. (2025)        AI in Palliative Care Communication      Narrative review               No reviewed system was both explainable, auditable, and co-designed                           No implementing system proposed.
                                and Decision-Making                                                     with clinicians and patients.

20   Parsons et al. (2025)      Explainability in Clinical               Systematic review              Explainability was the most consistently unmet requirement;                                    No palliative-care-specific system
                                Decision Support Systems                                                clinicians reluctant to act on unexplained recommendations.                                    proposed.

21   Abbas et al. (2025)        Explainable AI in Clinical               Meta-analysis (62 studies)     SHAP-based explanations integrated into dashboards most effective                             Focused on general clinical settings.
                                Decision Support                                                        at building trust and improving decision quality.

22   Antoniadi et al. (2021)    Current Challenges and Future            Systematic review              Explanation interfaces embedded in workflows outperform standalone                             Not applied to palliative care.
                                Opportunities for XAI in CDS                                            outputs.

23   WHO (2024)                 Palliative Care: Key Facts               Global review                  56.8 million people need palliative care annually; only 14% receive it;                       No AI-based interventions proposed.
                                                                                                        gap largest in low- and middle-income countries.

24   United Nations (2015)      Transforming Our World: The              Policy framework               SDGs 3, 9, and 10 provide the normative framework for health equity.                           Broad policy document; no technology
                                2030 Agenda for Sustainable                                                                                                                                           strategy for palliative care.
                                Development


2.5 Research Gap

Each piece in the literature works on its own. Predictive monitoring tools exist and some
perform well on clinical benchmarks. SHAP-based explainability improves clinician trust
when placed inside a dashboard. Online bereavement interventions show measurable
positive outcomes. Privacy-preserving AI architectures are technically achievable. No
reviewed system, however, puts these together. Nothing integrates symptom monitoring,
explainable clinical decision support, care coordination, and structured bereavement
follow-up into a single platform - let alone one designed for settings where hospital
infrastructure is limited, community care exists largely in policy documents, and families
bear the full weight of caregiving with no systemic support once the patient dies. The
literature provides the components separately. This project assembles them, specifically for
the Ghanaian context where the need is clearest.

2.6 Summary

Five themes point to one finding: clinical and digital palliative care systems have not
closed the gap between what the field promises and what patients and families actually
receive. Care is fragmented, families carry caregiving with no formal involvement, and AI
in this space has been limited to opaque mortality models that stop being relevant once the
patient dies. Bereavement support is documented as a clinical need but absent from every
platform reviewed. Privacy frameworks in deployed systems are inadequate, and the
ethical obligation to make clinical AI explainable - documented by Gerke et al. (2020),
Hildt (2025), and Tilala et al. (2024) - is rarely met.

In Ghana, the COMPASS Ghana data (Anon., 2024a) and Ghana Palliative Care Association
(GPCA) documentation (Anon., 2024b) make these failures concrete: referrals arrive too
late, no teaching hospital has a dedicated palliative ward, and 44% of the population has
no active health insurance. These gaps define what this project was built to address.


---

CHAPTER 3
METHODOLOGY AND SYSTEM DESIGN

3.1 Introduction

This chapter presents the methodology and system design behind Project AURA. It covers
the research approach, the software development life cycle, the system architecture, the
database design, the AI model design and explainability approach, the security
architecture, the technology stack, and the key runtime process flows. Four functional
pillars organise the entire design: the Intelligent Monitoring Core, the Adaptive Care
Guide, the Unified Care Dashboard, and the Continuity Bridge.

3.2 Research Approach

The project follows a design science research approach, where the primary contribution is
a purposefully built artefact rather than a tested hypothesis (Hevner et al., 2004). The
fragmentation, explainability gaps, and absence of bereavement support documented in
Chapters 1 and 2 constitute the problem. The artefact - a full-stack web platform - was
built to address it. Work proceeded through four stages: problem awareness (literature
review), suggestion (candidate architectures and models), development (the build), and
evaluation (testing against the objectives). This approach fits because the research
question is fundamentally "what can be built and how well does it perform?" rather than a
statistical question about human subjects.

3.3 Software Development Life Cycle

The Waterfall model was adopted as the software development life cycle (Royce, 1970).
It structures development into five sequential phases - Requirements Analysis, System
Design, Implementation, Testing, and Deployment and Documentation - each completed
and reviewed before the next begins. Three reasons made it the right choice here. First,
a capstone project has a fixed academic timetable with supervisor sign-off gates at defined
milestones, which maps naturally onto sequential phase completion. Second, requirements
were substantially derived upfront from the literature review, reducing the need for
continuous discovery that iterative models accommodate. Third, one developer working
under supervision benefits from documenting each phase fully before moving on, since it
produces the auditable trail this report records.

Figure 3.1: Waterfall Software Development Life Cycle Followed for the Project
[See dissertation figures guide for diagram]

3.3.1 Phase 1 - Requirements Analysis

Requirements were derived by walking through the palliative care journey from diagnosis
to bereavement and asking what each stakeholder - admin, clinician, caregiver, patient,
and family - would need at each stage. Functional requirements covered clinical data
capture (vital signs, symptoms, medications, appointments, and six validated assessment
instruments: the Edmonton Symptom Assessment System (ESAS), the Palliative Performance Scale (PPS),
the Barthel Index, the Mini Mental State Examination (MMSE), the Patient Health Questionnaire-9 (PHQ-9),
and the Generalised Anxiety Disorder-7 scale (GAD-7)), risk prediction and explanation, care planning,
secure messaging, and bereavement support.
Non-functional requirements included explainable AI output, offline-capable data capture,
accessibility for users with visual, motor, or cognitive
impairment, and role-based access control with audit logging.

3.3.2 Phase 2 - System Design

The design phase converted requirements into architecture before any code was written.
A layered client-server architecture was selected. An entity-relationship model was drafted
for the database. The eight clinical risk domains to be predicted were identified from the
assessment instruments, and a decision was made that every prediction must carry a SHAP
explanation - no risk score would reach a clinician without one. Low-fidelity wireframes
were produced for the role-aware dashboard, the patient portal, and the family-facing
Continuity Bridge.

3.3.3 Phase 3 - Implementation

Implementation proceeded in dependency order: authentication and the core clinical
modules first, the Intelligent Monitoring Core next, the Unified Care Dashboard once risk
data existed to display, and the Adaptive Care Guide and Continuity Bridge last. Each
module's design was reviewed against its specification before it was considered complete.

3.3.4 Phase 4 - Testing

Testing operated at three levels: an API smoke test suite; held-out evaluation of each
XGBoost model using a stratified 80/20 train-test split, Stratified K-Fold cross-validation
during hyperparameter tuning, and SMOTE for class imbalance; and a manual walkthrough
of every module's principal user interface flows against the seeded demonstration data.
The evaluation is of a prototype on synthetic data. These limitations are stated plainly in
Chapter 5.

3.3.5 Phase 5 - Deployment and Documentation

For development and demonstration, the backend runs on Uvicorn at port 8000 and the
frontend on the Vite development server at port 5173, with a Windows launcher script
starting both together. All configuration - database connection string, JWT signing secret,
and LLM provider API keys - is externalised to environment variables, so the same
codebase can be pointed at a production PostgreSQL database and served behind a
production process manager without any code change.


3.4 System Architecture

Figure 3.2: System Architecture Showing the Five Cooperating Layers
[See dissertation figures guide for diagram]

The system is a layered client-server application. A React/Vite single-page application
communicates with a FastAPI backend over REST endpoints and a persistent WebSocket
connection. The backend persists data through SQLAlchemy to SQLite in development and
PostgreSQL in production. The eight XGBoost models and their SHAP explainers are
loaded into the backend process at startup, serving predictions with low latency rather than
through a separate model server.

3.4.1 Data Input Layer

The data input layer is the set of forms and structured entry points through which
clinicians, caregivers, and patients record information: vital signs (heart rate, blood
pressure, oxygen saturation, temperature, respiratory rate), symptom logs, medication
records, appointment scheduling, and the six validated clinical assessment instruments
named in Section 3.3.1. Every submission is validated against a Pydantic schema before
it is persisted, which both rejects malformed input at the system boundary and gives the
Intelligent Monitoring Core a guarantee about the shape and range of the data it will later
read.

3.4.2 Intelligent Monitoring Core

This is the AI engine of the system, described fully in Section 3.6. In architectural terms
it consists of: a feature extraction function that reads the most recent vitals, assessment
scores, medications, and alert history for a given patient; eight independently trained
XGBoost classifiers, each scoring one clinical risk domain; a SHAP TreeExplainer
attached to each model; and a weighted aggregation function combining the eight domain
scores into a single overall risk level - low, moderate, high, or critical. A background
scheduler periodically re-runs this pipeline across all active patients and raises an alert
for any patient whose overall risk crosses the high or critical threshold.

3.4.3 Adaptive Care Guide

The Adaptive Care Guide turns clinical context into recommended action. It has three
components. A care plan engine maps a patient's diagnosis, functional status, and symptom
burden onto goals, checklist items, and interventions. A personalisation engine reads an
onboarding questionnaire completed at first login - covering primary condition, care
priorities, spiritual background, emotional needs, and content preferences - and derives
interface visibility flags, content tags, and a daily focus message from these signals. These
flags centrally control which navigation sections, AI assistants, and spiritual care content
are shown to that user across the entire interface, so a patient who opted out of a feature
during onboarding is not shown it anywhere. A journey tracking service places each
patient at one of six care phases based on clinical data already in the system, as shown in
Table 4.3.

3.4.4 Unified Care Dashboard

The Unified Care Dashboard is the primary interface for admin, clinician, caregiver, and
patient roles. It brings together: the role-aware landing dashboard; patient list and detailed
record views; clinical assessment forms; medication and drug interaction views; an
appointment scheduler; a messaging system with a client-side urgency classifier; a
notification centre that ranks alerts by clinical priority; and the AI Clinical Intelligence
hub presenting risk stratification, drug interaction analysis, and system overview. Real-time
updates arrive over the WebSocket connection so the dashboard always reflects current
state without manual refresh.

3.4.5 Continuity Bridge

The Continuity Bridge extends the platform beyond active treatment into bereavement,
addressing the discontinuity documented in Chapter 2 directly. It gives family members: a
timeline view of the care journey; a memory vault with automatic clustering of entries into
themes such as joy, family, and gratitude; a private grief journal with natural language tone
detection; a 13-item PG-13 grief screening instrument; and a digital legacy system through
which a patient can designate heirs and prepare messages for delivery after death. Each
heir carries an independently assigned access level - full, memories only, or messages
only - enforced separately from the user's system role.

3.5 Database Design

Figure 3.3: Entity-Relationship Diagram of the System Database
[See dissertation figures guide for diagram]

The database uses SQLAlchemy with SQLite in development and PostgreSQL in
production, switched by a single environment variable. The Patient entity is the centre of
the schema; almost every other table relates to it by a foreign key. Tables fall into six
functional groups:

Core tables - User, Patient, Vital, Symptom, Medication, Appointment, Alert,
NotificationQueue - capturing identity, the patient record, and the moment-to-moment
clinical events.

Assessment tables - ESASAssessment, PPSAssessment, FunctionalAssessment (Barthel),
CognitiveAssessment (MMSE), PHQ9Assessment, GAD7Assessment,
MedicationAdherenceLog - each corresponding to one validated clinical instrument and
supplying features directly to the Intelligent Monitoring Core.

Care and planning tables - CarePlan, CareGoal, CareGoalChecklist, CareIntervention,
CaregiverAssignment, PatientPreferences, CareSetting - recording the Adaptive Care
Guide's output and caregiver assignments.

Community and social tables - CommunityGroup, GroupMembership, GroupPost,
PostReaction, Message, Conversation, Resource, ResourceBookmark - supporting peer
support and educational content.

Bereavement and legacy tables - BereavementEntry, GriefScreening, LegacyConsent,
LegacyHeir, LegacyContent - implementing the Continuity Bridge.

Governance tables - UsabilityFeedback, ChatbotConsent, CrisisAlert, ClinicalOverride,
AuditLog - supporting ethical oversight and usability evaluation.

Schema changes were applied through incremental migration scripts rather than a
monolithic schema definition, reflecting the fact that several tables were added once the
corresponding feature was designed rather than all being specified at the project's start.


3.6 AI Model Design and Explainability

Figure 3.4: Explainable AI Pipeline from Input Features to SHAP-Based Clinician Output
[See dissertation figures guide for diagram]

Explainability was treated as a first-class design requirement, not an add-on, in direct
response to the opacity of existing mortality tools documented in Chapter 2. The system
therefore does not use a single monolithic model. Instead, eight independent XGBoost
classifiers - one per clinical domain - are trained, each paired with its own SHAP
TreeExplainer so that every risk score can be traced back to the specific clinical values
that drove it.

XGBoost (Chen and Guestrin, 2016) was chosen over logistic regression or deep neural
networks for three reasons: it performs well on structured, tabular, partially missing
clinical data; it trains quickly enough to be retrained as new patient data accumulates;
and it is directly compatible with SHAP TreeExplainer, which computes exact rather than
approximated Shapley values for tree-based models (Lundberg and Lee, 2017).

The eight clinical risk domains are: uncontrolled pain risk, overall symptom burden,
psychological risk (depression and anxiety escalation), 7-day hospital admission risk,
medication adherence risk, caregiver burden, clinical deterioration trajectory, and
30-day mortality risk. Feature vectors are assembled from the most recent vitals, ESAS,
PPS, Barthel, MMSE, PHQ-9, and GAD-7 scores, the active medication list, medication
adherence history, alert history over the preceding six months, and a recorded social
support score. Clinically appropriate default values are substituted for missing readings  - 
for example, a default heart rate of 80 bpm or oxygen saturation of 95% - so a prediction
is still produced for patients whose records are incomplete.

Each model was trained on 8,000 synthetic samples generated from parameter
distributions grounded in published palliative care statistics. Binary risk labels were
assigned using evidence-based clinical thresholds. Training used an 80/20 stratified split,
Stratified K-Fold cross-validation during hyperparameter tuning, SMOTE to correct class
imbalance, and a fixed random seed of 42 for reproducibility.

Table 3.1: Held-out test performance of the eight XGBoost risk models

Model                        AUC     Accuracy   Precision   Recall   F1
Pain Risk                    0.979   92.3%      77.2%       91.3%    83.6%
Symptom Burden               0.991   96.1%      75.6%       94.3%    83.9%
Deterioration                0.993   95.3%      89.3%       95.1%    92.1%
Medication Adherence Risk    0.996   95.6%      95.5%       93.9%    94.8%
Psychological Risk           0.998   97.3%      97.4%       97.3%    97.3%
Mortality Risk               0.994   95.3%      96.6%       95.7%    96.1%
Caregiver Burden             0.998   97.8%      95.6%       97.5%    96.5%
Admission Risk               0.985   91.8%      81.3%       96.7%    88.3%

Two caveats must be stated plainly. First, all eight models were trained and evaluated on
synthetic data; the figures in Table 3.1 show that each model learned the clinical
relationships encoded in its training distribution correctly, not that it would perform at the
same level on a real hospital population. Published XGBoost models trained on real
palliative care data typically report AUC in the range of 0.75 to 0.88 for comparable
tasks - that range is the realistic benchmark for eventual clinical deployment. Second, the
lower precision for vital signs risk (77.2%), symptom burden (75.6%), and admission risk
(81.3%) reflects a deliberate bias toward recall: in palliative care, a false positive that
prompts an unnecessary clinical review is judged far less harmful than a false negative
that allows a deteriorating patient to go unnoticed.

Two explanation systems are kept visually and architecturally separate so that a clinician
is never uncertain about which kind of explanation they are reading. The first is the
SHAP-driven explanation attached to every XGBoost prediction, always labelled with an
explicit "XGBoost SHAP" badge. The second is a rule-based clinical explanation engine
that answers plain-language questions about a specific vital sign, symptom, or alert using
threshold-based clinical heuristics - used where a targeted, human-readable explanation
of a single observation is more useful than a full multi-feature breakdown.

3.7 Security and Privacy Architecture

Figure 3.5: Security and Data Flow Architecture Showing Authentication and
Access Control Boundaries
[See dissertation figures guide for diagram]

Authentication uses JSON Web Tokens signed with HS256, issued at login with a 24-hour
expiry. Passwords are hashed using bcrypt through the passlib library. Authorisation is
enforced through role-based access control: every backend endpoint declares the roles
permitted to call it, and a dedicated middleware validates the token and attaches the
resolved user before any route handler executes. All administrative actions - creating a
user, deactivating an account, resetting a password - are written to an append-only
AuditLog table.

At the data layer, SQLAlchemy parameterises every database query, removing SQL
injection by construction. User-supplied text is sanitised by the bleach library before
storage, countering cross-site scripting. Sessions have an automatic 30-minute idle logout,
relevant because clinical workstations are frequently shared. The Continuity Bridge adds a
consent-based access control layer on top of role-based control: a family member's role
alone does not determine what legacy content they can see; an independently assigned
heir access level governs this, checked separately from the system role.

3.8 Tools and Technologies

Table 3.2: Principal tools and technologies by architectural layer

Layer                  Tool                              Rationale
Frontend               React 18 with Vite                Component-based UI with fast development server reload
Frontend state         TanStack Query                    Server state caching and automatic invalidation
Frontend table         TanStack Table                    Sortable, filterable patient list with row virtualisation
Frontend charts        Recharts                          SHAP bars, risk gauges, and trend sparklines
Frontend PWA           Vite PWA plugin / Workbox         Service worker, asset caching, and home-screen install
Backend                FastAPI                           Async Python framework with automatic OpenAPI documentation
ORM                    SQLAlchemy                        Database engine independence between SQLite and PostgreSQL
Validation             Pydantic                          Schema validation of all incoming API payloads
Machine learning       XGBoost and scikit-learn          Gradient-boosted trees suited to tabular clinical data
Explainability         SHAP (TreeExplainer)              Exact per-feature contribution for every risk prediction
Authentication         python-jose and passlib           JWT issuance and bcrypt password hashing
Conversational AI      Gemini 1.5 Flash / Groq           Streaming LLM chat with automatic provider fallback
                       Llama 3.1 fallback
Push notifications     Web Push API / VAPID              Background clinical alert delivery to mobile devices
Real-time              WebSockets                        Push delivery of alerts, messages, and notifications

3.9 System Process Flow

Figure 3.6: End-to-End System Process Flow from Patient Data Entry to Bereavement Support
[See dissertation figures guide for diagram]

Two process flows illustrate how the architectural layers cooperate at runtime.

The authentication flow works as follows. A user submits credentials; the backend
verifies them against the stored bcrypt hash and issues a signed JWT; the frontend stores
that token and attaches it as a bearer header to every subsequent request; the user is
routed to the view appropriate to their role - the personalisation questionnaire on first
login, the patient portal for a patient, or the role-aware dashboard for a clinician or
caregiver.

The risk prediction flow is the core of the project's contribution. When a clinician opens
a patient record, or a background scan runs on schedule, the backend reads the patient's
most recent vitals, assessment scores, medications, and alert history and assembles a
feature vector. That vector passes through all eight XGBoost models in turn. Each
model's SHAP TreeExplainer produces a ranked list of the clinical values that most
influenced its prediction. The eight domain scores are combined using the clinical weights
shown in Table 4.2, with vital signs and symptom burden weighted most heavily, into a
single overall risk level. The complete result - overall level, eight domain scores, SHAP
explanations, and a short list of plain-language key concerns - is returned to the frontend
in one response and rendered simultaneously on the patient record summary gauge and
the AI Insights hub deep-dive panel.

This pipeline re-runs immediately after a clinician submits a new ESAS, PPS, or Barthel
assessment, so the risk score shown always reflects the values just entered. Where a
patient's overall risk crosses the high or critical threshold, an alert is created and pushed
over the WebSocket to every connected clinician.

3.10 Summary

This chapter covered the design science research approach; the five-phase Waterfall life
cycle; the layered architecture organised around four functional pillars; the database
schema across six functional groups; the design and honestly reported performance of the
eight explainable XGBoost models; the security and privacy architecture; the technology
stack; and the two central runtime process flows. Chapter 4 presents how this design was
realised in working code.


---

CHAPTER 4
SYSTEM IMPLEMENTATION

4.1 Introduction

This chapter describes how the architecture, database, AI, and security designs from
Chapter 3 were built in working software. Where Chapter 3 explained what was designed
and why, this chapter explains how each of the four functional pillars was actually built,
which technologies and engineering techniques were used, and what practical decisions
were made during implementation. The chapter is organised in the dependency order in
which modules were built: authentication and clinical data capture first; the Intelligent
Monitoring Core once clinical data existed; the Unified Care Dashboard once risk output
existed to display; and the Adaptive Care Guide and Continuity Bridge last, since both
depend on mature clinical and family data. The chapter closes with an honest account of
the engineering problems encountered and how each was resolved.

4.2 Development and Runtime Environment

Project AURA is a full-stack application with a React/Vite frontend, a FastAPI backend,
a SQLAlchemy data access layer, and an XGBoost/SHAP inference layer. A lightweight
launcher starts both servers together with a single command. All configuration - database
connection string, JWT signing secret, and LLM API keys - is externalised to environment
variables, consistent with the deployment principle described in Section 3.3.5.

Table 4.1 gives the scale of the codebase at the end of the implementation phase.

Table 4.1: High-level composition of the Project AURA codebase

Layer               Component type                              Count
Frontend            Routed pages                                65
Frontend            Reusable components                         ~60
Frontend            Custom hooks                                7
Frontend            Context providers                           6
Backend             Routers (API route groups)                  39
Backend             Services                                    10
Machine learning    Trained XGBoost models with SHAP explainer  8
Database            SQLAlchemy models across six groups         ~40

4.3 Implementation of the Data Input Layer

Figure 4.1: Patient Symptom Tracking and Data Entry Screen
[See dissertation figures guide for screenshot]

The data input layer is a set of dedicated capture screens on the frontend, each backed by
a corresponding API route and schema validation layer. Vital sign capture - heart rate,
systolic and diastolic blood pressure, oxygen saturation, temperature, and respiratory rate
 -  follows a consistent create-and-retrieve pattern: a submission endpoint logs the reading,
and a retrieval endpoint returns the patient's history for the trend chart. Symptom logging,
medication records, and appointment scheduling follow the same pattern.

The six validated clinical assessment instruments are each a dedicated form, all served by
a single assessment router that exposes creation and history endpoints per instrument, plus
a combined patient overview endpoint. Every submission is validated against a request
schema maintained separately from the database model, so the shape of data accepted over
the network can evolve independently of how it is stored. This also ensures, for example,
that an ESAS slider value outside the 0-to-10 range is rejected at the boundary before it
reaches the database.

Because the system targets low-infrastructure settings, every capture form is wrapped by
an offline-first data access layer. A read attempts the network and falls back to a local
browser cache on failure. A write - such as logging a vital sign - is queued locally and
re-attempted once connectivity is restored. A persistent connectivity indicator in the
interface tells caregivers whether a reading has reached the server or is still waiting to
synchronise.

4.4 Implementation of the Intelligent Monitoring Core

Figure 4.2: Clinician Risk-Prediction View with SHAP-Based Explanation
[See dissertation figures guide for screenshot]

The inference service loads all eight trained XGBoost models, their fitted feature scalers,
and their SHAP explainers into memory once at application startup. Loading the models
eagerly and serving them from the same process as the rest of the backend keeps
prediction latency low and avoids the deployment complexity of a separate model server.
The service exposes three functions: a single-domain prediction returning a probability and
a ranked explanation; a combined function invoking all eight domains in one call; and an
aggregation function combining the eight probabilities using the fixed clinical weights in
Table 4.2.

Table 4.2: Clinical weighting applied when combining the eight domain scores

Clinical Risk Domain         Weight    Overall Risk Thresholds
Pain risk                    1.5       Critical: above 70%
Symptom burden               1.3       High: 50% to 70%
Deterioration                1.2       Moderate: 30% to 50%
Admission risk               1.2       Low: below 30%
Psychological risk           1.1
Mortality risk               1.0
Medication adherence risk    1.0
Caregiver burden             0.8

The feature vector is assembled from the most recent vital signs, ESAS, PPS, Barthel,
MMSE, PHQ-9, and GAD-7 scores, active medication list, medication adherence history,
alert history over the preceding six months as a proxy for recent emergency department
visits, and a recorded social support score. Clinically appropriate defaults substitute for
any genuinely missing value.

The proactive background scan runs all eight models across every patient with an active,
stable, or deteriorating status. Any patient whose overall risk crosses the high or critical
threshold receives an alert and a notification to every active clinician and administrator,
provided that patient has not already been alerted within the preceding six hours. The
six-hour deduplication window was a deliberate design choice to prevent alert fatigue from
the same deteriorating patient being flagged on every hourly run.

The rule-based clinical explanation engine sits alongside the SHAP system as an
architecturally independent component. It answers a clinician's question about a single
vital sign, symptom, or alert using threshold-based heuristics. On the frontend, the two
systems are kept visually distinct: SHAP output appears as bar and waterfall charts inside
the risk summary and explanation panels, always labelled "XGBoost SHAP explanation",
while the rule-based engine's output appears in a separate component. A clinician can
never mistake one for the other.

The advanced analytics service - covering 30-day deterioration trending, drug interaction
detection, caregiver burnout estimation, and prognosis - is implemented separately from
the main inference pipeline and consumed by the clinical intelligence timeline, the
medication interaction banner, and the caregiver workload panel.


4.5 Implementation of the Adaptive Care Guide

Figure 4.3: Adaptive Care Guide Recommendation Screen
[See dissertation figures guide for screenshot]

The Adaptive Care Guide is three cooperating services. The care plan engine reads a
patient's diagnosis, most recent PPS and ESAS scores, active medications, and recorded
goals of care preferences, then maps the diagnosis to a condition category and the
functional score to a functional level, producing a structured set of goals, checklist items,
and interventions the clinician can review, edit, and mark complete.

The personalisation engine derives interface visibility flags, content tags, a daily focus
message, a wellbeing insight, and a prioritised action list from the onboarding questionnaire
completed at first login. These signals are consumed throughout the interface: the patient
portal uses them for the greeting and quick actions, the community hub uses them to score
group recommendations, and the resource library uses them to rank the AI reading list.
Crucially, the same signals determine a single set of interface visibility flags applied
everywhere - which navigation sections appear, whether the two AI assistants are shown,
whether spiritual care content appears in the care plan and knowledge base. Centralising
this logic in one place was necessary because the questionnaire grew to cover consent,
spiritual preference, community interest, and legacy interest together; without a single
source of truth, the same patient would see different things on different screens.

The journey tracking service implements the six phases shown in Table 4.3, placing each
patient automatically from clinical data already in the system.

Table 4.3: The six phases of the patient journey tracked by the journey tracker service

Phase   Name               Automatic Trigger
1       Diagnosis          Patient record created and a primary diagnosis recorded
2       Care Planning      An initial care plan has been generated
3       Active Monitoring  Vitals and ESAS scores are logged regularly
4       Escalation         ESAS total exceeds 50, or PPS falls below 40
5       Transition         PPS falls below 20, or a terminal prognosis is recorded
6       Legacy             Digital legacy is activated following the patient's death

The family-facing view presents a care-appropriate, de-identified summary of the same
underlying journey events, so that raw clinical values the patient has not consented to
share are never exposed to family members.

The two clinical reference tools - a care protocol library and a searchable medical
knowledge base - were restructured during implementation from a card-and-modal layout
into a two-column reading interface: an index pane paired with a full reading pane, modelled
on a reference book. A clinician under time pressure needs to scan a table of contents and
jump directly to the relevant section; a modal does not support this once content grows
beyond a few short entries. The knowledge base was further extended to allow clinicians
and administrators to create, edit, and retire condition entries directly through the interface,
so it can keep pace with clinical practice over the system's life rather than being frozen at
submission.

4.6 Implementation of the Unified Care Dashboard

Figure 4.4: Unified Care Coordination Dashboard
[See dissertation figures guide for screenshot]

The Unified Care Dashboard is the single largest concentration of frontend screens. A
role-aware landing view adapts its content to the signed-in user: a clinician sees a patient
table with a risk overview widget and drug interaction warning banner; a caregiver sees an
assigned patient list; a family member sees a journey timeline. All three are rendered from
the same landing route, with the branching logic driven by the authenticated user's role.

A searchable patient list, a full patient record view carrying a vitals ribbon and compact
risk summary, a real-time monitoring view, and a SHAP deep-dive view give clinicians
progressively more detail as they move from a caseload overview to a single patient's risk
profile. The clinical intelligence hub - restricted to clinician and admin roles - presents
system-wide counts of critical, high-risk, and stable patients alongside an on-demand risk
scan control, in three tabs covering risk stratification, drug interaction warnings, and a
system overview with model health status.

Two components implement a lightweight client-side classifier rather than calling the full
inference pipeline. The messaging view scans each conversation's most recent message
against a fixed vocabulary of urgency terms - urgent, pain, breathing, unconscious - to
sort flagged conversations above routine messages. The notification centre assigns each
notification a base score by type, weighted so that a critical vitals or ML risk notification
always outranks a routine appointment reminder, then adds a recency bonus and an unread
bonus, so the feed reflects clinical urgency rather than strict arrival order.

The caregiver view renders a burnout indicator and workload measure for each care team
member. Its auto-assignment feature scores every available caregiver on a weighted
composite of workload, active patient count, and specialty match, assigning to the lowest
scorer and immediately invalidating the cached server state so the new assignment appears
without a manual refresh. The medication view surfaces a global warning banner and a
per-medication interaction indicator whenever the drug interaction service detects a severe
or major interaction.

All screens share a single API client that attaches the current authentication token to every
request and redirects to login if a request is rejected as unauthenticated. Server state is
cached with parameters tuned to how quickly each kind of data changes, as shown in
Table 4.4.

Table 4.4: Representative TanStack Query caching parameters applied to server state

Query key          Stale time    Refetch interval    Rationale
patients           5 minutes     -                   Patient list changes infrequently
patient-vitals     Not cached    -                   Always shown fresh on navigation
ml-risk            5 minutes     -                   ML inference is comparatively expensive
alerts             -             30 seconds          Clinical urgency requires near real-time data
notifications      -             30 seconds          Drives the user-facing unread badge
all-drug-ints      10 minutes    -                   Expensive all-patient batch scan

A consistency pass over the Dashboard extended dark-mode support to every table header,
both AI assistant widgets, the guided onboarding tour, and every major dashboard, portal,
and community screen. The navigation drawer, clinical assessment forms, and page-level
padding were adjusted for narrow viewport widths so the platform is usable on a phone,
consistent with caregivers in the target settings being more likely to access it from a
mobile device than a desktop.


4.7 Implementation of Additional System Capabilities

4.7.1 Care Setting System

The system supports five care settings - hospital, hospice, home care, community clinic,
and palliative day centre - each configurable through the administrative interface. The
active care setting is propagated to the frontend through a dedicated CareSettingContext,
which adjusts navigation additions, clinical form defaults, and protocol recommendations
based on where care is being delivered. This means the same codebase serves a hospital
ward and a home-based caregiver without any code change - the behaviour is driven by
the setting stored against the logged-in user's account.

4.7.2 AI Conversational Assistants

Two LLM-powered conversational assistants are built into the system, kept architecturally
and visually separate to serve different needs. AuraChat is a patient and family companion
with a teal theme; it uses emotionally supportive language and is restricted to the patient
and family roles. AIAssistant is a clinician copilot with a sky-blue theme; it is restricted
to clinician and admin roles and answers clinical questions about the patient record,
protocol guidance, and medication queries. Both assistants stream responses from
Gemini 1.5 Flash as the primary provider, with automatic fallback to Groq Llama 3.1 if the
primary provider is unavailable - ensuring the conversational layer remains functional
even if one external service is down.

Both assistants are hidden entirely for users who declined AI consent during the
onboarding questionnaire, controlled by the `showAI` flag in the PersonalisationContext
described in Section 4.5. This design means consent is enforced at the navigation and
rendering level, not just at the point of submitting a query.

4.7.3 Community and Peer Support Hub

The CommunityHub implements peer support groups, post reactions, content moderation,
and an ML-powered group recommendation system that scores available groups against a
user's questionnaire signals and care priorities. A spiritual care tab is shown or hidden
based on the user's `showSpiritualItems` personalisation flag. A dedicated educational
resources section allows clinicians and administrators to publish palliative care guides and
training material, with a bookmarking system and a PDF viewer for in-browser reading.
Educational resources are also available offline through the service worker prefetch
mechanism described in Section 4.10.

4.7.4 Push Notifications and PWA

The system implements Web Push notifications using VAPID keys, allowing the backend
to push clinical alerts directly to a clinician's device even when the browser is not open.
Push subscriptions are stored in the database per user and managed through the notification
service. The frontend is also packaged as a Progressive Web Application, allowing
installation to a device home screen on both Android and iOS. The install prompt is
captured through the `useInstallPrompt` hook and surfaced as an Install App button in the
Settings page.

4.7.5 HIPAA-Aligned Session Management

In addition to the 30-minute idle logout described in Section 4.9, the system implements
a 15-minute HIPAA-aligned auto-logoff enforced by the `useIdleTimer` hook built into
the main Layout component. When the idle timer fires, the user is logged out and
redirected to the login page with a session-expiry message, protecting patient data on
shared clinical workstations.

4.7.6 Guided Onboarding Tour

A guided application tour - AuraOnboarding - walks new users through the principal
interface areas on first login using a step-by-step overlay. The tour can be restarted at any
time from the Settings page through the `useRestartTour` hook. This is particularly
relevant given the system targets users with variable digital literacy; the tour provides a
structured introduction without requiring any written documentation to be read in advance.



4.7.7 Implementation of the Continuity Bridge

Figure 4.5: Bereavement Support Module Screen
[See dissertation figures guide for screenshot]

The Continuity Bridge is implemented across four screens and a supporting set of routes.
The memory vault applies a client-side clustering routine grouping a family member's
uploaded memories into themes - joy, family, gratitude, adventures, reflection - with a
toggle between a chronological grid and thematic grouping.

The private grief journal rotates compassionate writing prompts and applies natural
language tone detection to classify each entry into one of eight tones: grief, hope, anxiety,
acceptance, and others. The detected tone appears as a badge on the entry. Journal entries
are visible only to their author and are never surfaced to clinical staff - this boundary is
enforced at the access control layer, not just by interface convention.

The grief screening form implements the 13-item PG-13 instrument across three domains:
separation distress, cognitive and emotional response, and functional impairment, scored
on a one-to-five scale for a possible total of 13 to 65. A total of 30 or more flags the
respondent for a prolonged grief referral. Where the screening is flagged, the results screen
displays the Ghana Mental Health Authority crisis line alongside the recommendation.

The digital legacy workflow is enforced as a strict sequence. A patient first records
consent, then designates heirs - each with a relationship, an access level (full, memories
only, or messages only), and an independent flag governing access to private content  - 
and then creates posthumous content. Each piece of content carries a delivery trigger of
either "after death" or a specific date. Following the patient's death, a clinician activates
the legacy through the administrative interface. From that point, the heir access view
becomes available to each designated heir, filtered strictly by that heir's individually
assigned access level rather than their general system role.

4.8 Real-Time Communication Implementation

The real-time layer is a single WebSocket endpoint maintaining a connection manager
that maps each authenticated connection to a set of subscribed rooms. On connection, the
authentication token is validated exactly as for a REST request, and the connection is
automatically subscribed to a general room; to the clinicians room if the user's role is
clinician or admin; to the caregivers room if the user's role is caregiver; and to a room
unique to that patient if the user's role is patient. The server sends periodic keep-alive
frames to hold connections open.

Three event types cover most real-time traffic: an alert update broadcast to the clinicians
room when an alert is acknowledged or dismissed; a new message event broadcast when a
message is persisted; and a new notification event directed to a single recipient. On the
frontend, a custom hook maintains the WebSocket connection, and a context provider
exposes a subscribe/unsubscribe interface to any component, so components do not need
to manage connection state themselves. A connection status indicator in the navigation
shows whether the session is actively receiving live updates.

4.9 Security Implementation

Figure 4.6: Login and Authentication Screen
[See dissertation figures guide for screenshot]

Authentication middleware validates the signed token on every incoming request and
attaches the resolved user before any route handler executes. A role-based access control
layer supplies reusable dependency checks - for clinicians, administrators, caregivers, and
callers with a verified patient relationship - that every route declares explicitly. This
centralisation means a role check cannot be bypassed by calling a route directly.

Every administrative action is written to an append-only audit record. Request and
response schemas are maintained separately from database models so the shape of data
accepted over the network can be tightened without altering how it is stored. The ORM
parameterises every database query, removing SQL injection by construction. Free-text
input is sanitised before storage. The consent-based access control for the Continuity
Bridge is complemented by a consent mechanism for the conversational assistant and a
crisis workflow that lets a patient or family member flag a crisis directly, surfacing it to
clinical staff without requiring the family member to know who to contact.

4.10 Accessibility and Offline Implementation

Accessibility settings are managed by a shared state exposing independently toggleable
options: font size across five steps, high contrast, reduced motion, screen reader mode,
voice control, keyboard-only navigation, large touch targets, a simplified interface, and an
assisted mode for patients with cognitive impairment. Assisted mode combines the largest
font size, oversized controls, a simplified layout, reduced animation, and high-visibility
focus indicators in a single switch. A fixed set of keyboard shortcuts covers skipping to
main content, reaching navigation, reaching search, returning to the dashboard, and
closing an open dialogue. Centralising these settings in one shared state - rather than
having each screen implement its own - was necessary given the number of independently
built screens; without a single source, settings would drift out of sync between older and
newer parts of the interface.

Where voice control is enabled, a browser speech recognition service recognises a fixed
vocabulary of navigation commands and is guarded so it is never activated on the login or
registration screens.

Offline operation uses a service worker caching static assets, combined with a structured
local browser database holding stores for patients, vitals, medications, appointments, and
educational resources, plus a pending-write queue. Each clinical data access module was
wrapped so reads fall back to the local cache on network failure and writes are flushed
automatically once connectivity is restored. Ghana-specific palliative care guides and
training material can be downloaded in advance for use in settings with no reliable
connectivity.

4.11 Implementation Challenges and Resolutions

The following problems were encountered and resolved during implementation. They are
recorded honestly because they are part of the engineering record of the project.

Route precedence conflicts. A specific, literally-named route and a dynamic parameterised
route from different modules conflicted because the framework matches routes in
registration order and the dynamic pattern was broad enough to match the literal path.
The fix was to register literal routes before parameterised ones - a standing convention
applied throughout the router configuration.

Cross-origin and WebSocket authentication trade-off. Under the Cross-Origin Resource
Sharing specification, permitting requests from any origin during development is
incompatible with credentialed requests. WebSocket authentication was therefore
implemented by passing the token as a connection parameter rather than a cookie, trading
a small amount of authentication elegance for development flexibility. This trade-off
should be revisited before production deployment restricts allowed origins.

Model artefact versioning. Serialised model files occasionally produced version-mismatch
warnings against the installed library at startup because training and serving used slightly
different library versions. These were confirmed not to affect prediction correctness and
were suppressed with a targeted warning filter. Training and serving environments should
be pinned to identical dependency versions before any real deployment.

Text encoding artefacts. Corrupted special characters accumulated across several screens,
carried over from an earlier editing session that used an inconsistent encoding. These were
corrected and a defensive stylesheet rule added to catch any remaining instances.

Theming inconsistency under dark mode. Several table headers styled independently of
the shared theme were illegible once the dark variant was active. Every table header was
standardised to a single dark-themed style, and the fix was generalised into reusable colour
tokens so future components inherit correct theming automatically.

Unintended regression from bulk text substitution. A scripted rename across several
screens inadvertently deleted an unrelated import statement in one of the affected files,
breaking that screen. Re-running compiler and linter diagnostics after the bulk edit caught
the omission. The episode established a standing rule: always re-check diagnostics after
any bulk find-and-replace operation.

Interface default in wrong state. Sound effects were found to be enabled by default because
the stored preference evaluated as true unless explicitly the string false. This was corrected
so sound plays only once a user has explicitly opted in - an assistive feature should
default to off.

Data shape mismatch in stored preferences. The personalisation layer occasionally failed
when a preference field expected as an array arrived from the database as a JSON-encoded
string. A small coercion helper was introduced to normalise the field before any array
operation is applied to it, since the same preference data is written from more than one
place in the system.

Regression in a previously working component. A risk summary component had been
temporarily removed from the patient record view during a debugging session and not
reinstated once debugging was complete. This was caught during a manual review pass
over the Dashboard - not by an automated check - and the component was restored.

Two observations follow from this record. Most problems were caught through manual
review and the development environment's compiler and linter diagnostics rather than an
automated test suite, consistent with the absence of a formal unit testing framework noted
in Section 3.3.4. Several problems - particularly the router ordering and CORS/WebSocket
issues - arise directly from architectural decisions in Chapter 3, and their resolution is
best understood as refining that design under implementation pressure rather than as
evidence against the design.

4.12 Summary

This chapter traced the Chapter 3 design into the code that realises it. The data input
layer, Intelligent Monitoring Core, Adaptive Care Guide, Unified Care Dashboard, and
Continuity Bridge were described in terms of the specific routers, services, pages, and
components implementing them, with the concrete parameters, clinical weightings,
keyword lists, and caching policies that govern their runtime behaviour. Section 4.7
covered the additional capabilities that complete the system: the care setting system
that adapts behaviour across five deployment contexts; the two role-separated AI
conversational assistants running on Gemini with Groq fallback; the community and
peer support hub with ML-powered group recommendations; the Web Push and PWA
implementation; the HIPAA-aligned 15-minute idle auto-logoff; and the guided
onboarding tour. The real-time layer, security implementation, and accessibility and
offline features were described in the same detail, and the chapter closed with an honest
account of the nine implementation problems encountered and how each was resolved.
Chapter 5 presents the results.


---

CHAPTER 5
RESULTS, TESTING AND EVALUATION

5.1 Introduction

This chapter reports the results of testing the implementation described in Chapter 4. It
covers the API integration check, the held-out performance of the eight XGBoost models,
and the manual verification of the principal runtime flows, then evaluates the completed
system directly against the objectives set out in Chapter 1. The chapter distinguishes
carefully between what has been verified through actual testing and what remains an honest
limitation to be addressed in future work.

5.2 Testing Strategy

Testing used the three levels introduced in Section 3.3.4: an API integration smoke test,
held-out model evaluation, and a manual requirements-driven walkthrough of every
module's principal user interface flows. To support the manual testing, the database was
seeded with 12 synthetic patients together with associated vitals, medications,
appointments, and clinical assessments. One demonstration account was created for each
of the five user roles - admin, clinician, caregiver, patient, and family - so every
role-aware view could be exercised as intended. No automated unit test suite, load test,
external clinical validation, or formal user study was conducted.

5.3 API Integration Test Results

The smoke test authenticates as the seeded administrator account and confirms that a
small set of core administrative and care setting endpoints return the expected HTTP status
code and, where applicable, the expected response fields. Table 5.1 records the outcome;
every check passed.

Table 5.1: Results of the API integration smoke test

Endpoint Checked                  Verification Performed                        Result
GET /api/care-settings/templates   HTTP 200 response                            Passed
GET /api/care-settings/dashboard   HTTP 200 response                            Passed
GET /api/care-settings/interactions HTTP 200 response                           Passed
GET /api/admin/users               HTTP 200; care_setting field present         Passed
GET /api/admin/users               is_professional field present                Passed
GET /api/admin/users               professional_title field present             Passed
GET /api/admin/users               care_setting_change_request field present    Passed

This check does not exercise ML prediction endpoints, WebSocket connectivity, file
upload or download, authentication edge cases such as expired or malformed tokens,
input validation failures, or pagination behaviour. These are recorded as limitations in
Section 5.8. A separate integration issue was encountered during model training: the first
training run failed because a required class-imbalance package was not installed; the
results reported in Section 5.4 come from the successful run after that fix.

5.4 Machine Learning Model Results

Figure 5.1: SHAP Feature-Importance Summary Plot for the Risk Prediction Models
[See dissertation figures guide for diagram]

Figure 5.2: ROC Curves and Confusion Matrices for the Eight XGBoost Models
[See dissertation figures guide for diagram]

The held-out test performance of all eight models was obtained under the training protocol
described in Section 3.6: 8,000 synthetic samples per task; 80/20 stratified split; Stratified
K-Fold cross-validation during hyperparameter tuning; SMOTE for class imbalance; fixed
random seed of 42. All eight models achieved AUC above 0.97. The caregiver burden and psychological risk
models reached the highest F1 scores - 96.5% and 97.3% respectively. The pain risk,
symptom burden, and admission risk models recorded lower precision (77.2%, 75.6%, and
81.3%) while maintaining recall above 90% in each case.

Table 5.2 illustrates the synthetic feature distributions and label rules underlying these
figures.

Table 5.2: Illustrative synthetic feature distributions and label-assignment rules

Feature or Rule                  Specification Used in Model Training
Patient age                      Normal distribution, mean 72, SD 12, clipped to 18–100
PPS score                        Normal distribution, mean 55, SD 20, clipped to 10–100
ESAS pain score                  Normal distribution, mean 4, SD 3, clipped to 0–10
Zarit caregiver burden score     Normal distribution, mean 32, SD 15, clipped to 0–88
Pain risk label                  Positive if SpO2 < 90%, HR > 120 bpm, RR > 22/min,
                                 or temperature > 38.5 °C
Admission risk label             Positive if PPS < 40, ESAS total > 45, and ED visits
                                 in 6 months > 1

The synthetic data was generated from parameter distributions grounded in published
palliative care statistics rather than sampled from real patient records. The figures in
Table 3.1 show that each model learned the clinical relationships encoded in its training
distribution correctly - they do not predict performance on a real hospital population.
Published XGBoost models trained on real palliative care data typically report AUC of
0.75 to 0.88 for comparable tasks; that range, not the figures in Table 3.1, is the
realistic benchmark for eventual clinical use.

The three models flagged for lower precision were retrained in a targeted second pass
adjusting class balancing and decision thresholds - pain risk, symptom burden, and
admission risk. All three improved precision while preserving high recall; the figures in
Table 3.1 already reflect those retrained results. The clinical implication is visible in the
implementation: a pain risk precision of 77.2% means a meaningful proportion of proactive
scan alerts will concern patients who, on closer review, are not deteriorating. This expected
false-positive rate directly motivated the six-hour alert deduplication window in the
proactive scanner.


5.5 Functional Verification of Runtime Flows

Each principal runtime flow described in Section 3.9 was exercised manually against the
seeded demonstration data using the account created for the relevant role. Table 5.3
summarises the verified flows and outcomes.

Table 5.3: Manual verification outcomes for the principal runtime flows

Runtime Flow                          Verified Outcome
Authentication                        Login issues a signed JWT and routes each of the
                                      five roles to its correct landing view
WebSocket real-time push              An acknowledged alert and a sent message are
                                      reflected on other connected clients without a
                                      manual refresh
ML risk prediction pipeline           Opening a patient record returns all eight domain
                                      scores with SHAP explanations in a single response
Alert lifecycle                       A critical vital reading creates an alert, which can
                                      be acknowledged and moves to the resolved section
Assessment to ML feedback loop        Submitting an ESAS, PPS, or Barthel form
                                      immediately returns an updated risk panel reflecting
                                      the new scores
Drug interaction detection            A patient with two or more interacting medications
                                      triggers the amber warning banner
Caregiver burnout analysis            The AI auto-assign feature consistently proposes the
                                      caregiver with the lowest composite workload score
Messaging urgency classification      A message containing a flagged keyword is sorted
                                      above routine conversations with an URGENT or
                                      HIGH badge
Notification priority ordering        ML risk and crisis notifications consistently appear
                                      above routine appointment and community
                                      notifications
Care plan generation                  Generating a care plan produces goals, checklist
                                      items, and interventions appropriate to the diagnosis
Legacy delivery                       Content is inaccessible to a designated heir until the
                                      legacy is activated, then filtered by access level
Offline write queuing                 A vital sign logged while offline is queued locally
                                      and synchronised once connectivity is restored
Personalisation onboarding            Completing the questionnaire immediately hides the
                                      correct navigation sections, applies the selected
                                      theme and font size, and persists on re-login
AI conversational assistant           AuraChat and AIAssistant each return streamed
                                      responses; when the primary Gemini provider is
                                      unavailable, the system falls back to Groq
                                      automatically without user action
Push notification delivery            A backend-triggered alert produces both an in-app
                                      notification and a Web Push delivery to a subscribed
                                      device browser

This verification was manual rather than automated and confirms that the happy path of
each flow behaves as designed under the conditions tested. It is not a substitute for an
automated regression suite.

5.6 Evaluation Against the Objectives of the Study

Table 5.4 summarises how the completed system performs against each specific objective.

Table 5.4: Achievement of the specific objectives set out in Chapter 1

Specific Objective                              Status and Evidence
1. Real-time symptom tracking, medication       Met. Implemented by the data input layer
   management, and scheduling                   described in Section 4.3 and verified as
                                                functional in Section 5.5, including offline
                                                capture for low-connectivity settings.
2. Explainable AI risk prediction using         Met, with one justified deviation. Implemented
   SHAP-based models                            using eight XGBoost classifiers rather than the
                                                Random Forest proposed in Section 1.4.
                                                XGBoost was adopted specifically because it
                                                is directly compatible with the exact SHAP
                                                TreeExplainer. Both are tree-based ensemble
                                                methods; the substitution is a refinement, not
                                                a departure from the objective.
3. Unified, secure, privacy-respecting          Met at the level of a working prototype. The
   platform with bereavement support            Unified Care Dashboard and Continuity Bridge
                                                are implemented and functionally verified;
                                                role-based and consent-based access control
                                                are enforced as described in Section 4.9.
                                                Usability by real users has not yet been
                                                evaluated.

The first specific objective is met by the data input layer, notification machinery, and
alert system, all confirmed in Table 5.3. The second is met, with the XGBoost deviation
from the originally proposed Random Forest classifier recorded here as a deliberate
design-phase refinement - both are tree-based ensemble methods, and XGBoost was
chosen specifically to guarantee exact rather than approximated Shapley values. The third
is met at the prototype level the scope defined in Section 1.5; the coordination,
bereavement, and security features are each implemented and verified, but the term
"user-friendly" in the objective implies a usability claim that, without a user study, rests
on design intent rather than measured evidence.

5.7 Discussion of Results

Read together, the results support the conclusion that the four functional pillars directly
address the gaps documented in Chapter 2. The fragmentation of clinical, coordination,
and family tools into separate products is addressed by the single Unified Care Dashboard
verified in Section 5.5. The opacity of existing risk tools is addressed by pairing every
XGBoost prediction with a genuine SHAP explanation - covering pain risk, symptom
burden, psychological risk, deterioration, medication adherence, mortality risk, caregiver
burden, and admission risk. The near-total absence of structured bereavement support in
existing platforms is addressed by the Continuity Bridge, whose grief screening, memory
vault, and digital legacy components each confirmed correct function.

Several capabilities beyond the four core pillars further strengthen the system's fitness for
the Ghanaian context. The care setting system allows the same codebase to serve a hospital
ward, a hospice, and a home-based caregiver without code change. The two AI
conversational assistants - one for patients and families, one for clinicians - with
provider redundancy between Gemini and Groq ensure the conversational layer stays
functional under unreliable connectivity. The Web Push and PWA implementation allows
clinical alerts to reach staff on mobile devices even when the browser is closed, which
matters in settings where clinicians do not work at a fixed desktop. The community hub
with ML-powered group recommendations extends the social support dimension that the
literature identifies as protective against complicated grief.

Measured against the SDG framing in Section 1.4, the evidence supports the claim that a
working artefact contributing to Goals 3 and 9 has been produced. The Goal 10 claim  - 
reduced inequalities - is better understood as a claim about design intent: no underserved
community has yet used the system.

The honest ML reporting in Section 5.4 is itself a meaningful result for a resource-
constrained setting. It shows that a small team can build a technically sound, clinically
informed, explainable AI pipeline without access to a real patient dataset, while being
equally clear that this is a necessary first step toward, not a substitute for, validation on
real clinical data.

5.8 Limitations of the Evaluation

The following limitations apply to this evaluation and are carried forward as
recommendations for further work.

All eight ML models were trained and evaluated exclusively on synthetic data; no
validation against real patient records has been performed.

No formal user study, System Usability Scale assessment, or clinician think-aloud session
has been conducted; the UsabilityFeedback infrastructure exists but contains no submitted
records.

No formal accessibility audit using assistive technology such as NVDA or VoiceOver has
been carried out, despite the accessibility features described in Section 4.10 being
implemented.

No security penetration test, JWT secret rotation review, or rate-limiting audit has been
performed beyond the smoke test in Section 5.3.

No load or performance testing has been run against computationally expensive endpoints
such as the batch ML risk scan.

No automated unit or regression test suite exists; testing relied on the API smoke test and
the manual walkthrough.

No cross-browser compatibility testing has been performed.

These limitations do not reduce the value of the results in this chapter, which demonstrate
that a complete, internally consistent, and functionally verified system was built. They
mark precisely what evidence must be gathered before any claim of clinical readiness can
responsibly be made.

5.9 Summary

This chapter reported the API integration check, the held-out performance of the eight
XGBoost models, and the manual verification of 12 principal runtime flows, then
evaluated the completed system against the three specific objectives from Chapter 1. All
three objectives were met. The deviation from Random Forest to XGBoost for the second
objective was recorded and justified. The limitations of the evaluation - synthetic training
data, no user study, no formal accessibility audit, no security testing, no automated
regression suite - were stated plainly rather than allowed to inflate the claims made for
the system.


---

REFERENCES

All references are cited in the text using the Harvard system (author surname and year of
publication) and listed below in alphabetical order by first author's surname. Full-page
ranges are provided for all journal articles and conference papers.

Abbas, Q., Jeong, W., and Lee, S. W. (2025), "Explainable AI in Clinical Decision Support
    Systems: A Meta-Analysis of Methods, Applications, and Usability Challenges",
    Healthcare, Vol. 13, No. 17, p. 2154.

Alamri, A., Hassan, M., and Al-Otaibi, S. (2025), "Privacy-Preserving Architectures for
    Healthcare AI Systems", IEEE Transactions on Medical Informatics, Vol. 12, No. 2,
    pp. 45 – 59.

Alora Health (2025), Alora Hospice Software, Alora Health. Available at:
    https://www.alorahealth.com/hospice-software/. Accessed: 13 April 2026.

Anon. (2024a), "Palliative Care Access and End-of-Life Care in Ghana", COMPASS Ghana,
    www.compass-gh.org. Accessed: 1 April 2026.

Anon. (2024b), "Palliative Care Development and Situation in Ghana", Ghana Palliative Care
    Association, www.gpca.org.gh. Accessed: 1 April 2026.

Antoniadi, A. M., Du, Y., Guendouz, Y., Wei, L., Mazo, C., Dwyer, T., and Mooney, C.
    (2021), "Current Challenges and Future Opportunities for XAI in Clinical Decision
    Support", Applied Sciences, Vol. 11, No. 11, p. 5088.

Boddaert, M. S., Pereira, C., Adema, J., Vissers, K. C. P., van der Linden, Y. M.,
    Raijmakers, N. J. H., and Fransen, H. P. (2022), "Inappropriate End-of-Life Cancer
    Care in a Generalist and Specialist Palliative Care Model", BMJ Supportive and
    Palliative Care, Vol. 12, No. e1, pp. e137 – e145.

CareSmartz360 (2025), CareSmartz360 Home Care Agency Software, CareSmartz360.
    Available at: https://www.caresmartz.com/. Accessed: 13 April 2026.

Chen, T., and Guestrin, C. (2016), "XGBoost: A Scalable Tree Boosting System",
    Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge
    Discovery and Data Mining, pp. 785 – 794.

Coghlan, S., Loi, M., Ravn, M. N., and Leins, K. (2023), "Vulnerability and Affective
    Risks in Healthcare Chatbot Systems", AI and Society, Vol. 38, No. 2, pp. 567 – 578.

Finucane, A., Canny, A., Arcari Mair, A. P., Harrop, E., Selman, L. E., Swash, B.,
    Wakefield, D., and Gillanders, D. (2024), "A Rapid Review of the Evidence for
    Online Interventions for Bereavement Support", Palliative Medicine, Vol. 39,
    No. 1, pp. 31 – 52.

Gerke, S., Minssen, T., and Cohen, G. (2020), "Ethical and Legal Challenges of Artificial
    Intelligence in Healthcare", Artificial Intelligence in Healthcare, pp. 295 – 336.

Gris, G., Ramirez, M., and Sanchez, L. (2023), "Ethical Challenges of AI in Dementia and
    Palliative Care", Dementia, Vol. 22, No. 3, pp. 499 – 514.

Hevner, A. R., March, S. T., Park, J., and Ram, S. (2004), "Design Science in Information
    Systems Research", MIS Quarterly, Vol. 28, No. 1, pp. 75 – 105.

Hildt, E. (2025), "Explainability as a Moral Imperative in Medical AI", AI and Ethics,
    Vol. 5, No. 1, pp. 1 – 11.

Kocaballi, A. B., Berkovsky, S., Quiroz, J. C., Laranjo, L., Tong, H. L., Rezazadegan, D.,
    Briatore, A., and Coiera, E. (2019), "The Personalization of Conversational Agents
    in Health Care: Systematic Review", Journal of Medical Internet Research, Vol. 21,
    No. 11, p. e15360.

Lewis, J. (2000), "The Role of Care Coordinators in Continuity of End-of-Life Care",
    Journal of Palliative Medicine, Vol. 3, No. 2, pp. 201 – 212.

Lundberg, S. M., and Lee, S. I. (2017), "A Unified Approach to Interpreting Model
    Predictions", Advances in Neural Information Processing Systems, Vol. 30,
    pp. 4765 – 4774.

Maguraushe, K., and Ndlovu, S. (2024), "Privacy Risks in Smart Technologies Applied
    to Palliative Care", International Journal of Medical Informatics, Vol. 183, pp. 1 – 10.

National Health Insurance Authority (2025), "NHIS Active Membership Hits 56 Percent
    Coverage", NHIA Stakeholder Conference, Accra. Available at:
    https://www.nhis.gov.gh/News/nhis-active-membership-hits-56-percent-coverage--5966.
    Accessed: 13 April 2026.

Netsmart (2025), Palliative Care EHR Software, Netsmart Technologies. Available at:
    https://www.ntst.com/post-acute-care/palliative-care-software. Accessed: 13 April 2026.

Parsons, M., Rens, B., and Chen, Y. (2025), "Explainability in Clinical Decision Support
    Systems: A Systematic Review", Journal of the American Medical Informatics
    Association, Vol. 32, No. 1, pp. 112 – 126.

Pinto, S., Caldas, A., and Morais, A. (2025), "Artificial Intelligence in Palliative Care
    Communication and Decision-Making: A Narrative Review", Palliative and
    Supportive Care, Vol. 23, No. 1, pp. 1 – 14.

Royce, W. W. (1970), "Managing the Development of Large Software Systems",
    Proceedings of IEEE WESCON, Vol. 26, pp. 1 – 9.

Singer, P. A., Martin, D. K., and Kelner, M. (2016), "Multidisciplinary Continuity and
    Quality of End-of-Life Care", JAMA, Vol. 315, No. 1, pp. 60 – 70.

Stange, K. C. (2009), "The Problem of Fragmentation and the Need for Integrative
    Solutions", Annals of Family Medicine, Vol. 7, No. 2, pp. 100 – 103.

Tan, Y., Liang, X., Ming, W., Xing, H., Wang, Y., and Gao, Y. (2024), "A Scoping Review
    of Digital Technology Applications in Palliative Care", BMC Palliative Care,
    Vol. 23, p. 290.

Templin, N., Wernecke, K. D., and Walther, C. (2024), "Challenges in Personalised
    Health AI Deployment", npj Digital Medicine, Vol. 7, No. 1, pp. 1 – 10.

Tilala, M., Reddy, V., and Rao, K. (2024), "Biomedical Ethics and the Design of Healthcare
    AI Systems", AI in Healthcare, Vol. 9, No. 3, pp. 221 – 234.

United Nations (2015), Transforming Our World: The 2030 Agenda for Sustainable
    Development, United Nations, New York, 41 pp.

Wang, S. Y., Aldridge, M. D., Gross, C. P., Canavan, M., Cherlin, E., Johnson-Hurzeler, R.,
    and Bradley, E. (2016), "Transitions Between Healthcare Settings of Hospice
    Enrollees at the End of Life", Journal of the American Geriatrics Society, Vol. 64,
    No. 2, pp. 314 – 322.

Wang, L., Li, J., and Chen, H. (2023), "Humanistic Ethics in Healthcare AI: Empathy,
    Relationships, and the Limits of Algorithms", Ethics and Information Technology,
    Vol. 25, No. 1, pp. 1 – 12.

World Health Organization (2024), Palliative Care: Key Facts, World Health Organization,
    Geneva. Available at: https://www.who.int/news-room/fact-sheets/detail/palliative-care.
    Accessed: 10 April 2026.

