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

PROJECT REPORT SUBMITTED IN PARTIAL FULFILMENT OF THE REQUIREMENT FOR THE AWARD OF THE DEGREE OF BACHELOR OF SCIENCE IN COMPUTER
SCIENCE AND ENGINEERING

PROJECT SUPERVISOR

…………………………………………………………..
DR ALFRED ADUTWUM AMPONSAH

SEKONDI-TAKORADI, GHANA
MARCH, 2026

---

DECLARATION

We hereby declare that this project work is our own work. It is being submitted for the degree of Bachelor of Science in Computer Science and Engineering in the University of Mines and Technology (UMaT), School of Railway and Infrastructural Development (SRID), Essikado. It has not been submitted for any degree or examination in any other University.

…………………………………………………………
PAUL SMITH QUAIDOO (SRI.41.008.131.22)

…………………………………………………………
ABDUL-BASIT ISSAH (SRI.41.008.098.22)

…………………………………………………………
ALHASSAN HINA AHMED (SRI.41.008.023.22)

…………… day of ……………………………………………… (year) ………………

---

ABSTRACT

This project develops and evaluates an explainable, AI-powered framework intended to improve continuity, coordination, and personalised support in palliative care, with particular attention to the access and coordination gaps documented in Ghana. The system comprises four integrated components: an intelligent symptom-monitoring and care-management module, an explainable clinical decision-support module built around SHAP-based risk models, a unified coordination dashboard linking patients, caregivers and clinicians, and a structured post-bereavement support module, a feature largely absent from existing palliative care platforms. A personalisation and accessibility layer sits across all four components, deriving what each user sees, in what language, at what contrast and font size, and with which optional features enabled, from a short onboarding questionnaire, so that the same platform can serve a technically confident clinician and a low vision or low literacy patient without maintaining separate interfaces. The system was designed using a Waterfall-based software development life cycle spanning requirements analysis, system and database design, implementation of a web-based prototype, and structured testing. Eight XGBoost classifiers were trained and evaluated on synthetic clinical data, with performance and explainability verified through held-out testing and a SHAP-based explanation layer, and the completed prototype was verified functionally against the objectives set out in Chapter One through an application programming interface integration test and a manual walkthrough of its principal runtime flows. All three specific objectives were found to be met, although the classifier ultimately used was XGBoost rather than the Random Forest model originally proposed, a deviation recorded and justified in the report. The evaluation is, however, limited to synthetic data, and no user study, accessibility audit, or security penetration test has yet been performed. The report recommends that these evaluations be carried out, alongside integration of real clinical data, before deployment of the system is considered.

---

ACKNOWLEDGEMENTS

Our sincere gratitude goes to our supervisor, Dr. Alfred Adutwum Amponsah, for his guidance and direction throughout this project. The four years of knowledge and skills provided by the faculty of the Department of Computing and Data Analytics at UMaT were the foundation that made this project technically possible. The library resources and laboratory facilities at Essikado Campus were also consistently helpful. We acknowledge COMPASS Ghana and the Ghana Palliative Care Association for the data and statistics that grounded our problem statement in the Ghanaian context. We also thank our families, friends, and fellow students for the support and encouragement they gave us throughout this process.

---

TABLE OF CONTENTS

CONTENTS                                                            PAGE
DECLARATION                                                         i
ABSTRACT                                                            ii
ACKNOWLEDGEMENTS                                                    iii
TABLE OF CONTENTS                                                   iv
LIST OF TABLES                                                      viii
CHAPTER 1 INTRODUCTION                                              1
1.1 Background to the study                                         1
1.2 Problem Statement                                               2
1.3 Objectives of the study                                         3
1.3.1 Main Objective                                                3
1.3.2 Specific Objectives                                           3
1.4 Significance of the Study                                       4
1.5 Scope of the Study                                              5
1.6 Organisation of the Work                                        5
CHAPTER 2  LITERATURE REVIEW                                        7
2.1 Overview                                                        7
2.2 Theoretical Review                                              7
2.2.1 Fragmentation in Palliative Care Systems                      7
2.2.2 Bereavement and Post-Death Support                            8
2.2.3 Personalisation, Privacy, and User-Centred Design             8
2.2.4 Ethics in Healthcare Artificial Intelligence                  9
2.2.5 Artificial Intelligence and Chatbot Systems in Palliative Care 10
2.3 Empirical Review                                                10
2.3.1 Fragmentation and Care Coordination                           10
2.3.2 Bereavement Support                                           11
2.3.3 Personalisation, Privacy, and Explainability                  11
2.3.4 Explainability and Clinical Decision Support                  12
2.3.5 AI and Chatbot Applications                                   12
2.4 Summary of Related Works                                        13
2.5 Research Gap                                                    26
2.6 Summary                                                         27
CHAPTER 3  METHODOLOGY AND SYSTEM DESIGN                            28
3.1 Introduction                                                    28
3.2 Research Approach                                               28
3.3 Software Development Life Cycle                                 29
3.3.1 Phase 1: Requirements Analysis                                30
3.3.2 Phase 2: System Design                                        31
3.3.3 Phase 3: Implementation                                       31
3.3.4 Phase 4: Testing                                              32
3.3.5 Phase 5: Deployment and Documentation                         33
3.4 System Architecture                                             34
3.4.1 Data Input Layer                                              35
3.4.2 Intelligent Monitoring Core                                   35
3.4.3 Adaptive Care Guide                                           36
3.4.4 Unified Care Dashboard                                        36
3.4.5 Continuity Bridge                                             37
3.5 Database Design                                                 38
3.6 AI Model Design and Explainability                              40
3.7 Security and Privacy Architecture                               43
3.8 Tools and Technologies                                          44
3.9 System Process Flow                                             46
3.10 Summary                                                        47
CHAPTER 4  SYSTEM IMPLEMENTATION                                    50
4.1 Introduction                                                    50
4.2 Development and Runtime Environment                             50
4.3 Implementation of the Data Input Layer                          52
4.4 Implementation of the Intelligent Monitoring Core               53
4.5 Implementation of the Adaptive Care Guide                       56
4.6 Implementation of the Unified Care Dashboard                    58
4.7 Implementation of the Continuity Bridge                         61
4.8 Real-Time Communication Implementation                          62
4.9 Security Implementation                                         63
4.10 Accessibility and Offline Implementation                       64
4.11 Implementation Challenges and Resolutions                      65
4.12 Summary                                                        68
CHAPTER 5  RESULTS, TESTING AND EVALUATION                          70
5.1 Introduction                                                    70
5.2 Testing Strategy                                                70
5.3 API Integration Test Results                                    70
5.4 Machine Learning Model Results                                  72
5.5 Functional Verification of Runtime Flows                        74
5.6 Evaluation Against the Objectives of the Study                  75
5.7 Discussion of Results                                           77
5.8 Limitations of the Evaluation                                   77
5.9 Summary                                                         78
REFERENCES                                                          80

---

LIST OF TABLES

Table                Title                                                       Page

2.1                  Summary of Related Works                                    12

3.1                  Held-out test performance of the eight XGBoost risk models  45

3.2                  Principal tools and technologies by architectural layer      47

4.1                  High-level composition of the Project AURA codebase         52

4.2                  Clinical weighting applied when combining the eight domain models  54

4.3                  The six phases of the patient journey tracked by the system  57

4.4                  Representative TanStack Query caching parameters applied    59

5.1                  Results of the API integration smoke test                   68

5.2                  Illustrative synthetic feature distributions                69

5.3                  Manual verification outcomes for the principal runtime flows 70

5.4                  Achievement of the specific objectives set out in Chapter 1 71

---

CHAPTER 1
INTRODUCTION

1.1 Background to the study

According to the World Health Organisation, palliative care is defined as "an approach that improves the quality of life of patients and their families facing the problems associated with life-threatening illness, through the prevention and relief of suffering by means of early identification and impeccable assessment and treatment of pain and other problems, physical, psychosocial and spiritual" (WHO, 2024). Palliative care should not be viewed merely as treatment for dying patients or people close to the end of life. Instead, this concept applies to anyone living with a life-threatening illness, irrespective of whether that condition is terminal or not. Palliative care should therefore be integrated into active treatment until it reaches its ultimate stage, namely, hospice care. Once the chance for a cure becomes unattainable, attention should be paid to pain management, suffering reduction, and psychological, social and spiritual support for both the patient and his/her family members (WHO, 2024).

The World Health Organisation estimates that 56.8 million people worldwide need palliative care annually, but less than 14% of them receive this treatment (WHO, 2024). The gap between need and coverage is particularly wide in West Africa and Ghana serves as a clear example in that regard. Although palliative care is mentioned in at least eight of Ghana's national health policies, palliative care services in that country are currently available in only a handful of urban settings. COMPASS Ghana's statistics indicate that over 48% of Ghana's population has to pay for care out of pocket (Anon., 2024a). Meanwhile, according to the latest statistics released by the National Health Insurance Authority, 44% of Ghanaians lack active health insurance coverage, the figures in Oti and Northern regions being the lowest (National Health Insurance Authority, 2025). While the overall national coverage of health insurance has improved slightly since then, the financial burden on those who require prolonged palliative care treatment persists (Bediako-Ofori et al., 2021). Patients receive a referral to palliative services too late to diagnose their end-stage disease days before death. Community and home-based palliative care provision included in the national health policy has also failed to materialise (Anon., 2024a; Anon., 2024b).

In addition to poor access to health services, provision of palliative care is also hampered by fragmentation across health systems, lack of coordinated digital support, and virtually non-existent bereavement support for family members once the patient passes away. Current digital tools in this regard are largely limited to administrative purposes such as scheduling appointments, processing payments, and keeping medical records. Commercial platforms such as Alora Hospice Software (Alora Health, 2025), CareSmartz360 (CareSmartz360, 2025), and Netsmart's palliative care EHR system (Netsmart, 2025) are representative examples, none of which incorporate clinical decision support or any form of bereavement follow-up. The platforms were developed with little to no consideration for clinical decision-making processes (Tan et al., 2024; Widberg et al., 2021). On rare occasions when AI is applied within this setting, it is used to generate mortality risk predictions whose results clinicians cannot effectively interpret and use in their work (Pinto et al., 2025). This problem arises from structural gaps in accessibility, coordination, clinical decision-making support, and bereavement support following a patient's passing.

1.2 Problem Statement

Palliative care should have four key qualities – coordination, continuity, responsiveness, and specificity according to the needs of the patient. Yet, in practice, rarely is all of this achieved simultaneously. Transitioning from one caregiver and institution to another takes place without any accompanying patient records. Decisions are made using incomplete information about the condition of patients. Caregivers and families, carrying the heaviest burden, have zero participation in any of the established care processes. The gap between the philosophy behind palliative care and what is being practiced on the ground is significant (Boddaert et al., 2022; Wang et al., 2016).

No currently existing tools, systems, and platforms have managed to close this gap. Current palliative care platforms are designed to help with administrative functions only, such as scheduling, billing, and documentation. The application of AI to palliative care is currently limited to mortality prediction models. These algorithms are lacking in terms of transparency. Without having the ability to give an explanation for the classification, clinicians are unlikely to follow up with their recommendation. This issue is critical in palliative care as clinical decisions in it are life-or-death decisions and trust in the physician is essential (Abbas et al., 2025; Antoniadi et al., 2021). These problems in Ghana are even greater than those facing palliative care worldwide. In Ghana, palliative care services are limited to a select few major urban hospitals and to those able to pay for hospice care. According to COMPASS Ghana, more than 40% of the population does not have health insurance, patients are referred to palliative care late, community and home-based care approaches are mentioned in Ghanaian policy documents, yet there are no systems in place to ensure their implementation (Anon., 2024a). Indeed, according to 2025 data released by the National Health Insurance Authority, 44 percent of the country's population is not insured with the largest share of uninsured residents in Oti and Northern regions (National Health Insurance Authority, 2025). Moreover, according to the latest statistics reported by the Ghana Palliative Care Association (GPCA), there are no dedicated inpatient wards for palliative care in any of Ghana's leading teaching hospitals (Anon., 2024b). Care ends abruptly with the death of a patient and the cessation of any support services. Bereaved relatives, who were often the ones taking care of their loved one, receive no further contact and have nobody to help them cope psychologically with the loss (Finucane et al., 2024).

It is clear that an integrated and transparent approach is necessary to address this issue. Such a solution should be able to handle care fragmentation, enable proactivity and personalisation, provide transparency in clinical decision-making and allow for continuation of care in a form of bereavement counselling under the existing resource constraints.

1.3 Objectives of the study

1.3.1 Main Objective

The main objective of this project is to develop and implement an explainable, AI-powered framework that enhances continuity, coordination, and personalised support within palliative care.

1.3.2 Specific Objectives

1. To develop an intelligent palliative care system that enables real-time patient symptom tracking, medication management, and scheduling of clinical activities;

2. To incorporate Explainable Artificial Intelligence (XAI) techniques, specifically SHAP-based models, to generate clear and understandable risk predictions that clinicians can confidently act on; and

3. To build a single, user-friendly, web-based platform that improves coordination among patients, caregivers, and clinicians, incorporates a structured post-bereavement support module, and ensures data privacy and security throughout.

1.4 Significance of the Study

The benefits of this project fall into two broad categories: research contribution and healthcare contribution. First, in terms of contributing to the field of computer science, most works in Explainable Artificial Intelligence in the area of clinical decision support only test their methods on benchmark datasets in a laboratory setting. This project explores an integration of the SHAP-based explainability method along with a Random Forest (RF) classifier into a functional web-based prototype that would cover such aspects of palliative care as monitoring the patient's condition, coordinating the care process, and family support. None of these features has been tested before in conjunction with each other in palliative care, and the ability of the system to function with minimal infrastructure is especially crucial in developing countries where it is most necessary.

In terms of healthcare delivery, the project tackles structural problems related to the provision of palliative care in Ghana. A single platform that combines such elements as symptom monitoring, care coordination, decision support, and bereavement support has the potential to make the care preventive, ensure continuous communication among professionals, informal carers, and family members, and reduce the burden of work that currently lies on the shoulders of informal carers with no support whatsoever from the system. Bereavement support is the feature most consistently absent from existing palliative care platforms, yet around 40% of bereaved people are estimated to need additional support beyond what family and friends can provide (Finucane et al., 2024). No clinical platform addresses this after the patient dies. This project does. We believe firmly that every patient, regardless of how close they are to death, deserves dignity and proper care, and that no family should be left without support once a loved one has passed.

