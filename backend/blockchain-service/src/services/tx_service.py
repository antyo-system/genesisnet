def initiate_tx(sender: str, receiver: str, amount: int):
    # dummy tx
    return {"tx_id": "tx_001", "status": "pending"}

def check_tx_status(tx_id: str):
    return {"tx_id": tx_id, "status": "confirmed"}
