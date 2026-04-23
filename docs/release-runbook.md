# Release and Rollback Runbook

## Release Preconditions

- CI workflow green for latest commit.
- Frontend tests pass locally and in CI.
- Contract tests pass.
- Environment values verified for target network.

## Manual Release Steps

1. Build contracts.
2. Deploy contracts to target network.
3. Update frontend environment variables:
   - REACT_APP_STELLAR_NETWORK
   - REACT_APP_SOROBAN_RPC_URL
   - REACT_APP_NETWORK_PASSPHRASE
   - REACT_APP_CONTRACT_ID
   - REACT_APP_LOGGER_CONTRACT_ID
4. Build frontend artifact.
5. Deploy frontend artifact.
6. Run smoke test:
   - wallet connect
   - create note
   - update note
   - delete note

## Rollback Steps

1. Redeploy previous known-good frontend artifact.
2. Restore previous environment variable values.
3. Point frontend to previous known-good contract IDs.
4. Re-run smoke test to confirm recovery.

## Rollback Target

- Recovery objective: under 30 minutes.
- Recovery validation: one successful end-to-end note CRUD flow.
