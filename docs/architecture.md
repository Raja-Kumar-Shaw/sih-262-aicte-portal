# System Architecture & Technical Specifications
**System:** AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System  
**Version:** 1.0.0 (Unified Full-Stack System)  
**Date:** October 2026

---

## 1. Architecture Overview

To fulfill the explicit requirement:
> *"Dont make frontened and backened seperately. Make ui like real aicte website and fill real data as above instruction."*

The platform is designed as an **Integrated Unified Full-Stack Web Application**. Both the API server, database persistence, automated compliance engine, and React frontend live in one unified Node.js/TypeScript codebase.

```
+-------------------------------------------------------------------------------------------------+
|                                    Client Browser (User UI)                                     |
|  - Real AICTE Government Visual Language (Tricolor, Bilingual Banner, GIGW Accessibility)       |
|  - Role-Based Dashboards: Applicant, Scrutiny Officer, AICTE Admin, MoE Auditor                |
|  - 1-Click Interactive Demo Persona Switcher                                                    |
+-------------------------------------------------------------------------------------------------+
                                               |
                                     HTTP / REST API & SPA
                                               |
+-------------------------------------------------------------------------------------------------+
|                                 Unified Full-Stack Server (:5000)                               |
|                                                                                                 |
|   [ Express.js + Vite Engine / Static SPA Delivery ]                                            |
|                                                                                                 |
|   +---------------------------------------------------------------------------------------+     |
|   | API Router & Auth Middleware (/api/*)                                                 |     |
|   | - JWT & Session Auth (Role-Based Access Control)                                      |     |
|   | - Application Lifecycle & State Machine Router                                        |     |
|   +---------------------------------------------------------------------------------------+     |
|                                              |                                                  |
|   +---------------------------------------------------------------------------------------+     |
|   | Core Business Logic & Intelligence Engines                                            |     |
|   | 1. Document Extraction & OCR Simulator (pdf-parse / regex tokenizer)                  |     |
|   | 2. Deterministic AICTE Compliance Engine (APH 2024-27 Clause Validator)               |     |
|   | 3. Evidence-Linked Finding Generator & Explainability Map                             |     |
|   | 4. Human Reviewer Override Gateway (Mandatory Justification Enforcement)              |     |
|   | 5. Deadline & Pendency Intelligence Engine (Configurable SLA & Escalations)           |     |
|   | 6. Cryptographic Audit Chain (SHA-256 Block-Linked Tamper-Evident Ledger)            |     |
|   | 7. Multi-Channel Notification Dispatcher (In-App Alerts & Escalation Ticker)         |     |
|   +---------------------------------------------------------------------------------------+     |
|                                              |                                                  |
|   +---------------------------------------------------------------------------------------+     |
|   | Persistence Layer: SQLite Storage Engine (sqlite3 / file-persisted aicte_portal.db)   |     |
|   | - Users & Roles (Applicant, Officer, Admin, Auditor)                                  |     |
|   | - Institutions & Detailed Academic Profiles                                           |     |
|   | - Applications, Programmes, Document Registry & Extracted Metadata                    |     |
|   | - Compliance Rules, Evidence-Linked Findings, Discrepancy Logs                        |     |
|   | - Workflow Definitions, Stage History & Reassignment Logs                             |     |
|   | - Append-Only Audit Entries with Parent Hash & Block Digest                           |     |
|   +---------------------------------------------------------------------------------------+     |
+-------------------------------------------------------------------------------------------------+
```

---

## 2. Why Single-Stack Architecture?

1. **Host Environment Realities:**
   - The user's system runs Windows with Node.js v24.18.0 and npm 11.16.0.
   - Python is not installed natively (attempts to invoke `python` result in Windows Store redirection).
   - An integrated TypeScript/Node.js stack runs reliably without requiring additional system installs.
2. **Elimination of Cross-Origin & Port Friction:**
   - Separate servers (e.g. Vite on 5173, FastAPI on 8000) frequently hit CORS errors, proxy disconnections, and port conflicts during hackathon evaluations.
   - With a unified Express server serving both the API and client assets, the evaluator runs a single command (`npm start` or `npm run dev`) and opens `http://localhost:5000`.
3. **Seamless Document Processing:**
   - Document upload, text parsing, OCR fallback, and rule evaluation occur locally within the server.

---

## 3. Data Flow & Subsystems

### A. Document Upload & Extraction Pipeline
1. Applicant uploads permitted files (`.pdf`, `.png`, `.jpg`).
2. Server validates MIME type, magic numbers, and size limit (max 10MB).
3. Text is extracted via PDF parser or text tokenizer. Key fields are extracted:
   - Certificate Title, Issuing Authority, Registration / Survey Number
   - Issue Date & Validity / Expiry Date
   - Land Area (in Acres / Sq. Meters)
   - Built-up instructional and administrative carpet area
   - Fire NOC validity duration
4. Status transitions: `Uploaded` -> `Extracted` -> `Validated Against Application Form`.

### B. Deterministic AICTE Compliance Engine
1. Takes the submitted application JSON and all extracted document tokens.
2. Evaluates against statutory rules parameterized from the **AICTE Approval Process Handbook (APH) 2024–2027**:
   - `CR-DOC-PRESENCE`: All mandatory certificates uploaded.
   - `CR-FIRE-NOC`: Fire NOC valid through the upcoming academic year.
   - `CR-LAND-REQ`: Land area meets APH Chapter 7 thresholds (Urban >= 2.5 Acres, Rural >= 7.5 Acres).
   - `CR-FAC-RATIO`: Student-to-Faculty cadre ratio meets 1:15 or 1:20 norm.
   - `CR-BLDG-OCC`: Permanent Occupancy Certificate issued by Municipal / Town Planning Authority.
   - `CR-DISCREPANCY-NAME`: Name on Land Deed / Fire NOC matches registered Trust/Society name.
3. Outputs structured findings with:
   - Rule ID & Regulatory Clause
   - Severity (`Critical`, `High`, `Medium`, `Low`)
   - Automated Finding & Explanatory Reasoning
   - Evidence Citation (Document ID, Page Number, Match Token)
   - Recommended Next Step for Scrutiny Officer

### C. Reviewer Override & Append-Only Cryptographic Audit Trail
1. A Scrutiny Officer can disagree with an automated rule finding (e.g., if a state-specific executive order granted a temporary fire safety extension).
2. The override requires:
   - Original Automated Status (`FAILED`)
   - Overridden Status (`ACCEPTED_WITH_EXCEPTION`)
   - Mandatory Justification (minimum 25 characters)
   - Officer Identity & Timestamp
3. Audit Engine computes a SHA-256 block hash:
   $$\text{Hash}_n = \text{SHA256}(\text{Index}_n + \text{Timestamp}_n + \text{Actor}_n + \text{Action}_n + \text{Payload}_n + \text{Hash}_{n-1})$$
4. Any historical tampering invalidates the hash chain, enabling instant verification by the Auditor persona.

---

## 4. Security & Data Protection Measures
- **RBAC Enforcement:** Enforced at both the Express API routes and the client routing layer.
- **Controlled File Access:** Files are stored locally in `storage/documents` and served only through authenticated routes with access checks.
- **Tamper Resistance:** Application submission freezes draft editing; clarifications open restricted resubmission windows.
- **Zero Real PII:** Seed data uses synthetic, illustrative data modeled after real Indian engineering colleges to maintain privacy and compliance.
