#!/usr/bin/env bash

# Uso:
#   ./build.sh [RUTA_CLAVE_PRIVADA_O_BASE64] [URL_DESCARGA] [PASSWORD_CLAVE] [NOTAS]
# Ejemplo:
#   ./build.sh src-tauri/secret.key "https://github.com/USER/REPO/releases/download/v0.1.0" "mipass" "Notas de la versión"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

PRIVATE_KEY_INPUT="${1:-}"
DOWNLOAD_BASE_URL="${2:-}"
KEY_PASSWORD="${3:-}"
RELEASE_NOTES="${4:-}"

echo "[INFO] Construyendo frontend Next.js..."
npm run build

echo "[INFO] Construyendo bundle de Tauri..."
if ! npx --yes @tauri-apps/cli build -f --config src-tauri/tauri.conf.json; then
  echo "[WARN] Falló el build directo; intentando con 'npm run dist'..."
  npm run dist
fi

echo "[INFO] Buscando instalador NSIS generado..."
INSTALLER="$(find src-tauri/target/release/bundle/nsis -type f -name '*_x64-setup.exe' -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n1 | cut -d' ' -f2- || true)"
if [[ -z "${INSTALLER}" ]]; then
  echo "[ERROR] No se encontró el instalador NSIS en src-tauri/target/release/bundle/nsis"
  exit 1
fi
echo "[INFO] Instalador encontrado: ${INSTALLER}"

echo "[INFO] Obteniendo versión desde src-tauri/tauri.conf.json..."
APP_VERSION="$(node -pe "require('./src-tauri/tauri.conf.json').version" 2>/dev/null || true)"
if [[ -z "${APP_VERSION}" ]]; then
  echo "[ERROR] No se pudo leer la versión de src-tauri/tauri.conf.json"
  exit 1
fi
echo "[INFO] Versión detectada: ${APP_VERSION}"

DEFAULT_KEY_PATH="src-tauri/secret.key"
PRIVATE_KEY_VALUE=""
PRIVATE_KEY_SOURCE=""

if [[ -n "${PRIVATE_KEY_INPUT}" ]]; then
  if [[ -f "${PRIVATE_KEY_INPUT}" ]]; then
    PRIVATE_KEY_SOURCE="${PRIVATE_KEY_INPUT}"
    PRIVATE_KEY_VALUE="$(tr -d '\r\n' < "${PRIVATE_KEY_INPUT}")"
  else
    PRIVATE_KEY_SOURCE="valor en línea de comandos"
    PRIVATE_KEY_VALUE="${PRIVATE_KEY_INPUT}"
  fi
else
  if [[ -f "${DEFAULT_KEY_PATH}" ]]; then
    PRIVATE_KEY_SOURCE="${DEFAULT_KEY_PATH}"
    PRIVATE_KEY_VALUE="$(tr -d '\r\n' < "${DEFAULT_KEY_PATH}")"
  else
    echo "[ERROR] No se encontró la clave privada. Pasa la ruta como primer argumento o colócala en ${DEFAULT_KEY_PATH}"
    exit 1
  fi
fi

if [[ -z "${PRIVATE_KEY_VALUE}" ]]; then
  echo "[ERROR] La clave privada está vacía"
  exit 1
fi

if [[ -z "${DOWNLOAD_BASE_URL}" ]]; then
  DOWNLOAD_BASE_URL="https://github.com/andiricum2/Faltas-Cebanc/releases/download/v${APP_VERSION}"
fi

export TAURI_PRIVATE_KEY="${PRIVATE_KEY_VALUE}"
if [[ -n "${KEY_PASSWORD}" ]]; then
  export TAURI_KEY_PASSWORD="${KEY_PASSWORD}"
else
  unset TAURI_KEY_PASSWORD 2>/dev/null || true
fi

echo "[INFO] Usando PRIVATE_KEY desde: ${PRIVATE_KEY_SOURCE}"
echo "[INFO] Usando DOWNLOAD_BASE_URL: ${DOWNLOAD_BASE_URL}"

echo "[INFO] Firmando instalador..."
SIGN_OUTPUT="$(npx --yes @tauri-apps/cli signer sign "${INSTALLER}" 2>&1)" || {
  echo "[ERROR] Falló la firma del instalador:"
  echo "${SIGN_OUTPUT}"
  exit 1
}

SIGNATURE="$(echo "${SIGN_OUTPUT}" | sed -n 's/.*Public signature:[[:space:]]*\([A-Za-z0-9+/=]\+\).*/\1/p' | tail -n1)"
if [[ -z "${SIGNATURE}" ]]; then
  SIGNATURE="$(echo "${SIGN_OUTPUT}" | tr ' ' '\n' | grep -E '^[A-Za-z0-9+/=]+$' | tail -n1 || true)"
fi

if [[ -z "${SIGNATURE}" ]]; then
  echo "[ERROR] No se pudo extraer la firma pública del resultado de la firma"
  exit 1
fi

INSTALLER_NAME="$(basename "${INSTALLER}")"
ENCODED_NAME="$(python3 - <<'PY' "${INSTALLER_NAME}"
import sys, urllib.parse
print(urllib.parse.quote(sys.argv[1]))
PY
)"

DOWNLOAD_URL="${DOWNLOAD_BASE_URL}/${ENCODED_NAME}"
PUB_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
if [[ -z "${RELEASE_NOTES}" ]]; then
  RELEASE_NOTES="Release ${APP_VERSION}"
fi

python3 - <<'PY' "${APP_VERSION}" "${RELEASE_NOTES}" "${PUB_DATE}" "${SIGNATURE}" "${DOWNLOAD_URL}"
import json
import sys

version, notes, pub_date, signature, url = sys.argv[1:6]
payload = {
    "version": version,
    "notes": notes,
    "pub_date": pub_date,
    "platforms": {
        "windows-x86_64": {
            "signature": signature,
            "url": url,
        }
    },
}

with open("src-tauri/latest.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False)
PY

echo "[INFO] latest.json generado en src-tauri/latest.json"
echo "[INFO] Proceso completado correctamente."


