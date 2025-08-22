from typing import Dict, Any, Optional, List
from uagents import Model, Protocol

# ===== Versi schema (optional, berguna buat upgrade) =====
PROTO_VERSION = "v1"

# ===== Chat (untuk ASI:One / Inspector) =====
class ChatMessage(Model):
    text: str
    ver: str = PROTO_VERSION

chat_proto = Protocol("chat")

# ===== Data (Requester ↔ Provider) =====
class DataRequest(Model):
    intent: str                 # "metrics" | "logs" | "topology" | "scan" | "search" | "tx_*" | "wallet_*"
    params: Dict[str, Any]
    ver: str = PROTO_VERSION

class DataResponse(Model):
    ok: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    ver: str = PROTO_VERSION

data_proto = Protocol("genesisnet_data_protocol")

# ===== Reputation (Requester/Provider ↔ Reputation) =====
class RateRequest(Model):
    provider_id: str            # id/address provider
    score: int                  # 1..5
    reason: Optional[str] = None
    ver: str = PROTO_VERSION

class RateResponse(Model):
    ok: bool
    provider_id: str
    new_avg: float              # rata-rata terbaru
    total_ratings: int
    ver: str = PROTO_VERSION

class ReputationQuery(Model):
    provider_id: str
    ver: str = PROTO_VERSION

class ReputationInfo(Model):
    provider_id: str
    avg: float
    histogram: Dict[int, int]   # {1: x, 2: y, ...}
    last_n: Optional[List[int]] = None
    ver: str = PROTO_VERSION

reputation_proto = Protocol("genesisnet_reputation_protocol")
