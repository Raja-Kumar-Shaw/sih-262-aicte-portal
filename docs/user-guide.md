# User Guide & Operations Handbook
**System:** AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System  
**Prepared for:** Institutional Applicants, Scrutiny Officers, Administrators & Auditors  
**Version:** 1.0.0  

---

## 1. Quick Start for Evaluators

The system runs as an **Integrated Unified Full-Stack Application** on a single port (`http://localhost:5000`).

### 1-Click Demo Persona Switcher
Evaluators can explore the platform from all 4 stakeholder perspectives without logging out:
1. Look at the top navigation header on any page.
2. Click the **"Switch Role"** button (or **"Explore Demo Personas"** on the home page).
3. Select any of the 4 seeded personas to instantly switch permissions, accessible dashboards, and action controls.

| Role | Seed Account | Name & Designation | Sample Scenarios to Test |
|---|---|---|---|
| **Institution Applicant** | `dtu_registrar` | Prof. Rajesh K. Pathak (Registrar, DTU) | Create application draft, upload certificates, review preliminary OCR findings, respond to clarification notices. |
| **Institution Applicant (2)** | `coep_director` | Dr. Sunita Deshmukh (Principal, COEP) | View intake increase application `APP-102-COEP` with active clarification request for Fire Safety renewal. |
| **Scrutiny Officer** | `officer_sharma` | Dr. Alok Sharma (Prof., IIT Roorkee / Northern Committee) | Open assigned dossier, review evidence, execute APH checks, sign a Reviewer Override with mandatory justification, issue clarification. |
| **Administrator** | `aicte_admin` | Er. Vivek Rastogi (Director, Approval Bureau HQ) | Bureau-wide dashboard, reviewer allocation, regional bottleneck detection, SLA threshold tuning, record final statutory decision (`APPROVED` / `REJECTED`). |
| **Vigilance Auditor** | `cvc_auditor` | Smt. Vandana Saxena (Chief Compliance Auditor, MoE / CVC) | Read-only oversight, inspect reviewer overrides and justifications, verify cryptographic SHA-256 audit chain across all blocks. |

*Default Password for all seeded accounts:* `password123`

---

## 2. Walkthrough of Evaluator Journeys

### Journey A — Institution Application Creation & Scrutiny
1. Switch to **Prof. Rajesh K. Pathak** (`dtu_registrar`).
2. Click **"New Application"** in the top navigation bar.
3. **Step 1:** Select application category (e.g. *Extension of Approval* or *Increase in Intake*) and academic year cycle (2025–26).
4. **Step 2:** Verify institutional parameters (Permanent Institute ID `1-10974531201`, Land Area 164 Acres, Trust details).
5. **Step 3:** Review or add academic programmes (discipline, UG/PG, intake capacity, faculty count).
6. **Step 4:** Upload statutory certificates (`.pdf`, `.png`, `.jpg`). The system automatically performs text parsing and field extraction upon upload.
7. **Step 5:** Review statutory declarations for Fire Safety, Land Ownership, and Anti-Ragging.
8. Click **"Submit Formal Application"**. The system assigns a unique reference number (e.g. `AICTE/2025-26/APP-XXXXX`), automatically runs the APH preliminary scrutiny rules engine, locks the dossier against unauthorized edits, and records the event in the audit ledger.

---

### Journey B — Scrutiny Officer Inspection & Reviewer Override
1. Switch to **Dr. Alok Sharma** (`officer_sharma`).
2. Navigate to **"Reviewer Desk"** or open application `AICTE/2025-26/APP-101-DTU` from the Applications list.
3. Inspect the **Overview** tab: Review the AI-generated preliminary scrutiny summary and institutional parameters.
4. Switch to the **Documents & Extraction** tab: Inspect the extracted token values (Land Area, Fire NOC Expiry, Municipal Sanction, Aadhaar Verification %) alongside expected regulatory norms.
5. Switch to the **Compliance Findings** tab: Observe the deterministic evaluation against AICTE Approval Process Handbook (APH 2024–27) clauses:
   - `CR-DOC-PRESENCE`: Mandatory 8 statutory documents.
   - `CR-FIRE-NOC`: Fire & Life Safety validity extending through academic year.
   - `CR-LAND-REQ`: Contiguous land norms (Urban $\ge$ 2.5 Acres).
   - `CR-FAC-RATIO`: Cadre ratio 1:15 or 1:20 teacher-to-student norm.
   - `CR-BLDG-OCC`: Permanent municipal occupancy approval.
