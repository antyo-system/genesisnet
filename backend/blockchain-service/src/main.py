from fastapi import FastAPI
from services import wallet_service, tx_service, reputation_service

app = FastAPI(title="Blockchain Service")

@app.post("/wallet/new")
def wallet_new():
    return wallet_service.create_wallet()

@app.get("/wallet/balance/{address}")
def wallet_balance(address: str):
    return wallet_service.get_balance(address)

@app.post("/tx/initiate")
def tx_initiate(sender: str, receiver: str, amount: int):
    return tx_service.initiate_tx(sender, receiver, amount)

@app.get("/tx/status/{tx_id}")
def tx_status(tx_id: str):
    return tx_service.check_tx_status(tx_id)

@app.post("/reputation/update")
def reputation_update(user: str, score: int):
    return reputation_service.update_reputation(user, score)

@app.get("/reputation/{user}")
def reputation_get(user: str):
    return reputation_service.get_reputation(user)