Furthermore, the project contributes to three goals outlined in the United Nations Sustainable Development Goals (SDGs) agenda. First, Goal 3 focuses on ensuring good health and well-being for all patients, which this system strives to do providing access to quality care and preventing psychological distress. Second, Goal 9 concerns industry, innovation, and infrastructure, which is tackled through the development of a digital health platform that works in low-infrastructure settings. Finally, Goal 10, addressing reduced inequalities, is especially applicable to our case since this system targets the communities currently underserved in Ghana's palliative care system.

1.5 Scope of the Study

In this study, the team designed, developed, and evaluated the prototype of an AI-based personalised framework for providing palliative care services. The system comprises four key components. The first component is an intelligent symptom monitoring and palliative care management module. The second is an explainable AI-based clinical decision support system. The third is a unified coordination framework for patients, their caregivers, and clinicians. The fourth component is a structured digital module for bereavement support.

In general, this system is designed in the form of a software prototype. Thus, no clinical deployment or clinical trials are involved. Instead, AI training and testing will be carried out based on structured data within the development environment, and the assessment of the explainability will also be conducted based on the same structured data. Designing the prototype in the context of palliative care services in Ghana was one of the most important aspects considered when developing this prototype. Therefore, the structure of service gaps and demographic data from this country were used as references. Moreover, the light architecture of the software that can be easily installed and deployed locally was chosen deliberately since, for this prototype to be able to work properly, it needs to operate in areas that lack any kind of enterprise infrastructure, which allows for transferring the prototype to other resource-limited environments of sub-Saharan Africa.

1.6 Organisation of the Work

The study is structured into five chapters, each addressing distinct aspects of the research. Chapter 1 presents the background to the study, the problem statement, the objectives of the study, the significance of the work, and the scope. Chapter 2 reviews the literature across five themes: fragmentation in palliative care systems, bereavement and post-death support, personalisation and privacy, ethics in healthcare artificial intelligence, and AI and chatbot systems in palliative care. Chapter 3 covers the methodology and system design, including the software development life cycle, system architecture, AI model design, and the tools and technologies employed. Chapter 4 describes how the architecture, database, artificial intelligence, and security designs set out in Chapter 3 were implemented in working code. Chapter 5 reports the results of testing the implementation, evaluates the completed system against the objectives set out in Chapter 1, and states the limitations of the evaluation.

---

CHAPTER 2
LITERATURE REVIEW

2.1 Overview

The literature to be discussed in this chapter is grouped into five major categories based on how each one has influenced the development of the system proposed in this study: fragmentation in delivering palliative care services; bereavement and post-death support for families; personalisation, privacy, and user-centricity; ethical considerations for artificial intelligence in healthcare; and use of AI and chatbot technology in palliative care. The Ghanaian healthcare setting cuts across all these five topics instead of constituting an independent one because the gaps identified within the latter can best be captured by comparing the global literature and the findings of the local sources. The theoretical underpinning of the relevant technologies/frameworks is considered before critically examining existing literature on this topic. All the reviewed works are presented in Table 2.1.

2.2 Theoretical Review

2.2.1 Fragmentation in Palliative Care Systems

The theory underlying fragmentation within palliative care lies within health systems theory and theories of care continuity. According to Stange (2009), fragmentation is an inevitable product of health systems based on the expertise offered by specialists. Since acute care revolves around brief, episodic visits, it stands at odds with the needs of palliative care patients, which require sustained and coordinated whole-patient care. This is not a matter of increased funding but of a design issue. The same concept of lack of care coordination is put forth by Lewis (2000) who claims that when nobody is responsible for coordinating care, gaps in care become inevitable as no one takes action when they emerge. Finally, Singer et al. (2016) demonstrate that this theory works in real life through excessive hospitalisations, poorly controlled pain, and suboptimal experiences by family members.

In the case of Ghana, the GPCA documentation proves that all theoretical failures take place. Firstly, collaboration between different services remains poor. Secondly, despite the fact that integration is mentioned in the policy, its implementation is still far away. Thirdly, there is no such thing as a dedicated inpatient palliative ward in Ghana's teaching hospitals (Anon., 2024b). The COMPASS Ghana survey demonstrates the practical dimension of the problem: referrals are delayed, palliative diagnosis occurs only a few days prior to death, and most importantly, services remain hospital-based rather than delivered in the community.

2.2.2 Bereavement and Post-Death Support

According to the philosophy of palliative care as per WHO guidelines and hospice care practice, the family unit receives care and support throughout the process of bereavement (WHO, 2024). This is theoretically very sound since bereavement can be viewed as a period of increased clinical risk. Indeed, complicated grief, major depressive disorder, post-traumatic stress disorder (PTSD), and high levels of suicidal thoughts have been observed in a relatively high percentage of bereaved individuals, particularly those who had performed the bulk of informal caregiving during their loved one's illness. The theoretical framework for designing the digital intervention is based on psychological first aid and cognitive-behavioural theories of bereavement, both of which encourage peer networking and evidence-based journaling.

In resource-poor nations like Ghana, where there are limited facilities for providing home care services and where all caregiving is provided informally by the family, the problem becomes even more complex. In this setting, the majority of bereaved carers are left to fend for themselves when empirical evidence indicates that they are most vulnerable psychologically (Finucane et al., 2024). As indicated in the previous paragraph, it is therefore within this theoretical context that the Continuity Bridge was developed. It is aimed at providing bereaved carers with a virtual vault, journaling services, and access to professional advice and help.

2.2.3 Personalisation, Privacy, and User-Centred Design

The rationale behind the personalisation of health AI applications lies in the assumption that population-based models often exhibit poor performance on individuals from highly variable patient groups. When it comes to palliative care, diagnosis, prognosis, cultural, religious beliefs, family structure, and digital literacy are extremely variable factors. Thus, an application designed with the average patient in mind will probably perform poorly for any particular patient from such a heterogeneous group. Templin et al. (2024) offer a taxonomy comprising six different types of failures associated with the deployment of AI tools: algorithmic bias, privacy violations, hallucinations and errors, contextual insensitivity, lack of proper consent procedures, and unequal access. All six types are relevant to a palliative care setting. Thus, besides personalising content, the designers must personalise consent procedures, interfaces, and access policies.

Privacy issues in this case are not merely about compliance with legislation. Indeed, this type of care produces very sensitive information that needs protection, including pain levels experienced, psychological state, family dynamics, spirituality, and even patient wishes regarding death. According to Maguraushe and Ndlovu (2024), inappropriate access to symptom and family data is a common threat in all smart device deployments used in the examined palliative care settings. As per Alamri et al. (2025), federated learning and encryption must be implemented in any health AI platform. The appropriate approach to design in this context is described by Human-Computer Interaction theory, which includes iterative prototyping, usability testing, and accessibility assessment.

2.2.4 Ethics in Healthcare Artificial Intelligence

The central issue concerning ethics and the use of AI in medicine lies in the problem of opacity, which refers to not having visibility into how a model arrives at its conclusions. The lack of explanation from both the perspective of the clinician and the patient means that informed consent cannot be obtained in a way that is genuine and valid. In their study involving case scenarios in clinical AI technology, Gerke et al. (2020) explore the implications of AI opacity from both legal and ethical perspectives. Hildt (2025) suggests that the transparency of a medical AI is a moral requirement, rather than simply a technical one. This is because the inability to comprehend the reasoning behind a recommendation by the system precludes the ability to provide consent or make an informed decision.

Tilala et al. (2024) discuss the application of four principles of biomedical ethics for the development of clinical AI systems. Beneficence in that the output will benefit patient health cannot be ensured without the system being interpretable. Non-maleficence or minimizing any harm that might come as a consequence of interpreting the output improperly also necessitates transparency. The principle of autonomy, which refers to making informed decisions, cannot be adhered to without transparency. The requirement of justice involves minimizing disparities that would arise due to the use of such systems, which is only possible when there is complete openness regarding the system's assumptions and biases. According to Wang et al. (2023), AI usage in palliative care may be taken as an alternative to empathy on the part of clinicians.

2.2.5 Artificial Intelligence and Chatbot Systems in Palliative Care

There are two major streams in theoretical considerations for the use of AI in palliative care, namely, prognostic modelling, using supervised machine learning and survival analysis, and conversational agents, based on NLP and dialogue systems. For prognostic modelling, Random Forest classifiers and gradient boosting algorithms have been shown both theoretically and empirically to be useful for clinical risk stratification due to their ability to process different types of tabular data and generate feature importance scores, thereby facilitating explainability. Using SHAP, which is based on concepts of cooperative game theory, provides a theoretically sound technique to decompose predictions and make ensemble models that would otherwise lack explainability interpretable for individual predictions.

The basis for conversational agents in healthcare is the fact that delivering information in dialogue is easier for certain groups of patients compared to writing documents, especially the elderly, individuals with low health literacy and those suffering from emotional distress. According to Kocaballi et al. (2019), a review of 41 studies on personalized conversational agents in healthcare showed that the most frequently observed design flaw among implemented solutions was the lack of structured procedures regarding consent, safety, and privacy. Coghlan et al. (2023) expand on this idea by highlighting the unique risks associated with deploying conversational agents in vulnerable groups. They identify incidents of emotional distress when the chatbot dependency was unhealthy.

2.3 Empirical Review

2.3.1 Fragmentation and Care Coordination

According to Wang et al. (2016), there are many care transitions among different palliative settings; over 10% of patients enrolled in hospice were transferred once or several times after joining the program, with over 50% of transitions being admissions into the hospital. Every handover is an opportunity for losing information, introducing inconsistency and damaging the therapeutic relationship. According to a retrospective cohort study by Boddaert et al. (2022) that included patients with cancer in the Netherlands, late referral to palliative care was associated with poorer care quality and an incomplete care plan among such patients. Late referral to palliative services was strongly related to care continuity and poor family preparation.

As Singer et al. (2016) note, outcome studies show the negative effect of lack of multidisciplinary continuity on admission to the hospital, failure to control pain, and poor experiences of family members of patients. The use of care coordinators in palliative settings positively impacts on continuity of care and family satisfaction, according to a mixed-methods study by Lewis (2000).

2.3.2 Bereavement Support

A rapid review by Finucane et al. (2024) conducted on 39 research studies exploring the impact of bereavement and palliative care interventions revealed that around 40% of bereaved individuals would benefit from additional support beyond informal networks, with many experiencing complicated grief, major depression, PTSD, and increased suicidal ideation. Those people who offered the greatest degree of informal care to the deceased are at the maximum risk. The intervention methods for the management of these risks included digital bereavement interventions that involved the use of journaling, peer-to-peer communication, and access to mental health counselling resources. This review further revealed that there is currently no platform offering integration of bereavement intervention tools into care coordination.

2.3.3 Personalisation, Privacy, and Explainability

Maguraushe and Ndlovu (2024) studied deployments of smart technology in palliative care, and discovered that misuse of access to information about patient symptoms and their families was always a threat, and that not one of the studied systems included a comprehensive privacy protection policy. Alamri et al. (2025) stated that the minimum standards for designing responsible AI for use in health care should include federated learning and encryption, a result that helped form the approach taken by this project, namely role-based access control and HIPAA-compliant data security at all system layers. According to Templin et al. (2024), there are six specific modes of failure when deploying AI for personalisation in healthcare, all relevant to the current case study. Kocaballi et al. (2019) researched conversational agents in healthcare, discovering that very few of them had proper consent, safety, and privacy policies in place. Gris et al. (2023) reported on the same problem in dementia patients.

2.3.4 Explainability and Clinical Decision Support

A systematic review by Parsons et al. (2025) on clinical decision support systems reported that explainability was the requirement most often unfulfilled among all reviewed domains. According to Abbas et al. (2025), who analysed 62 studies on XAI clinical decision support, explanations provided by the SHAP approach demonstrated particular effectiveness in enhancing clinicians' trust, especially when incorporated into the clinical dashboard interface rather than generated as a standalone document. This notion is also confirmed by Antoniadi et al. (2021): explanation interfaces integrated into the existing clinical workflow tend to be more effective than interfaces that generate explanations separately. Explainability is seen by Hildt (2025) as an ethical imperative, not merely a technical option; the same result is achieved by applying all four principles of biomedical ethics as proposed by Tilala et al. (2024).

2.3.5 AI and Chatbot Applications

Pinto et al. (2025) reviewed AI systems applied to palliative care communication and decision-making, finding that the field remains dominated by mortality prediction models that provide survival estimates but have no practical relevance to daily clinical care. Such systems lose all utility once the patient dies and offer clinicians no support for care coordination or family preparation. The use of AI for generating informational content in palliative care carries specific risks. When AI produces material for emotionally vulnerable patients or bereaved families, the potential for inaccuracy, cultural insensitivity, and misinformation is well documented (Pinto et al., 2025).

However, it was also stated that there might be dangers of inaccuracy, lack of cultural sensitivity, and provision of misinformation in cases when AI creates content for vulnerable people. Coghlan et al. (2023) mentioned anthropomorphisation among the risks of using chatbots in healthcare: distressed patients develop dangerous reliance on the system which was never meant to be safe in this regard. As reported by Pinto et al. (2025), none of the examined palliative care communication AI systems meet four criteria: accuracy, explainability, auditability, and clinician-patient co-design.

2.4 Summary of Related Works

Table 2.1 provides a structured summary of all works reviewed in this chapter. The table includes the author, title, method, key findings, and limitations of each reviewed work. Within each thematic grouping, entries are presented in chronological order.

Table 2.1 Summary of Related Works

