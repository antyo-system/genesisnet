# GenesisNet Requester Agent

Agent ini adalah **Requester** untuk GenesisNet.
- Terima natural language via Fetch.ai Chat Protocol
- Parse intent (metrics, logs, topology, scan, search)
- Forward ke backend (`Node.js + Express + PostgreSQL + Redis`)
- Opsional: kirim request ke Provider Agent

## Jalankan Lokal

```bash
cd agents/requester
pip install -r requirements.txt
python agent.py
