# Cronos API Testing - curl Commands

This file contains curl commands to test Cronos API requests directly on EC2.

## IMPORTANT: Testing on EC2

**Why test on EC2?**
- If it works on EC2 directly with curl: the problem is NOT IP, it could be:
  - Different token used in creation vs confirmation
  - id_pagamento expired or invalidated
  - Difference in body or headers format
- If it doesn't work on EC2: could be configuration issue, token, or invalid id_pagamento

## Environment Variables

```bash
# Configuration (adjust as needed)
export CRONOS_URL="https://apibr.unex.ar"
export CRONOS_USERNAME="pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh"
export CRONOS_PASSWORD="priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz"
export CRONOS_USER_PASSWORD="abc123\$!"
export USER_DOCUMENT="46087750819"
export ID_PAGAMENTO="99b85d20-3b6e-4bcf-a133-fb62797592ea"
export VALOR="0.11"
export DESCRIPTION="PIX transfer test"
```

---

## Step 1: Get Application Token (Basic Auth)

```bash
curl -v -X GET \
  "${CRONOS_URL}/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CRONOS_USERNAME}:${CRONOS_PASSWORD}" | base64)"
```

**Expected response:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJh..."
}
```

**Save the token:**
```bash
APP_TOKEN=$(curl -s -X GET \
  "${CRONOS_URL}/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CRONOS_USERNAME}:${CRONOS_PASSWORD}" | base64)" \
  | jq -r '.token')

echo "APP_TOKEN: ${APP_TOKEN}"
```

---

## Step 2: Get User Token (with App Token in header)

```bash
curl -v -X POST \
  "${CRONOS_URL}/api/v1/user/auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${APP_TOKEN}" \
  -d "{
    \"document\": \"${USER_DOCUMENT}\",
    \"password\": \"${CRONOS_USER_PASSWORD}\"
  }"
```

**Expected response:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJh...",
  "document": "46087750819",
  "full_name": "Bruno Siqueira de Paulo",
  ...
}
```

**Save the user token:**
```bash
USER_TOKEN=$(curl -s -X POST \
  "${CRONOS_URL}/api/v1/user/auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${APP_TOKEN}" \
  -d "{
    \"document\": \"${USER_DOCUMENT}\",
    \"password\": \"${CRONOS_USER_PASSWORD}\"
  }" \
  | jq -r '.token')

echo "USER_TOKEN: ${USER_TOKEN}"
```

---

## Step 3: Confirm PIX Transfer (with User Token in header)

```bash
curl -v -X POST \
  "${CRONOS_URL}/api/v1/pix/confirmartransferencia" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d "{
    \"id_pagamento\": \"${ID_PAGAMENTO}\",
    \"valor\": \"${VALOR}\",
    \"description\": \"${DESCRIPTION}\",
    \"save_as_favorite\": 0
  }"
```

**Expected response (success):**
```json
{
  "success": true,
  "message": "Transferência realizada com sucesso",
  ...
}
```

**Expected response (authorization error):**
```json
{
  "success": false,
  "message": "Sem autorização",
  "code": 400
}
```

---

## Complete Command (All in One)

```bash
# Step 1: Get application token
APP_TOKEN=$(curl -s -X GET \
  "https://apibr.unex.ar/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh:priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz' | base64)" \
  | jq -r '.token')

echo "APP_TOKEN obtained: ${APP_TOKEN:0:30}..."

# Step 2: Get user token
USER_TOKEN=$(curl -s -X POST \
  "https://apibr.unex.ar/api/v1/user/auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${APP_TOKEN}" \
  -d '{
    "document": "46087750819",
    "password": "abc123$!"
  }' \
  | jq -r '.token')

echo "USER_TOKEN obtained: ${USER_TOKEN:0:30}..."

# Step 3: Confirm PIX transfer
curl -v -X POST \
  "https://apibr.unex.ar/api/v1/pix/confirmartransferencia" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -d '{
    "id_pagamento": "99b85d20-3b6e-4bcf-a133-fb62797592ea",
    "valor": "0.11",
    "description": "Transferência PIX teste",
    "save_as_favorite": 0
  }'
```

---

## Testing with Automated Script

To test everything at once, use the script:

```bash
# On EC2
./test-cronos-curl.sh
```

Or if you're in another directory:

```bash
bash /path/to/test-cronos-curl.sh
```

---

## Debug

### Check if the problem is IP/Proxy

1. **Test on EC2 without proxy:**
   - If it works: the problem is IP, need to use SOCKS proxy
   - If it doesn't work: could be another problem (token, data, etc.)

2. **Test on EC2 with SOCKS proxy:**
   ```bash
   # Check if SOCKS tunnel is active
   netstat -an | grep 8080
   
   # Use curl with SOCKS proxy
   curl --socks5-hostname localhost:8080 -v -X POST ...
   ```

3. **Check origin IP:**
   ```bash
   # See which IP is being used
   curl -s https://api.ipify.org
   ```

### Check Cronos API Logs

If you have access to Cronos logs, check:
- Which IP is making the request
- If the IP is in the whitelist
- If the token is being validated correctly

---

## "Sem autorização" Problem Analysis

**Important observation:** If the problem were IP/whitelist, the auth endpoints (`/api/v1/application/token` and `/api/v1/user/auth`) would also fail. Since they work (200 OK), the problem is **NOT IP**.

### Possible Causes:

1. **id_pagamento expired or invalidated:**
   - The `id_pagamento` may have a limited lifetime
   - If too much time passes between creating and confirming, it may expire
   - **Solution:** Use freshly created `id_pagamento` (test with the complete script that creates before confirming)

2. **Different token between creation and confirmation:**
   - In the old API, `transferPix` and `confirmTransferPix` are called in the same session (same cached token)
   - In the new API, they are separate processes (controller vs worker)
   - The token may have been regenerated in the worker, but the `id_pagamento` was created with another token
   - **Solution:** Ensure the token used to confirm is the same used to create (or compatible)

3. **Additional validation needed:**
   - May need to call `/api/v1/transactions/requesttoken` and `/api/v1/transactions/confirmtoken` before confirming
   - In the old API, these steps may be optional or done internally
   - **Solution:** Check if these steps are necessary in the Cronos API

4. **Different body format:**
   - Small differences in format can cause rejection
   - Verify all fields are correct (type, order, etc.)

### How to Test:

1. **Test with freshly created id_pagamento:**
   ```bash
   ./test-cronos-curl.sh
   ```
   - This creates a new `id_pagamento` and confirms immediately
   - If it works: the problem was expired `id_pagamento`
   - If it doesn't work: problem elsewhere

2. **Test with existing id_pagamento:**
   ```bash
   ./test-cronos-curl-simple.sh 99b85d20-3b6e-4bcf-a133-fb62797592ea 0.11
   ```
   - Tests with an existing `id_pagamento`
   - If it works: the problem may be timing/token in the new API
   - If it doesn't work: the `id_pagamento` may have expired or been invalidated

## Important Notes

1. **Application Token:** Valid for 1 hour, can be cached
2. **User Token:** Valid for 1 hour, specific per document (CPF/CNPJ)
3. **id_pagamento:** Must exist and have been created previously via `/api/v1/pix/criartransferencia`
4. **valor:** Must be string, not number (ex: "0.11" not 0.11) - according to documentation
5. **save_as_favorite:** Must be number 0, not string "0"
6. **Timing:** The `id_pagamento` may have a limited lifetime - confirm as soon as possible after creating
