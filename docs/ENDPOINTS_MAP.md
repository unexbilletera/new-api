# Mapeamento de Endpoints - Nova API

## 📋 Status Geral

- ✅ = Implementado
- 🚧 = Em desenvolvimento
- ⏳ = Pendente
- ❌ = Não será implementado

---

## 💸 TRANSFERÊNCIAS E PAGAMENTOS

### 🔄 Transferências entre Usuários

| Endpoint | Método | Provedor | Status | Observações |
|----------|--------|----------|--------|-------------|
| `/api/users/createTransaction/transfer` | POST | Cronos | ⏳ | Transferência internacional entre usuários |
| `/api/users/confirmTransaction` | POST | - | ⏳ | Confirma transação criada |
| `/api/users/cancelTransaction` | POST | - | ⏳ | Cancela transação pendente |
| `/api/users/selectTransaction/:id` | GET | - | ⏳ | Busca detalhes de uma transação |
| `/api/users/ticketTransaction/:id` | GET | - | ⏳ | Gera ticket/comprovante da transação |
| `/api/transactions` | GET | - | ⏳ | Lista todas as transações (com filtros) |
| `/api/transactions/:id` | GET | - | ⏳ | Busca transação específica |

### 🔐 Validação de Transações (Alto Valor)

| Endpoint | Método | Status | Observações |
|----------|--------|--------|-------------|
| `/api/users/transactions/check-validation` | POST | ⏳ | Verifica se transação precisa de validação (biometric/password) |
| `/api/users/transactions/validation-status/:authId` | GET | ⏳ | Consulta status de validação pendente |
| `/api/users/transactions/validate-password` | POST | ⏳ | Valida transação com senha |

---

### 💰 Cashout (Saques/Envios)

#### **Cronos**
| Endpoint | Método | Tipo | Status | Observações |
|----------|--------|------|--------|-------------|
| `/api/users/createTransaction/cashout` | POST | `cashout` | ⏳ | Saque padrão Cronos |
| `/api/users/createTransaction/cashoutCronosQr` | POST | `cashout_cronos_qr` | ⏳ | Saque via QR Code Cronos |

#### **Gire**
| Endpoint | Método | Tipo | Status | Observações |
|----------|--------|------|--------|-------------|
| `/api/users/createTransaction/cashoutGire` | POST | `cashout_gire` | ⏳ | Saque via Gire |

#### **Coelsa**
| Endpoint | Método | Tipo | Status | Observações |
|----------|--------|------|--------|-------------|
| `/api/users/createTransaction/cashoutCoelsa` | POST | `cashout_coelsa` | ⏳ | Saque via Coelsa |

#### **Manteca**
| Endpoint | Método | Tipo | Status | Observações |
|----------|--------|------|--------|-------------|
| `/api/users/createTransaction/cashoutMantecaQrAr` | POST | `cashout_manteca_qr_ar` | ⏳ | Saque QR Manteca (AR) |
| `/api/users/createTransaction/cashoutMantecaQrBr` | POST | `cashout_manteca_qr_br` | ⏳ | Saque QR Manteca (BR) |
| `/api/users/createTransaction/cashoutMantecaExchangeAr` | POST | `cashout_manteca_exchange_ar` | ⏳ | Saque Exchange Manteca (AR) |
| `/api/users/createTransaction/cashoutMantecaExchangeBr` | POST | `cashout_manteca_exchange_br` | ⏳ | Saque Exchange Manteca (BR) |

---

### 💵 Cashin (Depósitos/Recebimentos)

| Endpoint | Método | Tipo | Status | Observações |
|----------|--------|------|--------|-------------|
| `/api/users/createTransaction/cashin` | POST | `cashin` | ⏳ | Depósito padrão |
| `/api/users/createTransaction/cashinCoelsa` | POST | `cashin_coelsa` | ⏳ | Depósito via Coelsa |

---

### 💳 Pagamentos

#### **Gire**
| Endpoint | Método | Tipo | Status | Observações |
|----------|--------|------|--------|-------------|
| `/api/users/createTransaction/paymentGire` | POST | `payment_gire` | ⏳ | Pagamento de boletos via Gire |

