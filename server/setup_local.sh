#!/usr/bin/env bash
set -euo pipefail

# 1) venv + deps
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 2) env
cp -n .env.example .env

# 3) pull model snapshot if missing
set -a; source .env; set +a
if [[ ! -d "$MODEL_PATH" || -z "$(ls -A "$MODEL_PATH" 2>/dev/null || true)" ]]; then
  echo "Downloading model snapshot: $MODEL_SLUG → $MODEL_PATH"
  python - <<PY
from huggingface_hub import snapshot_download
import os
repo_id = os.environ.get("MODEL_SLUG", "vedaradhak/bac-accent-transcriber")
local_dir = os.environ.get("MODEL_PATH", "./model")
snapshot_download(repo_id=repo_id, local_dir=local_dir, local_dir_use_symlinks=False)
print("✅ Model ready at", local_dir)
PY
else
  echo "✅ Model already present at $MODEL_PATH"
fi

echo "✅ Setup complete. Run ./start.sh to launch the API."
