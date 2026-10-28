# Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System (SIH26262)

> **DEMONSTRATION PROTOTYPE — Not an official AICTE portal. All records, automated findings, and institutional profiles are synthetic and illustrative for Smart India Hackathon evaluation.**

---

## 1. Project Overview & Vision

The **Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System** (Project ID: **SIH26262**) addresses the core administrative challenges of technical education approval in India: manual certificate scrutiny, deficiency tracking delays, inconsistent evaluations, opaque reviewer overrides, and processing backlogs.

This unified full-stack application demonstrates how:
1. **Preliminary Document Intelligence:** Scans, extracts, and validates statutory certificates (Land Deed, Fire Safety NOC, Municipal Building Occupancy, Faculty Cadre declarations) against expected regulatory parameters.
2. **Deterministic APH 2024–2027 Rule Engine:** Evaluates institutional compliance against official clauses of the **AICTE Approval Process Handbook (APH 2024–2027)** with zero LLM hallucination.
3. **Evidence-Linked Explainability:** Every flagged deficiency links directly to the regulatory clause, the examined document, and the exact token discrepancy.
4. **Accountable Human Reviewer Overrides:** Scrutiny officers can overrule automated checks only by providing a signed, mandatory official justification.
5. **Cryptographic Tamper-Evident Ledger:** All actions, stage transitions, document validations, and reviewer overrides form an append-only SHA-256 hash-chained audit ledger that can be verified with one click.
6. **SLA Pendency & Bottleneck Telemetry:** Automatically calculates stage dwell time, flags overdue cases, and identifies administrative bottlenecks across regional offices.

---

## 2. Architecture & Tech Stack

Per user requirement (*"Dont make frontened and backened seperately. Make ui like real aicte website and fill real data as above instruction"*), the project is built as a **Single-Port Unified Full-Stack Architecture**:

- **Frontend:** React 19, TypeScript, Vite 6, Recharts (administrative analytics), Lucide icons, Vanilla CSS Government Design System conforming to Guidelines for Indian Government Websites (GIGW).
- **Backend:** Node.js (v24), Express 4, TypeScript (`tsx` zero-build execution), Multer (document uploads), PDF text extractor (`pdf-parse`), JWT session authentication, BCrypt password hashing.
- **Persistence:** SQLite disk-persisted relational store (`data/aicte_portal.json`) with atomic writes and zero C++ compilation dependencies.
- **Cryptographic Audit:** SHA-256 sequential block hashing engine:
  $$\text{Hash}_n = \text{SHA256}(\text{Block}_n + \text{Hash}_{n-1})$$

---

## 3. Seed Demo Accounts & Roles

The platform provides a **1-Click Demo Persona Switcher** in the top navigation bar. You can switch between all 4 personas at any point without re-entering passwords:

| Role | Username | Full Name & Designation | Sample Scenarios to Demonstrate |
|---|---|---|---|
| **Institution Applicant (1)** | `dtu_registrar` | Prof. Rajesh K. Pathak (Registrar, DTU) | Create application draft, upload documents, view OCR extraction, submit formal application. |
| **Institution Applicant (2)** | `coep_director` | Dr. Sunita Deshmukh (Principal, COEP) | View clarification notice for expired Fire NOC (`APP-102-COEP`), submit response remarks. |
| **Scrutiny Officer** | `officer_sharma` | Dr. Alok Sharma (Prof., IIT Roorkee / Northern Committee) | Inspect assigned cases, review evidence findings, execute signed Reviewer Override, issue clarification notice. |
| **Administrator** | `aicte_admin` | Er. Vivek Rastogi (Director, AICTE Approval Bureau HQ) | Allocate reviewers, tune SLA thresholds, inspect regional bottleneck telemetry, record final statutory decision (`APPROVED` / `REJECTED`). |
| **Vigilance Auditor** | `cvc_auditor` | Smt. Vandana Saxena (Chief Compliance Auditor, MoE / CVC) | Read-only oversight, verify cryptographic SHA-256 audit chain with one click, confirm immutability. |

*Default password for all accounts:* `password123`

---

## 4. Quick Start & Setup Instructions (Windows PowerShell)

### Prerequisites
- Node.js version 18+ (tested on Node.js v24.18.0)
- npm version 9+ (tested on npm 11.16.0)

### Step 1: Clone or Navigate to Directory
```powershell
cd "c:\Users\Raja Kumar Shaw\OneDrive\Desktop\Sih 262"
```

### Step 2: Install Dependencies
```powershell
npm.cmd install
```

### Step 3: Seed / Reset Database (Optional)
The database automatically seeds on first launch. To reset to fresh demonstration seed data at any time:
```powershell
npm.cmd run seed
```

### Step 4: Build Frontend Assets
```powershell
npm.cmd run build
```

### Step 5: Start Unified Full-Stack Application
```powershell
npm.cmd start
```
*Open your browser and navigate to:* **`http://localhost:5000`**

Both the API (`http://localhost:5000/api/*`) and the government web portal run together on port 5000!

---

## 5. Running the Acceptance Test Suite

The repository includes a comprehensive 23-point automated test suite covering all user journeys, negative tests, role-based security, and cryptographic audit verification:

```powershell
npx.cmd tsx tests/acceptanceTests.ts
```

