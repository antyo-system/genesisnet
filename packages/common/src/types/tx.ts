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
