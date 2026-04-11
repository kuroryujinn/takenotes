# TakeNotes

TakeNotes is a full-stack Web3 dApp built on Stellar Soroban that lets users create and manage personal notes as on-chain data. Authentication is wallet-based, so each user interacts with notes scoped to their own Stellar address.

This repository contains:

- A Soroban smart contract for note CRUD operations
- A reusable logger contract for event publishing
- A React + TypeScript frontend integrated with Freighter

## Why This Project

Traditional note apps rely on centralized databases and app-owned identity systems. TakeNotes demonstrates a decentralized alternative where:

- ownership is tied to wallet identity,
- write operations are signed by the user,
- and note state is persisted on-chain.

This project is intentionally practical: it is small enough to study end-to-end, but complete enough to show real contract/frontend integration patterns on Soroban.

## Core Features

- Wallet-authenticated note creation, update, deletion, and retrieval
- Per-wallet note isolation using address-scoped storage keys
- Duplicate-ID rejection at contract level
- Timestamps captured from ledger time
- Optional cross-contract logging of note activity
- Backward compatibility support for legacy deployments (`add_note`)

## Architecture

1. User connects Freighter wallet in the frontend.
2. Frontend builds contract invocation transactions.
3. Wallet signs write transactions.
4. Soroban RPC submits and confirms transactions.
5. Contract stores/retrieves notes from instance storage.

High-level flow:

```
React UI -> Freighter -> Soroban RPC -> TakeNotes Contract -> Stellar Testnet
																			\-> Logger Contract (optional)
```

## Repository Structure

```
takenotes/
├─ contracts/
│  ├─ hello-world/        # Main TakeNotes contract
│  └─ logger/             # Event logger contract
├─ frontend/              # React + TypeScript dApp
├─ images/                # Screenshots and docs assets
├─ Cargo.toml             # Workspace configuration
└─ README.md
```

## Smart Contract Design (TakeNotes)

Location: `contracts/hello-world/src/lib.rs`

### Data Model

Each note stores:

- `id: u32`
- `title: String`
- `content: String`
- `timestamp: u64`

Storage uses `DataKey::Notes(Address)` so every wallet has its own note vector.

### Public Functions

- `create_note(user, id, title, content) -> bool`
	- Requires auth
	- Rejects duplicate note IDs
	- Appends a new note and returns `true` on success

- `update_note(user, id, title, content) -> bool`
	- Requires auth
	- Updates existing note by ID

- `delete_note(user, id) -> bool`
	- Requires auth
	- Removes note by ID

- `get_notes(user) -> Vec<Note>`
	- Read-only retrieval for a wallet address

- `set_logger(logger_id)`
	- Configures logger contract address for cross-contract event calls

- `add_note(user, id, text)`
	- Legacy compatibility entrypoint
	- Internally delegates to `create_note` with empty title

## Logger Contract

Location: `contracts/logger/src/lib.rs`

The logger contract publishes events with:

- Topic: `("note_action", sender)`
- Payload: message string (for example, `"Note Created"`)

The TakeNotes contract can call it when logger is configured.

## Frontend Application

Location: `frontend/`

The frontend provides:

- Wallet connection status and reconnect action
- Note creation form with basic client-side validation
- Note list with timestamp rendering and descending order
- Edit mode for updates
- Delete actions with optimistic UI refresh path
- Transaction status/error messaging around wallet approval and chain confirmation

Contract integration is implemented in `frontend/src/services/contractService.ts`.

## Local Development

### 1) Build and test contracts

From `contracts/hello-world`:

```bash
make build
make test
```

### 2) Run frontend

From `frontend`:

```bash
npm install
npm start
```

Create `frontend/.env` (or `.env.local`) with:

```bash
REACT_APP_CONTRACT_ID=<deployed_contract_id>
REACT_APP_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
REACT_APP_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
REACT_APP_IPFS_UPLOAD_URL=https://api.pinata.cloud/pinning/pinJSONToIPFS
REACT_APP_IPFS_UPLOAD_TOKEN=<pinata_jwt>
REACT_APP_IPFS_GATEWAY=https://ipfs.io/ipfs
```

Phase 3 uses client-side encryption in the browser and stores only IPFS CIDs on-chain.

### 3) Production build (frontend)

```bash
npm run build
```

## Testing Status

- Contract unit test exists for CRUD behavior in `contracts/hello-world/src/test.rs`
	- create
	- duplicate create rejection
	- update
	- delete

Frontend currently uses the default CRA/Jest setup and can be extended with integration tests for wallet and contract interaction paths.

## Known Compatibility Notes

- Frontend supports older deployments that only expose `add_note` for note creation.
- Update/delete require modern contract methods (`update_note`, `delete_note`).
- If those methods are missing in a deployed contract, frontend surfaces explicit compatibility errors.

## Deployment References

- Testnet transaction:
	https://stellar.expert/explorer/testnet/tx/1aa57771d0b2c3814ae4bcd823776f86b738213077191162aa51d0f76082855d!
- Testnet contract reference:
	https://lab.stellar.org/r/testnet/contract/CBMLFQ25PGW3LELR24SWC3QFASDM4VTNS74TUAIJV7J3UC3LN2XEZMEQ
- Frontend deployment:
	https://takenotes-delta.vercel.app/

## Screenshots

![Deployment Screenshot](images/deployment.png)
![Frontend Preview](images/frontend-preview.png)

<img width="329" height="736" alt="Mobile preview" src="https://github.com/user-attachments/assets/cb08cd41-6c44-4b7a-9334-37c93e770779" />
