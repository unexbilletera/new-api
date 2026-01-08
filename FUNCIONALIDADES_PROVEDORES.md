# Funcionalidades por Provedor

Este documento lista todas as funcionalidades/capacidades de cada provedor de pagamento, sem se preocupar com os endpoints específicos. O objetivo é entender o que cada provedor pode fazer antes de centralizar tudo em endpoints únicos.

---

## 🏦 CRONOS

### 💰 Operações Financeiras

1. **Cash-in (Depósito)**
   - Recebimento de PIX via chave PIX
   - Recebimento via QR Code estático/dinâmico
   - Webhook automático quando recebe dinheiro

2. **Cash-out (Saque/Envio)**
   - Envio de PIX via chave PIX
   - Envio via QR Code (QR Code dinâmico)
   - Transferência entre contas Cronos

3. **Transferências**
   - Transferência internacional entre usuários
   - Suporte a múltiplas moedas (BRL, ARS)
   - Conversão automática de moeda quando necessário

4. **Pagamentos**
   - Pagamento de boletos (boleto bancário)
   - Pagamento via QR Code (PIX QR Code)
   - Suporte a pagamentos em ARS e BRL

5. **Recargas**
   - Recarga de celular (pré-pago)
   - Lista de empresas de recarga disponíveis
   - Múltiplos modos de pagamento por empresa

6. **PIX**
   - Cadastro de chaves PIX do usuário
   - Remoção de chaves PIX
   - Geração de QR Code para recebimento
   - Leitura de QR Code para pagamento

### 🔧 Funcionalidades Técnicas

- **Webhook**: Recebe notificações de transações (cashin, cashout, etc.)
- **Health Check**: Verifica status da integração
- **Token Transacional**: Envio de token para validação de transações
- **Statements**: Consulta de extratos bancários
- **Accounts**: Gerenciamento de contas bancárias

### 📊 Tipos de Transação Suportados

- `cashin` - Depósito padrão
- `cashout` - Saque padrão
- `cashout_cronos_qr` - Saque via QR Code
- `payment` - Pagamento de boleto
- `payment_cronos` - Pagamento via Cronos
- `payment_qr` - Pagamento via QR Code
- `recharge_cronos` - Recarga de celular
- `transfer` - Transferência entre usuários

---

## 🏦 BIND

### 💰 Operações Financeiras

1. **Transferências**
   - Transferência entre CVUs (Conta Virtual Única - Argentina)
   - Transferência entre CBUs (Clave Bancaria Uniforme - Argentina)
   - Transferência CVU → CBU
   - Transferência CBU → CVU
   - Suporte apenas para moeda ARS (Pesos Argentinos)

2. **Gerenciamento de Contas**
   - Criação de CVU para usuários
   - Consulta de contas por CVU/CBU
   - Consulta de saldo de contas
   - Modificação de CVU existente
   - Exclusão de CVU
   - Alteração de alias (apelido) da conta

3. **Cash-in (Depósito)**
   - Recebimento via transferência Bind (CVU/CBU)
   - Webhook automático quando recebe dinheiro

4. **Cash-out (Saque/Envio)**
   - Envio via transferência Bind (CVU/CBU)
   - Suporte a transferências para contas externas

### 🔧 Funcionalidades Técnicas

- **Webhook**: Recebe notificações de transferências (cashin, cashout)
- **Accounts API**: Consulta e gerenciamento de contas
- **Transfers API**: Consulta de transferências realizadas
- **Transactions API**: Consulta de transações
- **Balance**: Consulta de saldos

### 📊 Tipos de Transação Suportados

- `cashin_bind` - Depósito via Bind (recebimento)
- `cashout_bind` - Saque via Bind (envio)
- Transferências entre contas Bind (CVU/CBU)

### 🌍 Região

- **Apenas Argentina (ARS)**
- Não suporta Brasil ou outras moedas

---

## 🏦 GIRE

### 💰 Operações Financeiras

1. **Pagamentos**
   - Pagamento de boletos (faturas)
   - Consulta de boletos por código de barras
   - Consulta de boletos por empresa e modo de pagamento
   - Suporte a múltiplas empresas (utilities, serviços, etc.)

2. **Recargas**
   - Recarga de celular (pré-pago)
   - Lista de empresas de recarga disponíveis
   - Consulta de empresa de recarga específica
   - Múltiplos modos de pagamento por empresa

3. **Cash-out (Saque/Envio)**
   - Saque via Gire (envio de dinheiro)
   - Integração com sistema de pagamentos argentino

4. **Cash-in (Depósito)**
   - Recebimento via Gire

### 🔧 Funcionalidades Técnicas

- **Webhook**: Recebe notificações de pagamentos e recargas
  - `cashin/consulta` - Consulta de cashin
  - `cashin/pago` - Confirmação de pagamento recebido
  - `cashout/consulta` - Consulta de cashout
  - `cashout/pago` - Confirmação de pagamento enviado
  - `reversa` - Reversão de transação
- **Companies API**: Busca de empresas por nome
- **Payment Modes API**: Lista modos de pagamento de uma empresa
- **Bills API**: Consulta de faturas/boletos
- **Operations API**: Consulta de operações realizadas
- **Ticket**: Geração de comprovantes de operações

### 📊 Tipos de Transação Suportados

- `cashout_gire` - Saque via Gire
- `payment_gire` - Pagamento de boleto via Gire
- `recharge_gire` - Recarga de celular via Gire

### 🌍 Região

- **Apenas Argentina (ARS)**
- Focado em pagamentos e serviços argentinos

---

## 🏦 MANTECA

### 💰 Operações Financeiras