| No. | Author(s) and Year | Title | Method | Results | Limitation |
|---|---|---|---|---|---|
| 1 | Wang et al. (2016) | Care Transitions and Fragmentation in Palliative Settings | Systematic review and qualitative synthesis of care transition studies across multiple healthcare settings. | 10.2% of hospice enrolees had at least one care transition after enrolment; 6.6% had more than one. Hospital admissions accounted for 53.4% of transitions. Fragmentation was higher among younger, non-white, and underserved patients. | Did not propose a technological solution to address coordination failures. |
| 2 | Boddaert et al. (2022) | Late Palliative Care Initiation and Care Continuity | Retrospective cohort analysis of palliative care referral data across multiple European sites. | Late referral was strongly linked to poor care continuity and inadequate family preparation. Patients referred in their final days had markedly worse outcomes and incomplete care plans. | No AI-based intervention proposed to enable early deterioration detection to prevent late referral. |
| 3 | Anon. (2024a) | Palliative Care Access and Service Gaps in Ghana | National programme data and health facility assessment across Ghanaian healthcare settings. | 48% of Ghana's population lacks health insurance. Referrals arrive too late; many patients receive end-of-life diagnoses only days before death. Services are concentrated in urban hospitals with no community infrastructure. | Descriptive programme data; does not propose technological interventions to address identified service gaps. |
| 4 | Anon. (2024b) | Palliative Care Development and Situation in Ghana | Organisational reporting and advocacy documentation by the Ghana Palliative Care Association. | No dedicated inpatient palliative ward exists in any of Ghana's leading teaching hospitals. Poor integration across services and lack of a national implementation plan remain defining challenges. | Descriptive in nature; does not propose specific digital or AI-based solutions. |
| 5 | Lewis (2000) | The Role of Care Coordinators in Continuity of End-of-Life Care | Mixed-methods study combining qualitative interviews with care providers and quantitative care outcome data. | Dedicated care coordinators significantly improved care continuity and family satisfaction. Without a single accountable professional, responsibility diffused and care integration failed. | Focuses on human coordination; does not address how digital systems could replicate coordination functions. |
| 6 | Stange (2009) | The Problem of Fragmentation and the Need for Integrative Solutions | Conceptual and evidence synthesis drawing on healthcare systems literature. | Specialist-dominated systems produce fragmented care. Integrative, whole-person approaches were associated with better patient outcomes and lower care costs, particularly for complex conditions. | Theoretical argument; does not propose specific technological or AI-based integrative solutions. |
| 7 | Singer et al. (2016) | Multidisciplinary Continuity and Quality of End-of-Life Care | Prospective longitudinal study tracking patient outcomes across palliative care settings. | Absence of multidisciplinary continuity correlated with unnecessary hospital admissions, uncontrolled pain, and poor family experience of end-of-life care. Coordinated teams produced significantly better outcomes. | Does not evaluate AI-based solutions for improving multidisciplinary care continuity. |
| 8 | Finucane et al. (2024) | Bereavement Outcomes and the Role of Palliative Care Support | Rapid review of 39 studies (4 systematic reviews, 35 individual studies) using Ovid MEDLINE, Embase, and PsycINFO. | Online bereavement support was feasible, acceptable, and effective in reducing grief intensity, stress-related outcomes, and depression. Participant retention was typically above 70%. Positive impacts included reduced isolation and normalisation of loss responses. | Reviews evidence without proposing a dedicated digital platform for post-death family support. |
| 9 | Templin et al. (2024) | Challenges in Personalised Health AI Deployment | Narrative review and expert synthesis of health AI deployment case studies. | Six core deployment challenges identified: algorithmic bias, privacy violations, hallucination, contextual insensitivity, informed consent deficits, and inequity in access, all especially acute in palliative care. | Does not propose a specific AI system designed to address all six challenges in palliative care. |
| 10 | Maguraushe and Ndlovu (2024) | Privacy Risks in Smart Technologies Applied to Palliative Care | Qualitative case study analysis of smart technology deployments in palliative care. | Smart health technologies in palliative settings introduced significant privacy risks, including inappropriate access to sensitive symptom data and family dynamics. No robust privacy-preserving framework was found in any reviewed system. | Does not propose a privacy-preserving AI platform designed specifically for palliative care data. |
| 11 | Alamri et al. (2025) | Privacy-Preserving Architectures for Healthcare AI Systems | Experimental design and implementation study using federated learning architectures on healthcare datasets. | Federated learning and encryption-based architectures significantly reduced privacy risks. Role-based access control maintained high model performance without centralising sensitive data. | Framework tested on general healthcare data; not specifically applied to palliative care settings. |
| 12 | Kocaballi et al. (2019) | Conversational Agents in Healthcare: A Systematic Review | Systematic review of 41 studies on conversational AI deployment in healthcare settings. | Most health chatbots lacked robust consent, safety, and privacy frameworks. Only a minority incorporated ethical safeguards. Cognitively vulnerable users were at elevated risk of inappropriate dependence on chatbot responses. | Does not propose an integrated solution combining chatbot functionality with XAI and care coordination. |
| 13 | Gris et al. (2023) | Ethical Challenges of AI in Dementia and Palliative Care | Ethical analysis using qualitative case studies and literature review. | AI tools deployed with vulnerable populations created risks of dignity violations, inappropriate dependence, and consent failures. Consent-centred and vulnerability-aware design was identified as the primary ethical obligation. | Does not propose a specific AI system designed with consent and dignity safeguards for palliative care users. |
| 14 | Gerke et al. (2020) | Ethical and Legal Challenges of Artificial Intelligence in Healthcare | Legal and ethical analysis combining regulatory review with healthcare AI case studies. | Opaque AI systems undermine informed consent, erode clinical accountability, and damage patient trust. Explainability was identified as the most significant ethical and legal barrier to responsible clinical AI deployment. | Identifies challenges but does not implement an explainable AI system for clinical palliative care use. |
| 15 | Hildt (2025) | Explainability as a Moral Imperative in Medical AI | Philosophical and ethical analysis drawing on medical ethics and AI governance literature. | Explainability in medical AI is a moral obligation. When AI informs clinical decisions, unintelligible outputs prevent meaningful informed consent and shift moral responsibility in ways that violate patient autonomy. | Theoretical argument; does not propose or implement an explainable AI system to fulfil the identified moral obligation. |
| 16 | Tilala et al. (2024) | Biomedical Ethics and the Design of Healthcare AI Systems | Systematic ethical analysis using the Beauchamp and Childress biomedical ethics framework. | The four principles, beneficence, non-maleficence, autonomy, and justice, were mapped onto AI design requirements. Systems embedding these principles systematically produced more ethically sound outputs and higher clinician trust. | Does not implement a system that systematically embeds biomedical ethics principles in design. |
| 17 | Wang et al. (2023) | Humanistic Ethics in Healthcare AI: Empathy, Relationships, and the Limits of Algorithms | Ethical analysis and qualitative literature review. | AI systems risk positioning themselves as substitutes for human empathy in end-of-life care. Compassion and relational attentiveness cannot be replicated by algorithms; AI should support rather than replace the human dimensions of care. | Provides general caution without practical design guidance for building empathy-aware AI tools. |
| 18 | Coghlan et al. (2023) | Vulnerability and Affective Risks in Healthcare Chatbot Systems | Ethical and empirical review of chatbot systems deployed in healthcare. | Users in distress anthropomorphise chatbot responses and develop inappropriate reliance on them. Most systems lacked structured risk mitigation protocols for emotionally vulnerable users. | Does not propose safeguards or a system architecture to mitigate these risks in vulnerable palliative care populations. |
| 19 | Pinto et al. (2025) | Artificial Intelligence in Palliative Care Communication and Decision-Making: A Narrative Review | Narrative review of AI studies in palliative care communication and decision-support contexts. | AI tools improved information delivery in some contexts, but no reviewed system was both explainable, auditable, and developed with clinician and patient co-design. Explainability was the most frequently unmet requirement. | Review identifies requirements but does not implement a system meeting them. |
| 20 | Parsons et al. (2025) | Explainability in Clinical Decision Support Systems: A Systematic Review | Systematic review of clinical decision support studies across multiple healthcare domains. | Explainability was the most consistently unmet requirement across reviewed systems. Clinicians were reluctant to act on recommendations they could not interpret, reducing adoption of potentially beneficial AI tools. | Review is broad; no palliative care-specific explainable system is proposed. |
| 21 | Abbas et al. (2025) | Explainable AI in Clinical Decision Support: A Meta-Analysis | Meta-analysis of 62 XAI clinical decision support studies. | SHAP-based explanations were particularly effective at building clinician trust and improving clinical decision quality. Visual explanatory outputs integrated into clinician dashboards were the most effective implementation strategy. | Meta-analysis focuses on general clinical settings; no application to palliative care specifically. |
| 22 | Antoniadi et al. (2021) | Current Challenges and Future Opportunities for XAI in Clinical Decision Support | Systematic review of XAI clinical decision support implementations. | Visual explanation interfaces integrated directly into clinician workflows were the most effective XAI strategies. Lack of domain-specific validation and poor usability were the main barriers to adoption. | Does not apply findings to palliative care settings or propose a clinical workflow implementation. |
| 23 | WHO (2024) | Palliative Care: Key Facts | Global review of palliative care need, availability, and policy gaps across health systems. | Approximately 56.8 million people need palliative care annually; only 14% receive it. The gap is largest in low- and middle-income countries. Pain relief access and specialist workforce capacity were the most critical global shortfalls. | Descriptive global overview; does not propose AI-based interventions to address the palliative care access gap. |
| 24 | United Nations (2015) | Transforming Our World: The 2030 Agenda for Sustainable Development | Policy framework and global commitment documentation. | Established 17 Sustainable Development Goals including SDG 3 (Good Health and Well-being), SDG 9 (Industry, Innovation and Infrastructure), and SDG 10 (Reduced Inequalities), which provide the normative framework for health equity initiatives. | Broad policy document; does not address technology-specific implementation strategies for palliative care. |

2.5 Research Gap

The problems documented in this review do not appear together in any single platform. Predictive monitoring tools exist, and some perform well on clinical benchmarks. SHAP-based explainability has been shown to improve clinician trust when integrated into dashboard interfaces. Online bereavement interventions have measurable positive outcomes. Privacy-preserving architectures for health AI are technically feasible. Each of these pieces is, on its own, reasonably well understood in the literature.

The combination has not been attempted. No reviewed system integrates symptom monitoring, explainable clinical decision support, care coordination, and structured bereavement follow-up into a single platform, let alone one designed to work where hospital infrastructure is limited, community care exists largely in policy documents, and families bear the full weight of informal caregiving with no systemic support afterward. The literature offers the components separately. This project is an attempt to put them together, specifically for the Ghanaian context where the need is most acute and least served.

2.6 Summary

The five themes reviewed in this chapter point to one problem: palliative care systems, both clinical and digital, have not closed the gap between what the field promises and what patients and families actually receive. Care remains fragmented, families carry caregiving responsibilities with no formal involvement in care planning, and AI in this space has been largely confined to mortality prediction models that clinicians cannot interpret and that stop being relevant once a patient dies. Bereavement support is recognised as a clinical need in the literature but absent from every platform reviewed. Privacy frameworks are inadequate across deployed systems, and the ethical obligation to make clinical AI explainable, though well documented by Gerke et al. (2020), Hildt (2025), and Tilala et al. (2024), is rarely met in practice.

In Ghana specifically, the data from COMPASS Ghana (Anon., 2024a) and the GPCA (Anon., 2024b) show that these failures are not abstract. Referrals arrive too late, no teaching hospital has a dedicated palliative ward, and 44% of the population has no active health insurance. These gaps, taken together, define what this project is designed to address.

---

CHAPTER 3
METHODOLOGY AND SYSTEM DESIGN

3.1 Introduction

This chapter presents the methodology and system design followed in the development of Project AURA, the AI framework for personalised and explainable palliative care support introduced in Chapter One. It sets out the research approach adopted, justifies the choice of the Waterfall model as the software development life cycle, and describes the system architecture, database design, artificial intelligence model design, security architecture, tools and technologies, and process flows that together define how the problems identified in Chapters One and Two were translated into a working system. The design is organised around four functional pillars that recur throughout the chapter: the Intelligent Monitoring Core, the Adaptive Care Guide, the Unified Care Dashboard, and the Continuity Bridge.

3.2 Research Approach

The study follows a design science research approach, in which the principal contribution of the research is a purposefully built artefact rather than a purely theoretical model (Hevner et al., 2004). The fragmentation, lack of explainability, and absence of continuity documented in Chapters One and Two were treated as the problem statement that the artefact, in this case a full stack software platform, was designed to address. Consistent with design science practice, the work proceeded through an explicit problem awareness stage drawn from the literature review, a suggestion stage in which candidate architectures and models were proposed, a development stage in which the artefact was built, and an evaluation stage in which the artefact was tested against the functional and non-functional requirements derived from the study objectives. This approach was considered appropriate because the research question is fundamentally a question of what can be built and how well it performs, rather than a question that is answered through the statistical testing of a hypothesis on human subjects.

3.3 Software Development Life Cycle

Figure 3.1: Waterfall Software Development Life Cycle Followed for the Project

The Waterfall model was adopted as the software development life cycle for this project. The model structures development into a sequence of five discrete phases: Requirements Analysis, System Design, Implementation, Testing, and Deployment and Documentation, with each phase completed and reviewed before the next begins (Royce, 1970). Waterfall was chosen over iterative models such as Scrum or Extreme Programming for three reasons specific to the context of this study. First, the requirements for a final year capstone project are fixed by an academic timetable with supervisor sign off gates at defined milestones, which maps naturally onto sequential phase completion rather than continuous re-planning. Second, the requirements themselves were substantially derived up front from the literature review in Chapter Two, which reduced the need for the kind of continuous requirement discovery that iterative models are designed to accommodate. Third, a single developer working under close supervision benefits from the discipline of documenting each phase fully before moving on, since it produces the auditable trail of decisions that this chapter reports. The five phases are described in turn in the following subsections.

3.3.1 Phase 1: Requirements Analysis

The requirements analysis phase translated the problem statement and objectives set out in Chapter One, together with the gaps identified in the literature review in Chapter Two, into a concrete set of functional and non functional requirements. Five user roles were identified as the primary stakeholders of the system: admin, clinician, caregiver, patient, and family, each with a distinct set of permissions and concerns. Functional requirements were derived by walking through the care journey of a palliative patient from diagnosis through active monitoring to, where applicable, bereavement, and asking what information each stakeholder would need at each stage. This produced requirements spanning clinical data capture (vitals, symptoms, medications, appointments, and validated assessment instruments such as the Edmonton Symptom Assessment System, the Palliative Performance Scale, and the Barthel Index), risk prediction and explanation, care planning, secure messaging, and family facing bereavement support.

Non functional requirements were derived directly from the significance of the study and the Ghanaian context described in Chapter One. These included the requirement that AI generated risk scores be explainable rather than opaque, that the system operate acceptably in low connectivity settings through offline first data capture, that the interface meet accessibility guidelines for users with visual, motor, or cognitive impairment, including adjustable font size, a high contrast and dark colour theme, and a layout that remains usable on a small mobile screen, and that patient data be protected through role based access control and audit logging appropriate to a clinical system. Requirements were gathered through a combination of the literature review findings, an informal review of existing palliative and hospice software products, and iterative consultation with the project supervisor, and were consolidated into the use case and pillar structure that subsequently guided the design phase.

