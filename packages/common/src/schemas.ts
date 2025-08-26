export type SearchRequest = {
  query: string; // "traffic", "weather", etc.
  max_price?: number; // optional
  tags?: string[]; // ["geo","hourly"]
  budget?: number; // optional, for purchase decision
  requester_id: string; // user or agent id
};

export type Offer = {
  offer_id: string;
  provider_id: string;
  package_id: string;
  name: string;
  price: number;
  reputation: number; // from ICP (fallback 0 if not found)
  data_hash: string; // integrity marker
  latency_ms?: number;
};

export type PurchaseOrder = {
  offer_id: string;
  requester_id: string;
};

export type AgentEvent =
  | { type: 'OFFER_NEW'; payload: Offer }
  | {
      type: 'TX_PROCESSING';
      payload: {
        tx_id: string;
        offer_id: string;
        provider_id: string;
        package_id: string;
        amount: number;
      };
    }
  | {
      type: 'TX_SUCCESS';
      payload: {
        tx_id: string;
        offer_id: string;
        provider_id: string;
        amount: number;
        tx_hash: string;
      };
    }
  | { type: 'TX_FAILED'; payload: { offer_id: string; reason: string } }
  | {
      type: 'PROVIDER_ONLINE';
      payload: { provider_id: string; node_addr: string; latency_ms?: number };
    };