#### **Cronos**
| Endpoint | Método | Tipo | Status | Observações |
|----------|--------|------|--------|-------------|
| `/api/users/createTransaction/payment` | POST | `payment` | ⏳ | Pagamento padrão (boleto) |
| `/api/users/createTransaction/paymentCronos` | POST | `payment_cronos` | ⏳ | Pagamento via Cronos |
| `/api/users/createTransaction/paymentQr` | POST | `payment_qr` | ⏳ | Pagamento via QR Code |

---

### 🔋 Recargas

| Endpoint | Método | Tipo | Status | Observações |
|----------|--------|------|--------|-------------|
| `/api/users/createTransaction/rechargeGire` | POST | `recharge_gire` | ⏳ | Recarga via Gire |
| `/api/users/createTransaction/rechargeCronos` | POST | `recharge_cronos` | ⏳ | Recarga via Cronos |

---

### 🎁 Outros

| Endpoint | Método | Tipo | Status | Observações |
|----------|--------|------|--------|-------------|
| `/api/users/createTransaction/cashback` | POST | `cashback` | ⏳ | Cashback |
| `/api/users/createTransaction/refoundCoelsa` | POST | `refound_coelsa` | ⏳ | Reembolso Coelsa |

---

## 💱 CONVERSÃO DE MOEDAS (Exchange)

| Endpoint | Método | Status | Observações |
|----------|--------|--------|-------------|
| `/api/exchange/rates` | GET | ⏳ | Obtém cotações atuais |
| `/api/exchange/convert` | POST | ⏳ | Converte valor entre moedas |
| `/api/exchange/bulk-rates` | POST | ⏳ | Obtém cotações para múltiplos valores |
| `/api/exchange/preview` | POST | ⏳ | Preview de conversão (não cria transação) |
| `/api/exchange/confirm` | POST | ⏳ | Confirma conversão e cria transação |

---

## 🔌 INTEGRAÇÕES - CRONOS

### 📊 Consultas e Operações

| Endpoint | Método | Status | Observações |
|----------|--------|--------|-------------|
| `/api/cronos/getHealth` | GET | ⏳ | Health check do Cronos |
| `/api/cronos/sendTransactionalToken` | POST | ⏳ | Envia token transacional |
| `/api/cronos/rechargeCompanies` | GET | ⏳ | Lista empresas de recarga |
| `/api/cronos/paymentModes` | POST | ⏳ | Lista modos de pagamento |
| `/api/cronos/setUserPix` | POST | ⏳ | Adiciona chave PIX do usuário |
| `/api/cronos/removeUserPix` | POST | ⏳ | Remove chave PIX do usuário |
| `/api/cronos/webhook` | POST | ⏳ | Webhook do Cronos |
| `/api/cronos/proxy` | POST | ⏳ | Proxy para Cronos (admin only) |

---

## 🔌 INTEGRAÇÕES - BIND

### 📊 Consultas e Operações

| Endpoint | Método | Status | Observações |
|----------|--------|--------|-------------|
| `/api/bind/accounts` | GET | ⏳ | Lista contas Bind |
| `/api/bind/accounts/:id` | GET | ⏳ | Busca conta Bind específica |
| `/api/bind/transactions` | GET | ⏳ | Lista transações Bind |
| `/api/bind/transactions/:id` | GET | ⏳ | Busca transação Bind específica |
| `/api/bind/transactions/:id/:date` | GET | ⏳ | Busca transação Bind por data |
| `/api/bind/transfers` | GET | ⏳ | Lista transferências Bind |
| `/api/bind/transfers/:id` | GET | ⏳ | Busca transferência Bind específica |
| `/api/bind/webhook/:method?/:action?` | POST | ⏳ | Webhook do Bind |
| `/api/bind/proxy` | POST | ⏳ | Proxy para Bind (admin only) |

---

## 🔌 INTEGRAÇÕES - GIRE

### 📊 Consultas e Operações