1. **Exchange (Conversão de Moedas)**
   - Conversão ARS → BRL (ramp-on: saída ARS, entrada BRL)
   - Conversão BRL → ARS (ramp-off: saída BRL, entrada ARS)
   - Cotações em tempo real
   - Suporte a operações sintéticas (Synthetic Operations)
   - Rastreamento de status via webhook

2. **QR Code Payments**
   - Pagamento via QR Code (Argentina)
   - Pagamento via QR Code (Brasil)
   - Suporte a QR Codes estáticos e dinâmicos

3. **Withdraw (Saque)**
   - Saque de criptomoedas/ativos digitais
   - Conversão para moeda fiat (ARS/BRL)
   - Rastreamento de status via webhook

### 🔧 Funcionalidades Técnicas

- **Webhook**: Recebe notificações de múltiplos eventos:
  - `SYNTHETIC_STATUS_UPDATE` - Atualização de status de operação sintética (exchange)
  - `WITHDRAW_STATUS_UPDATE` - Atualização de status de saque
  - `ORDER_STATUS_UPDATE` - Atualização de status de pedido
- **Synthetic API**: Consulta de operações sintéticas (exchange)
- **Withdraw API**: Consulta de saques
- **Rates API**: Consulta de cotações de moedas
- **Health Check**: Verifica status da integração
- **Webhook Signature**: Geração de assinatura para validação de webhooks
- **Check Synthetic Status**: Consulta direta do status de uma operação sintética

### 📊 Tipos de Transação Suportados

- `cashout_manteca_qr_ar` - Saque QR Manteca (Argentina)
- `cashout_manteca_qr_br` - Saque QR Manteca (Brasil)
- `cashout_manteca_exchange_ar` - Exchange Manteca (saída ARS, entrada BRL)
- `cashout_manteca_exchange_br` - Exchange Manteca (saída BRL, entrada ARS)
- `cashin_manteca_exchange_ar` - Cashin Exchange Manteca (recebimento ARS após exchange)
- `cashin_manteca_exchange_br` - Cashin Exchange Manteca (recebimento BRL após exchange)

### 🌍 Região

- **Argentina e Brasil**
- Focado em conversão de moedas e pagamentos QR

---

## 🏦 COELSA

### 💰 Operações Financeiras

1. **Cash-in (Depósito)**
   - Recebimento via Coelsa
   - Integração com sistema de pagamentos

2. **Cash-out (Saque/Envio)**
   - Saque via Coelsa
   - Envio de dinheiro

3. **Reembolso (Refund)**
   - Estorno de transações
   - Reversão de pagamentos

### 🔧 Funcionalidades Técnicas

- **QR Code Decoding**: Decodificação de QR Codes EMV
- Integração com sistema de pagamentos brasileiro

### 📊 Tipos de Transação Suportados

- `cashin_coelsa` - Depósito via Coelsa
- `cashout_coelsa` - Saque via Coelsa
- `refound_coelsa` - Reembolso via Coelsa

### 🌍 Região

- **Brasil**
- Integração com sistema de pagamentos brasileiro

---

## 📊 Resumo Comparativo

| Funcionalidade | Cronos | Bind | Gire | Manteca | Coelsa |
|----------------|--------|------|------|---------|--------|
| **Cash-in** | ✅ | ✅ | ✅ | ✅ (Exchange) | ✅ |
| **Cash-out** | ✅ | ✅ | ✅ | ✅ (QR + Exchange) | ✅ |
| **Transferências** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Pagamentos (Boleto)** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Pagamentos (QR)** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Recargas** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Exchange (Conversão)** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **PIX** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **CVU/CBU** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Webhook** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Região Principal** | BR | AR | AR | AR + BR | BR |

---

## 🎯 Funcionalidades Comuns (Centralizar)

### 1. **Criação de Transação**
- Todos os provedores usam o mesmo fluxo: `createTransaction` → `confirmTransaction`
- A diferença está apenas no `type` da transação

### 2. **Confirmação de Transação**
- Todos usam `confirmTransaction` após criar
- O processamento é assíncrono via webhook

### 3. **Webhooks**
- Todos os provedores enviam webhooks para atualizar status
- Processamento assíncrono (fila SQS)

### 4. **Consulta de Transação**
- Todos permitem consultar status de transação criada
- Busca por ID da transação

---

## 📝 Notas Importantes

1. **Cronos** é o provedor mais completo, suportando:
   - PIX (Brasil)
   - Boletos
   - QR Codes
   - Recargas
   - Transferências internacionais

2. **Bind** é específico para Argentina:
   - Apenas CVU/CBU (sistema argentino)
   - Apenas ARS
   - Focado em transferências

3. **Gire** é específico para Argentina:
   - Pagamentos de boletos/faturas
   - Recargas
   - Sistema de pagamentos argentino

4. **Manteca** é para conversão de moedas:
   - Exchange ARS ↔ BRL
   - QR Codes (AR e BR)
   - Operações sintéticas complexas

5. **Coelsa** é para integração brasileira:
   - Decodificação de QR Codes
   - Integração com sistema de pagamentos BR

---

## 🔄 Fluxo Centralizado Sugerido

### Endpoint Único de Criação
```
POST /api/transactions
Body: {
  type: "cashout" | "cashin" | "transfer" | "payment" | "recharge" | ...
  provider: "cronos" | "bind" | "gire" | "manteca" | "coelsa"
  amount: number
  currency: "BRL" | "ARS"
  // ... outros campos específicos
}
```

### Endpoint Único de Confirmação
```
POST /api/transactions/:id/confirm
```

### Webhooks Centralizados
```
POST /api/webhooks/:provider
```

