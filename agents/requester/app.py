from fastapi import FastAPI
import requests, os
from pydantic import BaseModel

GATEWAY = os.getenv("GATEWAY_URL", "http://api-gateway:3000")

class SearchRequest(BaseModel):
    query: str
    max_price: float | None = None
    tags: list[str] | None = None
    budget: float | None = None
    requester_id: str

app = FastAPI()

@app.post("/search")
def search(body: SearchRequest):
    # TODO: panggil uAgents broadcast (lihat agent.py), di sini contoh dummy offer:
    offer = {
        "offer_id": "off-" + body.query,
        "provider_id": "prov-1",
        "package_id": "pkg-1",
        "name": f"{body.query} hourly",
        "price": 3.1,
        "reputation": 0,
        "data_hash": "sha256:abc",
        "latency_ms": 42
    }
    requests.post(f"{GATEWAY}/agents/events", json={"type": "OFFER_NEW", "payload": offer})
    return {"status": "ok"}

@app.post("/purchase")
def purchase(payload: dict):
    # TODO: kirim purchase via uAgents; dummy sukses:
    tx_event = {
        "type": "TX_SUCCESS",
        "payload": {
            "tx_id": payload["tx_id"],
            "offer_id": payload["offer_id"],
            "provider_id": "prov-1",
            "amount": 3.1,
            "tx_hash": "0xDUMMY"
        }
    }
    requests.post(f"{GATEWAY}/agents/events", json=tx_event)
    return {"status": "ok"}
