# GenesisNet ICP Canisters

## Prasyarat
- dfx SDK sudah terinstal (`dfx --version`)
- Jalankan local replica: `dfx start --clean --background`

## Deploy
```bash
dfx deploy ledger

Panggil dari CLI (contoh)
# Log transaksi
dfx canister call ledger log_transaction '(record { provider_id="prov-1"; requester_id="req-9"; price=1_000_000_000 : nat64; data_hash="QmABC..." })'

# Ambil semua transaksi
dfx canister call ledger get_transactions '()'

# Lihat reputasi provider
dfx canister call ledger get_reputation '("prov-1")'

# Update reputasi +5
dfx canister call ledger update_reputation '("prov-1", 5)'

# Reset (local/dev)
dfx canister call ledger reset_all '()'

Catatan ICP Ledger (Pembayaran)

Untuk hackathon, kita cukup catat price & transaksi di canister ini. Integrasi pembayaran on‑chain ke ICRC‑1 Ledger bisa ditambahkan nanti (panggil canister Ledger resmi lalu verifikasi block/tx dan setelah konfirmasi, barulah log_transaction). Struktur fungsi kita memang sudah disiapkan untuk itu (log transaksi + reputasi). Spes ini mengikuti desain backend yang kita buat: fungsi reputasi + pencatatan transaksi untuk diakses Requester/Provider/Frontend.

Next hooks (biar nyambung dengan agent & frontend)

Requester/Provider Agent (uAgents): saat deal sukses, panggil ledger.log_transaction(...) lalu baca skor dengan ledger.get_reputation(provider_id) untuk negosiasi berikutnya.

Reputation Agent: kalau mau dipisah, ia bisa melakukan audit berkala + menyesuaikan skor via update_reputation/set_reputation. (Versi simpel: reputasi auto +1 tiap transaksi sukses—sudah di‑auto di log_transaction.)

Frontend Dashboard: polling get_transactions() / get_logs_since(lastId) untuk panel log & animasi network.