3.3.2 Phase 2: System Design

The system design phase converted the requirements into concrete architectural and interface decisions before any implementation code was written. At the architectural level, a layered client server design was selected, separating a browser based frontend from a backend application server, a machine learning inference layer, a relational database, and a real time communication layer, as detailed in Section 3.4. At the data level, an entity relationship model was drafted covering patient records, clinical assessments, medications, care plans, community and bereavement data, described further in Section 3.5. At the intelligence level, the eight clinical risk domains that the Intelligent Monitoring Core would need to predict were identified from the assessment instruments already selected during requirements analysis, and a decision was made to pair every prediction with a Shapley Additive Explanations breakdown so that no risk score would be presented to a clinician without an accompanying explanation, addressing directly the explainability gap identified in Chapter Two. At the interface level, low fidelity wireframes were produced for the role aware dashboard, the patient portal, and the family facing Continuity Bridge, with particular attention paid to accessibility settings such as adjustable font size, high contrast mode, and a simplified assisted mode intended for patients living with cognitive impairment.

3.3.3 Phase 3: Implementation

The implementation phase built the system in the order established by the design phase, beginning with the foundational layers on which everything else depended. Authentication, the core database models, and the patient, vitals, and medication modules were implemented first, since every other module depends on a verified user identity and a patient record to attach data to. The Intelligent Monitoring Core was implemented next, comprising the eight XGBoost models, the SHAP explainers, and the feature extraction pipeline that reads from the clinical tables populated by the earlier modules. The Unified Care Dashboard, including the clinician facing AI Insights hub, the messaging system, and the real time alerting layer, was implemented once risk data existed to display. The Adaptive Care Guide and the Continuity Bridge, being the most dependent on mature clinical and family data, were implemented last. The frontend was built with React and Vite, the backend with FastAPI and SQLAlchemy, and the AI layer with XGBoost and SHAP, with the full technology rationale presented in Section 3.8. Implementation proceeded strictly module by module in line with the Waterfall sequencing, with each module's underlying design reviewed against the specification produced in the design phase before it was considered complete.

3.3.4 Phase 4: Testing

Testing was carried out at three levels corresponding to the three kinds of artefact produced during implementation. At the API level, a smoke test suite exercised the core administrative and care setting endpoints to confirm that authenticated requests returned the expected HTTP status codes and response fields. At the model level, each of the eight XGBoost models was evaluated on a held out twenty percent test split using a stratified train and test partition, with Stratified K Fold cross validation used during hyperparameter tuning and the Synthetic Minority Oversampling Technique applied to correct class imbalance in the training data. The full results of this evaluation, including the Area Under the Curve, accuracy, precision, recall, and F1 score achieved by each model, are reported in full in Section 3.6 and are revisited in the results chapter. At the interface level, each module was exercised manually against the requirements produced during requirements analysis to confirm that role based views rendered correctly and that ML generated risk output was displayed with its corresponding SHAP explanation.

It is important to state plainly what this testing phase did and did not establish. All eight models were trained and evaluated on synthetic data generated from parameter distributions grounded in published palliative care statistics rather than on real patient records, so the reported accuracy figures demonstrate that the models learned the clinical relationships encoded in the synthetic data correctly, not that they would perform at the same level on a real hospital population. No formal unit test suite, load test, external clinical validation, or user study was conducted within the scope of this project. These limitations are treated honestly here, and revisited as recommendations for further work in the concluding chapter, rather than being allowed to inflate a claim of clinical readiness that the evidence does not yet support.

3.3.5 Phase 5: Deployment and Documentation

The final phase covered getting the completed system running in a usable environment and documenting it for both the examiner and any future developer who continues the work. For development and demonstration purposes, the backend was served locally with Uvicorn on port 8000 and the frontend with the Vite development server on port 5173, with a small Windows launcher script provided to start both processes together. Configuration such as the database connection string, the JSON Web Token signing secret, and the API keys for the large language model providers used by the conversational assistant were externalised into environment variables rather than hard coded, so that the same codebase could later be pointed at a PostgreSQL database and served behind a production grade process manager without any code changes. Documentation produced at this stage included the system master documentation describing every route, component, service, and database table in the codebase, which served as the primary technical source for this chapter, in addition to this report itself.

3.4 System Architecture

Figure 3.2: System Architecture Showing the Data Input Layer, Intelligent Monitoring Core, Adaptive Care Guide, Unified Care Dashboard, and Continuity Bridge

The system follows a layered client server architecture comprising five cooperating layers: a data input layer through which clinical and personal information enters the system, an Intelligent Monitoring Core that turns that data into explainable risk predictions, an Adaptive Care Guide that turns predictions and clinical context into recommended actions, a Unified Care Dashboard through which clinicians, caregivers, and patients interact with the system, and a Continuity Bridge that extends the platform beyond active treatment into family support and bereavement. A React and Vite single page application communicates with a FastAPI backend over a combination of REST endpoints and a persistent WebSocket connection, the backend persists data through SQLAlchemy to a SQLite database in development and a PostgreSQL database in production, and the eight XGBoost models together with their SHAP explainers are loaded into the backend process at startup so that predictions are served with low latency rather than through a separate network call to an external model server.

3.4.1 Data Input Layer

The data input layer is the set of forms and structured entry points through which clinicians, caregivers, and patients record information: vital signs (heart rate, blood pressure, oxygen saturation, temperature, and respiratory rate), free text and structured symptom logs, medication records, appointment scheduling, and the validated clinical assessment instruments, namely the Edmonton Symptom Assessment System, the Palliative Performance Scale, the Barthel Index of activities of daily living, the Mini Mental State Examination, the Patient Health Questionnaire 9 for depression, and the Generalised Anxiety Disorder 7 scale. Every submission is validated against a Pydantic schema on the backend before it is persisted, which both rejects malformed input at the boundary of the system and gives the Intelligent Monitoring Core a guarantee about the shape and range of the data it will later read.

3.4.2 Intelligent Monitoring Core

The Intelligent Monitoring Core is the artificial intelligence heart of the system and is described fully in Section 3.6. In architectural terms, it consists of a feature extraction function that reads the most recent vitals, assessment scores, medications, and alert history for a given patient from the database and assembles them into a single feature vector, eight independently trained XGBoost classifiers that each score one clinical risk domain from that feature vector, a SHAP TreeExplainer attached to each model that decomposes its prediction into per feature contributions, and a weighted aggregation function that combines the eight domain scores into a single overall risk level of low, moderate, high, or critical. A background scheduler periodically re-runs this pipeline across all active patients and raises an alert for any patient whose overall risk crosses the high or critical threshold, so that clinicians are notified proactively rather than only when they happen to open a specific patient record.

3.4.3 Adaptive Care Guide

The Adaptive Care Guide is the layer responsible for turning clinical context into concrete recommended action. It comprises a care plan engine that maps a patient's diagnosis, functional status, and symptom burden onto an evidence informed set of goals, checklist items, and interventions, a personalisation engine that derives signals such as the patient's care priorities and need for emotional or spiritual support from an onboarding questionnaire, a journey tracker that places each patient at one of six care phases running from diagnosis through to legacy, and a rule based clinical explanation engine that answers plain language questions about a specific vital sign, symptom, or alert. Beyond shaping recommended content, the same personalisation signals also determine which parts of the interface are shown to a given user in the first place, for example whether the community and legacy sections of the navigation, the two AI assistants, and spiritual care content appear at all, so that a patient who has opted out of a feature during onboarding is not merely discouraged from using it but is not shown it. This rule based engine is deliberately kept separate from the SHAP driven explanations produced by the Intelligent Monitoring Core, since the two serve different purposes: SHAP explains why a statistical model produced a given score, while the rule based engine explains a single clinical observation in terms a non specialist can act on immediately.

3.4.4 Unified Care Dashboard

The Unified Care Dashboard is the primary interface through which the four stakeholder facing roles, namely admin, clinician, caregiver, and patient, interact with the system. It brings together the role aware landing dashboard, the patient list and detailed patient record, the clinical assessment forms, the medication and drug interaction views, the appointment scheduler, a messaging system with a client side urgency classifier that surfaces messages containing terms such as urgent, pain, or breathing above routine correspondence, a notification centre that ranks alerts by clinical priority rather than strictly by arrival time, and the AI Clinical Intelligence hub in which the output of the Intelligent Monitoring Core is presented across risk stratification, drug interaction, and system overview tabs. Real time updates, such as a newly acknowledged alert or an incoming message, are pushed to connected clients over a WebSocket connection so that the dashboard reflects the current state of a patient without requiring a manual refresh.

3.4.5 Continuity Bridge

The Continuity Bridge is the pillar that extends the platform beyond the period of active clinical monitoring, directly addressing the discontinuity in bereavement support identified in Chapter Two. It gives family members a timeline view of the patient's care journey, a memory vault in which photographs and written memories can be organised, including an automatic clustering of entries into themes such as joy, family, and gratitude, a private grief journal that applies natural language tone detection to surface how a family member's emotional state is trending over successive entries, a thirteen item grief screening instrument used to flag prolonged grief for referral, and a digital legacy system through which a patient can, with consent, designate heirs and prepare messages for delivery after death. Access to legacy content is scoped by an access level attached to each heir, so that, for example, a designated heir might be granted access to shared memories without being granted access to private messages intended for someone else.

3.5 Database Design

Figure 3.3: Entity-Relationship Diagram of the System Database

The database was designed using an object relational mapping approach through SQLAlchemy, with SQLite used during development for its zero configuration setup and PostgreSQL specified for production deployment through a single environment configuration variable, so that the choice of database engine does not require any change to application code. The Patient entity sits at the centre of the schema, with almost every other table, from Vital and Medication through to the various clinical assessment tables, related to it by a foreign key, reflecting the fact that the system is fundamentally organised around a single patient's longitudinal record rather than around discrete transactions.

Core tables: User, Patient, Vital, Symptom, Medication, Appointment, Alert, and NotificationQueue, which together capture identity, the patient record, and the moment to moment clinical events generated during care.

Assessment tables: ESASAssessment, PPSAssessment, FunctionalAssessment (Barthel), CognitiveAssessment (MMSE), PHQ9Assessment, GAD7Assessment, and MedicationAdherenceLog, each corresponding to one validated clinical instrument and supplying features directly to the Intelligent Monitoring Core.

Care and planning tables: CarePlan, CareGoal, CareGoalChecklist, CareIntervention, CaregiverAssignment, PatientPreferences, and CareSetting, which record the Adaptive Care Guide's output and the operational assignment of caregivers to patients.

Community and social tables: CommunityGroup, GroupMembership, GroupPost, PostReaction, Message, Conversation, Resource, and ResourceBookmark, supporting peer support and educational content.

Bereavement and legacy tables: BereavementEntry, GriefScreening, LegacyConsent, LegacyHeir, and LegacyContent, which together implement the Continuity Bridge described in Section 3.4.5.

Governance tables: UsabilityFeedback, ChatbotConsent, CrisisAlert, ClinicalOverride, and AuditLog, which support the ethical and usability evaluation of the system rather than clinical care directly.

Schema changes were applied through a set of incremental migration scripts rather than a single monolithic schema definition, reflecting the fact that several tables, such as those supporting care settings, preferences, and the comprehensive AI feedback loop, were added once the corresponding feature had been designed rather than all being specified at the very start of the project.

3.6 AI Model Design and Explainability

Figure 3.4: Explainable AI Pipeline from Input Features to SHAP-Based Clinician Output

Explainability was treated as a first class design requirement rather than an add on, in direct response to the opacity of existing mortality prediction tools identified in Chapter Two. The Intelligent Monitoring Core therefore does not use a single monolithic model. Instead, eight independent XGBoost classifiers, one per clinical domain, are trained, each accompanied by its own SHAP TreeExplainer so that every risk score the system produces can be traced back to the specific clinical values that drove it. XGBoost, a scalable gradient boosted decision tree implementation (Chen and Guestrin, 2016), was selected over alternatives such as logistic regression or deep neural networks because it performs well on the kind of structured, tabular, and partially missing clinical data that this system works with, trains quickly enough to be retrained as new patient data accumulates, and is directly compatible with SHAP TreeExplainer, which computes exact rather than approximated Shapley values for tree based models (Lundberg and Lee, 2017).

Eight clinical risk domains were modelled, corresponding to the assessment instruments and clinical concerns identified during requirements analysis: vital signs risk, symptom burden, functional decline, cognitive impairment, mental health risk, medication risk, caregiver burden, and thirty day hospital admission risk. Feature vectors are assembled at prediction time from the most recent vitals, ESAS, PPS, Barthel, MMSE, PHQ-9, and GAD-7 scores, active medication list, and alert history for the patient in question, with clinically appropriate default values substituted for any missing reading, for example a default heart rate of 80 beats per minute or oxygen saturation of 95 percent, so that a prediction can still be produced for a patient whose record is incomplete rather than the system withholding an assessment entirely.

Each model was trained on eight thousand synthetic samples, generated from parameter distributions grounded in published palliative care statistics, for example a mean Palliative Performance Scale score of approximately fifty five and a mean Zarit Caregiver Burden score of approximately thirty two, with binary risk labels assigned using evidence based clinical thresholds rather than random noise. Training used an eighty and twenty stratified train and test split, Stratified K Fold cross validation during hyperparameter tuning, and the Synthetic Minority Oversampling Technique to correct class imbalance. A fixed random seed of forty two was used throughout to keep the training procedure reproducible. The resulting performance on the held out test split for each of the eight models is summarised in Table 3.1.

Table 3.1: Held-out test performance of the eight XGBoost risk models

| Model | AUC | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|---|
| Vital Signs Risk | 0.979 | 92.3% | 77.2% | 91.3% | 83.6% |
| Symptom Burden | 0.991 | 96.1% | 75.6% | 94.3% | 83.9% |
| Functional Decline | 0.993 | 95.3% | 89.3% | 95.1% | 92.1% |
| Cognitive Impairment | 0.996 | 95.6% | 95.5% | 93.9% | 94.8% |
| Mental Health Risk | 0.998 | 97.3% | 97.4% | 97.3% | 97.3% |
| Medication Risk | 0.994 | 95.3% | 96.6% | 95.7% | 96.1% |
| Caregiver Burden | 0.998 | 97.8% | 95.6% | 97.5% | 96.5% |
| Admission Risk | 0.985 | 91.8% | 81.3% | 96.7% | 88.3% |

