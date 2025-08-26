import { Actor, HttpAgent } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';
import { env } from '@genesisnet/env';

const agent = new HttpAgent({ host: env.ICP_HOST });

const ledgerIdl = ({ IDL }: { IDL: typeof import('@dfinity/candid').IDL }) =>
  IDL.Service({
    log_transaction: IDL.Func([
      IDL.Record({ txId: IDL.Text, amount: IDL.Nat64 }),
    ], [], []),
  });

const reputationIdl = ({ IDL }: { IDL: typeof import('@dfinity/candid').IDL }) =>
  IDL.Service({
    get_reputation: IDL.Func([IDL.Text], [IDL.Int], ['query']),
    update_reputation: IDL.Func([IDL.Text, IDL.Int], [], []),
  });

const ledgerActor = env.ICP_LEDGER_CANISTER_ID
  ? Actor.createActor(ledgerIdl, {
      agent,
      canisterId: env.ICP_LEDGER_CANISTER_ID,
    })
  : null;

const reputationActor = env.ICP_REPUTATION_CANISTER_ID
  ? Actor.createActor(reputationIdl, {
      agent,
      canisterId: env.ICP_REPUTATION_CANISTER_ID,
    })
  : null;

export async function logTransaction(txId: string, amount: bigint) {
  if (!ledgerActor) throw new Error('ICP ledger canister not configured');
  return (ledgerActor as any).log_transaction({ txId, amount });
}

export async function getReputation(userId: string): Promise<bigint> {
  if (!reputationActor) throw new Error('ICP reputation canister not configured');
  return (reputationActor as any).get_reputation(userId);
}

export async function updateReputation(userId: string, delta: bigint) {
  if (!reputationActor) throw new Error('ICP reputation canister not configured');
  return (reputationActor as any).update_reputation(userId, delta);
}
