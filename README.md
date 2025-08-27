# bac-accent-transcriber

Full-stack speech-to-text web application powered by a fine-tuned Whisper model specialized for heavily accented English speech.

---

## 📖 Background

Developed as part of my role with the Stern Business Analytics Club.  
- Trained on ~200 hours of accented clinical English audio using Transformers, PyTorch, and CUDA.  
- On held-out test data, the fine-tuned model achieved an 86% reduction in Word Error Rate (WER) compared to OpenAI’s baseline Whisper.

---

## 📂 Repository Structure

- **[`server/`](server/README.md)** — FastAPI backend that loads the model and exposes a `/transcribe` API.  
- **[`client/`](client/README.md)** — Next.js React frontend that records audio in the browser, sends it to the server, and displays transcripts.

---

## 🚀 Running Locally

- Backend: see [server/README.md](server/README.md)  
- Frontend: see [client/README.md](client/README.md) (Next.js default instructions)

Run both in separate terminals, then visit [http://localhost:3000](http://localhost:3000).

---

## 🔑 Key Features
- Fine-tuned Whisper model for accented English  
- Browser-based recording and preview  
- Real-time transcription through FastAPI API  
- Modular design (server/client split)

---

## 📝 License
MIT