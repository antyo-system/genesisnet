from fastapi import FastAPI
import requests, os
from pydantic import BaseModel

GATEWAY = os.getenv("GATEWAY_URL", "http://api-gateway:3000")

class Offer(BaseModel):
    offer_id: str
    provider_id: str
    package_id: str
    name: str
    price: float
    reputation: int = 0
    data_hash: str | None = None
    latency_ms: float | None = None

app = FastAPI()

@app.post("/offer")
def offer(body: Offer):
    """Expose endpoint to manually push an offer to the gateway."""
    requests.post(
        f"{GATEWAY}/agents/events",
        json={"type": "OFFER_NEW", "payload": body.model_dump()},
    )
    return {"status": "ok"}