Two caveats are made explicit here rather than left implicit. First, all eight models were trained and evaluated on synthetic rather than real patient data, so the figures in Table 3.1 demonstrate that each model learned the clinical relationships encoded in its training distribution correctly, not that comparable accuracy would be achieved on a real hospital population; published XGBoost models trained on real palliative care datasets typically report an Area Under the Curve in the region of 0.75 to 0.88 for comparable tasks, which is the figure a reader should treat as the realistic benchmark for eventual clinical deployment. Second, the lower precision recorded for the vital signs risk, symptom burden, and admission risk models, at 77.2, 75.6, and 81.3 percent respectively, reflects a deliberate bias toward recall, since in a palliative care context a false positive that prompts an unnecessary clinical review is judged less harmful than a false negative that allows a deteriorating patient to go unnoticed.

Two distinct explanation systems were built and are kept visually and architecturally separate so that a clinician is never in doubt about which kind of explanation they are reading. The first is the SHAP driven explanation attached to every XGBoost prediction, which reports, for each of the top contributing features, the feature's raw clinical value, its SHAP value, and its percentage share of the total explanation, always labelled with an explicit XGBoost SHAP badge, or a Feature Importance badge on the rare occasion that the exact SHAP computation is unavailable and the system falls back to XGBoost's built in feature importance weights. The second is a rule based clinical explanation engine that answers a clinician's question about one specific vital sign, symptom, or alert using threshold based clinical heuristics rather than a statistical model, and is used where a targeted, human readable explanation of a single observation is more useful than a full multi feature breakdown.

3.7 Security and Privacy Architecture

Figure 3.5: Security and Data Flow Architecture Showing Authentication and Access Control Boundaries

Authentication is implemented using JSON Web Tokens signed with the HS256 algorithm, issued on login and carrying a twenty four hour expiry, with passwords hashed using bcrypt through the passlib library rather than stored or compared in plain text. Authorisation is enforced through role based access control: every backend endpoint declares the roles permitted to call it, and a dedicated authentication middleware validates the token and attaches the resolved user to the request before any route handler executes, so that role checks cannot be bypassed by calling a route directly. All actions performed through the administrative interface, such as creating a user or deactivating an account, are written to an append only AuditLog table, giving a traceable record of who changed what and when, which is a requirement for any system handling identifiable health information.

Data layer security relies on the SQLAlchemy object relational mapper to parameterise every query issued to the database, which removes the most common vector for SQL injection by construction rather than by convention, and on the bleach library to sanitise any user supplied text, such as a community post or a message body, before it is stored, mitigating cross site scripting. Sessions are additionally protected by an automatic thirty minute idle logout, implemented as a client side idle timer that displays a warning before forcing re-authentication, which is particularly relevant given that clinical workstations are frequently shared between staff. The Digital Legacy and bereavement modules apply an additional layer of consent based access control on top of role based access control, since a family member's role alone does not determine what legacy content they are entitled to see; a separate access level, ranging from full access to memories only, is attached to each designated heir at the point the patient sets up their legacy, and is checked independently of the user's system role.

3.8 Tools and Technologies

The technology stack was chosen to balance development speed appropriate to a single semester capstone project against the reliability and explainability requirements of a clinical decision support tool. Table 3.2 summarises the principal tools adopted at each layer of the architecture described in Section 3.4, together with the rationale for each choice.

Table 3.2: Principal tools and technologies by architectural layer

| Layer | Tool | Rationale |
|---|---|---|
| Frontend | React 18 with Vite | Component based UI with fast development server reload |
| Frontend state | TanStack Query | Server state caching and automatic invalidation |
| Frontend charts | Recharts | SHAP bars, risk gauges, and trend sparklines |
| Backend | FastAPI | Async Python framework with automatic OpenAPI documentation |
| ORM | SQLAlchemy | Database engine independence between SQLite and PostgreSQL |
| Validation | Pydantic | Schema validation of all incoming API payloads |
| Machine learning | XGBoost and scikit-learn | Gradient boosted trees suited to tabular clinical data |
| Explainability | SHAP (TreeExplainer) | Exact per-feature contribution for every risk prediction |
| Authentication | python-jose and passlib | JWT issuance and bcrypt password hashing |
| Conversational AI | Gemini 1.5 Flash with Groq Llama 3.1 fallback | Streaming LLM chat with provider redundancy |
| Real time | WebSockets | Push delivery of alerts, messages, and notifications |

3.9 System Process Flow

Figure 3.6: End-to-End System Process Flow from Patient Data Entry to Bereavement Support

Two process flows illustrate how the architectural layers described in Section 3.4 cooperate at runtime. The first is authentication: a user submits credentials from the login page, the backend verifies them against the stored bcrypt hash and issues a signed JSON Web Token, the frontend stores that token and attaches it as a bearer header to every subsequent request, and the user is routed to the view appropriate to their role, for example the personalisation questionnaire on first login, the patient portal for a patient, or the role aware dashboard for a clinician or caregiver.

The second, and more central to the contribution of this project, is the risk prediction flow. When a clinician opens a patient record or a background scan runs on its scheduled interval, the backend reads the patient's most recent vitals, ESAS, PPS, Barthel, MMSE, PHQ-9, and GAD-7 scores, active medications, and alert history, and assembles them into a feature vector. That vector is passed to each of the eight XGBoost models in turn, and each model's SHAP TreeExplainer produces a ranked list of the clinical values that most influenced its prediction. The eight domain scores are then combined using a fixed set of clinical weights, with vital signs and symptom burden weighted most heavily, into a single overall risk level, and the complete result, comprising the overall level, the eight domain scores, the SHAP explanations, and a short list of plain language key concerns, is returned to the frontend in one response and rendered simultaneously as the summary gauge on the patient record and the detailed explanation panel in the AI Insights hub.

This same pipeline is re-invoked immediately after a clinician submits a new ESAS, PPS, or Barthel assessment, so that the risk score and its SHAP explanation shown to the clinician always reflect the assessment values they have just entered rather than a stale prediction from before the visit. Where a patient's overall risk crosses the high or critical threshold, an alert record is created and pushed over the WebSocket connection to every connected clinician, which is what allows the system to surface deterioration proactively rather than only when a clinician happens to be looking at that specific patient.

3.10 Summary

This chapter has set out the methodology and system design underpinning Project AURA. A design science research approach was adopted, realised through a five phase Waterfall software development life cycle appropriate to the fixed timeline and supervised structure of a final year capstone project. The resulting system was described as a layered architecture built around four functional pillars, namely the Intelligent Monitoring Core, the Adaptive Care Guide, the Unified Care Dashboard, and the Continuity Bridge, each directly traceable to a gap identified in the literature review in Chapter Two. The database schema, the design and honestly reported performance of the eight explainable XGBoost risk models, the security and privacy architecture, the technology stack, and the two central runtime process flows were each described in turn. The following chapter presents the implementation of this design in greater technical detail together with the results of system testing and evaluation.

---

CHAPTER 4
SYSTEM IMPLEMENTATION

4.1 Introduction

This chapter describes how the architecture, database design, artificial intelligence design, and security design set out in Chapter Three were realised in working software. Where Chapter Three explained what was designed and why, this chapter explains how each of the four functional pillars introduced there, namely the Intelligent Monitoring Core, the Adaptive Care Guide, the Unified Care Dashboard, and the Continuity Bridge, was actually built, which technologies and engineering techniques were used to realise each responsibility, and what practical decisions were made during the Implementation phase of the Waterfall life cycle described in Section 3.3.3. The chapter is organised broadly in the dependency order in which the modules were actually built: foundational authentication and clinical data capture first, the Intelligent Monitoring Core once clinical data existed to feed it, the Unified Care Dashboard once risk output existed to display, and the Adaptive Care Guide and the Continuity Bridge last, since both depend on mature clinical and family data being present. The chapter closes with an honest account of the practical engineering problems encountered during implementation and how each was resolved, since these difficulties, and the discipline required to resolve them, are as much a part of the engineering record of this project as the finished modules themselves.

4.2 Development and Runtime Environment

Project AURA is a full stack application composed of a React and Vite single page frontend, a FastAPI backend, a SQLAlchemy data access layer, and an XGBoost and SHAP based inference layer, as set out architecturally in Section 3.4. For development and demonstration, the backend and frontend development servers are run independently, with a lightweight launcher provided so that both processes can be brought up together with a single command rather than requiring two separate terminal sessions, a small convenience that mattered during repeated demonstration of the system to the project supervisor. Configuration values that differ between a development and a production deployment, namely the database connection string, the JSON Web Token signing secret, and the API keys for the large language model providers used by the conversational assistant, are externalised into environment variables rather than hard coded into the source, consistent with the deployment principle described in Section 3.3.5 and allowing the same codebase to be pointed at a production database and served behind a production process manager without any code change.

Table 4.1 summarises the scale of the codebase produced during implementation, expressed in the same units used by the system master documentation that was compiled once the Implementation phase was complete. The figures give a sense of the size of the artefact evaluated in Chapter Five: a frontend of sixty five routed pages and roughly sixty reusable components, a backend of forty route groups and ten services, an inference layer of eight independently trained models, and a relational schema of approximately forty SQLAlchemy models organised into six functional groups, as first listed in Section 3.5.

Table 4.1: High-level composition of the Project AURA codebase at the end of the implementation phase

| Layer | Component type | Count |
|---|---|---|
| Frontend | Routed pages | 65 |
| Frontend | Reusable components | ~60 |
| Frontend | Custom hooks | 7 |
| Frontend | Context providers | 6 |
| Backend | Routers (API route groups) | 40 |
| Backend | Services | 10 |
| Machine learning | Trained XGBoost models, each with a SHAP explainer | 8 |
| Database | SQLAlchemy models, across six functional groups | ~40 |

4.3 Implementation of the Data Input Layer

Figure 4.1: Patient Symptom Tracking and Data Entry Screen

The data input layer described architecturally in Section 3.4.1 is implemented as a set of dedicated capture screens on the frontend, each backed by a corresponding API route and a schema validation layer on the backend that checks the payload before it reaches the database. Vital sign capture, covering heart rate, systolic and diastolic blood pressure, oxygen saturation, temperature, and respiratory rate, follows a consistent create-and-retrieve pattern: a submission is logged through a dedicated endpoint, and a corresponding retrieval endpoint returns the patient's history for the trend chart shown on the record. Symptom logging, medication records, and appointment scheduling were each implemented through an equivalent pair of endpoints, offering the create, read, update, and, where clinically appropriate, delete operations needed by the corresponding screen. This uniform pattern was adopted deliberately: a new capture form can be added by following an established template rather than by improvising a new interaction each time, which reduces the risk of inconsistency across a system with as many data entry points as this one.

The six validated clinical assessment instruments identified during requirements analysis, namely the Edmonton Symptom Assessment System, the Palliative Performance Scale, the Barthel Index, the Mini Mental State Examination, the Patient Health Questionnaire 9, and the Generalised Anxiety Disorder 7 scale, are each implemented as a dedicated form, all served by a single assessment router that exposes creation and history endpoints per instrument together with a combined patient overview endpoint. Every one of these submissions is validated against a request schema that is maintained deliberately separately from the database model it is eventually stored as, a separation of concerns adopted so that the shape of data accepted over the network can evolve independently of the shape of data persisted. This validation both rejects malformed input at the boundary of the system, for example an Edmonton Symptom Assessment System slider value outside the zero to ten range, and gives the Intelligent Monitoring Core, described in Section 4.4, a firm guarantee about the range and completeness of the data it will later read.

Because the significance of the study set out in Section 1.4 explicitly targets low infrastructure settings, every capture form is additionally wrapped by an offline first data access layer: a read attempts the network request first and, on failure, falls back to a local browser-resident cache, while a write, such as logging a vital sign, is queued locally and re-attempted once connectivity is restored. This pattern, generally referred to as background synchronisation, was chosen over simply failing the request outright because it directly answers the non functional requirement that the system remain usable when a caregiver is working in an area with intermittent network coverage, a realistic condition in much of the Ghanaian context this project targets. A persistent connectivity indicator was added to the interface so that a caregiver is never left uncertain about whether a reading has actually reached the server or is still waiting to synchronise.

4.4 Implementation of the Intelligent Monitoring Core

Figure 4.2: Clinician Risk-Prediction View with SHAP-Based Explanation

The Intelligent Monitoring Core, introduced architecturally in Section 3.4.2 and designed in detail in Section 3.6, is implemented as a dedicated inference service that loads all eight trained XGBoost models, together with each model's fitted feature scaler and its accompanying SHAP explainer, into memory once at application startup. Loading the models eagerly rather than lazily, and serving them from the same process as the rest of the backend rather than through a separate model server, was a deliberate choice: it keeps prediction latency low and avoids the additional deployment complexity of a distinct inference service, a complexity that is difficult to justify at the scale of this system's model count and demonstration workload. The service exposes a single-domain prediction function that returns a probability together with a ranked explanation of the features that most influenced it, a combined function that invokes this once for each of the eight clinical domains in one call, and an aggregation function that combines the eight resulting probabilities into one overall risk level using the fixed clinical weighting shown in Table 4.2, in which vital signs and symptom burden are weighted most heavily and caregiver burden least heavily, consistent with the clinical priority argued for in Section 3.6.

Table 4.2: Clinical weighting applied when combining the eight domain scores into one overall risk level

| Clinical risk domain | Weight | Overall risk thresholds |
|---|---|---|
| Vital signs risk | 1.5 | Critical: above 70% |
| Symptom burden | 1.3 | High: 50% to 70% |
| Functional decline | 1.2 | Moderate: 30% to 50% |
| Admission risk | 1.2 | Low: below 30% |
| Mental health risk | 1.1 | |
| Cognitive impairment | 1.0 | |
| Medication risk | 1.0 | |
| Caregiver burden | 0.8 | |

