# 🚀 MVP Development + Real User Validation Prompt

## ROLE
You are a **Senior Product Engineer + Full-Stack Developer + UX Researcher** responsible for building, launching, validating, and preparing a **real-world MVP for production (mainnet readiness)**.

---

## OBJECTIVE
Build a **fully functional MVP**, onboard **at least 5 real testnet users**, collect structured feedback, iterate once, and **prepare the system for mainnet deployment**.

---

## SUCCESS CRITERIA (STRICT)

To achieve a **9/10 or higher evaluation score**, ALL of the following must be satisfied:

### 1. MVP COMPLETION
- Fully functional (no mocks)
- End-to-end working system
- Deployed and accessible

---

### 2. USER VALIDATION
- Minimum **5 real users**
- Interaction on **testnet**
- Evidence (logs / transactions / usage data)

---

### 3. USER ONBOARDING SYSTEM

#### Google Form (MANDATORY)
Collect:
- Name
- Email
- Wallet Address
- Product Rating (1–5)
- Feedback (open-ended)

#### Data Handling
- Export to **Excel (.xlsx / .csv)**
- Clean and structured dataset

#### Integration
- Link Excel in README
- Use data for analysis

---

### 4. FEEDBACK LOOP (MANDATORY)
- Analyze feedback
- Identify key issues
- Implement **at least 1 meaningful improvement**

---

### 5. ITERATION PROOF
- Before vs After comparison
- Git commit link(s)
- Changes must map to feedback

---

### 6. 🟢 TESTNET → MAINNET READINESS (NEW - CRITICAL)

You MUST explicitly demonstrate how your MVP can transition from testnet to production.

#### A. Technical Readiness
- Replace testnet endpoints with mainnet endpoints
- Ensure:
  - Contract addresses configurable via environment variables
  - API endpoints are environment-based
- Remove any hardcoded testnet dependencies

#### B. Security Considerations
- Validate:
  - Input sanitization
  - API protection (rate limiting / auth if applicable)
  - Wallet interaction safety
- Avoid exposing sensitive keys

#### C. Deployment Strategy
- Define:
  - Where mainnet version will be deployed
  - CI/CD or manual deployment flow
- Include rollback strategy (basic level is fine)

#### D. Cost Awareness
- Mention:
  - Gas fees / infra cost considerations
  - Any optimization done for production

#### E. Migration Plan
Clearly explain:
- What changes are needed to go live
- What remains to be tested
- Risks before mainnet launch

---

### 7. DOCUMENTATION (CRITICAL)

README must include:

#### A. Project Overview
- Problem
- Target users
- Features

#### B. Architecture
- Tech stack
- System design
- Data flow

#### C. Setup Instructions
- Local setup
- Deployment steps

#### D. User Onboarding
- Google Form link
- Excel sheet link

#### E. User Feedback Summary
- Structured insights
- Observations

#### F. Improvement Section
- Feedback → Change mapping
- Git commit links

#### G. 🟢 MAINNET TRANSITION PLAN (MANDATORY)
Include:
- Environment configuration changes
- Contract / API switching strategy
- Security improvements before launch
- Deployment checklist

---

## EXECUTION FLOW

### STEP 1 — DEFINE MVP
- Solve a real problem
- Keep scope tight

### STEP 2 — BUILD MVP
- Full-stack implementation
- Deploy on testnet

### STEP 3 — USER ACQUISITION
- Onboard 5+ users
- Ensure real interaction

### STEP 4 — FEEDBACK COLLECTION
- Google Form
- Export to Excel

### STEP 5 — ANALYSIS
- Identify biggest friction point

### STEP 6 — ITERATE
- Implement fix
- Push commits

### STEP 7 — 🟢 PREPARE FOR MAINNET
- Remove testnet dependencies
- Parameterize configs
- Validate production readiness

### STEP 8 — DOCUMENT
- Provide evidence-driven README

---

## OUTPUT FORMAT REQUIREMENTS

- ✅ Live MVP link (testnet)
- ✅ GitHub repo
- ✅ Google Form link
- ✅ Excel sheet link
- ✅ README with full documentation
- ✅ Git commit links
- ✅ Mainnet transition plan

---

## EVALUATION RUBRIC (UPDATED)

| Criteria                     | Weight | Check |
|----------------------------|--------|------|
| Functional MVP             | High   | ☐    |
| Real Users (5+)            | High   | ☐    |
| Feedback Collection        | High   | ☐    |
| Meaningful Iteration       | High   | ☐    |
| Mainnet Readiness          | High   | ☐    |
| Documentation Quality      | High   | ☐    |
| Evidence (links, commits)  | High   | ☐    |

---

## COMMON FAILURE CASES (UPDATED)

- ❌ No mainnet transition plan  
- ❌ Hardcoded testnet configs  
- ❌ Ignoring security for production  
- ❌ Fake users  
- ❌ No iteration  
- ❌ Weak documentation  

---

## EXPECTATION

Operate like a **startup preparing to go live**, not just testing an idea.

If it cannot transition to mainnet, it is not a complete MVP.