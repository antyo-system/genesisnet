import os
import json
import re
import requests
from typing import Optional, Tuple, Dict, Any

from uagents import Agent, Context, Protocol, Model

# =========================
# ENV & CONFIG
# =========================
AGENT_NAME = os.getenv("REQUESTER_NAME", "genesisnet_requester")
AGENT_SEED = os.getenv("REQUESTER_SEED", "genesisnet-requester-dev")  # JANGAN hardcode secret di sini, pakai .env
PORT = int(os.getenv("REQUESTER_PORT", "8001"))
ENDPOINT = [os.getenv("REQUESTER_ENDPOINT", f"http://127.0.0.1:{PORT}/submit")]

BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://127.0.0.1:8080")  # ex: TS backend gateway
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "")  # jika gateway pakai auth
PROVIDER_ADDR = os.getenv("PROVIDER_ADDR")  # ex: agent1qxxxxxx dari Provider (optional)

TIMEOUT = 10  # detik

# =========================
# MODELS (Shared Protocol)
# =========================
class ChatMessage(Model):
    text: str

class DataRequest(Model):
    intent: str
    params: Dict[str, Any]

class DataResponse(Model):
    ok: bool
    message: str
    data: Optional[Dict[str, Any]] = None

# Protocol ke Provider
provider_proto = Protocol("genesisnet_data_protocol")

# Chat Protocol (untuk ASI:One / Agentverse)
chat_proto = Protocol("chat")

# =========================
# AGENT
# =========================
requester = Agent(
    name=AGENT_NAME,
    seed=AGENT_SEED,
    port=PORT,
    endpoint=ENDPOINT,
)

# =========================
# UTIL: intent parser
# =========================
INTENT_MAP = {
    "metrics": ["metrics", "stat", "stats", "statistik", "transaction", "transaksi", "harga", "latency"],
    "logs": ["log", "activity", "aktivitas"],
    "topology": ["topology", "network", "peta", "node", "jaringan"],
    "scan": ["scan", "discover", "discovery", "pemindaian"],
    "search": ["search", "cari", "filter", "provider", "data"],
}

def detect_intent(text: str) -> Tuple[str, Dict[str, Any]]:
    t = text.lower()

    # simple routing by keywords
    for intent, keys in INTENT_MAP.items():
        if any(k in t for k in keys):
            # rudimentary param extraction for search
            if intent == "search":
                params = {
                    "type": _extract(t, r"(cuaca|weather|finansial|finance|iot|sosial|social)"),
                    "region": _extract(t, r"(asia|amerika|eropa|global)"),
                    "max_price_icp": _extract_number(t),
                    "rating_min": _extract_number(t, key="rating"),
                    "q": text,  # raw text fallback
                }
                return "search", {k: v for k, v in params.items() if v not in (None, "")}
            return intent, {}

    # default: treat as search with raw text
    return "search", {"q": text}

def _extract(text: str, pattern: str) -> Optional[str]:
    m = re.search(pattern, text)
    return m.group(1) if m else None

def _extract_number(text: str, key: Optional[str] = None) -> Optional[float]:
    if key and key in text:
        nums = re.findall(r"(\d+(\.\d+)?)", text)
        return float(nums[0][0]) if nums else None
    nums = re.findall(r"(\d+(\.\d+)?)\s*(icp|sats|sat|ms)?", text)
    return float(nums[0][0]) if nums else None

# =========================
# BACKEND HTTP HELPERS
# =========================
def _headers() -> Dict[str, str]:
    h = {"Content-Type": "application/json"}
    if BACKEND_API_KEY:
        h["x-api-key"] = BACKEND_API_KEY
    return h

def call_backend(method: str, path: str, payload: Optional[Dict[str, Any]] = None) -> Tuple[bool, Any]:
    url = f"{BACKEND_BASE_URL}{path}"
    try:
        if method == "GET":
            r = requests.get(url, headers=_headers(), timeout=TIMEOUT)
        else:
            r = requests.post(url, headers=_headers(), data=json.dumps(payload or {}), timeout=TIMEOUT)
        if r.status_code >= 200 and r.status_code < 300:
            return True, r.json()
        return False, {"status": r.status_code, "text": r.text}
    except Exception as e:
        return False, {"error": str(e)}

# =========================
# INTENT EXECUTORS
# =========================
def exec_metrics() -> Tuple[bool, Any]:
    return call_backend("GET", "/api/dashboard/metrics")

def exec_logs() -> Tuple[bool, Any]:
    return call_backend("GET", "/api/dashboard/logs")

def exec_topology() -> Tuple[bool, Any]:
    return call_backend("GET", "/api/network/topology")

def exec_scan() -> Tuple[bool, Any]:
    return call_backend("POST", "/api/network/scan", {})

def exec_search(params: Dict[str, Any]) -> Tuple[bool, Any]:
    # minimal schema expected by your Search Service; pass-through params
    return call_backend("POST", "/api/data/search", params)

# =========================
# CHAT PROTOCOL HANDLER
# =========================
@chat_proto.on_message(model=ChatMessage)
async def on_chat(ctx: Context, sender: str, msg: ChatMessage):
    """
    Terima natural language dari Chat (ASI:One/Agentverse),
    route ke intent executor, balas dengan ChatMessage lagi.
    """
    intent, params = detect_intent(msg.text)
    ctx.logger.info(f"[chat] intent={intent} params={params}")

    if intent == "metrics":
        ok, data = exec_metrics()
    elif intent == "logs":
        ok, data = exec_logs()
    elif intent == "topology":
        ok, data = exec_topology()
    elif intent == "scan":
        ok, data = exec_scan()
    elif intent == "search":
        ok, data = exec_search(params)
    else:
        ok, data = False, {"error": f"Unknown intent: {intent}"}

    # optional: forward structured request to Provider Agent as well
    if PROVIDER_ADDR:
        await ctx.send(PROVIDER_ADDR, DataRequest(intent=intent, params=params))

    # reply to chat with compact summary
    preview = data if isinstance(data, dict) else {"data": data}
    text = f"intent={intent} ok={ok}\n{json.dumps(preview, ensure_ascii=False)[:800]}"
    await ctx.send(sender, ChatMessage(text=text))

# =========================
# PROVIDER PROTOCOL HANDLERS
# =========================
@provider_proto.on_message(model=DataResponse)
async def on_provider_response(ctx: Context, sender: str, msg: DataResponse):
    ctx.logger.info(f"[provider] from={sender} ok={msg.ok} message={msg.message}")

# =========================
# LIFECYCLE
# =========================
@requester.on_event("startup")
async def on_start(ctx: Context):
    ctx.logger.info(f"Requester up on port {PORT}, endpoint={ENDPOINT[0]}")
    if PROVIDER_ADDR:
        ctx.logger.info(f"Provider known: {PROVIDER_ADDR}")

# register protocols
requester.include(chat_proto)
requester.include(provider_proto)

if __name__ == "__main__":
    requester.run()