| Endpoint | Método | Status | Observações |
|----------|--------|--------|-------------|
| `/api/gire/companies/:name` | GET | ⏳ | Busca empresas Gire por nome |
| `/api/gire/rechargeCompanies` | GET | ⏳ | Lista empresas de recarga Gire |
| `/api/gire/rechargeCompanies/:id` | GET | ⏳ | Busca empresa de recarga específica |
| `/api/gire/paymentModes/:id` | GET | ⏳ | Lista modos de pagamento de uma empresa |
| `/api/gire/bills/:id1/:id2` | POST | ⏳ | Busca contas/faturas |
| `/api/gire/bills/:barcode` | GET | ⏳ | Busca conta por código de barras |
| `/api/gire/operations/:operationId` | GET | ⏳ | Busca operação por ID |
| `/api/gire/operations/ticket/:operationId` | GET | ⏳ | Gera ticket da operação |
| `/api/gire/webhook/:method?/:action?` | POST | ⏳ | Webhook do Gire |

---

## 🔌 INTEGRAÇÕES - MANTECA

### 📊 Consultas e Operações

| Endpoint | Método | Status | Observações |
|----------|--------|--------|-------------|
| `/api/manteca/getHealth` | GET | ⏳ | Health check do Manteca |
| `/api/manteca/getWebhookSignature` | POST | ⏳ | Gera assinatura para webhook |
| `/api/manteca/check-synthetic-status` | POST | ⏳ | Verifica status sintético diretamente |
| `/api/manteca/test-webhook` | POST/GET | ⏳ | Testa webhook (sem validação) |
| `/api/manteca/webhook` | POST | ⏳ | Webhook do Manteca |
| `/api/manteca/proxy` | POST | ⏳ | Proxy para Manteca (admin only) |

---

## 📡 WEBHOOKS (Compatibilidade)

| Endpoint | Método | Provedor | Status | Observações |
|----------|--------|----------|--------|-------------|
| `/api/webhook/bind/:method?/:action?` | POST | Bind | ⏳ | Webhook Bind (compatibilidade) |
| `/api/webhook/gire/:method?/:action?` | POST | Gire | ⏳ | Webhook Gire (compatibilidade) |
| `/api/webhook/manteca` | POST | Manteca | ⏳ | Webhook Manteca (compatibilidade) |
| `/api/webhook/manteca/:method?/:action?` | POST | Manteca | ⏳ | Webhook Manteca alternativo |

---

## 📊 BACKOFFICE - Transferências

### Bind

| Endpoint | Método | Status | Observações |
|----------|--------|--------|-------------|
| `/backoffice/bind/accounts` | GET | ⏳ | Resumo de saldos Bind (conta principal + Unex) |
| `/backoffice/bind/accounts/list` | GET | ⏳ | Lista contas Bind (view owner) |
| `/backoffice/bind/transfers` | GET | ⏳ | Lista transferências Bind (com filtros) |
| `/backoffice/bind/transactions/recover` | POST | ⏳ | Recupera transação Bind manualmente (usando código Coelsa) |
| `/backoffice/bind/webhooks` | GET | ⏳ | Lista webhooks configurados na Bind |
| `/backoffice/bind/accounts/cbu/:cbu` | GET | ⏳ | Consulta conta Bind por CBU/CVU |
| `/backoffice/bind/cvu/:accountId` | PUT | ⏳ | Modifica CVU existente na Bind |
| `/backoffice/bind/cvu` | DELETE | ⏳ | Deleta CVU |

### Cronos

| Endpoint | Método | Status | Observações |
|----------|--------|--------|-------------|
| `/backoffice/cronos/health` | GET | ⏳ | Status geral da integração Cronos |
| `/backoffice/clients/:userId/cronos-balance` | GET | ⏳ | Saldo Cronos de um cliente específico |

### Transações (Geral)

| Endpoint | Método | Status | Observações |
|----------|--------|--------|-------------|
| `/backoffice/clients/:id/transactions` | GET | ⏳ | Transações do cliente (com filtros: page, limit, minValue, maxValue, startDate, endDate, transactionType) |
| `/backoffice/tasks/transactions/:action` | POST | ⏳ | Executa task de transações (ex: accountConciliation) |

### Validação de Transações

| Endpoint | Método | Status | Observações |
|----------|--------|--------|-------------|
| `/backoffice/transaction-validation/limits` | GET | ⏳ | Lista limites de validação (biometric/password thresholds) |
| `/backoffice/transaction-validation/limits` | POST | ⏳ | Atualiza limites de validação |

---

## 📝 Resumo por Provedor

