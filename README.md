<div align="center">

# ⛓ SplitChain

**Shared Expense Splitter — On-Chain Splitwise for Stellar**

<img src="https://img.shields.io/badge/Stellar-Soroban-blueviolet" alt="Stellar Soroban" />
<img src="https://img.shields.io/badge/Language-Rust-orange" alt="Rust" />
<img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue" alt="React TypeScript" />
<img src="https://img.shields.io/badge/Network-Testnet-green" alt="Testnet" />
<img src="https://img.shields.io/badge/License-MIT-lightgrey" alt="MIT License" />

*Track shared expenses. Calculate balances automatically. Settle debts in one click using XLM.*

</div>

---

## 🧩 What is SplitChain?

SplitChain is a **decentralized expense-splitting and settlement system** built on the [Stellar](https://stellar.org) blockchain using [Soroban](https://soroban.stellar.org) smart contracts.

Apps like Splitwise are great — but they are centralized, opaque, and disconnected from actual payments. SplitChain fixes that.

> Think of it as **"Splitwise on-chain"** — transparent, trustless, and settled directly in XLM.

**Who is it for?**
- 🏠 Roommates splitting rent and utilities
- 🎒 Friends on trips tracking shared costs
- 👥 Teams managing shared project expenses
- 🏢 Small organizations handling group budgets

---

## ✨ Features

| Feature | Description |
| --- | --- |
| **Create Groups** | Spin up a named expense group with any number of Stellar addresses |
| **Add Expenses** | Record who paid, how much, and what for — split equally among all members |
| **Auto Balances** | Contract calculates net balances automatically (positive = owed, negative = owes) |
| **One-Click Settle** | Members settle debts directly through the contract using XLM |
| **On-Chain Transparency** | Every expense and settlement is recorded immutably on Stellar |
| **Open API** | Other apps can plug into SplitChain's split logic as a base library |

---

## 🏗️ Architecture Overview

SplitChain is composed of two main parts:

```
splitchain/
├── contract/
│   └── splitchain-stellar/           # Soroban smart contract (Rust)
│       └── contracts/splitchain/
│           └── src/
│               ├── lib.rs            # Core contract logic
│               └── test.rs           # Unit tests
└── frontend/
    └── splitchain-ui/                # React + TypeScript UI (Vite)
        └── src/
            ├── pages/                # CreateGroup, AddExpense, Balances, Settle
            ├── lib/
            │   └── contract.ts       # Soroban RPC helpers
            ├── types.ts
            └── main.tsx
```

For a deep dive into system design, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
For full folder breakdown, see [docs/STRUCTURE.md](docs/STRUCTURE.md).

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Install |
| --- | --- | --- |
| Rust | 1.70+ | [rustup.rs](https://rustup.rs) |
| wasm32 target | — | `rustup target add wasm32-unknown-unknown` |
| Soroban CLI | latest | `cargo install --locked stellar-cli` |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Freighter Wallet | latest | [freighter.app](https://freighter.app) |

---

### 1. Clone the Repository

```bash
git clone https://github.com/ChainOrganization/Splitter.git
cd splitchain
```

---

### 2. Smart Contract

```bash
cd contract/splitchain-stellar

# Build the contract
soroban contract build

# Run unit tests
cargo test

# Deploy to Stellar testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/splitchain.wasm \
  --network testnet \
  --source <your-identity>
```

Copy the deployed contract ID — you will need it for the frontend.

For full deployment instructions including identity setup and network config, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

### 3. Frontend

```bash
cd frontend/splitchain-ui

# Copy environment template
cp .env.example .env
# Edit .env and set VITE_CONTRACT_ID to your deployed contract address

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` to view the app.

---

## 📜 Contract API

### Methods

| Method | Parameters | Description |
| --- | --- | --- |
| `create_group` | `group_id: Symbol, members: Vec<Address>` | Create a new expense group |
| `add_expense` | `group_id, payer: Address, amount: i128, description: Symbol` | Record an expense, split equally |
| `settle` | `group_id, from: Address, to: Address, amount: i128` | Record a settlement between two members |
| `get_balances` | `group_id: Symbol` | Returns net balance map for all members |
| `get_members` | `group_id: Symbol` | Returns the member list for a group |
| `expense_count` | `group_id: Symbol` | Returns total number of expenses recorded |

### Balance Semantics

- **Positive balance** → member is owed money by the group
- **Negative balance** → member owes money to the group
- **Zero** → fully settled

Full API reference: [docs/API.md](docs/API.md)

---

## 🧪 Testing

```bash
# Smart contract unit tests
cd contract/splitchain-stellar
cargo test

# Frontend (after setup)
cd frontend/splitchain-ui
npm test
```

SplitChain's test suite covers:
- Group creation and member validation
- Expense recording and equal-split balance calculation
- Settlement logic and balance reconciliation
- Auth enforcement (`require_auth`)

Full testing guide: [docs/TESTING.md](docs/TESTING.md)

---

## 🔒 Security

SplitChain is built with security-first principles:

- All state-mutating functions require `require_auth()` from the relevant signer
- Balances are validated before settlement to prevent over-settlement
- Rust's memory safety eliminates entire classes of vulnerabilities
- Soroban's sandboxed host environment minimizes attack surface

Please read our full policy: [docs/SECURITY.md](docs/SECURITY.md)

---

## 🤝 Contributing

We welcome contributions of all kinds — bug fixes, new features, documentation improvements, and more.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and write tests
4. Open a pull request with a clear description

Read the full guide: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📚 Documentation

| Document | Description |
| --- | --- |
| [API.md](docs/API.md) | Full contract and frontend API reference |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Step-by-step deploy guide (testnet + mainnet) |
| [SECURITY.md](docs/SECURITY.md) | Security model and vulnerability disclosure |
| [STRUCTURE.md](docs/STRUCTURE.md) | Full project folder breakdown |
| [TESTING.md](docs/TESTING.md) | Testing strategy and how to run tests |

---

## 📄 License

SplitChain is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