The feature vector passed into these models is assembled by a dedicated feature extraction routine that reads the patient's most recent vital signs, Edmonton Symptom Assessment System, Palliative Performance Scale, Barthel, Mini Mental State Examination, Patient Health Questionnaire 9, and Generalised Anxiety Disorder 7 scores, the active medication list, medication adherence history, the alert history over the preceding six months as a proxy for recent emergency department visits, and a recorded social support score, substituting a clinically appropriate default, for example a heart rate of eighty beats per minute or an oxygen saturation of ninety five percent, for any value that is genuinely missing, so that a prediction is still produced for a patient whose record is incomplete rather than the system withholding an assessment entirely. This extraction logic sits behind a small set of endpoints through which the frontend consumes the Intelligent Monitoring Core: one returning the full eight domain risk profile for a patient, one returning a single domain in isolation, one reporting the health of the loaded models, one returning a ranked list of risk across the whole patient population for the dashboard and clinical intelligence views, and one allowing the proactive background scan described below to be triggered on demand rather than waiting for its next scheduled run.

The proactive background scan itself is implemented as a scheduled background task that runs all eight models across every patient whose status is active, stable, or deteriorating, and, for any patient whose overall risk crosses the high or critical threshold, raises an alert and queues a notification for every active clinician and administrator, provided that patient has not already been alerted within the preceding six hours. This six hour deduplication window was a deliberate implementation decision to prevent the alert fatigue that would otherwise result from a scan repeatedly flagging the same deteriorating patient on every run, and its practical importance is discussed further in relation to the precision achieved by the vital signs risk model in Section 5.4.

A second, architecturally independent, explanation pathway sits alongside the Intelligent Monitoring Core: a rule based clinical explanation service answers a clinician's question about one specific vital sign, symptom, or alert using threshold based clinical heuristics rather than a statistical model. On the frontend, the two explanation systems are kept visually distinct so that a clinician is never in doubt about which kind of explanation they are reading: SHAP-derived output is rendered as bar and waterfall charts inside the risk summary and explanation panels, always carrying an explicit label identifying it as an XGBoost SHAP explanation, or as a feature importance approximation on the rare occasion that the exact SHAP computation is unavailable, while the rule based engine's output is rendered in a visually separate explanation component. Finally, the more advanced clinical analyses, namely thirty day deterioration trending, drug interaction detection, caregiver burnout estimation, and prognosis, are implemented as a separate advanced analytics service and are consumed principally by the clinical intelligence timeline, the medication interaction banner, and the caregiver workload panel described in Section 4.6.

4.5 Implementation of the Adaptive Care Guide

Figure 4.3: Adaptive Care Guide Recommendation Screen

The Adaptive Care Guide, introduced in Section 3.4.3, is implemented as three cooperating services. A care plan engine reads a patient's diagnosis, most recent Palliative Performance Scale and Edmonton Symptom Assessment System scores, active medications, and recorded goals of care preferences, maps the diagnosis onto a condition category and the functional score onto a functional level, and produces a structured set of goals, checklist items, and interventions that the clinician can review, edit inline, and mark complete as care progresses. A personalisation engine derives a set of signals, namely a greeting context, community and resource content tags, indicators of whether a patient needs emotional or spiritual support, a daily focus message, a wellbeing insight, and a prioritised action list, from a short onboarding questionnaire completed once at first login, which collects the patient's primary condition, care priorities, spiritual background, emotional needs, and content preferences such as language, theme, and notification level. These signals are consumed throughout the interface: the patient portal uses them to construct a personalised greeting and to order its quick actions, the community hub uses them to score group recommendations, and the resource library uses them to rank the AI recommended reading list. Critically, the same signals are also used to derive a single set of interface visibility flags, rather than being read independently by every screen that needs them: whether the community and legacy sections of the navigation are shown at all, whether the two AI assistants are surfaced, and whether spiritual care content appears in the care plan, the medical knowledge base, and the community hub, are all controlled from this one derived state. Centralising this logic in one place, instead of scattering conditional checks throughout the interface, became necessary once the onboarding questionnaire grew to cover consent, spiritual preference, community interest, and legacy interest together: it keeps the rule for what a given patient sees consistent everywhere it matters, and it means a new personalisation signal only has to be wired into one place rather than into every screen that might eventually need it.

A journey tracking service implements the six phase care journey summarised in Table 4.3, automatically placing a patient at the appropriate phase from clinical data already captured elsewhere in the system, for example moving a patient into the Escalation phase once their Edmonton Symptom Assessment System total exceeds fifty or their Palliative Performance Scale score falls below forty, and into the Transition phase once the Palliative Performance Scale falls below twenty or a terminal prognosis is recorded. The patient's own view presents this journey directly, while the family facing view presents a care appropriate, de-identified summary of the same underlying events, ensuring that raw clinical values the patient has not consented to share are never exposed to family members, in line with the consent based access control described in Section 4.9.

Table 4.3: The six phases of the patient journey tracked by the journey tracker service

| Phase | Name | Automatic trigger |
|---|---|---|
| 1 | Diagnosis | Patient record created and a primary diagnosis recorded |
| 2 | Care Planning | An initial care plan has been generated |
| 3 | Active Monitoring | Vitals and Edmonton Symptom Assessment System scores are logged regularly |
| 4 | Escalation | Edmonton Symptom Assessment System total exceeds 50, or Palliative Performance Scale falls below 40 |
| 5 | Transition | Palliative Performance Scale falls below 20, or a terminal prognosis is recorded |
| 6 | Legacy | Digital legacy is activated following the patient's death |

The two clinical reference tools that support the Adaptive Care Guide, a structured care protocol library and a searchable medical knowledge base, were restructured during implementation from an initial card and pop-up modal layout into a two-column reading interface, an index pane paired with a full reading pane, deliberately modelled on the layout of a reference book rather than a scrolling feed. This change was made because a clinician consulting a protocol under time pressure needs to scan a table of contents and jump directly to the relevant section, a pattern a modal dialogue does not support well once the underlying content grows past a handful of short entries. The medical knowledge base was further extended to let a clinician or administrator create, edit, and retire condition entries directly through the interface, rather than requiring a code change to add a new condition, which was judged important for a knowledge base intended to keep pace with clinical practice over the life of the system rather than being fixed at the point of submission.

4.6 Implementation of the Unified Care Dashboard

Figure 4.4: Unified Care Coordination Dashboard

The Unified Care Dashboard, introduced in Section 3.4.4, is the single largest concentration of frontend screens in the system. A role aware landing view adapts its content to the signed in user: a patient table together with a risk overview widget and a drug interaction warning banner for a clinician, an assigned patient list for a caregiver, and a journey timeline for a family member are all rendered from the same landing route, with the branching logic driven by the authenticated user's role rather than by separate applications. A searchable patient list, a full patient record view carrying a vitals ribbon and a compact risk summary, a real time monitoring view, and a full SHAP deep dive view give clinicians progressively more detail as they move from an overview of the caseload to a single patient's risk profile. The clinical intelligence hub, restricted to the clinician and administrator roles, presents system wide counts of critical, high risk, and stable patients alongside a control that triggers an on demand risk scan, organised into three tabs covering risk stratification, drug interaction warnings, and a system overview showing the risk distribution across the caseload together with model health status. Selecting a patient from this hub opens a deep dive panel with overview, explanation, domain, and timeline sub views, each rendering a different facet of the same underlying risk profile.

Two of the Dashboard's components implement a lightweight client side classifier rather than calling the Intelligent Monitoring Core directly, on the reasoning that flagging urgency in a conversation or notification is a much cheaper problem than clinical risk prediction and does not warrant invoking the full inference pipeline. The messaging view scans the text of each conversation's most recent message against a fixed vocabulary of urgency indicating terms, for example urgent, pain, breathing, or unconscious, to sort flagged conversations above routine correspondence. The notification centre implements a comparable priority function that assigns each notification a base score by type, weighted so that a critical vitals or ML risk notification always outranks a routine appointment reminder, before adding a recency bonus and an unread bonus, so that the ordering of the notification feed reflects clinical urgency rather than strict arrival order.

The caregiver management and medication views are the two most directly dependent on the advanced analytics service introduced in Section 4.4. The caregiver view renders, for each member of the care team, a burnout indicator and a workload measure, and its auto-assignment feature scores every available caregiver on a weighted composite of workload, active patient count, and specialty match, assigning the patient to whichever caregiver scores lowest on that composite before the cached server state is invalidated so that the new assignment appears immediately without a manual refresh. The medication view, in turn, surfaces a global warning banner and a per medication interaction indicator whenever the same drug interaction service reports a severe or major interaction for a given patient, with the same population wide scan feeding a corresponding warning on the dashboard.

All of these screens communicate with the backend through a single shared API client, which attaches the current authentication token to every request and redirects to the login screen automatically should a request be rejected as unauthenticated. Server state returned by this client is cached client side, with caching parameters tuned to how quickly each kind of data changes, as illustrated in Table 4.4: expensive, comparatively slowly changing data such as a population wide risk scan is cached for several minutes, while data a clinician relies on being current, such as the active alert list, is refetched at short, fixed intervals regardless of cache age. This differential caching strategy, rather than a single uniform policy, was adopted because treating all server state identically would either make the interface feel stale for time sensitive clinical data or generate unnecessary network traffic for data that changes rarely.

Table 4.4: Representative TanStack Query caching parameters applied to server state

| Query key | Stale time | Refetch interval | Rationale |
|---|---|---|---|
| patients | 5 minutes | — | Patient list changes infrequently |
| patient-vitals | Not cached | — | Always shown fresh on navigation |
| ml-risk | 5 minutes | — | ML inference is comparatively expensive |
| alerts | — | 30 seconds | Clinical urgency requires near real time data |
| notifications | — | 30 seconds | Drives the user-facing unread badge |
| all-drug-ints | 10 minutes | — | Expensive all-patient batch scan |

Because the Unified Care Dashboard eventually spanned dozens of independently built screens, a separate pass was needed once the core functionality existed to keep their presentation consistent. A shared colour theme was extended with a dark variant, verified screen by screen rather than assumed to work automatically, since colours set directly on a component rather than derived from the shared theme were repeatedly found to be illegible once the dark variant was active. The layout was likewise reviewed for use on a small mobile screen, since caregivers in the settings this project targets are more likely to access the platform from a phone than a desktop; the navigation drawer, the clinical assessment forms, and the page-level padding were each adjusted to remain usable at narrow viewport widths rather than simply shrinking a desktop layout. A toast-based notification library was adopted for transient feedback, such as confirming that a setting was saved, in preference to a modal dialogue, because a transient confirmation should not block the user's next action the way a modal does. Finally, a small set of feature flags, covering optional interface behaviour such as list virtualisation for very large patient tables, celebratory animation on goal completion, and route level progress indication, were exposed through the settings screen so that these behaviours could be tuned per deployment without a code change, consistent with the configuration-over-code principle already applied to the environment variables described in Section 4.2.

4.7 Implementation of the Continuity Bridge

Figure 4.5: Bereavement Support Module Screen

The Continuity Bridge, introduced in Section 3.4.5, is implemented across four screens and a supporting set of routes. A memory vault applies a client side clustering routine that groups a family member's uploaded memories into themes such as joy, family, gratitude, adventures, and reflection, with a toggle allowing a switch between a plain chronological grid and this thematic grouping. A private grief journal rotates through a set of compassionate writing prompts and applies natural language tone detection to classify each entry into one of eight tones, for example grief, hope, anxiety, or acceptance, displaying the detected tone as a badge on the entry; because the journal is intended as a private space, entries are visible only to their author and are never surfaced to clinical staff, a boundary enforced at the access control layer rather than left to interface convention alone. A grief screening form implements the thirteen item PG-13 instrument, organised into the three domains of separation distress, cognitive and emotional response, and functional impairment, scored on a one to five scale per item for a possible total of thirteen to sixty five, with a total of thirty or more flagging the respondent for a prolonged grief referral; where the screening is flagged, the results screen displays the Ghana Mental Health Authority crisis line alongside the recommendation, directly reflecting the Ghana specific adaptation described in Section 1.5.

The digital legacy workflow described architecturally in Section 3.4.5 is implemented as a strict sequence enforced by the order in which its screens become available: a patient first records consent, then designates one or more heirs, each carrying a relationship, an access level of full, memories only, or messages only, and an independent flag governing access to private content, and then creates posthumous content, letters, messages, or notes, each carrying a delivery trigger of either after death or a specific date. Following the patient's death, a clinician activates the legacy through the administrative interface, at which point the heir access view becomes available to each designated heir, filtered strictly by that heir's individually assigned access level rather than by their general system role, so that, for example, a friend granted memories only access can never read a private letter intended for a spouse. A supporting set of routes implements the surrounding bereavement workflow, exposing the grief screening, journal, journey progress, and support data consumed by the family facing bereavement dashboard.

4.8 Real-Time Communication Implementation

The real time layer sketched in Section 3.4.4 is implemented as a single WebSocket endpoint maintaining a connection manager that maps each authenticated connection to a set of subscribed rooms. On connection, a user's authentication token is validated exactly as it would be for a REST request, and the connection is automatically subscribed to a general room, to a clinicians room if the user's role is clinician or admin, to a caregivers room if the user's role is caregiver, and to a room unique to that patient if the user's role is patient, with the server sending a periodic keep alive frame to hold the connection open. Three event types account for the great majority of real time traffic: an alert update, broadcast to the clinicians room whenever an alert is acknowledged or dismissed; a new message event, broadcast whenever a message is persisted; and a new notification event, broadcast to a single recipient whenever the notification service creates an entry, for example following the proactive scan described in Section 4.4.

On the frontend, a dedicated hook opens and maintains the WebSocket connection, and a context provider wraps this hook to expose a simple subscribe and unsubscribe interface to any component in the tree, so that a component does not need to know anything about connection management to react to a live event. A concrete example illustrates how the pieces cooperate end to end: when a clinician acknowledges a critical alert, the acknowledgement is written to the database and an alert update event is broadcast to the clinicians room; every other connected clinician's context receives this event and invalidates the corresponding cached query, causing the alerts view to refetch and move the item into its resolved section without any manual page refresh. A small connection status indicator in the navigation reflects whether the current session is actively receiving live updates, giving every user a constant, low friction signal of connectivity state.

4.9 Security Implementation

Figure 4.6: Login and Authentication Screen

Authentication and authorisation, designed at a high level in Section 3.7, are implemented through a small number of shared components applied consistently across every backend route. A dedicated authentication middleware validates the signed authentication token on every incoming request and attaches the resolved user to the request before any route handler executes; passwords are hashed rather than stored or compared in plain text. A role based access control layer then supplies a small set of reusable dependency checks, for restricting an endpoint to a given role, to administrators only, to clinical staff, or to a caller with a verified relationship to the specific patient being accessed, that every route declares against the specific endpoints it exposes. Centralising these checks in shared middleware rather than reimplementing them per route was a deliberate choice: a role check cannot be bypassed by calling a route directly, and the separation between what a clinician, a caregiver, a patient, and a family member may access is enforced uniformly rather than left to the discipline of each route's author.

