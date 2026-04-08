# SplitChain Security Policy

This document describes the security model of SplitChain, known limitations, and how to responsibly disclose vulnerabilities.

---

## Table of Contents

- [Security Model](#security-model)
- [Authorization](#authorization)
- [Input Validation](#input-validation)
- [Known Limitations](#known-limitations)
- [Rust and Soroban Safety](#rust-and-soroban-safety)
- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [Scope](#scope)
- [Out of Scope](#out-of-scope)

---

## Security Model

SplitChain is a smart contract application. Its security guarantees come from three layers:

1. **Stellar Network Consensus** — All transactions are validated and finalized by the Stellar network. There is no central server that can be compromised to alter contract state.

2. **Soroban Host Environment** — The Soroban VM provides a sandboxed execution environment. Contracts cannot access arbitrary memory, make external network calls, or interact with other contracts unless explicitly invoked.

3. **Rust Memory Safety** — The contract is written in Rust, which eliminates entire classes of vulnerabilities including buffer overflows, use-after-free, and null pointer dereferences at compile time.

---

## Authorization

Every function that modifies contract state enforces authorization using Soroban's `require_auth()` mechanism.

| Function | Required Signer | What it prevents |
| --- | --- | --- |
| `add_expense` | `payer` | Prevents anyone from recording a fake expense on behalf of another user |
| `settle` | `from` (debtor) | Prevents anyone from marking someone else's debt as settled without their signature |

Read-only functions (`get_balances`, `get_members`, `expense_count`) require no auth — they are public by design.

`require_auth()` is enforced at the Soroban host level. If the transaction is not signed by the required address, the invocation fails before any state is modified.

---

## Input Validation

The contract validates inputs at the following points:

### `create_group`
- Checks that the `group_id` does not already exist. Prevents overwriting an existing group's data.

### `add_expense`
- Checks that the group has at least one member before dividing. Prevents a divide-by-zero panic.

### `settle`
- Validates that `from_balance + amount <= 0` before applying the settlement. This prevents a debtor from "over-settling" — i.e. recording a payment larger than their actual debt, which would flip their balance to positive and incorrectly credit them.

---

## Known Limitations

### No Expense History

The contract stores net balances, not individual expense records. This means:
- You cannot retrieve a full expense history from the contract
- If a bug causes incorrect balance updates, there is no on-chain audit trail to reconstruct from

**Mitigation**: Off-chain indexing of contract events (planned for a future version) will provide a full audit trail.

### Integer Division Truncation

Expense amounts are split using integer division (`amount / member_count`). When the amount does not divide evenly, the remainder is absorbed by the payer (they receive slightly less credit than the exact split).

**Example**: 3 members, 10 stroops paid → share = 3 stroops each, payer credited 4 stroops (not 3.33...)

This is a known and intentional simplification for the MVP. A future version will implement a remainder distribution algorithm.

### No Group Deletion

There is currently no function to delete a group or remove a member. Groups persist on-chain indefinitely (subject to ledger rent TTL).

### No Upgrade Mechanism

The current contract does not include an upgrade function. If a critical bug is found post-deployment, a new contract must be deployed and users must migrate manually.

**Recommendation**: Do not deploy to mainnet with significant funds until an upgrade mechanism is added and the contract has been audited.

### Settlement is Off-Chain

The `settle` function records a settlement in contract state but does not execute an actual XLM transfer. The actual payment must be made as a separate Stellar payment operation. If a user records a settlement without actually sending XLM, the balances will be incorrect.

**Mitigation**: A future version will integrate the XLM transfer directly into the `settle` function using Soroban's token interface.

---

## Rust and Soroban Safety

### Memory Safety

Rust's ownership model and borrow checker prevent:
- Buffer overflows
- Use-after-free vulnerabilities
- Data races
- Null pointer dereferences

These are enforced at compile time, not runtime.

### No Standard Library

The contract uses `#![no_std]`, which means it has no access to the Rust standard library. This eliminates:
- File system access
- Network access
- System calls
- Dynamic memory allocation outside of Soroban's managed allocator

### Overflow Checks

The workspace `Cargo.toml` enables `overflow-checks = true` in the release profile. Integer overflow will panic rather than silently wrap.

---

## Reporting a Vulnerability

If you discover a security vulnerability in SplitChain, please **do not open a public GitHub issue**.

Instead, report it privately by emailing:

> **[your-security-email@example.com]**

Please include:
- A clear description of the vulnerability
- Steps to reproduce
- The potential impact
- Any suggested mitigations

We will acknowledge your report within **48 hours** and aim to release a fix within **7 days** for critical issues.

We appreciate responsible disclosure and will credit researchers who report valid vulnerabilities (unless you prefer to remain anonymous).

---

## Scope

The following are in scope for security reports:

- `contract/splitchain-stellar/contracts/splitchain/src/lib.rs` — the Soroban contract
- `frontend/splitchain-ui/src/lib/contract.ts` — the RPC helper
- Any logic that could lead to incorrect balance calculations or unauthorized state changes

---

## Out of Scope

- Issues in third-party dependencies (report these to the respective maintainers)
- UI/UX bugs that do not have a security impact
- Issues that require physical access to a user's device
- Social engineering attacks
- Theoretical vulnerabilities without a proof of concept
