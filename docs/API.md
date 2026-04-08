# SplitChain API Reference

This document covers the full public interface of the SplitChain Soroban smart contract and the frontend helper utilities.

---

## Table of Contents

- [Contract Overview](#contract-overview)
- [Data Types](#data-types)
- [Contract Methods](#contract-methods)
  - [create_group](#create_group)
  - [add_expense](#add_expense)
  - [settle](#settle)
  - [get_balances](#get_balances)
  - [get_members](#get_members)
  - [expense_count](#expense_count)
- [Error Conditions](#error-conditions)
- [Frontend Helpers](#frontend-helpers)
- [Environment Variables](#environment-variables)

---

## Contract Overview

- **Language**: Rust (`#![no_std]`)
- **Platform**: Soroban (Stellar)
- **Storage**: Instance storage (all group and balance data)
- **Auth**: `require_auth()` enforced on all state-mutating functions
- **Amounts**: All monetary values are in **stroops** (`i128`). 1 XLM = 10,000,000 stroops.

---

## Data Types

### `GroupData`

Stored per group. Contains the list of member addresses.

```rust
pub struct GroupData {
    pub members: Vec<Address>,
}
```

### `DataKey` (Storage Keys)

```rust
pub enum DataKey {
    Group(Symbol),        // group_id → GroupData
    Balance(Symbol),      // group_id → Map<Address, i128>
    ExpenseCount(Symbol), // group_id → u32
}
```

### Balance Map

`Map<Address, i128>` — maps each member address to their net balance.

| Value | Meaning |
| --- | --- |
| Positive (`> 0`) | This member is owed money by the group |
| Negative (`< 0`) | This member owes money to the group |
| Zero (`0`) | This member is fully settled |

---

## Contract Methods

---

### `create_group`

Creates a new expense group with a fixed set of members.

```rust
pub fn create_group(env: Env, group_id: Symbol, members: Vec<Address>)
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `group_id` | `Symbol` | Unique identifier for the group (e.g. `"trip2025"`) |
| `members` | `Vec<Address>` | List of Stellar addresses in the group |

**Behavior**
- Panics if a group with the same `group_id` already exists
- Initializes all member balances to `0`
- Initializes expense counter to `0`

**Auth**: None required (anyone can create a group)

**Example (Soroban CLI)**

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source alice \
  -- create_group \
  --group_id trip2025 \
  --members '["GABC...","GDEF...","GHIJ..."]'
```

---

### `add_expense`

Records a new expense paid by one member, split equally among all group members.

```rust
pub fn add_expense(
    env: Env,
    group_id: Symbol,
    payer: Address,
    amount: i128,
    description: Symbol,
)
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `group_id` | `Symbol` | The group to record the expense in |
| `payer` | `Address` | The member who paid |
| `amount` | `i128` | Total amount paid, in stroops |
| `description` | `Symbol` | Short label (e.g. `"dinner"`, `"rent"`) |

**Balance Update Logic**

For a group of N members where `payer` paid `amount`:

```
share = amount / N   (integer division)

payer balance    += amount - share   (credited for everyone else's share)
other balances   -= share            (debited their portion)
```

**Auth**: `payer` must sign the transaction

**Example**

Alice pays 300,000,000 stroops (30 XLM) for dinner in a 3-person group:

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source alice \
  -- add_expense \
  --group_id trip2025 \
  --payer GABC... \
  --amount 300000000 \
  --description dinner
```

Result: Alice `+200,000,000`, Bob `-100,000,000`, Carol `-100,000,000`

---

### `settle`

Records a settlement payment from one member to another, adjusting their balances.

```rust
pub fn settle(
    env: Env,
    group_id: Symbol,
    from: Address,
    to: Address,
    amount: i128,
)
```

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| `group_id` | `Symbol` | The group context |
| `from` | `Address` | The member paying (the debtor) |
| `to` | `Address` | The member receiving (the creditor) |
| `amount` | `i128` | Amount being settled, in stroops |

**Behavior**
- Panics if `from` would over-settle (i.e. `from_balance + amount > 0`)
- Adjusts `from` balance by `+amount` (reduces debt)
- Adjusts `to` balance by `-amount` (reduces credit)

**Auth**: `from` must sign the transaction

**Note**: This method records the settlement in contract state. The actual XLM transfer should be executed as a separate Stellar payment operation in the same transaction envelope.

---

### `get_balances`

Returns the current net balance for every member in a group.

```rust
pub fn get_balances(env: Env, group_id: Symbol) -> Map<Address, i128>
```

**Returns**: `Map<Address, i128>` — net balance per member in stroops

**Auth**: None (read-only)

---

### `get_members`

Returns the list of member addresses for a group.

```rust
pub fn get_members(env: Env, group_id: Symbol) -> Vec<Address>
```

**Returns**: `Vec<Address>`

**Auth**: None (read-only)

---

### `expense_count`

Returns the total number of expenses recorded for a group.

```rust
pub fn expense_count(env: Env, group_id: Symbol) -> u32
```

**Returns**: `u32`

**Auth**: None (read-only)

---

## Error Conditions

| Condition | Trigger | Behavior |
| --- | --- | --- |
| Group already exists | `create_group` called with duplicate `group_id` | `panic!("group already exists")` |
| Group not found | Any method called with unknown `group_id` | `expect("group not found")` panics |
| Empty group | `add_expense` on a group with 0 members | `panic!("group has no members")` |
| Over-settlement | `settle` amount exceeds debtor's balance | `panic!("settling more than owed")` |
| Unauthorized | State-mutating call without valid auth | Soroban auth failure |

---

## Frontend Helpers

Located in `frontend/splitchain-ui/src/lib/contract.ts`.

### Constants

```typescript
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID ?? "";
```

### `getRpc()`

Returns a configured Soroban RPC server instance.

```typescript
export function getRpc(): StellarSdk.rpc.Server
```

### `toStroops(xlm: number): bigint`

Converts an XLM amount to stroops for use in contract calls.

```typescript
export const toStroops = (xlm: number) => BigInt(Math.round(xlm * 10_000_000));
```

### `fromStroops(stroops: bigint): number`

Converts stroops back to XLM for display.

```typescript
export const fromStroops = (stroops: bigint) => Number(stroops) / 10_000_000;
```

---

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_CONTRACT_ID` | Yes | Deployed SplitChain contract address (starts with `C`) |
| `VITE_NETWORK` | No | `testnet` (default) or `mainnet` |

Copy `.env.example` to `.env` and fill in your values before running the frontend.
