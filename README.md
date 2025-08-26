# GenesisNet – Autonomous Network for the AI Data Economy

![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)

## 🌍 Overview

GenesisNet is an **autonomous data economy network** built on **Fetch.ai agents** and **Internet Computer (ICP)** canisters.  
Our mission: decentralize how AI discovers, negotiates, and validates data — enabling a **trustless, autonomous marketplace**.

- **Hackathon:** Hackathon 16 (Fetch.ai × ICP)
- **Team Members:**
  - Antonius Prasetyo – Backend Developer, AI Engineer (Initiator)
  - Natasha Putri – Frontend Developer, UI/UX Designer
  - Dharil – Technical Support & Contributor

---

## 🚨 The Problem

AI cannot thrive without high-quality data, yet today’s ecosystem is:

- **Fragmented** – Datasets locked in silos.
- **Inefficient** – Independent AI devs lack affordable access.
- **Untrusted** – No transparent way to verify authenticity.

---

## 💡 Our Solution

GenesisNet introduces a **living data marketplace** where agents autonomously:

- **Discover data** (Requester Agents).
- **Negotiate offers** (Provider Agents).
- **Enforce trust** with on-chain reputation (Reputation Agents).

All transactions are recorded in **immutable ICP canisters**.

---

## ⚙️ System Architecture

GenesisNet is built as a **full-stack decentralized system**, combining autonomous agents, blockchain integration, and a real-time dashboard.

### Backend – Microservices + AI Agents

**Tech Stack:** Node.js, Express, TypeScript, PostgreSQL, Redis, Socket.io  
**Pattern:** Microservices architecture  
**Blockchain:** Internet Computer Protocol (ICP) canisters  
**Real-time:** WebSocket broadcasts for live updates

#### Core Microservices

- **API Gateway** – Main entry point, routes all requests
- **Metrics Service** – Calculates KPIs and usage metrics
- **Search Service** – Filters providers and datasets
- **Network Service** – Manages node topology (scan, ping, discovery)
- **Transaction Service** – Handles payments & ICP ledger integration
- **WebSocket Service** – Publishes live updates (metrics/logs/topology)
- **Blockchain Service** – Calls ICP canisters for logging & reputation

#### Database (PostgreSQL)

- `users` – Buyers
- `providers` – Data sellers
- `data_packages` – Data inventory
- `transactions` – Transaction records
- `network_nodes` – Nodes for visualization
- `activity_logs` – Real-time activity

#### Backend Flows

1. **Dashboard Init** – API returns metrics, topology, logs to frontend
2. **Search Data** – User filters → DB query → return results + metrics
3. **Real-time Updates** – Every 3s recalc → WebSocket broadcast → live UI
4. **Network Scan** – Ping nodes → update topology → broadcast changes
5. **Transaction** – Validate request → ICP transfer → monitor blockchain → complete/rollback

**API Endpoints**

- `GET /api/dashboard/metrics`
- `GET /api/dashboard/logs`
- `GET /api/network/topology`
- `POST /api/data/search` – search data packages with optional filters (`q`, `tags[]`, `max_price`, `provider_id`)
- `POST /api/network/scan`

**WebSocket Events**

- `metrics_update`
- `activity_log`
- `network_update`
- `search_results`

**Security**

- JWT authentication, input validation
- Rate limiting & CORS rules
- Wallet signature verification

**Monitoring**

- Health checks
- Performance & query monitoring
- WebSocket connection tracking

---

### Frontend – 3-Panel Dashboard

**Tech Stack:** React (Vite), D3.js/Vis.js, @dfinity/agent

#### UI Layout

- **Left (Control Panel):** Input search criteria
- **Center (Network Visualization):** Live topology of requester & providers
- **Right (Log/Overview):** Transparent transaction log
- **Bottom (Metrics):** KPIs (transactions, latency, reputation scores)

**User Flow**

1. User enters criteria → triggers Data Requester Agent
2. Provider agents respond → offers visualized as flashing edges
3. Requester finalizes → ICP logs transaction → Reputation updated
4. UI updates all 3 panels in real-time

This layout = **cockpit design**:  
**Input (left) → Live process (center) → Verified output (right)**.  
Judges instantly see the _autonomy & decentralization in action_.

---

### How Backend & Frontend Connect

- **Frontend** calls REST APIs & subscribes to WebSocket events for **real-time responsiveness**.
- **Backend microservices** orchestrate search, metrics, and ICP transactions.
- **ICP canisters** ensure **immutable logging, payment, and reputation updates**.
- **Dashboard visualization** (network graph + logs) provides a **proof-of-concept UX** showing that the system is alive, not static.

