#!/bin/bash

CRONOS_URL="https://apibr.unex.ar"
CRONOS_USERNAME="pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh"
CRONOS_PASSWORD="priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz"
CRONOS_USER_PASSWORD="abc123\$!"
USER_DOCUMENT="46087750819"

PIX_KEY_TYPE="cpf"
PIX_KEY_VALUE="12345678900"
VALOR="0.11"
DESCRIPTION="Transferência PIX teste"

echo "═══════════════════════════════════════════════════════"
echo "Cronos API Test - Direct curl requests"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Step 1: Getting application token..."
echo "URL: GET ${CRONOS_URL}/api/v1/application/token"
echo "Auth: Basic (${CRONOS_USERNAME}:${CRONOS_PASSWORD})"
echo ""

APP_TOKEN_RESPONSE=$(curl -s -X GET \
  "${CRONOS_URL}/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CRONOS_USERNAME}:${CRONOS_PASSWORD}" | base64)" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$APP_TOKEN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
APP_TOKEN_BODY=$(echo "$APP_TOKEN_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Response Status: ${HTTP_STATUS}"
echo "Response Body:"
echo "$APP_TOKEN_BODY" | jq '.' 2>/dev/null || echo "$APP_TOKEN_BODY"
echo ""

if [ "$HTTP_STATUS" != "200" ]; then
  echo "ERROR: Failed to get application token. Status: ${HTTP_STATUS}"
  exit 1
fi

APP_TOKEN=$(echo "$APP_TOKEN_BODY" | jq -r '.token' 2>/dev/null)

if [ -z "$APP_TOKEN" ] || [ "$APP_TOKEN" = "null" ]; then
  echo "ERROR: Application token not found in response"
  exit 1
fi

echo "SUCCESS: Application token obtained: ${APP_TOKEN:0:30}...${APP_TOKEN: -10}"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "Step 2: Getting user token..."
echo "URL: POST ${CRONOS_URL}/api/v1/user/auth"
echo "Header: Authorization: Bearer ${APP_TOKEN:0:30}..."
echo "Body: { \"document\": \"${USER_DOCUMENT}\", \"password\": \"***\" }"
echo ""

USER_TOKEN_RESPONSE=$(curl -s -X POST \
  "${CRONOS_URL}/api/v1/user/auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${APP_TOKEN}" \
  -d "{
    \"document\": \"${USER_DOCUMENT}\",
    \"password\": \"${CRONOS_USER_PASSWORD}\"
  }" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$USER_TOKEN_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
USER_TOKEN_BODY=$(echo "$USER_TOKEN_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Response Status: ${HTTP_STATUS}"
echo "Response Body:"
echo "$USER_TOKEN_BODY" | jq '.' 2>/dev/null || echo "$USER_TOKEN_BODY"
echo ""

if [ "$HTTP_STATUS" != "200" ]; then
  echo "ERROR: Failed to get user token. Status: ${HTTP_STATUS}"
  exit 1
fi

USER_TOKEN=$(echo "$USER_TOKEN_BODY" | jq -r '.token' 2>/dev/null)

if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" = "null" ]; then
  echo "ERROR: User token not found in response"
  exit 1
fi

echo "SUCCESS: User token obtained: ${USER_TOKEN:0:30}...${USER_TOKEN: -10}"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "Step 3: Creating PIX transfer to get fresh id_pagamento..."
echo "URL: POST ${CRONOS_URL}/api/v1/pix/criartransferencia"
echo "Header: Authorization: Bearer ${USER_TOKEN:0:30}..."
echo "Body: {"
echo "  \"key_type\": \"${PIX_KEY_TYPE}\","
echo "  \"key_value\": \"${PIX_KEY_VALUE}\""
echo "}"
echo ""

CREATE_RESPONSE=$(curl -s -X POST \
  "${CRONOS_URL}/api/v1/pix/criartransferencia" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d "{
    \"key_type\": \"${PIX_KEY_TYPE}\",
    \"key_value\": \"${PIX_KEY_VALUE}\"
  }" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$CREATE_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Response Status: ${HTTP_STATUS}"
echo "Response Body:"
echo "$CREATE_BODY" | jq '.' 2>/dev/null || echo "$CREATE_BODY"
echo ""

if [ "$HTTP_STATUS" != "200" ]; then
  echo "ERROR: Failed to create PIX transfer. Status: ${HTTP_STATUS}"
  exit 1
fi

ID_PAGAMENTO=$(echo "$CREATE_BODY" | jq -r '.id_pagamento' 2>/dev/null)

if [ -z "$ID_PAGAMENTO" ] || [ "$ID_PAGAMENTO" = "null" ]; then
  echo "ERROR: id_pagamento not found in response"
  exit 1
fi

echo "SUCCESS: PIX transfer created - id_pagamento: ${ID_PAGAMENTO}"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "Step 4: Confirming PIX transfer (WITH FRESHLY CREATED ID_PAGAMENTO)..."
echo "URL: POST ${CRONOS_URL}/api/v1/pix/confirmartransferencia"
echo "Header: Authorization: Bearer ${USER_TOKEN:0:30}..."
echo "Body: {"
echo "  \"id_pagamento\": \"${ID_PAGAMENTO}\","
echo "  \"valor\": \"${VALOR}\","
echo "  \"description\": \"${DESCRIPTION}\","
echo "  \"save_as_favorite\": 0"
echo "}"
echo ""
echo "IMPORTANT: Using FRESHLY CREATED id_pagamento (${ID_PAGAMENTO})"
echo "   If it works now but didn't work before, the problem could be:"
echo "   - Expired id_pagamento"
echo "   - Different token used in creation vs confirmation"
echo ""

CONFIRM_RESPONSE=$(curl -s -X POST \
  "${CRONOS_URL}/api/v1/pix/confirmartransferencia" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d "{
    \"id_pagamento\": \"${ID_PAGAMENTO}\",
    \"valor\": \"${VALOR}\",
    \"description\": \"${DESCRIPTION}\",
    \"save_as_favorite\": 0
  }" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$CONFIRM_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
CONFIRM_BODY=$(echo "$CONFIRM_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Response Status: ${HTTP_STATUS}"
echo "Response Body:"
echo "$CONFIRM_BODY" | jq '.' 2>/dev/null || echo "$CONFIRM_BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "SUCCESS: PIX transfer confirmed successfully!"
  echo ""
  SUCCESS=$(echo "$CONFIRM_BODY" | jq -r '.success' 2>/dev/null)
  if [ "$SUCCESS" = "true" ]; then
    echo "SUCCESS: API returned success: true"
  else
    echo "WARNING: API returned success: ${SUCCESS}"
  fi
else
  echo "ERROR: Failed to confirm PIX transfer. Status: ${HTTP_STATUS}"
  echo ""
  MESSAGE=$(echo "$CONFIRM_BODY" | jq -r '.message' 2>/dev/null)
  if [ -n "$MESSAGE" ] && [ "$MESSAGE" != "null" ]; then
    echo "Error message: ${MESSAGE}"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test complete!"
echo "═══════════════════════════════════════════════════════"
