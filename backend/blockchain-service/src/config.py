import os
from dotenv import load_dotenv

load_dotenv()

BLOCKCHAIN_ENDPOINT = os.getenv("BLOCKCHAIN_ENDPOINT", "http://localhost:8000")
