# Frontend Integration

## Transaction Sequence

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant GW as Gateway
    participant RA as Requester Agent
    FE->>GW: POST /api/tx/initiate
    GW-->>FE: { tx_id, status: "PENDING" }
    GW->>RA: POST /purchase
    RA-->>GW: AgentEvent (TX_SUCCESS/TX_FAILED)
    GW-->>FE: WebSocket metrics & tx update
```

## Sample Agent Event

```json
{
  "type": "TX_SUCCESS",
  "payload": {
    "tx_id": "123",
    "offer_id": "off-1",
    "provider_id": "prov-1",
    "amount": 3.1,
    "tx_hash": "0xDUMMY"
  }
}
```

