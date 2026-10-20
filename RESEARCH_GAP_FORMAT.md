# 📚 Research Gap & Literature Review Analysis

## Paper Reference
**Title:** Fees Management System  
**Authors:** Deepadharshini G., Keerthika R., Saranya S., Kavipriya S., and Siva Ganga E. (Assistant Professor)  
**Publication:** *International Journal of Research Publication and Reviews (IJRPR)*, Vol. 4, No. 4, pp. 2780–2781, April 2023. ISSN: 2582-7421.

---

## 1. Literature Review Summary
Deepadharshini et al. (2023) developed a computerized fee management system designed to overcome the vulnerabilities and administrative overheads of manual register-based fee collection in educational institutions. A core objective was to eliminate student fee misappropriation (students taking money from parents but failing to deposit it with the college). The system architecture comprises four primary modules:
1. **Admin Login Module:** Basic role-based credential verification.
2. **Student Registration Module:** Academic and demographic data enrollment.
3. **Manual Fee Entry & Receipt:** Financial clerk input of paid amount, date, and manual receipt generation with balance calculation.
4. **SMS Notification Engine:** Telecommunication SMS dispatch to parents' mobile numbers containing paid amounts and outstanding balances.
The prototype was built on Microsoft Visual Studio (C# / .NET) and MySQL.

---

## 2. Research Gap Identification (Formal Academic Section)

### Section 2.3: Critical Analysis and Research Gap Identification

From the critical analysis of Deepadharshini et al. (2023), the following prominent research gaps (RG) have been identified:

* **RG-1: Absence of End-to-End Digital Payment Gateway (Financial Automation Gap)**  
  *Existing Gap:* The system functions exclusively as an offline record-keeping ledger. It lacks direct digital payment gateway integration (e.g., Razorpay, UPI, Net Banking, Cards).  
  *Impact:* Students/parents must physically visit fee counters with cash, leading to queues and manual data-entry errors.

* **RG-2: Lack of Intelligent Document Processing for Offline Bank Receipts (Verification Gap)**  
  *Existing Gap:* When students deposit fees via bank challans or NEFT/RTGS transfers, the system requires manual human inspection by administrative clerks with zero Computer Vision / Vision-LLM integration.  
  *Impact:* Inability to automatically extract and validate transaction IDs (UTR), amounts, and timestamps, leaving institutions vulnerable to fake or duplicate payment receipts.

* **RG-3: Telecommunication Bottlenecks and Single-Point Alerting Fragility (Notification Gap)**  
  *Existing Gap:* The alerting engine relies strictly on traditional telecom SMS gateways.  
  *Impact:* SMS incurs recurrent carrier costs, strict 160-character limits, and high delivery failure rates due to National Do Not Disturb (DND) regulations. It lacks automated multi-channel event-driven webhook pipelines (e.g., n8n, Brevo SMTP email delivery, and dynamic PDF receipts).

* **RG-4: Vulnerability to Brute-Force Attacks and Deficient Access Control (Security Gap)**  
  *Existing Gap:* Authentication utilizes basic username/password matching without rate limiting, account lockout mechanisms, or OTP-based identity verification.  
  *Impact:* High vulnerability to automated credential stuffing, dictionary attacks, and unauthorized administrative access.

* **RG-5: Absence of Automated Defaulter Cron Scheduling & Dynamic Penalty Computation (Automation Gap)**  
  *Existing Gap:* Identifying defaulters necessitates manual administrative database querying.  
  *Impact:* No autonomous background cron service monitors approaching deadlines, calculates daily late fines dynamically, or schedules multi-stage escalation warnings.

* **RG-6: Lack of Real-Time External Audit Trails & Cloud Synchronization (Data Integrity Gap)**  
  *Existing Gap:* System data is locked inside a local MySQL database without real-time external audit replication.  
  *Impact:* High risk of data loss and lack of live accounting transparency with external audit sheets (e.g., automated Google Sheets webhooks) or cloud PostgreSQL.

---

## 3. Tabular Research Gap Matrix (IEEE / Springer Format)

| Author & Year | Methodology / Architecture | Key Contribution | Identified Research Gap (Limitation) | Proposed Work Resolution |
|---|---|---|---|---|
| **Deepadharshini et al. (2023)** *[IJRPR]* | Visual Studio (.NET) Desktop + MySQL Database | Admin auth, manual fee logging, receipt generation, parent SMS alerts | **1. Absence of Payment Gateway:** Manual cash handling only.<br>**2. No Offline Receipt AI Verification:** Manual clerk scrutiny.<br>**3. Fragile Alerting:** SMS only with high carrier cost & DND drops.<br>**4. Security Weakness:** No brute-force protection or lockout.<br>**5. No Real-time Audit:** Lacks cloud ledger synchronization. | Implemented Razorpay checkout, Gemini 2.5 Flash OCR for automated UTR extraction, n8n + Brevo multi-channel alerts, 15-min account lockout security, and live Google Sheets webhook auditing. |

---

## 4. Problem Formulation & Research Question Statement
> *"In summary, while prior works such as Deepadharshini et al. (2023) successfully addressed basic manual ledger computerized logging and parent notification via SMS, they leave major technological voids in digital payment automation, AI-driven offline verification, multi-channel alerting resilience, and enterprise security hardening. These identified gaps formulate the core research objectives of our proposed system: an intelligent, cloud-native fee defaulter management platform integrating Razorpay, multimodal Gemini 2.5 Flash OCR, n8n-orchestrated notifications, and automated real-time audit logging."*
