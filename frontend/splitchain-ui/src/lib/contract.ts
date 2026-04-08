/**
 * Thin wrapper around the SplitChain Soroban contract.
 * Replace CONTRACT_ID with your deployed contract address.
 */
import * as StellarSdk from "@stellar/stellar-sdk";

export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID ?? "";

export function getRpc() {
  return new StellarSdk.rpc.Server(RPC_URL);
}

/** Convert XLM to stroops (i128 in contract) */
export const toStroops = (xlm: number) =>
  BigInt(Math.round(xlm * 10_000_000));

/** Convert stroops back to XLM */
export const fromStroops = (stroops: bigint) =>
  Number(stroops) / 10_000_000;
