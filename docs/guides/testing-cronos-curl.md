# Cronos API Testing with cURL

This guide contains cURL commands to test Cronos API directly on EC2 or local environment.

## Why Test on EC2?

Testing directly on EC2 helps identify issues:

- **Works on EC2**: Problem is NOT IP, could be:
  - Different token used in creation vs confirmation
  - Expired or invalidated id_pagamento
  - Different body or headers format
- **Doesn't work on EC2**: Configuration issue, invalid token, or expired id_pagamento

## Environment Variables

Configure variables:

```bash
export CRONOS_URL="https://apibr.unex.ar"
export CRONOS_USERNAME="pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh"
export CRONOS_PASSWORD="priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz"
export CRONOS_USER_PASSWORD="abc123\$!"
export USER_DOCUMENT="46087750819"
export ID_PAGAMENTO="99b85d20-3b6e-4bcf-a133-fb62797592ea"
export VALOR="0.11"
export DESCRIPTION="PIX transfer test"
```

## Step 1: Get Application Token

Get application token using Basic Auth:

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

**Save token:**
```bash
APP_TOKEN=$(curl -s -X GET \
  "${CRONOS_URL}/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CRONOS_USERNAME}:${CRONOS_PASSWORD}" | base64)" \
  | jq -r '.token')

echo "APP_TOKEN: ${APP_TOKEN}"
```

## Step 2: Get User Token

Get user token with app token:

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
  "full_name": "User Name",
  ...
}
```

**Save token:**
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

## Step 3: Confirm PIX Transfer

Confirm PIX transfer with user token:

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

**Expected success:**
```json
{
  "success": true,
  "message": "Transferência realizada com sucesso",
  ...
}
```

**Expected error:**
```json
{
  "success": false,
  "message": "Sem autorização",
  "code": 400
}
```

## Complete Command (All in One)

Execute all steps at once:

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

## Debugging

### Check IP/Proxy Issues

1. **Test on EC2 without proxy:**
   - If works: problem is IP, need SOCKS proxy
   - If doesn't work: another problem (token, data)

2. **Test on EC2 with SOCKS proxy:**
```bash
# Check SOCKS tunnel active
netstat -an | grep 8080

# Use curl with SOCKS proxy
curl --socks5-hostname localhost:8080 -v -X POST ...
```

3. **Check origin IP:**
```bash
curl -s https://api.ipify.org
```

## "Sem autorização" Problem Analysis

**Important**: If problem were IP/whitelist, auth endpoints would also fail. Since they work (200 OK), problem is **NOT IP**.

### Possible Causes

1. **Expired id_pagamento:**
   - Limited lifetime
   - Too much time between create and confirm
   - **Solution**: Use fresh id_pagamento

2. **Different token:**
   - Create and confirm use different tokens
   - Token may be regenerated in worker
   - **Solution**: Ensure same token used

3. **Additional validation:**
   - May need requesttoken/confirmtoken before confirming
   - **Solution**: Check if these steps required

4. **Different body format:**
   - Small format differences cause rejection
   - **Solution**: Verify all fields correct

## Important Notes

1. **Application Token**: Valid for 1 hour, can be cached
2. **User Token**: Valid for 1 hour, specific per document
3. **id_pagamento**: Must exist and be created via `/api/v1/pix/criartransferencia`
4. **valor**: Must be string, not number (e.g., "0.11" not 0.11)
5. **save_as_favorite**: Must be number 0, not string "0"
6. **Timing**: id_pagamento may have limited lifetime - confirm ASAP

## References

- [PIX Cronos Testing](testing-pix-cronos.md)
- [Worker Architecture](../architecture/worker.md)
- [Provider Features](../operations/provider-features.md)
