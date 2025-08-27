from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio

from .config import MODEL_PATH, PROCESSOR_ID, ALLOWED_ORIGINS
from .asr import LocalASR

app = FastAPI(title="Accent Transcriber (Local)")
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["*"], allow_headers=["*"])

# load once
_asr = LocalASR(MODEL_PATH, PROCESSOR_ID)
gate = asyncio.Semaphore(2)  # limit concurrent jobs

@app.get("/health")
def health():
    import torch
    return {"ok": True, "device": "cuda" if torch.cuda.is_available() else "cpu"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        data = await file.read()
        if not data:
            raise HTTPException(400, "Empty file")
        async with gate:
            text = await asyncio.to_thread(_asr.transcribe, data)
        return {"text": text}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"{type(e).__name__}: {e}")
