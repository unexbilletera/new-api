# Como Testar Backoffice Auth no Postman

Este guia mostra como testar os endpoints de autenticação do backoffice usando o Postman.

## Pré-requisitos

1. **Base URL**: Configure a base URL da API no Postman (ex: `http://localhost:3000`)

## Endpoints Disponíveis

### 1. Login Backoffice

**POST** `/backoffice/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@exemplo.com",
  "password": "senha-do-admin"
}
```

**Campos:**
- `email` (string, obrigatório): E-mail do usuário backoffice
- `password` (string, obrigatório): Senha do usuário backoffice

**Exemplo de Resposta (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Admin",
    "email": "admin@exemplo.com",
    "role": {
      "id": "uuid-do-role",
      "name": "Administrator",
      "level": 1
    }
  },
  "message": "200 backoffice.success.login",
  "code": "200 backoffice.success.login"
}
```

**Exemplo de Erro (401):**
```json
{
  "error": "401 backoffice.errors.invalidCredentials",
  "message": "401 backoffice.errors.invalidCredentials",
  "code": 401
}
```

---

### 2. Obter Dados do Usuário Logado

**GET** `/backoffice/auth/me`

**Headers:**
```
Authorization: Bearer {token_obtido_no_login}
Content-Type: application/json
```

**Exemplo de Resposta (200):**
```json
{
  "id": "uuid-do-usuario",
  "name": "Admin",
  "email": "admin@exemplo.com",
  "role": {
    "id": "uuid-do-role",
    "name": "Administrator",
    "level": 1
  }
}
```

**Exemplo de Erro (401):**
```json
{
  "error": "401 backoffice.errors.missingToken",
  "message": "401 backoffice.errors.missingToken",
  "code": 401
}
```

---

## Fluxo Completo de Teste

### Passo 1: Fazer Login

1. Configure o método como **POST**
2. URL: `{{base_url}}/backoffice/auth/login`
3. Na aba **Headers**, adicione:
   - `Content-Type`: `application/json`
4. Na aba **Body**, selecione **raw** e **JSON**, cole:
```json
{
  "email": "seu-email@exemplo.com",
  "password": "sua-senha"
}
```
5. Clique em **Send**
6. Copie o valor do campo `accessToken` da resposta

---

### Passo 2: Testar Endpoint Protegido (Me)

1. Configure o método como **GET**
2. URL: `{{base_url}}/backoffice/auth/me`
3. Na aba **Headers**, adicione:
   - `Authorization`: `Bearer {cole_o_accessToken_aqui}`
   - `Content-Type`: `application/json`
4. Clique em **Send**

---

## Variáveis de Ambiente no Postman

Para facilitar os testes, configure as seguintes variáveis no Postman:

```
base_url: http://localhost:3000
backoffice_token: {cole_o_accessToken_aqui}
```

Então use `{{base_url}}` e `{{backoffice_token}}` nas suas requisições.

---

## Códigos de Erro Comuns

### 401 Unauthorized
**Causas possíveis:**
- `401 backoffice.errors.missingToken`: Token não fornecido
- `401 backoffice.errors.invalidToken`: Token inválido
- `401 backoffice.errors.expiredToken`: Token expirado
- `401 backoffice.errors.invalidCredentials`: Credenciais inválidas
- `401 backoffice.errors.userInactive`: Usuário inativo
- `401 backoffice.errors.userDeleted`: Usuário deletado

**Solução**: Verifique se o token está correto e se o usuário está ativo.

### 400 Bad Request
**Causas possíveis:**
- `400 backoffice.errors.invalidEmail`: E-mail inválido
- `400 backoffice.errors.invalidPassword`: Senha inválida

**Solução**: Verifique os dados enviados no body.

---

## Notas Importantes

1. **Token JWT**: O token retornado no login tem validade. Quando expirar, faça login novamente.

2. **Usuário Ativo**: O usuário deve estar com status `active` para fazer login.

3. **Permissões**: O token contém informações sobre o role do usuário. Use para controlar acesso a diferentes funcionalidades.

4. **Segurança**: Nunca compartilhe tokens em produção. Use apenas para testes em desenvolvimento.

---

## Exemplo de Collection Postman

Você pode criar uma collection no Postman com as seguintes requests:

1. **Backoffice Login**
   - Method: POST
   - URL: `{{base_url}}/backoffice/auth/login`
   - Body: JSON com email e password
   - Tests: Salvar `accessToken` em variável

2. **Get Me**
   - Method: GET
   - URL: `{{base_url}}/backoffice/auth/me`
   - Headers: `Authorization: Bearer {{backoffice_token}}`

Isso permite que você teste o fluxo completo de autenticação de forma automatizada.

