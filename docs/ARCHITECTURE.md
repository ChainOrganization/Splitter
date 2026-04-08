# SplitChain Architecture

This document describes the system design, data flow, and technical decisions behind SplitChain.

---

## Table of Contents

- [Overview](#overview)
- [System Components](#system-components)
- [Smart Contract Design](#smart-contract-design)
  - [Storage Model](#storage-model)
  - [Balance Calculation](#balance-calculation)
  - [Auth Model](#auth-model)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow](#data-flow)
- [Design Decisions](#design-decisions)
- [Future Architecture](#future-architecture)

---

## Overview

SplitChain is a two-layer system:

```
┌─────────────────────────────────────────────────────┐
│                    User Browser                      │
│                                                      │
│   ┌──────────────────────────────────────────────┐  │
│   │         React + TypeScript Frontend          │  │
│   │   (Vite, @stellar/stellar-sdk, Freighter)    │  │
│   └──────────────────┬───────────────────────────┘  │
│                      │ Soroban RPC                   │
└──────────────────────┼──────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │    Stellar Network      │
          │    (Testnet / Mainnet)  │
          │                        │
          │  ┌──────────────────┐  │
          │  │ SplitChain       │  │
          │  │ Soroban Contract │  │
          │  │ (Rust, no_std)   │  │
          │  └──────────────────┘  │
          └────────────────────────┘
```

There is no backend server. All state lives on-chain. The frontend communicates directly with the Stellar network via the Soroban RPC endpoint.

---

## System Components

### 1. Soroban Smart Contract

**Location**: `contract/splitchain-stellar/contracts/splitchain/src/lib.rs`

The contract is the source of truth for all group data, expense records, and balances. It is written in Rust with `#![no_std]` and compiled to WebAssembly for deployment on Stellar.

Responsibilities:
- Store group membership
- Record expenses and update net balances
- Validate and record settlements
- Enforce authorization on all writes

### 2. React Frontend

**Location**: `frontend/splitchain-ui/src/`

A single-page application that provides the user interface for interacting with the contract. It uses the `@stellar/stellar-sdk` to construct and submit Soroban transactions, and Freighter wallet for signing.

Responsibilities:
- Provide UI for all four core flows (create group, add expense, view balances, settle)
- Connect to Freighter for transaction signing
- Call the Soroban RPC to read contract state and submit transactions
- Display balances in XLM (converting from stroops internally)

---

## Smart Contract Design

### Storage Model

SplitChain uses **Instance Storage** for all data. This is appropriate because:

- All group data is accessed together (members + balances are always read as a pair)
- Instance storage is the simplest and most cost-effective model for this use case
- TTL is extended automatically on every contract invocation

Three storage keys are used per group:

```
DataKey::Group(group_id)        → GroupData { members: Vec<Address> }
DataKey::Balance(group_id)      → Map<Address, i128>
DataKey::ExpenseCount(group_id) → u32
```

All monetary values are stored as `i128` in **stroops** (1 XLM = 10,000,000 stroops). Using `i128` allows for large balances and negative values (debts) without overflow risk.

### Balance Calculation

SplitChain uses a **net balance model** rather than storing individual expense records. This keeps storage minimal and balance lookups O(1).

When an expense is added:

```
share = total_amount / member_count   (integer division)

for each member:
    if member == payer:
        balance[member] += total_amount - share
    else:
        balance[member] -= share
```

This means:
- The payer is credited for the full amount minus their own share
- Every other member is debited their share
- The sum of all balances always equals zero (zero-sum invariant)

**Example**: 3-person group, Alice pays 30 XLM (300,000,000 stroops)

```
share = 300,000,000 / 3 = 100,000,000

Alice:  +300,000,000 - 100,000,000 = +200,000,000  (owed 20 XLM)
Bob:    -100,000,000                               (owes 10 XLM)
Carol:  -100,000,000                               (owes 10 XLM)

Sum: 200,000,000 - 100,000,000 - 100,000,000 = 0 ✓
```

### Auth Model

| Function | Auth Required | Who |
| --- | --- | --- |
| `create_group` | No | — |
| `add_expense` | Yes | `payer` |
| `settle` | Yes | `from` (the debtor) |
| `get_balances` | No | — |
| `get_members` | No | — |
| `expense_count` | No | — |

All auth is enforced via Soroban's `require_auth()` mechanism, which validates that the transaction was signed by the required address.

---

## Frontend Architecture

The frontend follows a simple page-based structure with no global state management library. State is passed via props between the root `App` component and page components.

```
App.tsx
├── state: { page, group }
├── CreateGroup.tsx   → onCreated(group) → sets group, navigates to AddExpense
├── AddExpense.tsx    → reads group from props
├── Balances.tsx      → reads group from props, fetches on-chain balances
└── Settle.tsx        → reads group from props
```

Each page component is responsible for:
1. Rendering its form
2. Calling the appropriate contract method (via `src/lib/contract.ts`)
3. Displaying status feedback to the user

The `contract.ts` helper module centralizes all Soroban RPC configuration and unit conversion utilities, keeping page components clean.

---

## Data Flow

### Creating a Group

```
User fills form → CreateGroup.tsx
    → calls contract.create_group(group_id, members)
    → Freighter signs transaction
    → Soroban RPC submits to Stellar
    → Contract stores GroupData + zero balances
    → UI navigates to AddExpense
```

### Adding an Expense

```
User fills form → AddExpense.tsx
    → converts XLM to stroops (toStroops)
    → calls contract.add_expense(group_id, payer, amount, description)
    → Freighter signs as payer
    → Contract updates balance map for all members
```

### Viewing Balances

```
User clicks "Fetch Balances" → Balances.tsx
    → calls contract.get_balances(group_id) [read-only, no signing]
    → Soroban RPC returns Map<Address, i128>
    → UI converts stroops to XLM (fromStroops)
    → Displays table with color-coded positive/negative balances
```

### Settling a Debt

```
User fills form → Settle.tsx
    → calls contract.settle(group_id, from, to, amount)
    → Freighter signs as `from`
    → Contract validates amount, updates both balances
```

---

## Design Decisions

### Why net balances instead of storing every expense?

Storing individual expenses would require unbounded storage growth and complex querying. The net balance model keeps storage constant per group (one entry per member) regardless of how many expenses are added. The tradeoff is that you cannot retrieve the full expense history from the contract — but that is acceptable for an MVP and can be addressed with off-chain indexing later.

### Why `i128` for amounts?

`i128` supports values up to ~170 trillion XLM in stroops, which is far beyond any realistic use case. It also natively supports negative values for debt representation without needing a separate sign field.

### Why Instance Storage?

For a group expense tracker, all data for a group is always accessed together. Instance storage is the simplest model and avoids the complexity of managing TTL on individual persistent storage entries. As the project scales, a migration to persistent storage per group could be considered.

### Why no backend?

Keeping the architecture serverless reduces operational complexity, eliminates a central point of failure, and keeps the project fully decentralized. All state is on-chain and verifiable by anyone.

---

## Future Architecture

Planned improvements for future versions:

- **Debt netting algorithm**: Minimize the number of payments needed to settle a group (e.g. 3 people, 3 expenses → 2 payments instead of 6)
- **Off-chain indexer**: Index contract events to support expense history queries without on-chain storage growth
- **Multi-currency support**: Allow expenses in different assets using Stellar's native asset support
- **Recurring expenses**: Automate regular shared costs (rent, subscriptions)
- **Group invitations**: On-chain invite/accept flow for adding members to existing groups
