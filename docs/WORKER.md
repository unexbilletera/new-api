# Worker - Processamento de Mensagens SQS

Este worker processa mensagens da fila AWS SQS e executa ações assíncronas (como processar transações PIX).

## Estrutura

- `worker.ts`: Arquivo principal que inicia o worker
- `worker.module.ts`: Módulo NestJS do worker
- `worker.service.ts`: Service principal que gerencia o loop de processamento
- `handlers/`: Diretório com handlers para cada tipo de job
  - `pix-cronos.handler.ts`: Handler para jobs PIX Cronos

## Como Rodar

### Desenvolvimento
```bash
npm run start:worker
# ou
yarn start:worker
```

### Produção
```bash
# Build primeiro
npm run build:prod

# Depois rodar o worker
npm run start:prod:worker
# ou
yarn start:prod:worker
```

## Variáveis de Ambiente Necessárias

```env
# AWS SQS
AWS_REGION=us-east-2
SQS_TRANSACTIONS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/123456789012/transactions-queue

# Database (Prisma)
WALLET_MYSQL_URL=mysql://user:password@host:3306/database

# Environment
NODE_ENV=development|sandbox|production
```

## Tipos de Jobs Suportados

### `pix_cronos_create`
Processa a criação de uma transação PIX Cronos.

**Payload:**
```json
{
  "transactionId": "uuid",
  "userId": "uuid",
  "sourceAccountId": "uuid",
  "sourceIdentityId": "uuid",
  "amount": 100.50,
  "targetKeyType": "cpf",
  "targetKeyValue": "12345678900",
  "description": "Transferência PIX"
}
```

**Ações:**
- Valida dados da transação
- Prepara dados para envio à API da Cronos
- Mantém status como `pending` até confirmação

### `pix_cronos_confirm`
Processa a confirmação de uma transação PIX Cronos.

**Payload:**
```json
{
  "transactionId": "uuid",
  "userId": "uuid"
}
```

**Ações:**
- Busca transação
- Chama API da Cronos para criar transferência
- Atualiza transação com `cronosId`
- Atualiza status para `confirm` ou `error`

## Fluxo de Processamento

1. **Worker recebe mensagem** da fila SQS (long polling)
2. **Parse da mensagem** para extrair `jobType` e `payload`
3. **Roteamento** para handler apropriado baseado no `jobType`
4. **Processamento** do job pelo handler
5. **Deleção da mensagem** da fila se processamento for bem-sucedido
6. **Retry automático** se houver erro (mensagem permanece na fila)

## Adicionar Novo Handler

1. Crie um arquivo em `handlers/` (ex: `meu-handler.ts`)
2. Implemente a classe com métodos para cada tipo de job
3. Adicione o handler em `worker.module.ts`
4. Adicione roteamento em `worker.service.ts` método `routeJob()`

Exemplo:
```typescript
@Injectable()
export class MeuHandler {
  async handleMeuJob(payload: any): Promise<void> {
  }
}
```

## Logs

O worker registra todas as operações importantes:
- Mensagens recebidas
- Jobs processados
- Erros encontrados
- Status de transações atualizadas

## Notas Importantes

1. **Long Polling**: O worker usa long polling (20 segundos) para reduzir custos e latência
2. **Retry**: Mensagens com erro permanecem na fila para retry automático pelo SQS
3. **Graceful Shutdown**: O worker trata sinais SIGTERM/SIGINT para shutdown seguro
4. **Isolamento**: Cada job é processado isoladamente - erro em um não afeta outros

