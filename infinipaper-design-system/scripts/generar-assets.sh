#!/usr/bin/env bash
# Regenera los SVG/PNG y verifica el sistema de diseño.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "Falta rsvg-convert. Instala librsvg2-bin." >&2
  exit 1
fi

python3 scripts/generar-assets.py
python3 scripts/verificar-assets.py
