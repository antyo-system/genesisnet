# Provider Agent (GenesisNet)

Terima `DataRequest` via uAgents → panggil **Backend/ICP** → balas `DataResponse`.

## Quickstart
```bash
cd agents/provider
pip install -r requirements.txt
python agent.py

.env (wajib)
PROVIDER_NAME=genesisnet_provider
PROVIDER_SEED=genesisnet-provider-dev
PROVIDER_PORT=8002
PROVIDER_ENDPOINT=http://127.0.0.1:8002/submit

BACKEND_BASE_URL=http://127.0.0.1:8080
BACKEND_API_KEY=

ICP_BASE_URL=http://127.0.0.1:4943

## Intent → Endpoint

- `metrics` → `GET /api/dashboard/metrics` *(Backend)*
- `logs` → `GET /api/dashboard/logs` *(Backend)*
- `topology` → `GET /api/network/topology` *(Backend)*
- `scan` → `POST /api/network/scan` *(Backend)*
- `search` → `POST /api/data/search` *(Backend)*
- `tx_init` → `POST /api/tx/initiate` *(Backend)*
- `tx_send` → `POST /tx/send` *(ICP)*
- `tx_status` → `GET /tx/status?tx_id=...` *(ICP)*
- `wallet_new` → `POST /wallet/new` *(ICP)*
- `wallet_balance` → `GET /wallet/balance?wallet=...` *(ICP)*

## Notes
- Butuh **Python 3.10+**
- Jangan commit `.env` → pastikan `**/.env` ada di `.gitignore`
- Kalau pakai schema/protocol bersama, simpan di `agents/protocols.py`
