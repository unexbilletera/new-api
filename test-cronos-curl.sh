#!/bin/bash

# Script para testar requisições Cronos diretamente na EC2
# Testa se o problema é IP/proxy fazendo chamadas diretas

# Configurações (ajuste conforme necessário)
CRONOS_URL="https://apibr.unex.ar"
CRONOS_USERNAME="pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh"
CRONOS_PASSWORD="priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz"
CRONOS_USER_PASSWORD="abc123\$!"
USER_DOCUMENT="46087750819"

# Para testar com id_pagamento existente, descomente e ajuste:
# ID_PAGAMENTO="99b85d20-3b6e-4bcf-a133-fb62797592ea"

# Para criar um novo id_pagamento, configure:
PIX_KEY_TYPE="cpf"
PIX_KEY_VALUE="12345678900"
VALOR="0.11"
DESCRIPTION="Transferência PIX teste"

echo "═══════════════════════════════════════════════════════"
echo "Teste Cronos API - Requisições curl diretas"
echo "═══════════════════════════════════════════════════════"
echo ""

# Passo 1: Obter token da aplicação (Basic Auth)
echo "📤 Passo 1: Obtendo token da aplicação..."
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
  echo "❌ Erro ao obter token da aplicação. Status: ${HTTP_STATUS}"
  exit 1
fi

APP_TOKEN=$(echo "$APP_TOKEN_BODY" | jq -r '.token' 2>/dev/null)

if [ -z "$APP_TOKEN" ] || [ "$APP_TOKEN" = "null" ]; then
  echo "❌ Token da aplicação não encontrado na resposta"
  exit 1
fi

echo "✅ Token da aplicação obtido: ${APP_TOKEN:0:30}...${APP_TOKEN: -10}"
echo ""

# Passo 2: Obter token do usuário (com app token no header)
echo "═══════════════════════════════════════════════════════"
echo "📤 Passo 2: Obtendo token do usuário..."
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
  echo "❌ Erro ao obter token do usuário. Status: ${HTTP_STATUS}"
  exit 1
fi

USER_TOKEN=$(echo "$USER_TOKEN_BODY" | jq -r '.token' 2>/dev/null)

if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" = "null" ]; then
  echo "❌ Token do usuário não encontrado na resposta"
  exit 1
fi

echo "✅ Token do usuário obtido: ${USER_TOKEN:0:30}...${USER_TOKEN: -10}"
echo ""

# Passo 3: Criar transferência PIX (para obter id_pagamento FRESCO)
echo "═══════════════════════════════════════════════════════"
echo "📤 Passo 3: Criando transferência PIX para obter id_pagamento..."
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
  echo "❌ Erro ao criar transferência PIX. Status: ${HTTP_STATUS}"
  exit 1
fi

ID_PAGAMENTO=$(echo "$CREATE_BODY" | jq -r '.id_pagamento' 2>/dev/null)

if [ -z "$ID_PAGAMENTO" ] || [ "$ID_PAGAMENTO" = "null" ]; then
  echo "❌ id_pagamento não encontrado na resposta"
  exit 1
fi

echo "✅ Transferência PIX criada - id_pagamento: ${ID_PAGAMENTO}"
echo ""

# Passo 4: Confirmar transferência PIX (com user token no header)
echo "═══════════════════════════════════════════════════════"
echo "📤 Passo 4: Confirmando transferência PIX (COM ID_PAGAMENTO RECÉM-CRIADO)..."
echo "URL: POST ${CRONOS_URL}/api/v1/pix/confirmartransferencia"
echo "Header: Authorization: Bearer ${USER_TOKEN:0:30}..."
echo "Body: {"
echo "  \"id_pagamento\": \"${ID_PAGAMENTO}\","
echo "  \"valor\": \"${VALOR}\","
echo "  \"description\": \"${DESCRIPTION}\","
echo "  \"save_as_favorite\": 0"
echo "}"
echo ""
echo "⚠️  IMPORTANTE: Usando id_pagamento RECÉM-CRIADO (${ID_PAGAMENTO})"
echo "   Se funcionar agora mas não funcionou antes, o problema pode ser:"
echo "   - id_pagamento expirado"
echo "   - Token diferente usado na criação vs confirmação"
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
  echo "✅ Transferência PIX confirmada com sucesso!"
  echo ""
  SUCCESS=$(echo "$CONFIRM_BODY" | jq -r '.success' 2>/dev/null)
  if [ "$SUCCESS" = "true" ]; then
    echo "✅ API retornou success: true"
  else
    echo "⚠️  API retornou success: ${SUCCESS}"
  fi
else
  echo "❌ Erro ao confirmar transferência PIX. Status: ${HTTP_STATUS}"
  echo ""
  MESSAGE=$(echo "$CONFIRM_BODY" | jq -r '.message' 2>/dev/null)
  if [ -n "$MESSAGE" ] && [ "$MESSAGE" != "null" ]; then
    echo "Mensagem de erro: ${MESSAGE}"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "Teste completo!"
echo "═══════════════════════════════════════════════════════"

