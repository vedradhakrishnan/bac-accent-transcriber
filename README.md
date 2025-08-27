# bac-accent-transcriber
full-stack speech-to-text web application powered by a fine-tuned Whisper model specialized for heavily accented English speech.

Developed as part of my role with the Stern Business Analytics Club, the model was trained on ~200 hours of accented clinical English audio using Transformers, PyTorch, and CUDA. On held-out test data, it outperformed OpenAI’s baseline Whisper model with an 86% reduction in Word Error Rate (WER).

This repository contains:

Server – a FastAPI backend that loads the fine-tuned model and exposes a /transcribe API for audio uploads.

Client – a Next.js React frontend that lets users record speech in the browser, upload it, and view real-time transcripts.