#### UI Components:

- **Control Panel (Left):** User inputs search criteria.
- **Network Visualization (Center):** Live topology of agents.
- **Real-time Log (Right):** Transparent record of offers & transactions.
- **Metrics Panel (Bottom):** Key stats (transactions, latency).

This **three-panel cockpit design** ensures clarity and impact:

- **Left (Input)** → **Center (Visual Result)** → **Right (Details)**:contentReference[oaicite:4]{index=4}.  
  It creates the _“wow” moment_ instantly when judges open the demo.

---

## 🔄 How GenesisNet Works

1. **Requester Agent** sends a query (search criteria).
2. **Provider Agents** respond with offers (price, quality, reputation).
3. **Requester** selects the best offer and finalizes the transaction.
4. **Reputation Agent** monitors and updates provider scores on-chain.
5. **Dashboard** visualizes the entire workflow (query → negotiation → transaction).

### Transaction States

Transactions move through a simple state machine:
`PENDING` → `PROCESSING` → `CONFIRMED`/`FAILED`. Each record stores the
`tx_hash`, `amount`, `provider_id`, `package_id`, and `user_id` so the
status of any payment can be monitored and retried if necessary.

---

## 🧩 Fetch.ai Agents

| Agent Name           | Role                 | Example Address               |
| -------------------- | -------------------- | ----------------------------- |
| Data Requester Agent | Search & purchase    | `fetch:genesisnet/requester`  |
| Data Provider Agent  | Provide & sell data  | `fetch:genesisnet/provider`   |
| Reputation Agent     | Maintain trust score | `fetch:genesisnet/reputation` |

_(Addresses finalized after deployment)_

---

## 🏆 Key Features & Advantages

| Conventional Data Platforms (e.g. Kaggle, Bright Data) | GenesisNet                                   |
| ------------------------------------------------------ | -------------------------------------------- |
| Centralized, manual browsing                           | Autonomous, decentralized agents             |
| Trust in platform brand                                | Trust via on-chain reputation ledger         |
| High fees, intermediaries                              | Minimal cost, direct peer-to-peer            |
| Static catalog showcase                                | Live, visualized negotiations & transactions |

**Visual Topology = Proof of Autonomy.**  
Instead of static datasets, we show the _process_ of agents negotiating and transacting live — a clear differentiator.

---

## 🚀 How to Run GenesisNet

Follow these steps to run the project locally. Everything is containerized and scriptable — no need to dig into source code.

### 1. Clone the Repository

`git clone https://github.com/<your-team>/genesisnet.git
cd genesisnet`

2. Start the Backend (Agents + ICP Canisters)

# Install Python deps (Fetch.ai uAgents)

pip install uagents

# Install Internet Computer SDK

sh -ci "$(curl -sS https://internetcomputer.org/install.sh)"

# Launch local ICP replica

dfx start --clean --background

# Deploy all canisters (agents, reputation, ledger, etc.)

dfx deploy

Once deployed, you will see canister IDs printed in the terminal — keep these, the frontend will use them. 3. Start the Frontend Dashboard

# Move into frontend folder

cd frontend

# Install dependencies

npm install

# Run development server

npm run dev

4. Interact with the System
   Enter search criteria in the left panel.
   Watch the network visualization come alive in the center.
   Track logs and metrics updating in real time on the right & bottom.
   Try a purchase flow: Requester → Provider → Reputation update → On-chain log.

## 🔮 Future Development & Vision

We see GenesisNet not only as a hackathon prototype, but as the foundation of a decentralized AI data economy.  
Planned directions include:

- **Scaling Agents** → Support thousands of requester and provider agents running in parallel.
- **Advanced Reputation Model** → Move beyond simple counters into trust scoring, fraud detection, and incentive design.
- **Multi-chain Support** → Extend beyond ICP to other blockchains for interoperability.
- **Token Economy** → Native token for payments, staking, and reputation collateral.
- **Marketplace Expansion** → Integration with external datasets, IoT feeds, and real-time APIs.
- **UI/UX Enhancements** → Richer visualization, multi-agent simulation modes, and mobile access.
- **Open Developer Ecosystem** → Allow third parties to plug in new agent types and monetize their data/services.

Our long-term vision: **GenesisNet as the trust layer for AI data markets globally — autonomous, transparent, and unstoppable.**
