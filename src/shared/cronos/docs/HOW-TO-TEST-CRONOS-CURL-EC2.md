# curl Command for Testing on EC2

## Option 1: Complete command in one line (copy and paste)

```bash
APP_TOKEN=$(curl -s -X GET "https://apibr.unex.ar/api/v1/application/token" -H "Content-Type: application/json" -H "Authorization: Basic $(echo -n 'pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh:priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz' | base64)" | jq -r '.token') && USER_TOKEN=$(curl -s -X POST "https://apibr.unex.ar/api/v1/user/auth" -H "Content-Type: application/json" -H "Authorization: Bearer ${APP_TOKEN}" -d '{"document":"46087750819","password":"abc123$!"}' | jq -r '.token') && curl -v -X POST "https://apibr.unex.ar/api/v1/pix/confirmartransferencia" -H "Content-Type: application/json" -H "Authorization: Bearer ${USER_TOKEN}" -d '{"id_pagamento":"99b85d20-3b6e-4bcf-a133-fb62797592ea","valor":"0.11","description":"Transferência PIX teste","save_as_favorite":0}'
```

## Option 2: Complete command creating id_pagamento first (recommended)

This command creates a new `id_pagamento` and then confirms immediately:

```bash
APP_TOKEN=$(curl -s -X GET "https://apibr.unex.ar/api/v1/application/token" -H "Content-Type: application/json" -H "Authorization: Basic $(echo -n 'pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh:priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz' | base64)" | jq -r '.token') && USER_TOKEN=$(curl -s -X POST "https://apibr.unex.ar/api/v1/user/auth" -H "Content-Type: application/json" -H "Authorization: Bearer ${APP_TOKEN}" -d '{"document":"46087750819","password":"abc123$!"}' | jq -r '.token') && ID_PAGAMENTO=$(curl -s -X POST "https://apibr.unex.ar/api/v1/pix/criartransferencia" -H "Content-Type: application/json" -H "Authorization: Bearer ${USER_TOKEN}" -d '{"key_type":"cpf","key_value":"12345678900"}' | jq -r '.id_pagamento') && echo "id_pagamento created: ${ID_PAGAMENTO}" && curl -v -X POST "https://apibr.unex.ar/api/v1/pix/confirmartransferencia" -H "Content-Type: application/json" -H "Authorization: Bearer ${USER_TOKEN}" -d "{\"id_pagamento\":\"${ID_PAGAMENTO}\",\"valor\":\"0.11\",\"description\":\"Transferência PIX teste\",\"save_as_favorite\":0}"
```

## Option 3: Step by step (for debugging)

```bash
# 1. Get application token
APP_TOKEN=$(curl -s -X GET "https://apibr.unex.ar/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh:priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz' | base64)" \
  | jq -r '.token')

echo "APP_TOKEN: ${APP_TOKEN}"

# 2. Get user token
USER_TOKEN=$(curl -s -X POST "https://apibr.unex.ar/api/v1/user/auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${APP_TOKEN}" \
  -d '{"document":"46087750819","password":"abc123$!"}' \
  | jq -r '.token')

echo "USER_TOKEN: ${USER_TOKEN}"

# 3. Create id_pagamento (optional - to test with fresh id_pagamento)
ID_PAGAMENTO=$(curl -s -X POST "https://apibr.unex.ar/api/v1/pix/criartransferencia" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d '{"key_type":"cpf","key_value":"12345678900"}' \
  | jq -r '.id_pagamento')

echo "ID_PAGAMENTO created: ${ID_PAGAMENTO}"

# 4. Confirm PIX transfer
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

## What to observe:

**If it works on EC2:**
- The problem is NOT IP
- Could be:
  - Different token in new API (create vs confirm)
  - id_pagamento expired when worker tries to confirm
  - Timing between creation and confirmation

**If it doesn't work on EC2:**
- Could be:
  - Invalid or expired id_pagamento
  - Invalid token
  - Incorrect body format
  - Some additional validation needed
