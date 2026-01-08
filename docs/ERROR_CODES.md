# Códigos de Erro e Sucesso da API

Este documento lista todos os códigos de erro e sucesso utilizados na API, seguindo o padrão: `{statusCode} {modulo}.{tipo}.{codigo}`

## Formato

- **Erros**: `{statusCode} {modulo}.errors.{codigoErro}`
- **Sucessos**: `{statusCode} {modulo}.success.{codigoSucesso}`

---

## 📋 Códigos de Erro

### 🔴 USERS ERRORS (400)

| Código | Descrição | Tradução |
|--------|-----------|----------|
| `400 users.errors.invalidParameters` | Parâmetros inválidos | Parâmetros inválidos |
| `400 users.errors.invalidUsername` | Username inválido | Username inválido |
| `400 users.errors.invalidEmail` | Email inválido | Email inválido |
| `400 users.errors.invalidPassword` | Senha inválida | Senha inválida |
| `400 users.errors.userNotFound` | Usuário não encontrado | Usuário não encontrado |
| `400 users.errors.invalidUserAccount` | Conta de usuário inválida | Conta de usuário inválida |
| `400 users.errors.failBindChangeAliasRecently` | Falha ao alterar alias recentemente | Falha ao alterar alias recentemente |
| `400 users.errors.failBindChangeAliasAlreadyUsed` | Alias já está em uso | Alias já está em uso |
| `400 users.errors.failBindChangeAliasSame` | Alias é o mesmo | Alias é o mesmo |
| `400 users.errors.failBindChangeAliasInvalid` | Alias inválido | Alias inválido |

### 🔴 USERS ERRORS (401)

| Código | Descrição | Tradução |
|--------|-----------|----------|
| `401 users.errors.missingToken` | Token não fornecido | Token não fornecido |
| `401 users.errors.expiredToken` | Token expirado | Token expirado |
| `401 users.errors.invalidToken` | Token inválido | Token inválido |
| `401 users.errors.invalidAccess` | Acesso inválido | Acesso inválido |
| `401 users.errors.invalidCredentials` | Credenciais inválidas | Email ou senha inválidos |
| `401 users.errors.userInactive` | Usuário inativo | Usuário inativo |
| `401 users.errors.userDeleted` | Usuário deletado | Usuário deletado |

### 🔴 BACKOFFICE ERRORS (400)

| Código | Descrição | Tradução |
|--------|-----------|----------|
| `400 backoffice.errors.invalidParameters` | Parâmetros inválidos | Parâmetros inválidos |
| `400 backoffice.errors.invalidEmail` | Email inválido | Email inválido |
| `400 backoffice.errors.invalidPassword` | Senha inválida | Senha inválida |
| `400 backoffice.errors.userNotFound` | Usuário não encontrado | Usuário não encontrado |
| `400 backoffice.errors.invalidUserAccount` | Conta de usuário inválida | Conta de usuário inválida |

### 🔴 BACKOFFICE ERRORS (401)

| Código | Descrição | Tradução |
|--------|-----------|----------|
| `401 backoffice.errors.missingToken` | Token não fornecido | Token não fornecido |
| `401 backoffice.errors.expiredToken` | Token expirado | Token expirado |
| `401 backoffice.errors.invalidToken` | Token inválido | Token inválido |
| `401 backoffice.errors.invalidCredentials` | Credenciais inválidas | Email ou senha inválidos |
| `401 backoffice.errors.userInactive` | Usuário inativo | Usuário inativo |
| `401 backoffice.errors.userDeleted` | Usuário deletado | Usuário deletado |
| `401 backoffice.errors.insufficientPermissions` | Permissões insuficientes | Permissões insuficientes |

### 🔴 TRANSACTIONS ERRORS (400)