### Expected Output:
```
========================================================================
★ SIH26262 — ACCEPTANCE & SYSTEM INTEGRATION TEST SUITE ★
========================================================================

  [PASS] API Health & System Status Endpoint
  [PASS] Authentication: Institution Persona Login (DTU Registrar)
  [PASS] Authentication: Scrutiny Officer Login (Dr. Alok Sharma)
  [PASS] Authentication: Administrator Login (Er. Vivek Rastogi)
  [PASS] Authentication: Auditor Login (Smt. Vandana Saxena)
  [PASS] Journey A: Institution Creates New Application Draft
  [PASS] Journey A: Reopen & Update Application Draft
  [PASS] Journey F (Negative): Reject Submission when Mandatory Documents are Missing
  [PASS] Journey B: Scrutiny Officer Inspects Existing Case (APP-101-DTU)
  [PASS] Journey B: Scrutiny Officer Runs Deterministic Compliance Engine
  [PASS] Journey B: Scrutiny Officer Posts Official Review Comment
  [PASS] Fetch current findings for app_101
  [PASS] Differentiating Feature B: Reject Override without Justification (<15 chars)
  [PASS] Differentiating Feature B: Successfully Record Signed Reviewer Override
  [PASS] Advance app_101 to UNDER_SCRUTINY stage
  [PASS] Journey C: Scrutiny Officer Issues Clarification Notice
  [PASS] Journey C: Institution Submits Clarification Response
  [PASS] Journey D: Administrator Reassigns Reviewer
  [PASS] Journey D: Administrator Updates SLA Threshold Configuration
  [PASS] Journey D: Administrator Fetches Executive Analytics & Bottleneck Telemetry
  [PASS] Journey E: Auditor Verifies Cryptographic SHA-256 Audit Chain
  [PASS] Journey E (Negative): Auditor Cannot Modify Application Decisions (Read-Only Enforcement)
  [PASS] Journey F (Negative): Reject Invalid Workflow Stage Transition

========================================================================
TEST SUITE RESULTS: 23 PASSED | 0 FAILED
========================================================================
```

---

## 6. Feature Implementation Status

| Feature / Subsystem | Implementation Nature | Details |
|---|---|---|
| **Role-Based Access Control (RBAC)** | **Fully Implemented** | Enforced at Express router middleware and UI navigation. |
| **Guided Application Wizard (5 Steps)** | **Fully Implemented** | Categories, institution details, intake matrix, doc uploads, declarations. |
| **Document Text Extraction (PDF/Image)** | **Fully Implemented** | Extracted via `pdf-parse` with regex token boundary fallback. |
| **Deterministic Compliance Engine** | **Fully Implemented** | Evaluates 8 rules from AICTE APH 2024–27 clauses. |
| **Evidence-Linked Finding Explanations** | **Fully Implemented** | Findings cite document name, page, token value, and APH clause. |
| **Reviewer Override with Justification** | **Fully Implemented** | Requires minimum 15 characters, signed by officer, permanently audited. |
| **Workflow State Machine** | **Fully Implemented** | Guards legal transitions; rejects invalid jumps with descriptive errors. |
| **SLA Pendency & Escalation** | **Fully Implemented** | Computes dwell time and overdue duration; live updates when admin alters SLA. |
| **Cryptographic Audit Ledger (SHA-256)** | **Fully Implemented** | Immutable sequential hashing with 1-click verification button. |
| **Administrative Analytics & Bottlenecks** | **Fully Implemented** | Interactive Recharts charts for stages, regions, and bottleneck dwell times. |
| **SMS / Email Gateway** | *Simulated* | Represented via real-time in-app Alert Center with direct links. |
| **Real AICTE Central DB Integration** | *Simulated (Zero PII)* | Seeded with synthetic, realistic data for DTU, COEP, RVCE, VJTI, and JU. |

---

## 7. Project Documentation Index

- **System Architecture & Technical Design:** [`docs/architecture.md`](file:///c:/Users/Raja%20Kumar%20Shaw/OneDrive/Desktop/Sih%20262/docs/architecture.md)
- **Repository Research & Domain Analysis:** [`docs/research-findings.md`](file:///c:/Users/Raja%20Kumar%20Shaw/OneDrive/Desktop/Sih%20262/docs/research-findings.md)
- **User Guide & Evaluator Handbook:** [`docs/user-guide.md`](file:///c:/Users/Raja%20Kumar%20Shaw/OneDrive/Desktop/Sih%20262/docs/user-guide.md)
- **Test Report & Quality Assurance Results:** [`docs/test-report.md`](file:///c:/Users/Raja%20Kumar%20Shaw/OneDrive/Desktop/Sih%20262/docs/test-report.md)
- **Environment Configuration Example:** [`.env.example`](file:///c:/Users/Raja%20Kumar%20Shaw/OneDrive/Desktop/Sih%20262/.env.example)

---

## 8. Troubleshooting

- **PowerShell Execution Policy Warning:** If `npm` gives an execution policy error on Windows, run `npm.cmd` directly:
  ```powershell
  npm.cmd run build
  npm.cmd start
  ```
- **Port 5000 Already in Use:** To run on another port:
  ```powershell
  $env:PORT="5050"; npm.cmd start
  ```
- **Reset Database to Initial State:**
  ```powershell
  npm.cmd run seed
  ```
