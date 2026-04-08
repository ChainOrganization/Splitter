# SplitChain Testing Guide

This document covers the testing strategy for SplitChain, how to run the test suite, and how to write new tests.

---

## Table of Contents

- [Overview](#overview)
- [Smart Contract Tests](#smart-contract-tests)
  - [Running Tests](#running-tests)
  - [Test Environment](#test-environment)
  - [Existing Tests](#existing-tests)
  - [Writing New Tests](#writing-new-tests)
- [Frontend Tests](#frontend-tests)
- [Manual Testing](#manual-testing)
- [Test Coverage Goals](#test-coverage-goals)

---

## Overview

SplitChain has two testing layers:

| Layer | Framework | Location |
| --- | --- | --- |
| Smart Contract | Rust + `soroban-sdk` testutils | `contract/splitchain-stellar/contracts/splitchain/src/test.rs` |
| Frontend | Vitest + React Testing Library | `frontend/splitchain-ui/src/` (planned) |

The smart contract tests are the most critical — they verify the correctness of all on-chain logic including balance calculations, auth enforcement, and settlement validation.

---

## Smart Contract Tests

### Running Tests

```bash
cd contract/splitchain-stellar

# Run all tests
cargo test

# Run with output (useful for debugging)
cargo test -- --nocapture

# Run a specific test
cargo test test_create_group_and_add_expense
```

### Test Environment

Soroban's `testutils` feature provides a mock environment (`Env::default()`) that simulates the Soroban host without needing a live network. Key utilities:

- `Env::default()` — creates a fresh mock environment
- `env.mock_all_auths()` — bypasses `require_auth()` checks so tests can call any function without real signatures
- `Address::generate(&env)` — generates a random test address
- `env.register(SplitChain, ())` — deploys the contract to the mock environment and returns a contract ID
- `SplitChainClient::new(&env, &contract_id)` — creates a typed client for calling contract methods

### Existing Tests

#### `test_create_group_and_add_expense`

**What it tests**: Creating a group and recording an expense, then verifying the resulting balances.

**Setup**:
- 3 members: Alice, Bob, Carol
- Group ID: `"trip"`
- Alice pays 30 stroops

**Expected balances**:
- Alice: `+20` (paid 30, owes 10 herself → credited 20)
- Bob: `-10`
- Carol: `-10`

```rust
#[test]
fn test_create_group_and_add_expense() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SplitChain, ());
    let client = SplitChainClient::new(&env, &contract_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    let group_id = symbol_short!("trip");
    let members = vec![&env, alice.clone(), bob.clone(), carol.clone()];

    client.create_group(&group_id, &members);
    client.add_expense(&group_id, &alice, &30_i128, &symbol_short!("dinner"));

    let balances = client.get_balances(&group_id);

    assert_eq!(balances.get(alice.clone()).unwrap(), 20);
    assert_eq!(balances.get(bob.clone()).unwrap(), -10);
    assert_eq!(balances.get(carol.clone()).unwrap(), -10);
}
```

#### `test_settle`

**What it tests**: Recording a settlement between two members and verifying both balances reach zero.

**Setup**:
- 2 members: Alice, Bob
- Group ID: `"duo"`
- Alice pays 20 stroops (Bob owes 10)
- Bob settles 10 stroops to Alice

**Expected balances after settlement**:
- Alice: `0`
- Bob: `0`

```rust
#[test]
fn test_settle() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SplitChain, ());
    let client = SplitChainClient::new(&env, &contract_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    let group_id = symbol_short!("duo");
    client.create_group(&group_id, &vec![&env, alice.clone(), bob.clone()]);
    client.add_expense(&group_id, &alice, &20_i128, &symbol_short!("lunch"));
    client.settle(&group_id, &bob, &alice, &10_i128);

    let balances = client.get_balances(&group_id);
    assert_eq!(balances.get(alice.clone()).unwrap(), 0);
    assert_eq!(balances.get(bob.clone()).unwrap(), 0);
}
```

---

### Writing New Tests

When adding new contract functionality, add a corresponding test in `src/test.rs`. Follow this pattern:

```rust
#[test]
fn test_your_scenario() {
    // 1. Set up the environment
    let env = Env::default();
    env.mock_all_auths();

    // 2. Register the contract
    let contract_id = env.register(SplitChain, ());
    let client = SplitChainClient::new(&env, &contract_id);

    // 3. Generate test addresses
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    // 4. Set up initial state
    let group_id = symbol_short!("test");
    client.create_group(&group_id, &vec![&env, alice.clone(), bob.clone()]);

    // 5. Execute the action under test
    // ...

    // 6. Assert expected outcomes
    // ...
}
```

**Guidelines for new tests**:

- Test one scenario per test function
- Use descriptive test names that explain what is being tested
- Always assert the final state, not just that the call succeeded
- Test both the happy path and error cases
- For error cases, use `#[should_panic(expected = "your error message")]`:

```rust
#[test]
#[should_panic(expected = "group already exists")]
fn test_create_duplicate_group_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(SplitChain, ());
    let client = SplitChainClient::new(&env, &contract_id);

    let group_id = symbol_short!("dup");
    let members = vec![&env, Address::generate(&env)];

    client.create_group(&group_id, &members);
    client.create_group(&group_id, &members); // should panic
}
```

**Scenarios to cover** (contributions welcome):

- [ ] Duplicate group creation (should panic)
- [ ] Adding expense to non-existent group (should panic)
- [ ] Over-settlement (should panic)
- [ ] Multiple expenses accumulate correctly
- [ ] Expense count increments correctly
- [ ] `get_members` returns correct list
- [ ] Large group (10+ members) balance calculation
- [ ] Expense amount not evenly divisible by member count (remainder handling)

---

## Frontend Tests

Frontend tests are planned using [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

To run frontend tests once they are implemented:

```bash
cd frontend/splitchain-ui
npm test
```

For a single run (no watch mode):

```bash
npm run test -- --run
```

**Planned test coverage**:
- `CreateGroup` — form validation, member list management
- `AddExpense` — payer selection, amount input
- `Balances` — correct display of positive/negative/zero balances
- `Settle` — from/to validation, amount input
- `contract.ts` — `toStroops` and `fromStroops` unit tests

---

## Manual Testing

For end-to-end testing on the Stellar testnet:

### 1. Deploy the contract

Follow [docs/DEPLOYMENT.md](DEPLOYMENT.md) to deploy to testnet.

### 2. Set up test accounts

Create two or three testnet accounts using Freighter or the Stellar CLI, and fund them via Friendbot:

```bash
curl "https://friendbot.stellar.org?addr=<YOUR_ADDRESS>"
```

### 3. Test the full flow

1. Open the frontend at `http://localhost:5173`
2. Connect Freighter wallet
3. Create a group with your test addresses
4. Add an expense (e.g. 10 XLM)
5. Check the Balances page — verify the split is correct
6. Settle the balance from one account to another
7. Check Balances again — verify both balances are zero

### 4. Verify on-chain

Check your transactions on the Stellar testnet explorer:
`https://stellar.expert/explorer/testnet`

---

## Test Coverage Goals

| Area | Current | Target |
| --- | --- | --- |
| Contract: happy paths | ✅ 2 tests | 5+ tests |
| Contract: error cases | ❌ 0 tests | 5+ tests |
| Contract: auth enforcement | ❌ 0 tests | 3+ tests |
| Frontend: component tests | ❌ 0 tests | 8+ tests |
| Frontend: utility functions | ❌ 0 tests | 4+ tests |

Contributions to expand test coverage are very welcome. See [CONTRIBUTING.md](../CONTRIBUTING.md) for how to get started.
