#!/usr/bin/env bash
# Crea el esqueleto de una spec SDD ligera.
# Uso: ./docs/sdd/nueva-spec.sh <slug>
# Ejemplo: ./docs/sdd/nueva-spec.sh buscador-proyecto

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Uso: $0 <slug>" >&2
  echo "Ejemplo: $0 buscador-proyecto" >&2
  exit 1
fi

slug="$1"
if [[ ! "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Slug inválido: '$slug'. Usa minúsculas, números y guiones (ej. buscador-proyecto)." >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
specs_dir="$script_dir/specs"
templates_dir="$script_dir/plantillas"

last_number="$(
  find "$specs_dir" -maxdepth 1 -type d -name '[0-9][0-9][0-9]-*' -printf '%f\n' \
    | cut -d- -f1 \
    | sort -n \
    | tail -1
)"

if [[ -z "$last_number" ]]; then
  next_number=1
else
  next_number=$((10#$last_number + 1))
fi

spec_id="$(printf '%03d' "$next_number")"
target="$specs_dir/$spec_id-$slug"

if [[ -e "$target" ]]; then
  echo "La spec ya existe: $target" >&2
  exit 1
fi

mkdir -p "$target"
cp "$templates_dir/spec.md" "$target/spec.md"
cp "$templates_dir/plan.md" "$target/plan.md"
cp "$templates_dir/tasks.md" "$target/tasks.md"
sed -i "s/\`NNN\`/\`$spec_id\`/g" "$target/spec.md"

echo "Spec creada: $target"
echo
echo "Siguientes pasos:"
echo "  1. Completa $target/spec.md (estado: Borrador)."
echo "  2. Añádela a docs/sdd/specs/README.md."
echo "  3. No implementes hasta que el estado sea 'Aprobada'."