### **Cronos** (Transferências e Pagamentos)
- ✅ Total de endpoints: **8** (app) + **2** (backoffice) = **10**
- ✅ Tipos de transação: `cashout`, `cashout_cronos_qr`, `payment`, `payment_cronos`, `payment_qr`, `recharge_cronos`, `transfer`

### **Bind** (Transferências)
- ✅ Total de endpoints: **10** (app) + **8** (backoffice) = **18**
- ✅ Tipos de transação: Transferências entre contas Bind

### **Gire** (Pagamentos e Recargas)
- ✅ Total de endpoints: **9**
- ✅ Tipos de transação: `cashout_gire`, `payment_gire`, `recharge_gire`

### **Manteca** (QR e Exchange)
- ✅ Total de endpoints: **6**
- ✅ Tipos de transação: `cashout_manteca_qr_ar`, `cashout_manteca_qr_br`, `cashout_manteca_exchange_ar`, `cashout_manteca_exchange_br`

### **Coelsa** (Cashin/Cashout)
- ✅ Total de endpoints: **3**
- ✅ Tipos de transação: `cashin_coelsa`, `cashout_coelsa`, `refound_coelsa`

### **Exchange** (Conversão de Moedas)
- ✅ Total de endpoints: **5**
- ✅ Funcionalidades: Cotações, conversão, preview, confirmação

---

## 📊 Estatísticas Gerais

- **Total de endpoints de criação de transação**: **18**
- **Total de endpoints de consulta**: **15**
- **Total de endpoints de integração**: **33**
- **Total de endpoints de backoffice**: **12**
- **Total de webhooks**: **7**
- **Total geral**: **~85 endpoints**

---

## 🎯 Priorização Sugerida

### Fase 1 - Transferências Básicas (Alta Prioridade)
1. ⏳ `/api/users/createTransaction/transfer` - Transferência entre usuários
2. ⏳ `/api/users/selectTransaction/:id` - Consulta de transação
3. ⏳ `/api/transactions` - Lista de transações
4. ⏳ `/api/users/confirmTransaction` - Confirmação
5. ⏳ `/api/users/cancelTransaction` - Cancelamento

### Fase 2 - Integrações Essenciais
1. ⏳ Webhooks (Cronos, Bind, Gire, Manteca)
2. ⏳ Endpoints de consulta de integrações
3. ⏳ Health checks

### Fase 3 - Funcionalidades Avançadas
1. ⏳ Validação de transações de alto valor
2. ⏳ Exchange/Conversão
3. ⏳ Endpoints de backoffice

---

## ✅ Checklist de Implementação

### 🔄 Transferências Básicas
- [ ] POST `/api/users/createTransaction/transfer`
- [ ] POST `/api/users/confirmTransaction`
- [ ] POST `/api/users/cancelTransaction`
- [ ] GET `/api/users/selectTransaction/:id`
- [ ] GET `/api/users/ticketTransaction/:id`
- [ ] GET `/api/transactions`
- [ ] GET `/api/transactions/:id`

### 💰 Cashout
- [ ] POST `/api/users/createTransaction/cashout` (Cronos)
- [ ] POST `/api/users/createTransaction/cashoutCronosQr` (Cronos)
- [ ] POST `/api/users/createTransaction/cashoutGire` (Gire)
- [ ] POST `/api/users/createTransaction/cashoutCoelsa` (Coelsa)
- [ ] POST `/api/users/createTransaction/cashoutMantecaQrAr` (Manteca)
- [ ] POST `/api/users/createTransaction/cashoutMantecaQrBr` (Manteca)
- [ ] POST `/api/users/createTransaction/cashoutMantecaExchangeAr` (Manteca)
- [ ] POST `/api/users/createTransaction/cashoutMantecaExchangeBr` (Manteca)

### 💵 Cashin
- [ ] POST `/api/users/createTransaction/cashin`
- [ ] POST `/api/users/createTransaction/cashinCoelsa`

### 💳 Pagamentos
- [ ] POST `/api/users/createTransaction/payment`
- [ ] POST `/api/users/createTransaction/paymentQr`
- [ ] POST `/api/users/createTransaction/paymentGire`
- [ ] POST `/api/users/createTransaction/paymentCronos`

### 🔋 Recargas
- [ ] POST `/api/users/createTransaction/rechargeGire`
- [ ] POST `/api/users/createTransaction/rechargeCronos`

