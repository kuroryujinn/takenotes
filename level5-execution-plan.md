# Level 5 Full Execution Plan (Including Real Users and Evidence)

## Goal

Deliver a fully functional testnet MVP, validate with at least 5 real users, implement one feedback-driven improvement, and provide production/mainnet transition readiness with verifiable evidence.

## Scope and Success Gates

This plan is complete only when all gates below are met:

- Gate A: Functional MVP is live and testnet-usable end to end.
- Gate B: At least 5 real users submit and perform real wallet interactions.
- Gate C: Google Form data is exported, cleaned, and analyzed.
- Gate D: At least one meaningful feedback-driven change is shipped.
- Gate E: Before and after comparison plus commit links are documented.
- Gate F: Mainnet transition plan is documented with security, deployment, rollback, and cost notes.

## Workstreams

## 1. MVP Completion Workstream

Tasks:

- Confirm deployed frontend and contract are reachable and healthy.
- Run smoke flow: connect wallet, create note, update note, delete note.
- Record reproducible testnet transaction references.

Artifacts:

- Updated deployment section in README.
- Smoke test log in docs.

Acceptance:

- No mocked behavior in production flow.
- At least one successful end-to-end run from a fresh wallet session.

## 2. Real User Validation Workstream (Mandatory)

Tasks:

- Recruit 5 to 8 real test users (buffer above minimum 5).
- Share onboarding steps and testnet usage script.
- Require each user to complete at least one on-chain action.

Artifacts:

- docs/user-validation.csv with columns:
  - user_alias
  - wallet_address
  - action_performed
  - tx_hash
  - timestamp_utc

Acceptance:

- Minimum 5 unique wallet addresses.
- Minimum 5 valid testnet transactions linked to those wallets.

## 3. Onboarding and Feedback Collection Workstream (Mandatory)

Tasks:

- Create Google Form with required fields:
  - Name
  - Email
  - Wallet Address
  - Product Rating (1 to 5)
  - Open feedback
- Share form after the user interaction step.
- Export responses as CSV/XLSX.
- Clean data and remove duplicates/noise.

Artifacts:

- README links:
  - Google Form link
  - Exported sheet link
- docs/feedback-clean.csv
- docs/feedback-raw.xlsx

Acceptance:

- At least 5 valid response rows from real users.
- One cleaned dataset and one raw export snapshot.

## 4. Feedback Analysis and Iteration Workstream (Mandatory)

Tasks:

- Cluster qualitative feedback into themes.
- Rank themes by severity x frequency.
- Pick one highest-impact issue.
- Ship one meaningful fix mapped directly to that issue.

Artifacts:

- docs/feedback-analysis.md with:
  - pain points
  - prioritization method
  - selected improvement rationale
- README section mapping feedback to shipped changes.

Acceptance:

- One shipped improvement clearly tied to a real reported issue.

## 5. Iteration Proof Workstream (Mandatory)

Tasks:

- Capture before and after behavior.
- Link implementation commit(s).
- Show exactly which feedback item triggered which code change.

Artifacts:

- README improvement section including:
  - before vs after table
  - commit links
  - feedback to change mapping

Acceptance:

- Reviewer can trace user feedback to exact commit and behavior difference.

## 6. Mainnet Transition Readiness Workstream (Mandatory)

### 6A Technical readiness

Tasks:

- Ensure contract IDs, RPC URLs, and network passphrase are environment-based.
- Ensure no hardcoded testnet-only dependencies remain.
- Validate startup behavior for missing required mainnet env values.

Acceptance:

- Mainnet switch requires env-only changes, no code edits.

### 6B Security readiness

Tasks:

- Keep wallet key handling external to app (Freighter signing only).
- Keep input sanitization and field bounds enforced.
- Ensure no sensitive token leakage in repository or frontend bundle.
- If backend/API is added, add rate limiting and auth guard.

Acceptance:

- No critical key/secrets exposure findings in code review.

### 6C Deployment and rollback strategy

Tasks:

- Define deployment target for production frontend.
- Define release method (manual checklist or CI/CD).
- Define rollback steps for:
  - frontend artifact rollback
  - env variable rollback
  - contract ID rollback pointer

Acceptance:

- Rollback can be executed in less than 30 minutes via documented runbook.

### 6D Cost awareness

Tasks:

- Estimate typical gas usage per create, update, delete.
- Estimate monthly infra costs (RPC/IPFS hosting/tooling).
- Note optimization actions already done and future candidates.

Acceptance:

- Cost table available in README with assumptions.

### 6E Migration risk plan

Tasks:

- List remaining risks before mainnet launch.
- Define mitigation and owner for each risk.
- Define final go/no-go checklist.

Acceptance:

- A reviewer can determine launch readiness from checklist alone.

## 7. Documentation Completion Workstream

README must include:

- Project overview: problem, users, features.
- Architecture: stack and data flow.
- Setup: local and deployment instructions.
- User onboarding links: form and sheet.
- Feedback summary and insights.
- Improvement mapping and commit links.
- Mainnet transition plan and checklist.

Acceptance:

- External reviewer can validate all claims using links and artifacts.

## 8. Testing and Verification Workstream

Tasks:

- Run frontend unit tests.
- Run contract tests.
- Run e2e wallet/IPFS flows on testnet.
- Archive test results and timestamps.

Artifacts:

- test-results/ outputs
- docs/verification-log.md

Acceptance:

- All core test suites pass.
- At least one documented real-wallet e2e pass.

## 9. Suggested 10-Day Timeline

Day 1 to 2:

- Final technical hardening and config validation.
- Smoke test deployment.

Day 3:

- Prepare Google Form and onboarding instructions.
- Recruit user cohort.

Day 4 to 6:

- Execute user sessions and capture transaction evidence.
- Collect form responses.

Day 7:

- Export and clean data.
- Analyze friction points.

Day 8:

- Implement one feedback-driven improvement.
- Add tests if behavior changed.

Day 9:

- Prepare before and after proof and commit mapping.
- Finalize mainnet transition runbook and cost table.

Day 10:

- Complete README evidence links.
- Final verification pass and submission.

## 10. Final Submission Checklist

- Live MVP link (testnet)
- Repository link
- Google Form link
- Excel or CSV export link
- README complete with all required sections
- Commit links for iteration proof
- Mainnet transition plan with risks and rollback