6. **Execute Reviewer Override:**
   - Locate finding `CR-BLDG-OCC` (or any deficiency).
   - Click **"Reviewer Override"**.
   - Select disposition: *Accept with Exception / Executive Waiver*.
   - Enter mandatory justification (minimum 15 characters, e.g.: *"State DTE order #782 granted operational extension; building safety equipment verified on site."*).
   - Click **"Confirm & Sign Override"**.
   - The finding immediately updates with the signed reviewer disposition badge, and the override is sealed in the SHA-256 ledger.

---

### Journey C — Clarification Notice & Institutional Response
1. While viewing an application under scrutiny (e.g. `APP-101-DTU`), click **"Request Clarification"**.
2. Enter the official committee query (e.g. *"Please submit updated structural stability sign-off for Academic Block C"*) and select an SLA window (7 days).
3. Submit the notice. The application transitions to `CLARIFICATION_REQUESTED`.
4. Switch role to **Institution Applicant** (`dtu_registrar`).
5. Notice the new alert in the Alerts center. Open the application dossier.
6. Click **"Respond to Clarification Notice"** on the Clarifications tab.
7. Enter the institutional response remarks and submit. The application advances to `CLARIFICATION_SUBMITTED` for committee re-scrutiny.

---

### Journey D — Administrator Allocation, SLA Tuning & Final Decision
1. Switch to **Er. Vivek Rastogi** (`aicte_admin`).
2. Go to **"Reviewer Desk"**:
   - Inspect the **Unassigned Pool** queue.
   - Click **"Assign / Reassign"** on an unassigned application (e.g. `APP-103-RVCE`) and allocate to Dr. Meenakshi Iyer.
3. Go to **"Approval Analytics"**:
   - Review the application stage funnel and regional distribution charts.
   - Inspect the **Bottleneck Detection** section identifying high-dwell stages.
   - Scroll to **Administrative SLA & Deadline Threshold Configurations**: Click **"Modify Threshold"** on `SLA_SCRUTINY_OFFICER_DAYS` and update the value (e.g., from 7 to 5 days). Observe that overdue flags across the portal recalculate immediately!
4. Open any application ready for determination (e.g. `APP-101-DTU` or `APP-104-VJTI`).
5. Click **"Record Final Statutory Decision"**. Select **APPROVED** or **REJECTED**, enter the official statutory order remarks, and submit. The formal approval is recorded and sealed in the audit trail.

---

### Journey E — Auditor Vigilance & Cryptographic Verification
1. Switch to **Smt. Vandana Saxena** (`cvc_auditor`).
2. Go to **"Audit Ledger (SHA-256)"**:
   - Inspect the append-only ledger displaying all sequential blocks, actor IDs, actions, entity IDs, timestamps, and previous/current block digests.
   - Inspect the reviewer override entry recorded in Journey B to view the preserved automated finding alongside the officer's signed justification.
3. Click the prominent button: **"Verify Audit Chain Integrity"**.
4. Observe the green confirmation banner:
   > *"Audit chain cryptographically verified across all 32 blocks with zero tampering."*
   The system displays the Genesis block hash and the latest block hash.
5. Attempting to record decisions or modify workflows as an Auditor is blocked by backend RBAC guards.

---

### Journey F — Robust Error Handling & Guardrails
- **Incomplete Submission:** Creating an application and submitting without mandatory certificates results in an explicit error: *"Cannot submit application: Mandatory documents missing (LAND_TITLE_DEED, FIRE_SAFETY_NOC, BUILDING_OCCUPANCY_CERTIFICATE)"*.
- **Invalid Workflow Stage Transitions:** Attempting an illegal transition (e.g. jumping directly from `DRAFT` to `APPROVED`) is rejected with a descriptive state machine error.
- **Unsupported File Uploads:** Uploading files with disallowed extensions (e.g. `.exe`, `.sh`) is immediately rejected by MIME and extension validation.
- **Unauthorized Actions:** Non-administrators attempting to record final approval decisions receive HTTP 403 Forbidden.
