# Payment Provider Features

This document lists capabilities of each payment provider to understand integration options before centralizing into unified endpoints.

## CRONOS

### Financial Operations

1. **Cash-in (Deposit)**
   - PIX receipt via PIX key
   - Receipt via static/dynamic QR Code
   - Automatic webhook when receiving money

2. **Cash-out (Withdrawal/Send)**
   - PIX send via PIX key
   - Send via QR Code (dynamic QR Code)
   - Transfer between Cronos accounts

3. **Transfers**
   - International transfer between users
   - Support for multiple currencies (BRL, ARS)
   - Automatic currency conversion when needed

4. **Payments**
   - Bill payment (bank slip)
   - Payment via QR Code (PIX QR Code)
   - Support for payments in ARS and BRL

5. **Recharges**
   - Mobile recharge (prepaid)
   - List of available recharge companies
   - Multiple payment methods per company

6. **PIX**
   - User PIX key registration
   - PIX key removal
   - QR Code generation for receipt
   - QR Code reading for payment

### Technical Features

- **Webhook**: Transaction notifications (cashin, cashout)
- **Health Check**: Integration status verification
- **Transactional Token**: Token for transaction validation
- **Statements**: Bank statement queries
- **Accounts**: Bank account management

### Supported Transaction Types

- `cashin` - Standard deposit
- `cashout` - Standard withdrawal
- `cashout_cronos_qr` - Withdrawal via QR Code
- `payment` - Bill payment
- `payment_cronos` - Payment via Cronos
- `payment_qr` - Payment via QR Code
- `recharge_cronos` - Mobile recharge
- `transfer` - Transfer between users

### Region

- Primary: Brazil (BRL)
- Secondary: Argentina (ARS)

## BIND

### Financial Operations

1. **Transfers**
   - Transfer between CVUs (Virtual Unique Account - Argentina)
   - Transfer between CBUs (Uniform Bank Key - Argentina)
   - Transfer CVU → CBU
   - Transfer CBU → CVU
   - Support only for ARS currency (Argentine Pesos)

2. **Account Management**
   - CVU creation for users
   - Account query by CVU/CBU
   - Account balance query
   - CVU modification
   - CVU deletion
   - Account alias change

3. **Cash-in (Deposit)**
   - Receipt via Bind transfer (CVU/CBU)
   - Automatic webhook when receiving money

4. **Cash-out (Withdrawal/Send)**
   - Send via Bind transfer (CVU/CBU)
   - Support for transfers to external accounts

### Technical Features

- **Webhook**: Transfer notifications (cashin, cashout)
- **Accounts API**: Account query and management
- **Transfers API**: Query of performed transfers
- **Transactions API**: Transaction queries
- **Balance**: Balance queries

### Supported Transaction Types

- `cashin_bind` - Deposit via Bind (receipt)
- `cashout_bind` - Withdrawal via Bind (send)
- Transfers between Bind accounts (CVU/CBU)

### Region

- Argentina only (ARS)
- Does not support Brazil or other currencies

## GIRE

### Financial Operations

1. **Payments**
   - Bill payment (invoices)
   - Bill query by barcode
   - Bill query by company and payment method
   - Support for multiple companies (utilities, services)

2. **Recharges**
   - Mobile recharge (prepaid)
   - List of available recharge companies
   - Query specific recharge company
   - Multiple payment methods per company

3. **Cash-out (Withdrawal/Send)**
   - Withdrawal via Gire (money send)
   - Integration with Argentine payment system

4. **Cash-in (Deposit)**
   - Receipt via Gire

### Technical Features

- **Webhook**: Payment and recharge notifications
  - `cashin/consulta` - Cashin query
  - `cashin/pago` - Payment receipt confirmation
  - `cashout/consulta` - Cashout query
  - `cashout/pago` - Payment send confirmation
  - `reversa` - Transaction reversal
- **Companies API**: Company search by name
- **Payment Modes API**: Lists payment methods per company
- **Bills API**: Invoice/bill queries
- **Operations API**: Query of performed operations
- **Ticket**: Operation receipt generation

### Supported Transaction Types

- `cashout_gire` - Withdrawal via Gire
- `payment_gire` - Bill payment via Gire
- `recharge_gire` - Mobile recharge via Gire

### Region

- Argentina only (ARS)
- Focused on Argentine payments and services

## MANTECA

### Financial Operations

1. **Exchange (Currency Conversion)**
   - Conversion ARS → BRL (ramp-on: ARS out, BRL in)
   - Conversion BRL → ARS (ramp-off: BRL out, ARS in)
   - Real-time quotes
   - Support for synthetic operations
   - Status tracking via webhook

