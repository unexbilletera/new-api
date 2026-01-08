# Como Testar Auth Público (Test) no Postman

Este guia mostra como testar os endpoints de autenticação públicos de teste usando o Postman.

⚠️ **ATENÇÃO**: Estes endpoints são apenas para desenvolvimento/testes. NÃO devem ser usados em produção!

## Pré-requisitos

1. **Base URL**: Configure a base URL da API no Postman (ex: `http://localhost:3000`)

## Endpoints Disponíveis

### 1. Login de Teste (App Mobile)

**POST** `/test/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha-do-usuario"
}
```

**Campos:**
- `email` (string, obrigatório): E-mail do usuário do app
- `password` (string, obrigatório): Senha do usuário do app

**Exemplo de Resposta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "status": "enable",
    "identity": {
      "id": "uuid-da-identidade",
      "number": 1234,
      "type": "personal",
      "status": "enable"
    }
  },
  "message": "200 users.success.login",
  "code": "200 users.success.login"
}
```

**Exemplo de Erro (401):**
```json
{
  "error": "401 users.errors.invalidCredentials",
  "message": "401 users.errors.invalidCredentials",
  "code": 401
}
```

---

### 2. Login de Teste (Backoffice)

**POST** `/test/auth/backoffice-login`

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "email": "admin@exemplo.com",
    "name": "Admin",
    "status": "active",
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

## Fluxo Completo de Teste

### Passo 1: Login App Mobile

1. Configure o método como **POST**
2. URL: `{{base_url}}/test/auth/login`
3. Na aba **Headers**, adicione:
   - `Content-Type`: `application/json`
4. Na aba **Body**, selecione **raw** e **JSON**, cole:
```json
{
  "email": "usuario@exemplo.com",
  "password": "sua-senha"
}
```
5. Clique em **Send**
6. Copie o valor do campo `token` da resposta

---

### Passo 2: Usar Token em Endpoints Protegidos

1. Use o token obtido no Passo 1
2. Configure o método conforme o endpoint (GET, POST, etc.)
3. URL: `{{base_url}}/endpoint-protegido`
4. Na aba **Headers**, adicione:
   - `Authorization`: `Bearer {cole_o_token_aqui}`
   - `Content-Type`: `application/json`
5. Clique em **Send**

---

## Variáveis de Ambiente no Postman

Para facilitar os testes, configure as seguintes variáveis no Postman:

```
base_url: http://localhost:3000
app_token: {cole_o_token_do_app_aqui}
backoffice_token: {cole_o_token_do_backoffice_aqui}
```

Então use `{{base_url}}`, `{{app_token}}` e `{{backoffice_token}}` nas suas requisições.

---

## Códigos de Erro Comuns

### 401 Unauthorized
**Causas possíveis:**
- `401 users.errors.invalidCredentials`: Credenciais inválidas
- `401 users.errors.invalidPassword`: Senha inválida
- `401 users.errors.userInactive`: Usuário inativo
- `401 backoffice.errors.invalidCredentials`: Credenciais backoffice inválidas
- `401 backoffice.errors.userInactive`: Usuário backoffice inativo

**Solução**: Verifique se o email e senha estão corretos.

### 400 Bad Request
**Causas possíveis:**
- `400 users.errors.invalidEmail`: E-mail inválido
- `400 users.errors.invalidPassword`: Senha inválida
- `400 backoffice.errors.invalidEmail`: E-mail backoffice inválido
- `400 backoffice.errors.invalidPassword`: Senha backoffice inválida

**Solução**: Verifique os dados enviados no body.

---

## Notas Importantes

1. **⚠️ APENAS PARA TESTES**: Estes endpoints são temporários e devem ser removidos em produção.

2. **Validação Real**: Os endpoints fazem validação real de senha usando bcrypt, então você precisa das senhas reais dos usuários.

3. **Token JWT**: O token retornado pode ser usado em todos os endpoints protegidos que exigem autenticação.

4. **Usuário Ativo**: 
   - Para app mobile: usuário deve ter status `enable` e não estar deletado
   - Para backoffice: usuário deve ter status `active` e não estar deletado

5. **Senha**: A senha deve estar cadastrada no banco de dados. Se o usuário não tiver senha, retornará erro.

---

## Exemplo de Collection Postman

Você pode criar uma collection no Postman com as seguintes requests:

1. **Test Login (App)**
   - Method: POST
   - URL: `{{base_url}}/test/auth/login`
   - Body: JSON com email e password
   - Tests: Salvar `token` em variável `app_token`

2. **Test Login (Backoffice)**
   - Method: POST
   - URL: `{{base_url}}/test/auth/backoffice-login`
   - Body: JSON com email e password
   - Tests: Salvar `token` em variável `backoffice_token`

Isso permite que você teste o fluxo completo de autenticação de forma automatizada.

---

## Diferença entre App e Backoffice

| Aspecto | App Mobile | Backoffice |
|---------|------------|------------|
| Tabela | `users` | `backofficeUsers` |
| Status válido | `enable` | `active` |
| Role | `customer` (padrão) | Vem da tabela `backofficeRoles` |
| Resposta | Inclui `identity` | Inclui `role` |
| Endpoint | `/test/auth/login` | `/test/auth/backoffice-login` |

