import { HttpAgent, Actor } from "@dfinity/agent";
import idlFactory from "./reputation.idl.js"; // hasil dfx generate

const canisterId = process.env.ICP_CANISTER_ID!;

const agent = new HttpAgent({ host: process.env.ICP_HOST ?? "https://icp0.io" });
// if dev: await agent.fetchRootKey();

export const icp = Actor.createActor(idlFactory, { agent, canisterId });

export async function getReputation(providerId: string): Promise<number> {
  return Number(await (icp as any).get_reputation(providerId));
}

export async function logTx(tx: { tx_id: string; provider_id: string; amount: number; data_hash: string; ts: bigint; }) {
  return (icp as any).log_transaction(
    tx.tx_id,
    tx.provider_id,
    BigInt(Math.floor(tx.amount * 1e8)),
    tx.ts,
    tx.data_hash
  );
}

export async function bumpReputation(providerId: string, delta = 1) {
  return (icp as any).update_reputation(providerId, BigInt(delta));
}
