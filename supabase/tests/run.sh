#!/usr/bin/env bash
# Corre las pruebas de seguridad y de concurrencia contra la base de datos de pruebas.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
echo "== Pruebas de seguridad (se revierten) =="
psql -v ON_ERROR_STOP=1 -q -f "$DIR/loyalty_security.sql" 2>&1 | grep -E 'OK:|FALLÓ|ERROR'
echo "== Pruebas de concurrencia =="
bash "$DIR/concurrency.sh"
