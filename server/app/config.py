import os

MODEL_PATH = os.getenv("MODEL_PATH", "./model")
PROCESSOR_ID = os.getenv("PROCESSOR_ID", "openai/whisper-small")
PORT = int(os.getenv("PORT", "8000"))
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")]
MODEL_SLUG = os.getenv("MODEL_SLUG", "vedaradhak/bac-accent-transcriber")
