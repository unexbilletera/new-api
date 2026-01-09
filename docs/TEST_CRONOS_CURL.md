# Teste Cronos API - Comandos curl

Este arquivo contém comandos curl para testar as requisições da API Cronos diretamente na EC2.

## ⚠️ IMPORTANTE: Teste na EC2

**Por que testar na EC2?**
- Se funcionar na EC2 direto com curl: o problema NÃO é IP, pode ser:
  - Token diferente usado na criação vs confirmação
  - id_pagamento expirado ou invalidado
  - Diferença no formato do body ou headers
- Se não funcionar na EC2: pode ser problema de configuração, token, ou id_pagamento inválido

## Variáveis de Ambiente

```bash
# Configurações (ajustar conforme necessário)
export CRONOS_URL="https://apibr.unex.ar"
export CRONOS_USERNAME="pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh"
export CRONOS_PASSWORD="priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz"
export CRONOS_USER_PASSWORD="abc123\$!"
export USER_DOCUMENT="46087750819"
export ID_PAGAMENTO="99b85d20-3b6e-4bcf-a133-fb62797592ea"
export VALOR="0.11"
export DESCRIPTION="Transferência PIX teste"
```

---

## Passo 1: Obter Token da Aplicação (Basic Auth)

```bash
curl -v -X GET \
  "${CRONOS_URL}/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CRONOS_USERNAME}:${CRONOS_PASSWORD}" | base64)"
```

**Resposta esperada:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJh..."
}
```

**Salvar o token:**
```bash
APP_TOKEN=$(curl -s -X GET \
  "${CRONOS_URL}/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n "${CRONOS_USERNAME}:${CRONOS_PASSWORD}" | base64)" \
  | jq -r '.token')

echo "APP_TOKEN: ${APP_TOKEN}"
```

---

## Passo 2: Obter Token do Usuário (com App Token no header)

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

**Resposta esperada:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJh...",
  "document": "46087750819",
  "full_name": "Bruno Siqueira de Paulo",
  ...
}
```

**Salvar o token do usuário:**
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

## Passo 3: Confirmar Transferência PIX (com User Token no header)

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

**Resposta esperada (sucesso):**
```json
{
  "success": true,
  "message": "Transferência realizada com sucesso",
  ...
}
```

**Resposta esperada (erro de autorização):**
```json
{
  "success": false,
  "message": "Sem autorização",
  "code": 400
}
```

---

## Comando Completo (Tudo em Um)

```bash
# Passo 1: Obter token da aplicação
APP_TOKEN=$(curl -s -X GET \
  "https://apibr.unex.ar/api/v1/application/token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'pub_EwERFOBmKy78wm12FFERGydHzTTojIGdUNlazfOh:priv_jstjv2TBDmsuWsIOUzhgG3yW4hTWOFjIi5PQbgcz' | base64)" \
  | jq -r '.token')

echo "APP_TOKEN obtido: ${APP_TOKEN:0:30}..."

# Passo 2: Obter token do usuário
USER_TOKEN=$(curl -s -X POST \
  "https://apibr.unex.ar/api/v1/user/auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${APP_TOKEN}" \
  -d '{
    "document": "46087750819",
    "password": "abc123$!"
  }' \
  | jq -r '.token')

echo "USER_TOKEN obtido: ${USER_TOKEN:0:30}..."

# Passo 3: Confirmar transferência PIX
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

## Teste com Script Automatizado

Para testar tudo de uma vez, use o script:

```bash
# Na EC2
./test-cronos-curl.sh
```

Ou se estiver em outro diretório:

```bash
bash /caminho/para/test-cronos-curl.sh
```

---

## Debug

### Verificar se o problema é IP/Proxy

1. **Testar na EC2 sem proxy:**
   - Se funcionar: o problema é IP, precisa usar proxy SOCKS
   - Se não funcionar: pode ser outro problema (token, dados, etc.)

2. **Testar na EC2 com proxy SOCKS:**
   ```bash
   # Verificar se o túnel SOCKS está ativo
   netstat -an | grep 8080
   
   # Usar curl com proxy SOCKS
   curl --socks5-hostname localhost:8080 -v -X POST ...
   ```

3. **Verificar IP de origem:**
   ```bash
   # Ver qual IP está sendo usado
   curl -s https://api.ipify.org
   ```

### Verificar Logs da API Cronos

Se tiver acesso aos logs da Cronos, verifique:
- Qual IP está fazendo a requisição
- Se o IP está na whitelist
- Se o token está sendo validado corretamente

---

## Análise do Problema "Sem autorização"

**Observação importante:** Se o problema fosse IP/whitelist, os endpoints de auth (`/api/v1/application/token` e `/api/v1/user/auth`) também falhariam. Como eles funcionam (200 OK), o problema **NÃO é IP**.

### Possíveis Causas:

1. **id_pagamento expirado ou invalidado:**
   - O `id_pagamento` pode ter um tempo de vida limitado
   - Se passar muito tempo entre criar e confirmar, pode expirar
   - **Solução:** Usar `id_pagamento` recém-criado (teste com o script completo que cria antes de confirmar)

2. **Token diferente entre criação e confirmação:**
   - Na API antiga, `transferPix` e `confirmTransferPix` são chamados na mesma sessão (mesmo token do cache)
   - Na nova API, são processos separados (controller vs worker)
   - O token pode ter sido regenerado no worker, mas o `id_pagamento` foi criado com outro token
   - **Solução:** Garantir que o token usado para confirmar seja o mesmo usado para criar (ou compatível)

3. **Validação adicional necessária:**
   - Pode ser necessário chamar `/api/v1/transactions/requesttoken` e `/api/v1/transactions/confirmtoken` antes de confirmar
   - Na API antiga, esses passos podem ser opcionais ou feitos internamente
   - **Solução:** Verificar se esses passos são necessários na API da Cronos

4. **Formato do body diferente:**
   - Pequenas diferenças no formato podem causar rejeição
   - Verificar se todos os campos estão corretos (tipo, ordem, etc.)

### Como Testar:

1. **Teste com id_pagamento recém-criado:**
   ```bash
   ./test-cronos-curl.sh
   ```
   - Isso cria um novo `id_pagamento` e confirma imediatamente
   - Se funcionar: o problema era `id_pagamento` expirado
   - Se não funcionar: problema em outro lugar

2. **Teste com id_pagamento existente:**
   ```bash
   ./test-cronos-curl-simple.sh 99b85d20-3b6e-4bcf-a133-fb62797592ea 0.11
   ```
   - Testa com um `id_pagamento` que já existe
   - Se funcionar: o problema pode ser timing/token na nova API
   - Se não funcionar: pode ser que o `id_pagamento` expirou ou foi invalidado

## Notas Importantes

1. **Token da Aplicação:** Válido por 1 hora, pode ser cacheado
2. **Token do Usuário:** Válido por 1 hora, específico por documento (CPF/CNPJ)
3. **id_pagamento:** Deve existir e ter sido criado anteriormente via `/api/v1/pix/criartransferencia`
4. **valor:** Deve ser string, não número (ex: "0.11" não 0.11) - conforme documentação
5. **save_as_favorite:** Deve ser número 0, não string "0"
6. **Timing:** O `id_pagamento` pode ter um tempo de vida limitado - confirmar o mais rápido possível após criar

