# 🎙️ Accent Transcriber — Server

FastAPI backend for the Accent Transcriber app.  
Loads the fine-tuned Whisper model and exposes REST endpoints for transcription.

---

## Quick Start

### 1. Requirements
- Python ≥ 3.10
- [ffmpeg](https://ffmpeg.org/) installed (`brew install ffmpeg` on macOS, `sudo apt-get install -y ffmpeg` on Linux)

### 2. Setup
```bash
cd server
chmod +x setup_local.sh start.sh
./setup_local.sh
```

### 3. Run
```bash
./start.sh
```