### 🔐 Validação
- [ ] POST `/api/users/transactions/check-validation`
- [ ] GET `/api/users/transactions/validation-status/:authId`
- [ ] POST `/api/users/transactions/validate-password`

### 💱 Exchange
- [ ] GET `/api/exchange/rates`
- [ ] POST `/api/exchange/convert`
- [ ] POST `/api/exchange/bulk-rates`
- [ ] POST `/api/exchange/preview`
- [ ] POST `/api/exchange/confirm`

### 🔌 Cronos
- [ ] GET `/api/cronos/getHealth`
- [ ] POST `/api/cronos/sendTransactionalToken`
- [ ] GET `/api/cronos/rechargeCompanies`
- [ ] POST `/api/cronos/paymentModes`
- [ ] POST `/api/cronos/setUserPix`
- [ ] POST `/api/cronos/removeUserPix`
- [ ] POST `/api/cronos/webhook`

### 🔌 Bind
- [ ] GET `/api/bind/accounts`
- [ ] GET `/api/bind/accounts/:id`
- [ ] GET `/api/bind/transactions`
- [ ] GET `/api/bind/transactions/:id`
- [ ] GET `/api/bind/transactions/:id/:date`
- [ ] GET `/api/bind/transfers`
- [ ] GET `/api/bind/transfers/:id`
- [ ] POST `/api/bind/webhook/:method?/:action?`

### 🔌 Gire
- [ ] GET `/api/gire/companies/:name`
- [ ] GET `/api/gire/rechargeCompanies`
- [ ] GET `/api/gire/rechargeCompanies/:id`
- [ ] GET `/api/gire/paymentModes/:id`
- [ ] POST `/api/gire/bills/:id1/:id2`
- [ ] GET `/api/gire/bills/:barcode`
- [ ] GET `/api/gire/operations/:operationId`
- [ ] GET `/api/gire/operations/ticket/:operationId`
- [ ] POST `/api/gire/webhook/:method?/:action?`

### 🔌 Manteca
- [ ] GET `/api/manteca/getHealth`
- [ ] POST `/api/manteca/getWebhookSignature`
- [ ] POST `/api/manteca/check-synthetic-status`
- [ ] POST `/api/manteca/test-webhook`
- [ ] POST `/api/manteca/webhook`

### 📡 Webhooks (Compatibilidade)
- [ ] POST `/api/webhook/bind/:method?/:action?`
- [ ] POST `/api/webhook/gire/:method?/:action?`
- [ ] POST `/api/webhook/manteca`
- [ ] POST `/api/webhook/manteca/:method?/:action?`

### 📊 Backoffice
- [ ] GET `/backoffice/bind/accounts`
- [ ] GET `/backoffice/bind/accounts/list`
- [ ] GET `/backoffice/bind/transfers`
- [ ] POST `/backoffice/bind/transactions/recover`
- [ ] GET `/backoffice/bind/webhooks`
- [ ] GET `/backoffice/bind/accounts/cbu/:cbu`
- [ ] PUT `/backoffice/bind/cvu/:accountId`
- [ ] DELETE `/backoffice/bind/cvu`
- [ ] GET `/backoffice/cronos/health`
- [ ] GET `/backoffice/clients/:userId/cronos-balance`
- [ ] GET `/backoffice/clients/:id/transactions`
- [ ] POST `/backoffice/tasks/transactions/:action`
- [ ] GET `/backoffice/transaction-validation/limits`
- [ ] POST `/backoffice/transaction-validation/limits`

---

## 🎯 Próximos Passos

1. **Priorizar endpoints de transferências** (foco inicial)
2. **Implementar endpoints de criação** (`createTransaction/*`)
3. **Implementar endpoints de consulta** (`selectTransaction`, `transactions`)
4. **Implementar webhooks** (processamento assíncrono)
5. **Implementar endpoints de integração** (Cronos, Bind, Gire, Manteca)

---

## 📌 Notas Importantes

- Todos os endpoints de criação de transação criam com status `pending`
- Validações de spending limits aplicadas em alguns endpoints
- Webhooks são processados de forma assíncrona (fila SQS)
- Endpoints de backoffice requerem autenticação específica (níveis de acesso)

