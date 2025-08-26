from fastapi import FastAPI
import requests, os
from pydantic import BaseModel

ICP = os.getenv("ICP_URL", "http://icp:8000")

class TxSuccess(BaseModel):
    provider_id: str
    tx_id: str
    amount: float
    tx_hash: str

app = FastAPI()

@app.post("/tx-success")
def tx_success(body: TxSuccess):
    """Receive TX_SUCCESS event and update provider reputation."""
    payload = {"provider_id": body.provider_id, "delta": 1}
    try:
        requests.post(f"{ICP}/update_reputation", json=payload, timeout=5)
    except Exception:
        # For demo purposes we ignore errors communicating with ICP
        pass
    return {"status": "ok"}
