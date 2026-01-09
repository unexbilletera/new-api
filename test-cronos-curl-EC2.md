# Comando curl para testar na EC2

## Opção 1: Comando completo em uma linha (copiar e colar)

```bash
APP_TOKEN=$(curl -s -X GET "https://apibr.unex.ar/api/v1/application/token" -H "Content-Type: application/json" -H "Authorization: Basic $(echo -n 'pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh:priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz' | base64)" | jq -r '.token') && USER_TOKEN=$(curl -s -X POST "https://apibr.unex.ar/api/v1/user/auth" -H "Content-Type: application/json" -H "Authorization: Bearer ${APP_TOKEN}" -d '{"document":"46087750819","password":"abc123$!"}' | jq -r '.token') && curl -v -X POST "https://apibr.unex.ar/api/v1/pix/confirmartransferencia" -H "Content-Type: application/json" -H "Authorization: Bearer ${USER_TOKEN}" -d '{"id_pagamento":"99b85d20-3b6e-4bcf-a133-fb62797592ea","valor":"0.11","description":"Transferência PIX teste","save_as_favorite":0}'
```

## Opção 2: Comando completo criando id_pagamento antes (recomendado)

Este comando cria um novo `id_pagamento` e depois confirma imediatamente:

```bash
APP_TOKEN=$(curl -s -X GET "https://apibr.unex.ar/api/v1/application/token" -H "Content-Type: application/json" -H "Authorization: Basic $(echo -n 'pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh:priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz' | base64)" | jq -r '.token') && USER_TOKEN=$(curl -s -X POST "https://apibr.unex.ar/api/v1/user/auth" -H "Content-Type: application/json" -H "Authorization: Bearer ${APP_TOKEN}" -d '{"document":"46087750819","password":"abc123$!"}' | jq -r '.token') && ID_PAGAMENTO=$(curl -s -X POST "https://apibr.unex.ar/api/v1/pix/criartransferencia" -H "Content-Type: application/json" -H "Authorization: Bearer ${USER_TOKEN}" -d '{"key_type":"cpf","key_value":"12345678900"}' | jq -r '.id_pagamento') && echo "id_pagamento criado: ${ID_PAGAMENTO}" && curl -v -X POST "https://apibr.unex.ar/api/v1/pix/confirmartransferencia" -H "Content-Type: application/json" -H "Authorization: Bearer ${USER_TOKEN}" -d "{\"id_pagamento\":\"${ID_PAGAMENTO}\",\"valor\":\"0.11\",\"description\":\"Transferência PIX teste\",\"save_as_favorite\":0}"
```

## Opção 3: Passo a passo (para debug)

```bash
# 1. Obter token da aplicação
APP_TOKEN=$(curl -s -X GET "https://apibr.unex.ar/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh:priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz' | base64)" \
  | jq -r '.token')

echo "APP_TOKEN: ${APP_TOKEN}"

# 2. Obter token do usuário
USER_TOKEN=$(curl -s -X POST "https://apibr.unex.ar/api/v1/user/auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${APP_TOKEN}" \
  -d '{"document":"46087750819","password":"abc123$!"}' \
  | jq -r '.token')

echo "USER_TOKEN: ${USER_TOKEN}"

# 3. Criar id_pagamento (opcional - para testar com id_pagamento fresco)
ID_PAGAMENTO=$(curl -s -X POST "https://apibr.unex.ar/api/v1/pix/criartransferencia" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d '{"key_type":"cpf","key_value":"12345678900"}' \
  | jq -r '.id_pagamento')

echo "ID_PAGAMENTO criado: ${ID_PAGAMENTO}"

# 4. Confirmar transferência PIX
curl -v -X POST "https://apibr.unex.ar/api/v1/pix/confirmartransferencia" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d "{
    \"id_pagamento\": \"${ID_PAGAMENTO:-99b85d20-3b6e-4bcf-a133-fb62797592ea}\",
    \"valor\": \"0.11\",
    \"description\": \"Transferência PIX teste\",
    \"save_as_favorite\": 0
  }"
```

## O que observar:

✅ **Se funcionar na EC2:**
- O problema NÃO é IP
- Pode ser:
  - Token diferente na nova API (criar vs confirmar)
  - id_pagamento expirado quando o worker tenta confirmar
  - Timing entre criação e confirmação

❌ **Se não funcionar na EC2:**
- Pode ser:
  - id_pagamento inválido ou expirado
  - Token inválido
  - Formato do body incorreto
  - Alguma validação adicional necessária

