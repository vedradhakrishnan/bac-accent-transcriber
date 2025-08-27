# server/app/asr.py
import subprocess, numpy as np, tempfile, torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration

class LocalASR:
    def __init__(self, model_path: str, processor_id: str, device: str | None = None):
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.model = WhisperForConditionalGeneration.from_pretrained(model_path).to(self.device)
        self.processor = WhisperProcessor.from_pretrained(processor_id)

    def _decode_to_pcm16k(self, audio_bytes: bytes) -> np.ndarray:
        """Use ffmpeg to decode arbitrary input (webm/ogg/mp3/wav) -> mono 16k float32 PCM."""
        proc = subprocess.Popen(
            ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
             "-i", "pipe:0",
             "-f", "f32le", "-ac", "1", "-ar", "16000", "pipe:1"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        out, err = proc.communicate(input=audio_bytes)
        if proc.returncode != 0 or not out:
            raise RuntimeError(f"ffmpeg decode failed: {err.decode().strip() or 'no error text'}")
        return np.frombuffer(out, dtype=np.float32)

    def transcribe(self, audio_bytes: bytes) -> str:
        audio = self._decode_to_pcm16k(audio_bytes)     # <— robust decode
        feats = self.processor(audio, sampling_rate=16000, return_tensors="pt").input_features.to(self.device)
        ids = self.model.generate(feats)
        return self.processor.batch_decode(ids, skip_special_tokens=True)[0]
