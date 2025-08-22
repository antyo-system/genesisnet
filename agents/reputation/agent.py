import os
from typing import Dict, List, Optional, Tuple
from pathlib import Path

from dotenv import load_dotenv
from uagents import Agent, Context, Protocol, Model

# --- .env ---
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))  # prioritas .env di folder agent
load_dotenv(override=False)  # optional fallback ke root .env

NAME = os.getenv("REPUTATION_NAME", "genesisnet_reputation")
SEED = os.getenv("REPUTATION_SEED", "genesisnet-reputation-dev")
PORT = int(os.getenv("REPUTATION_PORT", "8003"))
ENDPOINT = [os.getenv("REPUTATION_ENDPOINT", f"http://127.0.0.1:{PORT}/submit")]
KEEP_LAST = int(os.getenv("REPUTATION_KEEP_LAST", "50"))  # simpan N rating terakhir per provider

# --- shared protocol definition (local) ---
reputation_proto = Protocol("genesisnet_reputation_protocol")

class RateRequest(Model):
    provider_id: str
    score: int           # 1..5
    reason: Optional[str] = None

class RateResponse(Model):
    ok: bool
    provider_id: str
    new_avg: float
    total_ratings: int

class ReputationQuery(Model):
    provider_id: str

class ReputationInfo(Model):
    provider_id: str
    avg: float
    histogram: Dict[int, int]         # {1: n1, ..., 5: n5}
    last_n: Optional[List[int]] = None

# --- storage (in-memory) ---
_RATINGS: Dict[str, List[int]] = {}          # provider_id -> list[rating]
_HIST: Dict[str, Dict[int, int]] = {}        # provider_id -> {1..5: count}

def _clamp_score(s: int) -> int:
    return max(1, min(5, int(s)))

def _add_rating(pid: str, score: int) -> Tuple[float, int]:
    score = _clamp_score(score)
    if pid not in _RATINGS:
        _RATINGS[pid] = []
        _HIST[pid] = {i: 0 for i in range(1, 6)}
    # append + keep last N
    _RATINGS[pid].append(score)
    if len(_RATINGS[pid]) > KEEP_LAST:
        removed = _RATINGS[pid].pop(0)
        _HIST[pid][removed] = max(0, _HIST[pid][removed] - 1)
    _HIST[pid][score] += 1

    lst = _RATINGS[pid]
    avg = sum(lst) / len(lst)
    return round(avg, 3), len(lst)

def _get_info(pid: str) -> Tuple[float, Dict[int, int], List[int]]:
    if pid not in _RATINGS or not _RATINGS[pid]:
        return 0.0, {i: 0 for i in range(1, 6)}, []
    lst = _RATINGS[pid]
    avg = round(sum(lst) / len(lst), 3)
    return avg, dict(_HIST[pid]), lst[-min(len(lst), KEEP_LAST):]

# --- agent ---
rep = Agent(name=NAME, seed=SEED, port=PORT, endpoint=ENDPOINT)

@reputation_proto.on_message(model=RateRequest)
async def on_rate(ctx: Context, sender: str, msg: RateRequest):
    avg, total = _add_rating(msg.provider_id, msg.score)
    ctx.logger.info(f"[rate] from={sender} provider={msg.provider_id} score={msg.score} avg={avg} n={total}")
    await ctx.send(sender, RateResponse(ok=True, provider_id=msg.provider_id, new_avg=avg, total_ratings=total))

@reputation_proto.on_message(model=ReputationQuery)
async def on_query(ctx: Context, sender: str, msg: ReputationQuery):
    avg, hist, last_n = _get_info(msg.provider_id)
    ctx.logger.info(f"[query] from={sender} provider={msg.provider_id} avg={avg} n={sum(hist.values())}")
    await ctx.send(sender, ReputationInfo(provider_id=msg.provider_id, avg=avg, histogram=hist, last_n=last_n))

@rep.on_event("startup")
async def on_start(ctx: Context):
    ctx.logger.info(f"Reputation up on {PORT} → {ENDPOINT[0]}; KEEP_LAST={KEEP_LAST}")

rep.include(reputation_proto)

if __name__ == "__main__":
    rep.run()
