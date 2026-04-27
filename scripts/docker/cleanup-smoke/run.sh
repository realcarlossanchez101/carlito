#!/usr/bin/env bash
set -euo pipefail

cd /repo

export CARLITO_STATE_DIR="/tmp/carlito-test"
export CARLITO_CONFIG_PATH="${CARLITO_STATE_DIR}/carlito.json"

echo "==> Build"
if ! pnpm build >/tmp/carlito-cleanup-build.log 2>&1; then
  cat /tmp/carlito-cleanup-build.log
  exit 1
fi

echo "==> Seed state"
mkdir -p "${CARLITO_STATE_DIR}/credentials"
mkdir -p "${CARLITO_STATE_DIR}/agents/main/sessions"
echo '{}' >"${CARLITO_CONFIG_PATH}"
echo 'creds' >"${CARLITO_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${CARLITO_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
if ! pnpm carlito reset --scope config+creds+sessions --yes --non-interactive >/tmp/carlito-cleanup-reset.log 2>&1; then
  cat /tmp/carlito-cleanup-reset.log
  exit 1
fi

test ! -f "${CARLITO_CONFIG_PATH}"
test ! -d "${CARLITO_STATE_DIR}/credentials"
test ! -d "${CARLITO_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${CARLITO_STATE_DIR}/credentials"
echo '{}' >"${CARLITO_CONFIG_PATH}"

echo "==> Uninstall (state only)"
if ! pnpm carlito uninstall --state --yes --non-interactive >/tmp/carlito-cleanup-uninstall.log 2>&1; then
  cat /tmp/carlito-cleanup-uninstall.log
  exit 1
fi

test ! -d "${CARLITO_STATE_DIR}"

echo "OK"