2. **QR Code Payments**
   - Payment via QR Code (Argentina)
   - Payment via QR Code (Brazil)
   - Support for static and dynamic QR Codes

3. **Withdraw (Withdrawal)**
   - Cryptocurrency/digital asset withdrawal
   - Conversion to fiat currency (ARS/BRL)
   - Status tracking via webhook

### Technical Features

- **Webhook**: Multiple event notifications
  - `SYNTHETIC_STATUS_UPDATE` - Exchange status update
  - `WITHDRAW_STATUS_UPDATE` - Withdrawal status update
  - `ORDER_STATUS_UPDATE` - Order status update
- **Synthetic API**: Exchange operation queries
- **Withdraw API**: Withdrawal queries
- **Rates API**: Currency quote queries
- **Health Check**: Integration status
- **Webhook Signature**: Signature generation for validation
- **Check Synthetic Status**: Direct status query

### Supported Transaction Types

- `cashout_manteca_qr_ar` - Manteca QR Withdrawal (Argentina)
- `cashout_manteca_qr_br` - Manteca QR Withdrawal (Brazil)
- `cashout_manteca_exchange_ar` - Exchange (ARS out, BRL in)
- `cashout_manteca_exchange_br` - Exchange (BRL out, ARS in)
- `cashin_manteca_exchange_ar` - Exchange Cashin (ARS receipt)
- `cashin_manteca_exchange_br` - Exchange Cashin (BRL receipt)

### Region

- Argentina and Brazil
- Focused on currency conversion and QR payments

## COELSA

### Financial Operations

1. **Cash-in (Deposit)**
   - Receipt via Coelsa
   - Integration with payment system

2. **Cash-out (Withdrawal/Send)**
   - Withdrawal via Coelsa
   - Money send

3. **Refund**
   - Transaction reversal
   - Payment reversal

### Technical Features

- **QR Code Decoding**: EMV QR Code decoding
- Integration with Brazilian payment system

### Supported Transaction Types

- `cashin_coelsa` - Deposit via Coelsa
- `cashout_coelsa` - Withdrawal via Coelsa
- `refound_coelsa` - Refund via Coelsa

### Region

- Brazil
- Integration with Brazilian payment system

## Comparative Summary

| Feature                   | Cronos | Bind | Gire | Manteca             | Coelsa |
| ------------------------- | ------ | ---- | ---- | ------------------- | ------ |
| **Cash-in**               | Yes    | Yes  | Yes  | Yes (Exchange)      | Yes    |
| **Cash-out**              | Yes    | Yes  | Yes  | Yes (QR + Exchange) | Yes    |
| **Transfers**             | Yes    | Yes  | No   | No                  | No     |
| **Payments (Bill)**       | Yes    | No   | Yes  | No                  | No     |
| **Payments (QR)**         | Yes    | No   | No   | Yes                 | No     |
| **Recharges**             | Yes    | No   | Yes  | No                  | No     |
| **Exchange (Conversion)** | No     | No   | No   | Yes                 | No     |
| **PIX**                   | Yes    | No   | No   | No                  | No     |
| **CVU/CBU**               | No     | Yes  | No   | No                  | No     |
| **Webhook**               | Yes    | Yes  | Yes  | Yes                 | No     |
| **Main Region**           | BR     | AR   | AR   | AR + BR             | BR     |

## Common Patterns

### Transaction Creation

All providers follow similar flow:
1. Create transaction
2. Confirm transaction
3. Receive webhook update

Difference is transaction `type` parameter.

### Transaction Confirmation

- All use confirmation step after creation
- Processing is asynchronous via webhook
- Status updates sent to webhook endpoint

### Webhooks

- All providers send status update webhooks
- Asynchronous processing via SQS queue
- Standardized webhook handling

### Transaction Query

- Query transaction status by ID
- Search transaction history
- Filter by date range and status

## Integration Strategy

### Centralized Endpoints

Unified endpoints that route to appropriate provider:

- `/transactions/create` - Route by transaction type
- `/transactions/confirm` - Confirm pending transaction
- `/transactions/:id` - Query transaction status
- `/transactions/history` - List user transactions

### Provider Selection

Automatic provider selection based on:

- Transaction type
- User region (AR/BR)
- Currency (ARS/BRL)
- Available balance

### Error Handling

Standardized error responses across providers:

- Timeout errors
- Insufficient balance
- Invalid credentials
- Provider unavailable

## References

- [Architecture Overview](../architecture/overview.md)
- [API Documentation](../api/)
- [Security and Performance](security-performance.md)
