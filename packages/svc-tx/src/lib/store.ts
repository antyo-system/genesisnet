export type TxStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface TxRecord {
  id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  memo?: string;
  status: TxStatus;
  created_at: string; // ISO
  updated_at: string; // ISO
}

const txMap = new Map<string, TxRecord>();

export const store = {
  create(tx: TxRecord) {
    txMap.set(tx.id, tx);
    return tx;
  },
  get(id: string) {
    return txMap.get(id) || null;
  },
  update(id: string, patch: Partial<TxRecord>) {
    const cur = txMap.get(id);
    if (!cur) return null;
    const next = { ...cur, ...patch, updated_at: new Date().toISOString() };
    txMap.set(id, next);
    return next;
  },
};
