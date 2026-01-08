# Endpoints Temporários de Teste de Autenticação

⚠️ **ATENÇÃO**: Estes endpoints são **TEMPORÁRIOS** e devem ser **REMOVIDOS EM PRODUÇÃO**.

Eles foram criados apenas para facilitar testes durante o desenvolvimento, permitindo fazer login real com validação de senha para obter tokens JWT.

---

## 🔐 Endpoints Disponíveis

### 1. Login Temporário (App/Usuários)

**POST** `/test/auth/login`

Faz login temporário para usuários do app (customers).

#### Body (obrigatório):
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha-do-usuario"
}
```

#### Resposta de Sucesso:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "status": "active",
    "identity": { ... }
  },
  "message": "Login temporário realizado com sucesso (apenas para testes)"
}
```

#### Exemplo de uso com cURL:
```bash
# Login com email e senha
curl -X POST http://localhost:3000/test/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

---

### 2. Login Temporário (Backoffice)

**POST** `/test/auth/backoffice-login`

Faz login temporário para usuários do backoffice.

#### Body (obrigatório):
```json
{
  "email": "admin@exemplo.com",
  "password": "senha-do-admin"
}
```

#### Resposta de Sucesso:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@exemplo.com",
    "name": "Nome do Admin",
    "status": "active",
    "role": {
      "id": "uuid",
      "name": "Administrator",
      "level": 3
    }
  },
  "message": "Login backoffice temporário realizado com sucesso (apenas para testes)"
}
```

#### Exemplo de uso com cURL:
```bash
# Login com email e senha
curl -X POST http://localhost:3000/test/auth/backoffice-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exemplo.com",
    "password": "senha123"
  }'
```

---

## 🚀 Como Usar o Token

Após obter o token, use-o no header `Authorization`:

```bash
# Exemplo: acessar endpoint protegido
curl -X GET http://localhost:3000/backoffice/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📝 Notas Importantes

1. **Valida credenciais**: Estes endpoints validam email e senha antes de gerar o token
2. **Apenas para desenvolvimento**: ⚠️ **NUNCA** deixe estes endpoints em produção
3. **Token válido**: O token gerado é um JWT válido e pode ser usado em qualquer endpoint protegido
4. **Campos obrigatórios**: Email e senha são obrigatórios
5. **Atualiza último login**: O último login do usuário é atualizado após login bem-sucedido

---

## 🗑️ Como Remover em Produção

Para remover estes endpoints temporários:

1. Remover o arquivo: `src/public/auth/controllers/test-auth.controller.ts`
2. Remover do módulo: `src/public/auth/auth.module.ts`
   - Remover `TestAuthController` do array `controllers`
   - Remover import de `TestAuthController`

---

## 🔒 Segurança

- ✅ Tokens gerados são JWT válidos
- ✅ Tokens seguem o mesmo padrão dos tokens reais
- ✅ **Valida senha** usando bcrypt
- ✅ Verifica se usuário está ativo (backoffice)
- ✅ Atualiza último login após autenticação bem-sucedida
- ❌ **NÃO** deve estar em produção (endpoints temporários)

