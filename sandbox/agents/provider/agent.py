import os, json
from typing import Optional, Dict, Any, Tuple

import requests
from uagents import Agent, Context, Protocol, Model
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

# =========================
# ENV
# =========================
PROVIDER_NAME = os.getenv("PROVIDER_NAME", "genesisnet_provider")
PROVIDER_SEED = os.getenv("PROVIDER_SEED", "genesisnet-provider-dev")
PORT = int(os.getenv("PROVIDER_PORT", "8002"))
ENDPOINT = [os.getenv("PROVIDER_ENDPOINT", f"http://127.0.0.1:{PORT}/submit")]

# Backend (TS) gateway
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://127.0.0.1:8080")
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "")

# ICP (generic canister HTTP gateway you own; implement endpoint names bebas)
# contoh endpoint: /wallet/new, /wallet/balance, /tx/send, /tx/status
ICP_BASE_URL = os.getenv("ICP_BASE_URL", "http://127.0.0.1:4943")

TIMEOUT = 12

# =========================
# MODELS / PROTOCOL
# (boleh dipindah ke protocols.py untuk shared)
# =========================
class DataRequest(Model):
    intent: str
    params: Dict[str, Any]

class DataResponse(Model):
    ok: bool
    message: str
    data: Optional[Dict[str, Any]] = None

proto = Protocol("genesisnet_data_protocol")

# =========================
# HELPERS
# =========================
def _headers() -> Dict[str, str]:
    h = {"Content-Type": "application/json"}
    if BACKEND_API_KEY:
        h["x-api-key"] = BACKEND_API_KEY
    return h

def be_get(path: str) -> Tuple[bool, Any]:
    try:
        r = requests.get(f"{BACKEND_BASE_URL}{path}", headers=_headers(), timeout=TIMEOUT)
        return (True, r.json()) if r.ok else (False, {"status": r.status_code, "text": r.text})
    except Exception as e:
        return False, {"error": str(e)}

def be_post(path: str, payload: Dict[str, Any]) -> Tuple[bool, Any]:
    try:
        r = requests.post(f"{BACKEND_BASE_URL}{path}", headers=_headers(), data=json.dumps(payload), timeout=TIMEOUT)
        return (True, r.json()) if r.ok else (False, {"status": r.status_code, "text": r.text})
    except Exception as e:
        return False, {"error": str(e)}

def icp_post(path: str, payload: Dict[str, Any]) -> Tuple[bool, Any]:
    try:
        r = requests.post(f"{ICP_BASE_URL.rstrip('/')}/{path.lstrip('/')}", headers={"Content-Type":"application/json"}, data=json.dumps(payload), timeout=TIMEOUT)
        return (True, r.json()) if r.ok else (False, {"status": r.status_code, "text": r.text})
    except Exception as e:
        return False, {"error": str(e)}

def icp_get(path: str, params: Optional[Dict[str, Any]]=None) -> Tuple[bool, Any]:
    try:
        r = requests.get(f"{ICP_BASE_URL.rstrip('/')}/{path.lstrip('/')}", params=params or {}, timeout=TIMEOUT)
        if r.ok:
            try: return True, r.json()
            except: return True, {"text": r.text}
        return False, {"status": r.status_code, "text": r.text}
    except Exception as e:
        return False, {"error": str(e)}

# =========================
# EXECUTORS (GenesisNet domain)
# =========================
def exec_metrics(_: Dict[str, Any]):           return be_get("/api/dashboard/metrics")
def exec_logs(_: Dict[str, Any]):              return be_get("/api/dashboard/logs")
def exec_topology(_: Dict[str, Any]):          return be_get("/api/network/topology")
def exec_scan(_: Dict[str, Any]):              return be_post("/api/network/scan", {})

def exec_search(params: Dict[str, Any]):
    # contoh payload: { q, type, region, max_price_icp, rating_min }
    return be_post("/api/data/search", params)

# ===== Transaction flow (generic) =====
# kamu yang implement di backend/ICP. Nama endpoint bebas; ini contoh:
def exec_tx_init(params: Dict[str, Any]):
    """
    params minimal:
      - user_id
      - provider_id
      - package_id
      - amount_icp (float)
    backend sebaiknya: validasi → buat tx record → return tx_id, dest_wallet
    """
    return be_post("/api/tx/initiate", params)

def exec_tx_send(params: Dict[str, Any]):
    """
    params:
      - tx_id
      - from_wallet
      - to_wallet
      - amount_icp
    ICP: kirim transfer → return {tx_hash}
    """
    return icp_post("/tx/send", params)

def exec_tx_status(params: Dict[str, Any]):
    """
    params:
      - tx_id  (atau tx_hash)
    ICP: cek konfirmasi → return {status: pending/confirmed/failed}
    """
    return icp_get("/tx/status", {"tx_id": params.get("tx_id"), "tx_hash": params.get("tx_hash")})

def exec_wallet_new(_: Dict[str, Any]):
    # Buat wallet baru untuk user/provider (opsional, kalau kamu sediakan)
    return icp_post("/wallet/new", {})

def exec_wallet_balance(params: Dict[str, Any]):
    # params: { wallet }
    return icp_get("/wallet/balance", {"wallet": params.get("wallet")})

EXEC_MAP = {
    "metrics":        exec_metrics,
    "logs":           exec_logs,
    "topology":       exec_topology,
    "scan":           exec_scan,
    "search":         exec_search,
    # transaksi
    "tx_init":        exec_tx_init,      # init transaksi di backend (buat record)
    "tx_send":        exec_tx_send,      # kirim ICP via canister
    "tx_status":      exec_tx_status,    # cek status ICP/record
    # wallet
    "wallet_new":     exec_wallet_new,
    "wallet_balance": exec_wallet_balance,
}

# =========================
# AGENT
# =========================
provider = Agent(
    name=PROVIDER_NAME,
    seed=PROVIDER_SEED,
    port=PORT,
    endpoint=ENDPOINT,
)

# =========================
# HANDLERS
# =========================
@proto.on_message(model=DataRequest)
async def on_request(ctx: Context, sender: str, msg: DataRequest):
    ctx.logger.info(f"[provider] from={sender} intent={msg.intent} params={msg.params}")
    fn = EXEC_MAP.get(msg.intent)
    if not fn:
        await ctx.send(sender, DataResponse(ok=False, message=f"Unsupported intent: {msg.intent}"))
        return

    ok, data = fn(msg.params)
    payload = data if isinstance(data, dict) else {"data": data}
    await ctx.send(sender, DataResponse(ok=bool(ok), message=("ok" if ok else "error"), data=payload))

@provider.on_event("startup")
async def on_start(ctx: Context):
    ctx.logger.info(f"Provider up on {PORT} → {ENDPOINT[0]}")
    ctx.logger.info(f"BACKEND_BASE_URL={BACKEND_BASE_URL}")
    ctx.logger.info(f"ICP_BASE_URL={ICP_BASE_URL}")

provider.include(proto)

if __name__ == "__main__":
    provider.run()
