#!/bin/bash

ID_PAGAMENTO="${1:-99b85d20-3b6e-4bcf-a133-fb62797592ea}"
VALOR="${2:-0.11}"

echo "Testing confirmTransferPix with id_pagamento: ${ID_PAGAMENTO}, valor: ${VALOR}"
echo ""

APP_TOKEN=$(curl -s -X GET "https://apibr.unex.ar/api/v1/application/token" -H "Content-Type: application/json" -H "Authorization: Basic $(echo -n 'pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh:priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz' | base64)" | jq -r '.token') && \
USER_TOKEN=$(curl -s -X POST "https://apibr.unex.ar/api/v1/user/auth" -H "Content-Type: application/json" -H "Authorization: Bearer ${APP_TOKEN}" -d '{"document":"46087750819","password":"abc123$!"}' | jq -r '.token') && \
curl -v -X POST "https://apibr.unex.ar/api/v1/pix/confirmartransferencia" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d "{\"id_pagamento\":\"${ID_PAGAMENTO}\",\"valor\":\"${VALOR}\",\"description\":\"Transferência PIX teste\",\"save_as_favorite\":0}"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "Test complete!"
echo ""
