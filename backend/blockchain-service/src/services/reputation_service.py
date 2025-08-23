user_reputation = {}

def update_reputation(user: str, score: int):
    user_reputation[user] = user_reputation.get(user, 0) + score
    return {"user": user, "score": user_reputation[user]}

def get_reputation(user: str):
    return {"user": user, "score": user_reputation.get(user, 0)}
