import { Actor, HttpAgent } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';
import { env } from '@genesisnet/env';

const agent = new HttpAgent({ host: env.ICP_HOST });

const ledgerIdl = ({ IDL }: { IDL: typeof import('@dfinity/candid').IDL }) =>
  IDL.Service({
    log_transaction: IDL.Func([
      IDL.Record({
        tx_id: IDL.Text,
        provider_id: IDL.Text,
        amount: IDL.Nat64,
        ts: IDL.Int,
        data_hash: IDL.Text,
      }),
    ], [IDL.Nat], []),
    get_reputation: IDL.Func([IDL.Text], [IDL.Nat], ['query']),
    update_reputation: IDL.Func([IDL.Text, IDL.Int], [IDL.Nat], []),
  });

const ledgerActor = env.ICP_LEDGER_CANISTER_ID
  ? Actor.createActor(ledgerIdl, {
      agent,
      canisterId: env.ICP_LEDGER_CANISTER_ID,
    })
  : null;

export async function logTransaction(
  txId: string,
  providerId: string,
  amount: bigint,
  ts: bigint,
  dataHash: string,
) {
  if (!ledgerActor) throw new Error('ICP ledger canister not configured');
  return (ledgerActor as any).log_transaction({
    tx_id: txId,
    provider_id: providerId,
    amount,
    ts,
    data_hash: dataHash,
  });
}

export async function getReputation(providerId: string): Promise<bigint> {
  if (!ledgerActor) throw new Error('ICP ledger canister not configured');
  return (ledgerActor as any).get_reputation(providerId);
}

export async function updateReputation(providerId: string, delta: bigint) {
  if (!ledgerActor) throw new Error('ICP ledger canister not configured');
  return (ledgerActor as any).update_reputation(providerId, delta);
}
