#!/bin/bash

CRONOS_URL="https://apibr.unex.ar"
CRONOS_USERNAME="pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh"
CRONOS_PASSWORD="priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz"
CRONOS_USER_PASSWORD="abc123\$!"
USER_DOCUMENT="46087750819"

ID_PAGAMENTO="${1:-99b85d20-3b6e-4bcf-a133-fb62797592ea}"
VALOR="${2:-0.11}"
DESCRIPTION="Transferência PIX teste"

echo "═══════════════════════════════════════════════════════"
echo "Quick Test - Confirm Transfer PIX"
echo "═══════════════════════════════════════════════════════"
echo "ID_PAGAMENTO: ${ID_PAGAMENTO}"
echo "VALOR: ${VALOR}"
echo ""
echo "Usage: ./test-cronos-curl-simple.sh [id_pagamento] [valor]"
echo "Example: ./test-cronos-curl-simple.sh 99b85d20-3b6e-4bcf-a133-fb62797592ea 0.11"
echo ""

echo "Getting application token..."
APP_TOKEN=$(curl -s -X GET \
  "${CRONOS_URL}/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CRONOS_USERNAME}:${CRONOS_PASSWORD}" | base64)" \
  | jq -r '.token')

if [ -z "$APP_TOKEN" ] || [ "$APP_TOKEN" = "null" ]; then
  echo "ERROR: Failed to get application token"
  exit 1
fi

echo "SUCCESS: App token obtained"
echo ""

echo "Getting user token..."
USER_TOKEN=$(curl -s -X POST \
  "${CRONOS_URL}/api/v1/user/auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${APP_TOKEN}" \
  -d "{\"document\":\"${USER_DOCUMENT}\",\"password\":\"${CRONOS_USER_PASSWORD}\"}" \
  | jq -r '.token')

if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" = "null" ]; then
  echo "ERROR: Failed to get user token"
  exit 1
fi

echo "SUCCESS: User token obtained"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "Confirming PIX transfer..."
echo "POST ${CRONOS_URL}/api/v1/pix/confirmartransferencia"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${CRONOS_URL}/api/v1/pix/confirmartransferencia" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d "{
    \"id_pagamento\": \"${ID_PAGAMENTO}\",
    \"valor\": \"${VALOR}\",
    \"description\": \"${DESCRIPTION}\",
    \"save_as_favorite\": 0
  }")

HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Response Status: ${HTTP_STATUS}"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  SUCCESS=$(echo "$BODY" | jq -r '.success' 2>/dev/null)
  if [ "$SUCCESS" = "true" ]; then
    echo "SUCCESS: Transfer confirmed successfully!"
  else
    echo "WARNING: API returned success: ${SUCCESS}"
    MESSAGE=$(echo "$BODY" | jq -r '.message' 2>/dev/null)
    echo "Message: ${MESSAGE}"
  fi
else
  echo "ERROR: Failed to confirm transfer. Status: ${HTTP_STATUS}"
  MESSAGE=$(echo "$BODY" | jq -r '.message' 2>/dev/null)
  if [ -n "$MESSAGE" ] && [ "$MESSAGE" != "null" ]; then
    echo "Error message: ${MESSAGE}"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════"
