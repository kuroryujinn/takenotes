# Level 5 MVP Execution Todo

This checklist maps every requirement in `level5.md` to concrete tasks, implementation status, and evidence location.

Full execution runbook: `level5-execution-plan.md`

## 1) MVP Completion

- [x] End-to-end note create/update/delete flow on Soroban contract
  - Evidence: `contracts/hello-world/src/lib.rs`, `frontend/src/pages/index.tsx`
- [x] Frontend deployed and accessible
  - Evidence: deployment link in `README.md`
- [ ] Confirm no mocked flows remain in production path
  - Action: run smoke test on live deployment with real wallet before final sign-off

## 2) User Validation (5 real users)

- [ ] Recruit minimum 5 real users
- [ ] Capture at least one real testnet interaction per user
- [ ] Store wallet + tx evidence for each user
  - Evidence target: `docs/user-validation.csv` (to be created with real data)

## 3) User Onboarding System

- [ ] Create Google Form with mandatory fields:
  - Name
  - Email
  - Wallet Address
  - Product Rating (1-5)
  - Open feedback
- [ ] Export responses to CSV/XLSX
- [ ] Add Google Form and sheet links to `README.md`
- [ ] Keep cleaned dataset in repository docs folder

## 4) Feedback Loop

- [ ] Analyze responses and cluster top friction points
- [ ] Select one highest-impact issue
- [x] Implement one meaningful improvement
  - Improvement implemented in this pass: stronger input sanitization and field constraints in note creation/update form
  - Evidence: `frontend/src/components/NoteForm.tsx`, `frontend/src/utils/sanitize.ts`

## 5) Iteration Proof

- [ ] Add before/after behavior summary in README
- [ ] Link commit(s) implementing improvement
- [ ] Explicitly map each code change to a user pain point

## 6) Testnet to Mainnet Readiness

### A. Technical readiness

- [x] Contract and RPC configuration environment-driven
  - Evidence: `frontend/src/config/runtimeConfig.ts`
- [x] Remove hardcoded runtime dependency on testnet-only endpoint in services
  - Evidence: `frontend/src/services/contractService.ts`, `frontend/src/services/ipfsService.ts`
- [x] Make network selection configurable (`testnet` or `mainnet`)
- [x] Validate runtime config and fail fast for invalid env combinations
  - Evidence: `frontend/src/config/runtimeConfig.ts`, `frontend/src/config/runtimeConfig.test.ts`

### B. Security considerations

- [x] Client-side input sanitization added (control-char stripping, normalization)
- [x] Input bounds added (title/content/category/tags)
- [x] No private keys stored or exposed; wallet signing handled by Freighter
- [ ] Add backend/API rate limiting if a custom API layer is introduced

### C. Deployment strategy

- [x] Document deployment target and env-driven config in README
- [x] Add CI/CD workflow or documented manual release SOP + rollback runbook
  - Evidence: `.github/workflows/ci.yml`, `docs/release-runbook.md`

### D. Cost awareness

- [ ] Document gas and infrastructure cost estimates in README
- [ ] Add optimization notes from production usage data

### E. Migration plan

- [x] Define config-switch steps and risk checklist in README
- [ ] Validate rollback drill on a staging release

## 7) Documentation

- [x] Expand README with:
  - project overview
  - architecture
  - setup
  - onboarding placeholders
  - feedback/iteration placeholders
  - mainnet transition checklist
- [ ] Add live links for Google Form and exported dataset
- [x] Add in-repo dataset artifact paths
  - Evidence: `docs/user-validation.csv`, `docs/feedback-clean.csv`
- [ ] Add commit links after pushing branch

## 8) Testing Tasks

- [x] Add test coverage for sanitization utility
- [x] Add test coverage for form validation/sanitization behavior
- [x] Add test coverage for runtime network/env configuration
- [ ] Execute and archive e2e results for real wallet + testnet flows
- [x] Add verification log template for timestamped test evidence
  - Evidence: `docs/verification-log.md`

## Blockers Requiring Real-World Execution

- Real user onboarding and feedback cannot be fabricated in-repo.
- Google Form/Sheet links require external account setup.
- Commit links require pushing branch to remote.
- Production readiness sign-off requires live deployment checks.