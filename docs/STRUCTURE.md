# SplitChain Project Structure

This document provides a complete breakdown of every folder and file in the SplitChain repository.

---

## Top-Level Layout

```
splitchain/
├── contract/                  # Soroban smart contract (Rust)
├── frontend/                  # React + TypeScript UI
├── docs/                      # Project documentation
├── .gitignore                 # Git ignore rules
├── CONTRIBUTING.md            # Contribution guide
├── LICENSE                    # MIT License
└── README.md                  # Project overview
```

---

## Contract

```
contract/
└── splitchain-stellar/
    ├── Cargo.toml             # Workspace manifest (defines members, shared deps, release profiles)
    └── contracts/
        └── splitchain/
            ├── Cargo.toml     # Contract package manifest
            └── src/
                ├── lib.rs     # Contract implementation
                └── test.rs    # Unit tests
```

### Key Files

#### `contract/splitchain-stellar/Cargo.toml`

The workspace manifest. Defines:
- `members = ["contracts/splitchain"]` — the contract crate
- `soroban-sdk` version (pinned to `22.0.0`)
- Release profile settings: `opt-level = "z"`, `lto = true`, `panic = "abort"` — optimized for minimal WASM size

#### `contract/splitchain-stellar/contracts/splitchain/Cargo.toml`

The contract crate manifest. Sets `crate-type = ["cdylib"]` which is required for WASM compilation.

#### `contract/splitchain-stellar/contracts/splitchain/src/lib.rs`

The main contract file. Contains:
- `DataKey` enum — storage key definitions
- `GroupData` struct — group membership data
- `Expense` struct — expense record type (used for future history tracking)
- `SplitChain` contract struct
- `SplitChainImpl` — all public contract methods

#### `contract/splitchain-stellar/contracts/splitchain/src/test.rs`

Unit tests using `soroban-sdk`'s test utilities. Contains:
- `test_create_group_and_add_expense` — verifies balance calculation after an expense
- `test_settle` — verifies balance reconciliation after settlement

---

## Frontend

```
frontend/
└── splitchain-ui/
    ├── index.html             # HTML entry point
    ├── vite.config.ts         # Vite build configuration
    ├── tsconfig.json          # TypeScript compiler options
    ├── package.json           # Node dependencies and scripts
    ├── .env.example           # Environment variable template
    └── src/
        ├── main.tsx           # React app entry point
        ├── App.tsx            # Root component + navigation state
        ├── index.css          # Global styles
        ├── types.ts           # Shared TypeScript types
        ├── lib/
        │   └── contract.ts    # Soroban RPC helpers and constants
        └── pages/
            ├── CreateGroup.tsx   # Create a new expense group
            ├── AddExpense.tsx    # Record a new expense
            ├── Balances.tsx      # View net balances for a group
            └── Settle.tsx        # Record a settlement payment
```

### Key Files

#### `src/main.tsx`

Bootstraps the React application. Mounts `<App />` into the `#root` div.

#### `src/App.tsx`

Root component. Manages two pieces of state:
- `page` — which page is currently visible (`"create" | "expense" | "balances" | "settle"`)
- `group` — the currently active group (`Group | null`)

Renders the navigation bar and the active page component.

#### `src/types.ts`

Shared TypeScript interfaces:
- `Group` — `{ id: string, members: string[] }`
- `Expense` — `{ payer: string, amount: number, description: string }`
- `Balances` — `Record<string, number>`

#### `src/lib/contract.ts`

Centralizes all Soroban configuration:
- `NETWORK_PASSPHRASE` — Stellar network passphrase
- `RPC_URL` — Soroban RPC endpoint
- `CONTRACT_ID` — read from `VITE_CONTRACT_ID` env var
- `getRpc()` — returns a configured `StellarSdk.rpc.Server`
- `toStroops(xlm)` — converts XLM to stroops for contract calls
- `fromStroops(stroops)` — converts stroops to XLM for display

#### `src/pages/CreateGroup.tsx`

Form for creating a new group. Collects:
- Group ID (short string, becomes a Soroban `Symbol`)
- Member addresses (Stellar public keys, `G...`)

On submit, calls `contract.create_group()` and passes the created group up to `App.tsx`.

#### `src/pages/AddExpense.tsx`

Form for recording an expense. Collects:
- Payer (selected from group members)
- Amount in XLM
- Description

On submit, calls `contract.add_expense()` with the payer's auth.

#### `src/pages/Balances.tsx`

Displays the current net balance for each group member. On "Fetch Balances", calls `contract.get_balances()` and renders a color-coded table:
- Green = owed money
- Red = owes money
- Neutral = settled

#### `src/pages/Settle.tsx`

Form for recording a settlement. Collects:
- From (debtor, selected from group members)
- To (creditor, selected from group members)
- Amount in XLM

On submit, calls `contract.settle()` with the debtor's auth.

---

## Docs

```
docs/
├── API.md           # Full contract and frontend API reference
├── ARCHITECTURE.md  # System design and data flow
├── DEPLOYMENT.md    # Step-by-step deploy guide
├── SECURITY.md      # Security model and vulnerability disclosure
├── STRUCTURE.md     # This file
└── TESTING.md       # Testing strategy and how to run tests
```

---

## Root Files

### `.gitignore`

Covers:
- `target/` — Rust build artifacts (large, regenerated by `cargo build`)
- `node_modules/` — Node dependencies
- `dist/` — Frontend build output
- `.env` and `.env.*` — Environment files containing secrets (`.env.example` is kept)
- `.soroban/` — Soroban CLI local state
- `*.wasm` — Compiled contract binaries (regenerated by `soroban contract build`)
- OS and editor files (`.DS_Store`, `.idea/`, `.vscode/`)

### `CONTRIBUTING.md`

Full guide for contributors covering setup, branch naming, commit conventions, PR process, and contribution guidelines for each part of the project.

### `LICENSE`

MIT License. SplitChain is free and open source software.

### `README.md`

Project overview, feature table, quick start guide, contract API summary, and links to all documentation.