Every action performed through the administrative interface, including creating a user, deactivating an account, and resetting a password, is written to an append only audit record, giving a traceable history of who changed what and when, and the request and response schemas that validate data at the network boundary are maintained deliberately separately from the models used to persist it, so that the shape of data accepted over the network can be tightened or relaxed without altering how it is stored. At the data layer, the object relational mapper parameterises every query issued to the database, removing the most common vector for SQL injection by construction rather than by convention, and free text input, such as a community post or a message body, is sanitised before it is stored, mitigating cross site scripting. The consent based access control layered on top of role based access control for the Continuity Bridge, described in Section 4.7, is complemented by a comparable consent mechanism for the conversational assistant, and by a crisis workflow that lets a patient or family member flag a crisis directly, surfacing it to clinical staff without requiring the family member to know who on the care team to contact.

4.10 Accessibility and Offline Implementation

The accessibility requirements identified during requirements analysis in Section 3.3.1 are implemented centrally through a shared accessibility state that exposes a set of independently toggleable settings: adjustable font size across five steps, high contrast, reduced motion, screen reader mode, voice control, keyboard only navigation, large touch targets, a simplified interface, and an assisted mode intended for patients living with cognitive impairment that combines the largest font size, oversized controls, a simplified layout, reduced animation, and high visibility focus indicators into a single switch, together with a fixed set of keyboard shortcuts for skipping to the main content, reaching the navigation, reaching search, returning to the dashboard, and closing an open dialogue. Centralising these settings in one place, rather than letting each screen implement its own notion of font size or motion, was necessary given how many independently built screens the system eventually accumulated; without a single shared state, accessibility settings would inevitably have drifted out of sync between older and newer parts of the interface. Where voice control is enabled, a browser speech recognition service is wrapped to recognise a fixed vocabulary of navigation commands, and is deliberately guarded so that it is never activated on the public login or registration screens and silently absorbs the permission denial the browser raises when microphone access has been refused, rather than surfacing a technical error to the user.

Offline operation, motivated by the scope of the study set out in Section 1.5, is implemented through a service worker that caches static assets for repeat visits, combined with a structured local browser database that defines dedicated stores for patients, vitals, medications, appointments, and educational resources, together with a pending-write queue for data captured while offline. Each clinical data access module was wrapped so that a read attempts the network first and falls back to this local cache on failure, while a write, such as logging a vital sign, is queued and flushed automatically once connectivity is restored. The same pattern was extended to the Ghana specific educational resources described in Section 3.7, allowing palliative care guides and training material to be downloaded in advance for use in settings with no reliable connectivity at all.

4.11 Implementation Challenges and Resolutions

Consistent with the honest reporting practised throughout this report, this section records the practical problems actually encountered during implementation, and how each was resolved, rather than presenting the build process as having proceeded without friction.

- Route precedence conflicts: a specific, literally named route and a dynamic, parameterised route belonging to two different modules were found to conflict once both were registered, because the web framework matches routes in registration order and the dynamic route's pattern was broad enough to also match the specific path, producing an unintended validation error. The fix was to register the more specific route first, and the episode established a standing convention of registering literal routes ahead of parameterised ones throughout the router configuration.

- Cross origin and WebSocket authentication trade-off: permitting requests from any origin during development is incompatible, under the Cross-Origin Resource Sharing specification, with also allowing credentialed requests, which meant the REST API could not rely on browser managed session credentials once an open cross origin policy was enabled. WebSocket authentication was therefore implemented by passing the authentication token as a connection parameter rather than through a cookie, a workaround that traded a small amount of authentication elegance for the flexibility of an unrestricted development origin policy, a trade-off that would need to be revisited before any production deployment restricts allowed origins.

- Model artefact versioning: the serialized model files occasionally produced version mismatch warnings against the installed inference library at startup, because the models had been trained under a slightly different library version than the one running in the deployed environment. These were confirmed not to affect prediction correctness and were suppressed with a targeted warning filter rather than left to clutter the startup log, though the episode is a reminder that the training and serving environments should ideally be pinned to identical dependency versions before any real deployment.

- Text encoding artefacts: several interface screens had accumulated corrupted special characters, incorrectly rendered degree signs and similar symbols, carried over from an earlier editing session that used an inconsistent text encoding. These were corrected in the affected screens, and a small defensive stylesheet rule was added as a safety net to catch any remaining instances, illustrating how a seemingly cosmetic bug can persist for a surprising length of time in a fast moving codebase if it is not specifically checked for.

- Theming consistency under dark mode: once a dark colour theme was introduced as an accessibility and personalisation option, several table headers styled with a light background colour were found to be illegible against the surrounding dark interface, because their colouring had been set independently of the shared theme rather than derived from it. Every table header across the frontend was subsequently standardised to a single dark themed style that reads correctly in both light and dark mode, and the fix was generalised into a small set of reusable colour tokens so that future components would inherit correct theming automatically rather than needing an individual correction; the broader consistency pass this prompted also extended dark mode support to the two AI assistant widgets, the guided onboarding tour, and every major dashboard, portal, and community screen.

- Unintended regressions from bulk text substitution: a scripted, pattern based rename of a user facing label across several screens inadvertently deleted an unrelated import statement in one of the affected files, breaking that screen. The omission was caught by re-running the compiler and linter diagnostics available in the development environment after the bulk edit, and the import was restored, establishing a standing rule to re-check diagnostics after any bulk find-and-replace operation rather than trusting that a text substitution touched only what it was intended to touch.

- An interface default that shipped the wrong way round: interface sound effects were found to be enabled by default because the stored preference was evaluated as true unless it was explicitly the string false, rather than the reverse. This was corrected so that sound plays only once a user has explicitly opted in, consistent with the general principle that an assistive or sensory feature should default to off rather than assuming consent.

- A data shape mismatch in stored preferences: the personalisation layer occasionally failed when a preference field expected to be an array arrived from the database as a JSON encoded string instead, depending on how it had originally been written. A small coercion helper was introduced to normalise the field to a consistent array shape before any array operation is applied to it, a defensive pattern that proved necessary because the same preference data is written from more than one place in the system and cannot be guaranteed to always arrive in exactly the same shape.

- A regression in a previously working component: a risk summary component had been temporarily removed from the patient record view during an earlier debugging session, with a note left in its place for reference, and had not been reinstated once the debugging was complete. This was caught during a review pass over the Unified Care Dashboard rather than by any automated check, and the component was restored to its intended position, underlining the point made in Section 5.8 that the absence of an automated regression suite left this class of problem to manual review alone.

Two observations follow from this record. First, the great majority of these problems were caught through manual review and the compiler and linter diagnostics available in the development environment rather than through an automated test suite, which is consistent with the absence of a formal unit testing framework noted honestly in Section 3.3.4 and revisited as a limitation in Chapter Five. Second, several of the problems, in particular the router ordering issue and the CORS and WebSocket configuration, arise directly from architectural decisions made in Chapter Three, namely the layered client server design and the choice to authenticate the WebSocket connection independently of the REST API, and their resolution is best understood as refining that design under the pressure of a working implementation rather than as evidence against the design itself.

4.12 Summary

This chapter has traced the design decisions of Chapter Three through to the code that realises them. The data input layer, the Intelligent Monitoring Core, the Adaptive Care Guide, the Unified Care Dashboard, and the Continuity Bridge were each described in terms of the specific routers, services, pages, and components that implement them, together with the concrete parameters, clinical weightings, keyword lists, and caching policies that govern their behaviour at runtime. The real time communication layer, the security implementation, and the accessibility and offline features were then described in the same technical detail, and the chapter closed with an honest record of the practical problems encountered during implementation and how each was resolved. The following chapter presents the results obtained when this completed implementation was tested and evaluated against the objectives set out in Chapter One.

---

CHAPTER 5
RESULTS, TESTING AND EVALUATION

5.1 Introduction

This chapter reports the results obtained when the implementation described in Chapter Four was tested and evaluated. It follows directly from the testing phase of the Waterfall life cycle described in Section 3.3.4, presenting in full the outcomes that section reported only in summary, and it closes by evaluating the completed artefact directly against the main and specific objectives set out in Section 1.3. Consistent with the register maintained throughout this report, the chapter distinguishes carefully between what has been verified through the testing actually carried out and what remains an honest limitation to be addressed in future work, rather than allowing the evident technical sophistication of the system to imply a level of clinical validation that the evidence does not support.

5.2 Testing Strategy

Testing was carried out at the three levels introduced in Section 3.3.4: an application programming interface integration check, a held out evaluation of each of the eight XGBoost models, and a manual, requirements driven walkthrough of every module's principal user interface. To support this manual testing, the database was seeded with twelve synthetic patients together with associated vitals, medications, appointments, and clinical assessments, and one demonstration account was created for each of the five user roles, admin, clinician, caregiver, patient, and family, so that every role aware view described in Chapter Four could be exercised as the role it was designed for rather than only as an administrator. No automated unit test suite, load test, external clinical validation, or formal user study was conducted, and the results that follow should be read with that scope in mind throughout.

5.3 API Integration Test Results

The application programming interface integration check is a smoke test rather than a full automated suite: it authenticates as the seeded administrator account and confirms that a small set of core administrative and care setting endpoints return the expected HTTP status code and, where applicable, the expected response fields. Table 5.1 records the outcome of running this check against the completed implementation; every check passed.

Table 5.1: Results of the API integration smoke test

| Endpoint checked | Verification performed | Result |
|---|---|---|
| GET /api/care-settings/templates | HTTP 200 response | Passed |
| GET /api/care-settings/dashboard | HTTP 200 response | Passed |
| GET /api/care-settings/interactions | HTTP 200 response | Passed |
| GET /api/admin/users | HTTP 200 response; care_setting field present | Passed |
| GET /api/admin/users | is_professional field present | Passed |
| GET /api/admin/users | professional_title field present | Passed |
| GET /api/admin/users | care_setting_change_request field present | Passed |

This check does not exercise the ML prediction endpoints, WebSocket connectivity, file upload or download, authentication edge cases such as an expired or malformed token, input validation failures, or pagination and filtering behaviour, and no formal automated test suite exists in the codebase at the time of writing; these are recorded as limitations in Section 5.8 rather than left implicit. A separate, and more informative, integration problem was encountered and resolved during the machine learning training pipeline itself: the first attempt to run the training pipeline failed because a required package for correcting class imbalance had not been installed in the runtime environment; the training run reported in Section 5.4 is the successful run that followed this fix.

5.4 Machine Learning Model Results

Figure 5.1: SHAP Feature-Importance Summary Plot for the Risk Prediction Models

Figure 5.2: ROC Curves and Confusion Matrices for the Eight XGBoost Models

The held out test performance of the eight XGBoost models, first reported in Table 3.1, was obtained under the training protocol described in Section 3.6: eight thousand synthetic samples per task, an eighty and twenty stratified train and test split, Stratified K Fold cross validation during hyperparameter tuning, the Synthetic Minority Oversampling Technique to correct class imbalance, and a fixed random seed of forty two for reproducibility. All eight models reported an Area Under the Curve above 0.97, with the caregiver burden and mental health risk models achieving the highest overall F1 scores of 96.5 and 97.3 percent respectively, and the vital signs risk, symptom burden, and admission risk models recording comparatively lower precision, 77.2, 75.6, and 81.3 percent, while maintaining recall above ninety percent in each case.

The synthetic data underlying these figures was generated from parameter distributions grounded in published palliative care statistics rather than sampled from real patient records, and both the feature distributions and the rules used to assign binary risk labels are illustrated in Table 5.2. The clinical coherence of these distributions and rules is what allows the models to learn genuine clinical relationships, for example that low functional status combined with high symptom burden indicates elevated risk, but it is also precisely why the resulting accuracy figures cannot be read as a prediction of performance on a real hospital population; published XGBoost models trained on real palliative care datasets typically report an Area Under the Curve in the region of 0.75 to 0.88 for comparable tasks, and that range, rather than the figures in Table 3.1, is the realistic benchmark a reader should apply when judging the system's readiness for clinical use.

Table 5.2: Illustrative synthetic feature distributions and label-assignment rules used in model training

| Feature or rule | Specification used in model training |
|---|---|
| Patient age | Normal distribution, mean 72, standard deviation 12, clipped to 18–100 years |
| Palliative Performance Scale score | Normal distribution, mean 55, standard deviation 20, clipped to 10–100 |
| Edmonton Symptom Assessment System pain score | Normal distribution, mean 4, standard deviation 3, clipped to 0–10 |
| Zarit caregiver burden score | Normal distribution, mean 32, standard deviation 15, clipped to 0–88 |
| Vital signs risk label | Positive if oxygen saturation below 90%, heart rate above 120bpm, respiratory rate above 22/min, or temperature above 38.5°C |
| Admission risk label | Positive if Palliative Performance Scale below 40, Edmonton total above 45, and emergency department visits in 6 months above 1 |

The three models flagged for their comparatively lower precision, vital signs risk, symptom burden, and admission risk, were subsequently retrained using a second, targeted training pass that adjusted the class balancing and decision threshold used for these three tasks specifically, which improved precision on all three while preserving their high recall; the figures reported in Table 3.1 and reproduced in this section already reflect that retrained result. The clinical implication of this deliberate bias toward recall is directly visible in the implementation described in Section 4.4: a vital signs risk precision of 77.2 percent means that a meaningful proportion of proactive scan alerts will concern patients who, on closer review, are not in fact deteriorating, and it is precisely this expected rate of false positives that motivated the six hour deduplication window built into the proactive scanner, without which the same patient could otherwise be re-flagged on every hourly run and desensitise clinicians to genuine alerts.

5.5 Functional Verification of Runtime Flows

Each of the principal runtime flows described in Section 3.9 and documented in greater technical detail during implementation was exercised manually against the seeded demonstration data, using the account created for the relevant role in each case, and confirmed to produce the outcome the design intended. Table 5.3 summarises the flows verified in this way and the outcome observed for each. This verification was manual rather than automated, and should be read as confirming that the happy path of each flow behaves as designed under the conditions actually tested, rather than as a substitute for the automated regression suite identified as absent in Section 5.8.

Table 5.3: Manual verification outcomes for the principal runtime flows

