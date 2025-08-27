import io
import tempfile
from typing import Optional

import torch
import librosa
from transformers import WhisperProcessor, WhisperForConditionalGeneration

class LocalASR:
    def __init__(self, model_path: str, processor_id: str, device: Optional[str] = None):
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.model = WhisperForConditionalGeneration.from_pretrained(model_path).to(self.device)
        self.processor = WhisperProcessor.from_pretrained(processor_id)

    def transcribe(self, audio_bytes: bytes) -> str:
        # librosa works best with a file path for mp3/wav → write bytes to a temp file
        with tempfile.NamedTemporaryFile(suffix=".audio", delete=True) as tmp:
            tmp.write(audio_bytes)
            tmp.flush()
            audio, sr = librosa.load(tmp.name, sr=16000, mono=True)
        inputs = self.processor(audio, sampling_rate=16000, return_tensors="pt").input_features.to(self.device)
        ids = self.model.generate(inputs)
        return self.processor.batch_decode(ids, skip_special_tokens=True)[0]