| Código | Descrição | Tradução |
|--------|-----------|----------|
| `400 transactions.errors.missingContextUserId` | ID do usuário do contexto ausente | ID do usuário do contexto ausente |
| `400 transactions.errors.missingAction` | Ação ausente | Ação ausente |
| `400 transactions.errors.invalidAction` | Ação inválida | Ação inválida |
| `400 transactions.errors.missingStatus` | Status ausente | Status ausente |
| `400 transactions.errors.invalidStatus` | Status inválido | Status inválido |
| `400 transactions.errors.invalidActionStatus` | Status de ação inválido | Status de ação inválido |
| `400 transactions.errors.invalidType` | Tipo inválido | Tipo inválido |
| `400 transactions.errors.invalidAccountType` | Tipo de conta inválido | Tipo de conta inválido |
| `400 transactions.errors.duplicateCoelsaId` | ID Coelsa duplicado | ID Coelsa duplicado |
| `400 transactions.errors.missingId` | ID ausente | ID ausente |
| `400 transactions.errors.invalidId` | ID inválido | ID inválido |
| `400 transactions.errors.invalidStatusPending` | Status pendente inválido | Status pendente inválido |
| `400 transactions.errors.invalidStatusProcess` | Status de processamento inválido | Status de processamento inválido |
| `400 transactions.errors.invalidStatusFinal` | Status final inválido | Status final inválido |
| `400 transactions.errors.invalidSourceIdentity` | Identidade de origem inválida | Identidade de origem inválida |
| `400 transactions.errors.invalidSourceAccount` | Conta de origem inválida | Conta de origem inválida |
| `400 transactions.errors.invalidSourceTaxDocumentNumber` | Número de documento fiscal de origem inválido | Número de documento fiscal de origem inválido |
| `400 transactions.errors.invalidTargetIdentityId` | ID de identidade de destino inválido | ID de identidade de destino inválido |
| `400 transactions.errors.invalidTargetUserAccount` | Conta de usuário de destino inválida | Conta de usuário de destino inválida |
| `400 transactions.errors.invalidTargetTaxDocumentNumber` | Número de documento fiscal de destino inválido | Número de documento fiscal de destino inválido |
| `400 transactions.errors.invalidSourceUser` | Usuário de origem inválido | Usuário de origem inválido |
| `400 transactions.errors.invalidTargetUser` | Usuário de destino inválido | Usuário de destino inválido |
| `400 transactions.errors.invalidSourceIdentityType` | Tipo de identidade de origem inválido | Tipo de identidade de origem inválido |
| `400 transactions.errors.invalidtargetIdentity` | Identidade de destino inválida | Identidade de destino inválida |
| `400 transactions.errors.invalidAccess` | Acesso inválido | Acesso inválido |
| `400 transactions.errors.invalidGrantedTransactionLimit` | Limite de transação concedido inválido | Limite de transação concedido inválido |
| `400 transactions.errors.invalidGrantedMonthLimit` | Limite mensal concedido inválido | Limite mensal concedido inválido |
| `400 transactions.errors.spendingLimitExceeded` | Limite de gastos excedido | Limite de gastos excedido |
| `400 transactions.errors.arsAccountNotFound` | Conta ARS não encontrada | Conta ARS não encontrada |

### 🔴 GENERIC ERRORS

| Código | Descrição | Tradução |
|--------|-----------|----------|
| `500 server.errors.internalError` | Erro interno do servidor | Erro interno do servidor |
| `404 server.errors.notFound` | Recurso não encontrado | Recurso não encontrado |
| `403 server.errors.forbidden` | Acesso proibido | Acesso proibido |

---

## ✅ Códigos de Sucesso

### 🟢 USERS SUCCESS (200)

| Código | Descrição | Tradução |
|--------|-----------|----------|
| `200 users.success.login` | Login realizado com sucesso | Login realizado com sucesso |
| `200 users.success.logout` | Logout realizado com sucesso | Logout realizado com sucesso |
| `200 users.success.register` | Registro realizado com sucesso | Registro realizado com sucesso |
| `200 users.success.passwordReset` | Senha redefinida com sucesso | Senha redefinida com sucesso |
| `200 users.success.profileUpdated` | Perfil atualizado com sucesso | Perfil atualizado com sucesso |
| `200 users.success.passwordChanged` | Senha alterada com sucesso | Senha alterada com sucesso |

### 🟢 BACKOFFICE SUCCESS (200)

| Código | Descrição | Tradução |
|--------|-----------|----------|
| `200 backoffice.success.login` | Login realizado com sucesso | Login realizado com sucesso |
| `200 backoffice.success.logout` | Logout realizado com sucesso | Logout realizado com sucesso |
| `200 backoffice.success.profileUpdated` | Perfil atualizado com sucesso | Perfil atualizado com sucesso |
| `200 backoffice.success.passwordChanged` | Senha alterada com sucesso | Senha alterada com sucesso |

### 🟢 TRANSACTIONS SUCCESS (200)

| Código | Descrição | Tradução |
|--------|-----------|----------|
| `200 transactions.success.created` | Transação criada com sucesso | Transação criada com sucesso |
| `200 transactions.success.confirmed` | Transação confirmada com sucesso | Transação confirmada com sucesso |
| `200 transactions.success.cancelled` | Transação cancelada com sucesso | Transação cancelada com sucesso |
| `200 transactions.success.completed` | Transação concluída com sucesso | Transação concluída com sucesso |

### 🟢 GENERIC SUCCESS

| Código | Descrição | Tradução |
|--------|-----------|----------|
| `200 server.success.operationSuccess` | Operação realizada com sucesso | Operação realizada com sucesso |
| `200 server.success.dataRetrieved` | Dados recuperados com sucesso | Dados recuperados com sucesso |

---

## 📝 Formato de Resposta

### Resposta de Erro

```json
{
  "error": "401 users.errors.invalidCredentials",
  "message": "401 users.errors.invalidCredentials",
  "code": 401
}
```

### Resposta de Sucesso

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... },
  "message": "200 users.success.login",
  "code": "200 users.success.login"
}
```

---

## 🔄 Como Adicionar Novos Códigos

1. Adicione o código no enum apropriado (`error-codes.ts` ou `success-codes.ts`)
2. Atualize este documento com a descrição e tradução
3. Use o código no código através de `ErrorCodes` ou `SuccessCodes`

---

**Última atualização**: 2026-01-07