| Runtime flow | Verified outcome |
|---|---|
| Authentication | Login issues a signed JWT and routes each of the five roles to its correct landing view |
| WebSocket real-time push | An acknowledged alert and a sent message are reflected on other connected clients without a manual refresh |
| ML risk prediction pipeline | Opening a patient record returns all eight domain scores with SHAP explanations in a single response |
| Alert lifecycle | A critical vital reading creates an alert, which can be acknowledged and moves to the resolved section |
| Assessment to ML feedback loop | Submitting an ESAS, PPS, or Barthel form immediately returns an updated risk panel reflecting the new scores |
| Drug interaction detection | A patient with two or more active medications known to interact triggers the amber warning banner |
| Caregiver burnout analysis | The AI auto-assign feature consistently proposes the caregiver with the lowest composite workload score |
| Messaging urgency classification | A message containing a flagged keyword is sorted above routine conversations with an URGENT or HIGH badge |
| Notification priority ordering | ML risk and crisis notifications consistently appear above routine appointment and community notifications |
| Care plan generation | Generating a care plan for a patient produces goals, checklist items, and interventions appropriate to the diagnosis entered |
| Legacy delivery | Content is inaccessible to a designated heir until the patient's legacy is activated, and is then filtered by access level |
| Offline write queuing | A vital sign logged while offline is queued locally and successfully synchronised once connectivity is restored |

5.6 Evaluation Against the Objectives of the Study

Section 1.3 set out one main objective and three specific objectives against which the completed system can now be assessed directly. Table 5.4 summarises this assessment, and the paragraphs that follow discuss each specific objective in turn.

Table 5.4: Achievement of the specific objectives set out in Chapter One

| Specific objective | Status and evidence |
|---|---|
| 1. Real-time symptom tracking, medication management, and scheduling | Met. Implemented by the data input layer described in Section 4.3 and verified as functional in Section 5.5, including offline capture for low-connectivity settings |
| 2. Explainable AI risk prediction using SHAP-based models | Met, with one justified deviation. Implemented using eight XGBoost classifiers rather than the Random Forest classifier proposed in Section 1.4, adopted specifically because XGBoost is directly compatible with the exact SHAP TreeExplainer described in Section 3.6 |
| 3. Unified, secure, privacy-respecting platform with bereavement support | Met at the level of a working prototype. The Unified Care Dashboard and Continuity Bridge are implemented and functionally verified; role based and consent based access control are enforced as described in Section 4.9; usability by real users has not yet been evaluated |

The first specific objective, an intelligent system enabling real time symptom tracking, medication management, and clinical scheduling, is met by the data input layer and the notification and alert machinery described in Chapter Four, and its functioning was directly confirmed in Table 5.3. The second specific objective, the incorporation of explainable artificial intelligence techniques so that clinicians can act on risk predictions with confidence, is met, and the results in Section 5.4 give a first, honestly qualified, indication of how well the underlying models perform, while the choice of XGBoost over the Random Forest classifier originally proposed in Chapter One is recorded here as a deliberate refinement made during the design phase described in Section 3.3.2 rather than a departure from the objective, since both are tree based ensemble methods and the substitution was made specifically to guarantee that every prediction carries an exact, rather than approximated, Shapley value explanation. The third specific objective, a single user friendly platform improving coordination among patients, caregivers, and clinicians, incorporating structured bereavement support, and ensuring data privacy and security, is met at the level the scope of the study in Section 1.5 anticipated, namely a tested software prototype rather than a clinically deployed system; the coordination, bereavement, and security features it specifies are each implemented and functionally verified, but the word user friendly implies an ease of use claim that, in the absence of the user study identified as a gap in Section 5.8, rests on design intent rather than on measured usability evidence.

5.7 Discussion of Results

Read together, the results in this chapter support the conclusion that the four functional pillars set out in Chapter Three directly close the gaps identified in the literature review in Chapter Two. The fragmentation of clinical, coordination, and family facing tools into separate products, documented in Section 2.2.1, is addressed by the single Unified Care Dashboard verified in Section 5.5; the opacity of existing risk prediction tools, documented in Section 2.2.4, is addressed by pairing every one of the eight XGBoost predictions with a genuine SHAP explanation, verified functionally in Table 5.3 and evaluated statistically in Section 5.4; and the almost total absence of structured bereavement support in existing platforms, documented in Section 2.2.2, is addressed by the Continuity Bridge, whose grief screening, memory vault, and digital legacy components were each confirmed to function as designed. Read against the Sustainable Development Goals framing offered in Section 1.4, the evidence gathered in this chapter supports the claim that a working artefact contributing to Goals 3 and 9 has been produced; the claim in relation to Goal 10, reduced inequalities, is better understood as a claim about the system's design intent, since no underserved community has yet used the system in practice.

At the same time, the honesty with which the ML results are reported in Section 5.4 is itself a finding of some significance for a project situated in a resource constrained setting: it demonstrates that a small team can construct a technically sound, clinically informed explainable AI pipeline without access to a real patient dataset, while being equally clear that this is a necessary first step toward, and not a substitute for, validation on real clinical data before any such system could responsibly be deployed.

5.8 Limitations of the Evaluation

The following limitations apply to the evaluation reported in this chapter and are carried forward as recommendations for further work in the concluding chapter.

- All eight ML models were trained and evaluated exclusively on synthetic data; no validation against real patient records has been performed.

- No formal user study, System Usability Scale assessment, or clinician think-aloud session has been conducted; the UsabilityFeedback infrastructure described in Section 4.6 exists but contains no submitted records at the time of writing.

- No formal accessibility audit using assistive technology such as NVDA or VoiceOver has been carried out, despite the accessibility features described in Section 4.10 being implemented.

- No security penetration test, JWT secret rotation review, or rate limiting audit has been performed beyond the smoke test reported in Section 5.3.

- No load or performance testing has been carried out against computationally expensive endpoints such as the batch ML risk scan.

- No automated unit or regression test suite exists; testing to date has relied on the API smoke test and the manual functional walkthrough reported in this chapter.

- No cross-browser compatibility testing has been performed.

These limitations do not diminish the results reported earlier in this chapter, which demonstrate that a complete, internally coherent, and functionally verified system was built; rather, they mark out precisely the evidence that would need to be gathered before any claim of clinical readiness could responsibly be made.

5.9 Summary

This chapter has reported the results of testing the implementation described in Chapter Four, covering the application programming interface integration check, the held out performance of the eight XGBoost models, and the manual verification of the system's principal runtime flows, before evaluating the completed system directly against the objectives set out in Chapter One. All three specific objectives were found to be met, with the deviation from a Random Forest to an XGBoost classifier for the second objective recorded and justified rather than concealed, and with the limitations of the evaluation, in particular the exclusively synthetic nature of the training data and the absence of any user study, stated plainly rather than allowed to inflate the claims made for the system. The following chapter concludes the report by drawing together the contribution of the study and setting out recommendations for the further work this evaluation has identified.

---

REFERENCES

Abbas, Q., Jeong, W., and Lee, S. W. (2025), "Explainable AI in Clinical Decision Support Systems: A Meta-Analysis of Methods, Applications, and Usability Challenges", Healthcare, Vol. 13, No. 17, p. 2154.

Alamri, A., Hassan, M., and Al-Otaibi, S. (2025), "Privacy-Preserving Architectures for Healthcare AI Systems", IEEE Transactions on Medical Informatics, Vol. 12, No. 2, pp. 45 - 59.

Alora Health (2025), Alora Hospice Software, Alora Health. Available at: https://www.alorahealth.com/hospice-software/. Accessed: 13 April 2026.

Alzahrani, A., and Al-Badi, A. (2024), "AI Applications in Healthcare: A Comprehensive Review", Health Informatics Journal, Vol. 30, No. 1, pp. 1 - 22.

Anon. (2024a), "Palliative Care Access and End-of-Life Care in Ghana", COMPASS Ghana, www.compass-gh.org. Accessed: 1 April 2026.

Anon. (2024b), "Palliative Care Development and Situation in Ghana", Ghana Palliative Care Association, www.gpca.org.gh. Accessed: 1 April 2026.

Antoniadi, A. M., Du, Y., Guendouz, Y., Wei, L., Mazo, C., Dwyer, T., and Mooney, C. (2021), "Current Challenges and Future Opportunities for XAI in Clinical Decision Support", Applied Sciences, Vol. 11, No. 11, p. 5088.

Boddaert, M. S., Pereira, C., Adema, J., Vissers, K. C. P., van der Linden, Y. M., Raijmakers, N. J. H., & Fransen, H. P. (2022), "Inappropriate End-of-Life Cancer Care in a Generalist and Specialist Palliative Care Model", BMJ Supportive & Palliative Care, Vol. 12, No. e1, pp. e137 – e145.

CareSmartz360 (2025), CareSmartz360 Home Care Agency Software, CareSmartz360. Available at: https://www.caresmartz.com/. Accessed: 13 April 2026.

Chen, T., and Guestrin, C. (2016), "XGBoost: A Scalable Tree Boosting System", Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, pp. 785 - 794.

Coghlan, S., Loi, M., Ravn, M. N., and Leins, K. (2023), "Vulnerability and Affective Risks in Healthcare Chatbot Systems", AI and Society, Vol. 38, No. 2, pp. 567 - 578.

Finucane, A. M., O'Donnell, H., Lugton, J., Gibson-Watt, T., Swenson, C., and Pagliari, C. (2021), "Digital Health Interventions in Palliative Care: A Systematic Meta-Review", npj Digital Medicine, Vol. 4, p. 64.

Finucane, A., Canny, A., Arcari Mair, A. P., Harrop, E., Selman, L. E., Swash, B., Wakefield, D., and Gillanders, D. (2024), "A Rapid Review of the Evidence for Online Interventions for Bereavement Support", Palliative Medicine, Vol. 39, No. 1, pp. 31 - 52.

Gerke, S., Minssen, T., and Cohen, G. (2020), "Ethical and Legal Challenges of Artificial Intelligence in Healthcare", Artificial Intelligence in Healthcare, pp. 295 - 336.

Gris, G., Ramirez, M., and Sanchez, L. (2023), "Ethical Challenges of AI in Dementia and Palliative Care", Dementia, Vol. 22, No. 3, pp. 499 - 514.

Hevner, A. R., March, S. T., Park, J., and Ram, S. (2004), "Design Science in Information Systems Research", MIS Quarterly, Vol. 28, No. 1, pp. 75 - 105.

Hildt, E. (2025), "Explainability as a Moral Imperative in Medical AI", AI and Ethics, Vol. 5, No. 1, pp. 1 - 11.

Kocaballi, A. B., Berkovsky, S., Quiroz, J. C., Laranjo, L., Tong, H. L., Rezazadegan, D., Briatore, A., and Coiera, E. (2019), "The Personalization of Conversational Agents in Health Care: Systematic Review", Journal of Medical Internet Research, Vol. 21, No. 11, p. e15360.

Lewis, J. (2000), "The Role of Care Coordinators in Continuity of End-of-Life Care", Journal of Palliative Medicine, Vol. 3, No. 2, pp. 201 - 212.

Lundberg, S. M., and Lee, S. I. (2017), "A Unified Approach to Interpreting Model Predictions", Advances in Neural Information Processing Systems, Vol. 30, pp. 4765 - 4774.

Maguraushe, K., and Ndlovu, S. (2024), "Privacy Risks in Smart Technologies Applied to Palliative Care", International Journal of Medical Informatics, Vol. 183, pp. 1 - 10.

National Health Insurance Authority (2025), "NHIS Active Membership Hits 56 Percent Coverage", NHIA Stakeholder Conference, Accra. Available at: https://www.nhis.gov.gh/News/nhis-active-membership-hits-56-percent-coverage--5966. Accessed: 13 April 2026.

Netsmart (2025), Palliative Care EHR Software, Netsmart Technologies. Available at: https://www.ntst.com/post-acute-care/palliative-care-software. Accessed: 13 April 2026.

Parsons, M., Rens, B., and Chen, Y. (2025), "Explainability in Clinical Decision Support Systems: A Systematic Review", Journal of the American Medical Informatics Association, Vol. 32, No. 1, pp. 112 - 126.

Pinto, S., Caldas, A., and Morais, A. (2025), "Artificial Intelligence in Palliative Care Communication and Decision-Making: A Narrative Review", Palliative and Supportive Care, Vol. 23, No. 1, pp. 1 - 14.

Royce, W. W. (1970), "Managing the Development of Large Software Systems", Proceedings of IEEE WESCON, Vol. 26, pp. 1 - 9.

Singer, P. A., Martin, D. K., and Kelner, M. (2016), "Multidisciplinary Continuity and Quality of End-of-Life Care", JAMA, Vol. 315, No. 1, pp. 60 - 70.

Stange, K. C. (2009), "The Problem of Fragmentation and the Need for Integrative Solutions", Annals of Family Medicine, Vol. 7, No. 2, pp. 100 - 103.

Tan, Y., Liang, X., Ming, W., Xing, H., Wang, Y., and Gao, Y. (2024), "A Scoping Review of Digital Technology Applications in Palliative Care", BMC Palliative Care, Vol. 23, p. 290.

Templin, N., Wernecke, K. D., and Walther, C. (2024), "Challenges in Personalised Health AI Deployment", npj Digital Medicine, Vol. 7, No. 1, pp. 1 - 10.

Tilala, M., Reddy, V., and Rao, K. (2024), "Biomedical Ethics and the Design of Healthcare AI Systems", AI in Healthcare, Vol. 9, No. 3, pp. 221 - 234.

United Nations (2015), Transforming Our World: The 2030 Agenda for Sustainable Development, United Nations, New York, 41 pp.

Wang, S. Y., Aldridge, M. D., Gross, C. P., Canavan, M., Cherlin, E., Johnson-Hurzeler, R., and Bradley, E. (2016), "Transitions Between Healthcare Settings of Hospice Enrollees at the End of Life", Journal of the American Geriatrics Society, Vol. 64, No. 2, pp. 314 – 322.

Wang, L., Li, J., and Chen, H. (2023), "Humanistic Ethics in Healthcare AI: Empathy, Relationships, and the Limits of Algorithms", Ethics and Information Technology, Vol. 25, No. 1, pp. 1 - 12.

World Health Organization (2024), Palliative Care: Key Facts, World Health Organization, Geneva. Available at: https://www.who.int/news-room/fact-sheets/detail/palliative-care. Accessed: 10 April 2026.
