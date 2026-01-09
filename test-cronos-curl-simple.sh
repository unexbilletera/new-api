#!/bin/bash

# Script simplificado para testar confirmTransferPix com id_pagamento existente
# Use este script para testar se um id_pagamento específico ainda está válido

# Configurações
CRONOS_URL="https://apibr.unex.ar"
CRONOS_USERNAME="pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh"
CRONOS_PASSWORD="priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz"
CRONOS_USER_PASSWORD="abc123\$!"
USER_DOCUMENT="46087750819"

# Ajuste estes valores conforme necessário
ID_PAGAMENTO="${1:-99b85d20-3b6e-4bcf-a133-fb62797592ea}"  # Passa como argumento ou usa default
VALOR="${2:-0.11}"  # Passa como argumento ou usa default
DESCRIPTION="Transferência PIX teste"

echo "═══════════════════════════════════════════════════════"
echo "Teste Rápido - Confirm Transfer PIX"
echo "═══════════════════════════════════════════════════════"
echo "ID_PAGAMENTO: ${ID_PAGAMENTO}"
echo "VALOR: ${VALOR}"
echo ""
echo "Uso: ./test-cronos-curl-simple.sh [id_pagamento] [valor]"
echo "Exemplo: ./test-cronos-curl-simple.sh 99b85d20-3b6e-4bcf-a133-fb62797592ea 0.11"
echo ""

# Obter token da aplicação
echo "📤 Obtendo token da aplicação..."
APP_TOKEN=$(curl -s -X GET \
  "${CRONOS_URL}/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CRONOS_USERNAME}:${CRONOS_PASSWORD}" | base64)" \
  | jq -r '.token')

if [ -z "$APP_TOKEN" ] || [ "$APP_TOKEN" = "null" ]; then
  echo "❌ Erro ao obter token da aplicação"
  exit 1
fi

echo "✅ App token obtido"
echo ""

# Obter token do usuário
echo "📤 Obtendo token do usuário..."
USER_TOKEN=$(curl -s -X POST \
  "${CRONOS_URL}/api/v1/user/auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${APP_TOKEN}" \
  -d "{\"document\":\"${USER_DOCUMENT}\",\"password\":\"${CRONOS_USER_PASSWORD}\"}" \
  | jq -r '.token')

if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" = "null" ]; then
  echo "❌ Erro ao obter token do usuário"
  exit 1
fi

echo "✅ User token obtido"
echo ""

# Confirmar transferência PIX
echo "═══════════════════════════════════════════════════════"
echo "📤 Confirmando transferência PIX..."
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
    echo "✅ Transferência confirmada com sucesso!"
  else
    echo "⚠️  API retornou success: ${SUCCESS}"
    MESSAGE=$(echo "$BODY" | jq -r '.message' 2>/dev/null)
    echo "Mensagem: ${MESSAGE}"
  fi
else
  echo "❌ Erro ao confirmar transferência. Status: ${HTTP_STATUS}"
  MESSAGE=$(echo "$BODY" | jq -r '.message' 2>/dev/null)
  if [ -n "$MESSAGE" ] && [ "$MESSAGE" != "null" ]; then
    echo "Mensagem de erro: ${MESSAGE}"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════"

