#!/usr/bin/env bash
set -euo pipefail
if [[ -f .env ]]; then set -a; source .env; set +a; fi
exec ./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
