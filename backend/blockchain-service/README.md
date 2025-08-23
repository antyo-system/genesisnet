# Blockchain Service (GenesisNet)

Service ini mengurus semua interaksi dengan blockchain:
- Wallet (buat wallet, cek saldo)
- Transaksi (initiate, status)
- Reputasi user (update, ambil)

## Run Locally
```bash
uvicorn src.main:app --reload --port 9000
