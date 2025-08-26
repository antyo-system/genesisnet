"""Agentverse chat agent for GenesisNet requester.

This agent exposes two simple chat commands for demonstration purposes:

* ``search <query>`` – emits an ``OFFER_NEW`` event containing a couple of
  dummy offers to the configured webhook.
* ``buy <offer_id>`` – emits a ``TX_SUCCESS`` event simulating a successful
  purchase of the given offer.

Both events are delivered via HTTP ``POST`` requests to ``AGENT_WEBHOOK_URL``
using the ``X-AGENT-SECRET`` header for authentication.
"""

from __future__ import annotations

import os
from dataclasses import asdict, dataclass

import requests
from uagents import Agent, Context, Model, Protocol


# ---------------------------------------------------------------------------
# Environment configuration
# ---------------------------------------------------------------------------
AGENT_NAME = os.getenv("REQUESTER_NAME", "genesisnet_requester")
AGENT_SEED = os.getenv("REQUESTER_SEED", "genesisnet-requester-seed")

# Networking configuration for the uAgents runtime.  When deployed inside
# Agentverse/ASI:One these values will typically be provided by the platform.
PORT = int(os.getenv("REQUESTER_PORT", "8000"))
ENDPOINT = [os.getenv("REQUESTER_ENDPOINT", f"http://127.0.0.1:{PORT}/submit")]

WEBHOOK_URL = os.getenv("AGENT_WEBHOOK_URL", "http://localhost:3000")
SHARED_SECRET = os.getenv("AGENT_SHARED_SECRET", "")


# ---------------------------------------------------------------------------
# Models and protocols
# ---------------------------------------------------------------------------
class ChatMessage(Model):
    """Simple text message used for chat interactions."""

    text: str


# We use a small dataclass to build dummy offer payloads.  It serialises nicely
# to JSON via ``asdict``.
@dataclass
class Offer:
    offer_id: str
    provider_id: str
    package_id: str
    name: str
    price: float


chat_proto = Protocol("chat")


# ---------------------------------------------------------------------------
# Agent setup
# ---------------------------------------------------------------------------
requester = Agent(name=AGENT_NAME, seed=AGENT_SEED, port=PORT, endpoint=ENDPOINT)
requester.include(chat_proto)


def _post_event(payload: dict) -> None:
    """Helper to deliver events to the GenesisNet webhook."""

    headers = {"X-AGENT-SECRET": SHARED_SECRET}
    try:
        requests.post(WEBHOOK_URL, json=payload, headers=headers, timeout=10)
    except Exception as exc:  # pragma: no cover - network failure is non fatal
        # The agent should keep running even if the webhook cannot be reached,
        # therefore we only log the error.
        print(f"Webhook post failed: {exc}")


@chat_proto.on_message(model=ChatMessage)
async def on_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    """Handle incoming chat messages."""

    text = msg.text.strip()

    if text.lower().startswith("search"):
        query = text[6:].strip() or ""

        offers = [
            Offer(
                offer_id="off-1",
                provider_id="prov-1",
                package_id="pkg-1",
                name=f"{query} basic",
                price=1.0,
            ),
            Offer(
                offer_id="off-2",
                provider_id="prov-2",
                package_id="pkg-2",
                name=f"{query} premium",
                price=2.0,
            ),
        ]

        event = {"type": "OFFER_NEW", "payload": [asdict(o) for o in offers]}
        _post_event(event)

        await ctx.send(sender, ChatMessage(text="search submitted"))

    elif text.lower().startswith("buy"):
        parts = text.split(maxsplit=1)
        offer_id = parts[1] if len(parts) > 1 else ""
        event = {
            "type": "TX_SUCCESS",
            "payload": {
                "tx_id": f"tx-{offer_id}" or "tx-0",
                "offer_id": offer_id,
                "amount": 0,
            },
        }
        _post_event(event)
        await ctx.send(sender, ChatMessage(text=f"purchase simulated for {offer_id}"))

    else:
        await ctx.send(sender, ChatMessage(text="unknown command"))


@requester.on_event("startup")
async def on_start(ctx: Context) -> None:
    """Log the agent address so it can be stored for the demo."""

    ctx.logger.info(f"GenesisNet Requester running at {ctx.address}")


if __name__ == "__main__":
    requester.run()

