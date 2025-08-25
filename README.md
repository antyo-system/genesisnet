# GenesisNet – Autonomous Network for the AI Data Economy  

![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)  

## 🌍 Overview  

GenesisNet is an **autonomous data economy network** built on **Fetch.ai agents** and **Internet Computer (ICP)** canisters.  
Our vision is to decentralize the access, negotiation, and verification of data for AI systems — creating a **trustless, autonomous marketplace** where AI agents buy, sell, and validate data in real time.  

- **Hackathon:** Hackathon 16 (Fetch.ai × ICP)  
- **Team Members:**  
  - Antonius Prasetyo – Backend Developer, AI Engineer (Initiator)  
  - Natasha Putri – Frontend Developer, UI/UX Designer  
  - Dharil – Technical Support & Contributor  

---

## 🚨 The Problem  

Modern AI is **data-hungry** but faces:  
- **Fragmentation** – Data is siloed within large corporations.  
- **Inefficiency** – Independent developers struggle to access quality datasets.  
- **Lack of Trust** – No transparent verification of data authenticity or quality.  

---

## 💡 Our Solution  

GenesisNet introduces a **network of autonomous agents** that enable:  

- **Autonomous Data Discovery** – Requester agents find the most relevant datasets.  
- **Real-Time Negotiation** – Provider agents compete to offer the best price/quality.  
- **Trusted Transactions** – Reputation agents validate and record activity on-chain.  

All transactions are logged on **ICP canisters**, ensuring transparency and immutability.  

---

## ⚙️ System Architecture  

### Backend (AI Agents on Fetch.ai + ICP):contentReference[oaicite:5]{index=5}  
- **Framework:** Fetch.ai uAgent (Python)  
- **Deployment:** ICP canisters (dfx)  

#### Agents:  
1. **Data Requester Agent**  
   - Searches & purchases datasets autonomously.  
   - Evaluates offers (price, reputation, quality).  
   - Calls ICP canister: `log_transaction`, `update_reputation`.  

2. **Data Provider Agent**  
   - Publishes available datasets.  
   - Responds to queries with `DataOfferMessage`.  
   - Delivers data upon purchase & logs transaction on ICP.  

3. **Reputation Agent**  
   - Monitors on-chain transaction logs.  
   - Updates provider scores (`reputation += 1` per success).  

#### Protocol Messages:  
- `DataQueryMessage { query_type, criteria }`  
- `DataOfferMessage { provider_id, price, data_hash, reputation }`  
- `PurchaseMessage { offer_id, requester_id }`  

---

### Frontend (Visualization & Interaction):contentReference[oaicite:6]{index=6}  
- **Framework:** React + Vite  
- **Libraries:** D3.js/Vis.js (network graph), @dfinity/agent (ICP calls)  

#### Key UI Components:  
- **Network Visualization** – Graph of requester (center) and providers (peripheral).  
- **Control Panel** – User input for data criteria.  
- **Real-time Log Panel** – Displays negotiations and transactions.  
- **Metrics Dashboard** – Tracks total transactions & network latency.  

#### Flow:  
1. User submits criteria in Control Panel.  
2. Requester Agent canister starts search.  
3. Providers respond → offers visualized on graph.  
4. Negotiations & transactions logged in real-time.  

---

## 📦 Project Setup:contentReference[oaicite:7]{index=7}  

### Prerequisites  
- **Backend:** Python 3.9+, Fetch.ai `uagent`, ICP SDK (`dfx`)  
- **Frontend:** Node.js 20+, npm/yarn, Vite  

### Backend Setup  
```bash
# Install dependencies
pip install uagent
sh -ci "$(curl -sS https://internetcomputer.org/install.sh)"

# Start local replica
dfx start --clean --background

# Deploy canisters
dfx deploy
