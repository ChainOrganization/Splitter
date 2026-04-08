# SplitChain Deployment Guide

This guide walks you through deploying the SplitChain smart contract to the Stellar testnet and mainnet, and connecting the frontend to your deployed contract.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deploy to Testnet](#deploy-to-testnet)
- [Deploy to Mainnet](#deploy-to-mainnet)
- [Connect the Frontend](#connect-the-frontend)
- [Verify the Deployment](#verify-the-deployment)
- [Upgrading the Contract](#upgrading-the-contract)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, make sure you have the following installed:

```bash
# Rust
curl https://sh.rustup.rs -sSf | sh

# WASM target
rustup target add wasm32-unknown-unknown

# Soroban / Stellar CLI
cargo install --locked stellar-cli

# Verify
stellar --version
```

You will also need:
- A funded Stellar account (testnet accounts can be funded via Friendbot)
- The Freighter browser extension for frontend signing

---

## Environment Setup

### 1. Configure the Stellar CLI Network

```bash
# Add testnet configuration
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# Add mainnet configuration
stellar network add mainnet \
  --rpc-url https://soroban-rpc.stellar.org \
  --network-passphrase "Public Global Stellar Network ; September 2015"
```

### 2. Create a Deployer Identity

```bash
# Generate a new keypair for deployment
stellar keys generate deployer --network testnet

# View the public key
stellar keys address deployer
```

### 3. Fund the Testnet Account

```bash
# Use Friendbot to fund your testnet account
curl "https://friendbot.stellar.org?addr=$(stellar keys address deployer)"
```

Verify the account is funded:

```bash
stellar account show $(stellar keys address deployer) --network testnet
```

---

## Deploy to Testnet

### Step 1: Build the Contract

```bash
cd contract/splitchain-stellar

soroban contract build
```

This produces the compiled WASM at:
```
target/wasm32-unknown-unknown/release/splitchain.wasm
```

### Step 2: Run Tests

Always run tests before deploying:

```bash
cargo test
```

All tests must pass before proceeding.

### Step 3: Deploy

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/splitchain.wasm \
  --source deployer \
  --network testnet
```

The CLI will output a **Contract ID** that looks like:

```
CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Save this — you will need it for the frontend.

### Step 4: Verify the Deployment

Invoke a read-only method to confirm the contract is live:

```bash
stellar contract invoke \
  --id <YOUR_CONTRACT_ID> \
  --network testnet \
  --source deployer \
  -- expense_count \
  --group_id testgroup
```

This will panic with "group not found" — which is expected and confirms the contract is responding correctly.

---

## Deploy to Mainnet

> ⚠️ Deploying to mainnet uses real XLM. Make sure your contract is fully tested on testnet first.

### Step 1: Create a Mainnet Identity

```bash
stellar keys generate mainnet-deployer --network mainnet
```

Fund this account with real XLM before proceeding.

### Step 2: Build and Deploy

```bash
cd contract/splitchain-stellar

soroban contract build

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/splitchain.wasm \
  --source mainnet-deployer \
  --network mainnet
```

Save the mainnet Contract ID.

---

## Connect the Frontend

### Step 1: Set Environment Variables

```bash
cd frontend/splitchain-ui
cp .env.example .env
```

Edit `.env`:

```env
# Testnet
VITE_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_NETWORK=testnet

# For mainnet, change to:
# VITE_CONTRACT_ID=<mainnet-contract-id>
# VITE_NETWORK=mainnet
```

### Step 2: Update the RPC URL (if needed)

The default RPC URL in `src/lib/contract.ts` points to the Stellar testnet:

```typescript
export const RPC_URL = "https://soroban-testnet.stellar.org";
```

For mainnet, update this to:

```typescript
export const RPC_URL = "https://soroban-rpc.stellar.org";
```

### Step 3: Start the Frontend

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and connect your Freighter wallet.

---

## Verify the Deployment

After connecting the frontend:

1. Create a test group with two addresses
2. Add a small expense (e.g. 1 XLM)
3. Check the Balances page — you should see the correct split
4. Settle the balance and confirm it resets to zero

You can also verify transactions directly on the Stellar explorer:
- Testnet: `https://stellar.expert/explorer/testnet`
- Mainnet: `https://stellar.expert/explorer/public`

---

## Upgrading the Contract

Soroban supports contract upgrades via the `update_current_contract_wasm` host function. To upgrade:

1. Build the new WASM
2. Upload the new WASM to the network:

```bash
stellar contract upload \
  --wasm target/wasm32-unknown-unknown/release/splitchain.wasm \
  --source deployer \
  --network testnet
```

3. Invoke the upgrade function (requires adding an `upgrade` method to the contract that calls `env.deployer().update_current_contract_wasm(new_wasm_hash)`)

> Note: The current MVP does not include an upgrade function. This is intentional for simplicity. Add one before deploying to mainnet if you anticipate needing upgrades.

---

## Troubleshooting

### "insufficient balance" on deploy

Your deployer account does not have enough XLM to cover the transaction fee and ledger rent. Fund it via Friendbot (testnet) or transfer XLM (mainnet).

### "contract not found" in frontend

Double-check that `VITE_CONTRACT_ID` in your `.env` matches the deployed contract ID exactly. Restart the dev server after editing `.env`.

### "group not found" panic

This is expected when calling any method on a `group_id` that has not been created yet. Call `create_group` first.

### Freighter not connecting

- Make sure the Freighter extension is installed and unlocked
- Confirm Freighter is set to the correct network (testnet or mainnet)
- Check the browser console for any RPC errors

### Build fails with WASM errors

Make sure the `wasm32-unknown-unknown` target is installed:

```bash
rustup target add wasm32-unknown-unknown
rustup show
```
