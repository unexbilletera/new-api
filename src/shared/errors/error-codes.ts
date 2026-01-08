/**
 * Códigos de erro padronizados seguindo o padrão da API antiga
 * Formato: {statusCode} {modulo}.errors.{codigoErro}
 * 
 * Exemplo: "400 users.errors.invalidPassword"
 */

export enum ErrorCodes {
  // ========== USERS ERRORS (400) ==========
  USERS_INVALID_PARAMETERS = '400 users.errors.invalidParameters',
  USERS_INVALID_USERNAME = '400 users.errors.invalidUsername',
  USERS_INVALID_EMAIL = '400 users.errors.invalidEmail',
  USERS_INVALID_PASSWORD = '400 users.errors.invalidPassword',
  USERS_USER_NOT_FOUND = '400 users.errors.userNotFound',
  USERS_INVALID_USER_ACCOUNT = '400 users.errors.invalidUserAccount',
  USERS_FAIL_BIND_CHANGE_ALIAS_RECENTLY = '400 users.errors.failBindChangeAliasRecently',
  USERS_FAIL_BIND_CHANGE_ALIAS_ALREADY_USED = '400 users.errors.failBindChangeAliasAlreadyUsed',
  USERS_FAIL_BIND_CHANGE_ALIAS_SAME = '400 users.errors.failBindChangeAliasSame',
  USERS_FAIL_BIND_CHANGE_ALIAS_INVALID = '400 users.errors.failBindChangeAliasInvalid',

  // ========== USERS ERRORS (401) ==========
  USERS_MISSING_TOKEN = '401 users.errors.missingToken',
  USERS_EXPIRED_TOKEN = '401 users.errors.expiredToken',
  USERS_INVALID_TOKEN = '401 users.errors.invalidToken',
  USERS_INVALID_ACCESS = '401 users.errors.invalidAccess',
  USERS_INVALID_CREDENTIALS = '401 users.errors.invalidCredentials',
  USERS_USER_INACTIVE = '401 users.errors.userInactive',
  USERS_USER_DELETED = '401 users.errors.userDeleted',

  // ========== BACKOFFICE ERRORS (400) ==========
  BACKOFFICE_INVALID_PARAMETERS = '400 backoffice.errors.invalidParameters',
  BACKOFFICE_INVALID_EMAIL = '400 backoffice.errors.invalidEmail',
  BACKOFFICE_INVALID_PASSWORD = '400 backoffice.errors.invalidPassword',
  BACKOFFICE_USER_NOT_FOUND = '400 backoffice.errors.userNotFound',
  BACKOFFICE_INVALID_USER_ACCOUNT = '400 backoffice.errors.invalidUserAccount',

  // ========== BACKOFFICE ERRORS (401) ==========
  BACKOFFICE_MISSING_TOKEN = '401 backoffice.errors.missingToken',
  BACKOFFICE_EXPIRED_TOKEN = '401 backoffice.errors.expiredToken',
  BACKOFFICE_INVALID_TOKEN = '401 backoffice.errors.invalidToken',
  BACKOFFICE_INVALID_CREDENTIALS = '401 backoffice.errors.invalidCredentials',
  BACKOFFICE_USER_INACTIVE = '401 backoffice.errors.userInactive',
  BACKOFFICE_USER_DELETED = '401 backoffice.errors.userDeleted',
  BACKOFFICE_INSUFFICIENT_PERMISSIONS = '401 backoffice.errors.insufficientPermissions',

  // ========== TRANSACTIONS ERRORS (400) ==========
  TRANSACTIONS_MISSING_CONTEXT_USER_ID = '400 transactions.errors.missingContextUserId',
  TRANSACTIONS_MISSING_ACTION = '400 transactions.errors.missingAction',
  TRANSACTIONS_INVALID_ACTION = '400 transactions.errors.invalidAction',
  TRANSACTIONS_MISSING_STATUS = '400 transactions.errors.missingStatus',
  TRANSACTIONS_INVALID_STATUS = '400 transactions.errors.invalidStatus',
  TRANSACTIONS_INVALID_ACTION_STATUS = '400 transactions.errors.invalidActionStatus',
  TRANSACTIONS_INVALID_TYPE = '400 transactions.errors.invalidType',
  TRANSACTIONS_INVALID_ACCOUNT_TYPE = '400 transactions.errors.invalidAccountType',
  TRANSACTIONS_DUPLICATE_COELSA_ID = '400 transactions.errors.duplicateCoelsaId',
  TRANSACTIONS_MISSING_ID = '400 transactions.errors.missingId',
  TRANSACTIONS_INVALID_ID = '400 transactions.errors.invalidId',
  TRANSACTIONS_INVALID_STATUS_PENDING = '400 transactions.errors.invalidStatusPending',
  TRANSACTIONS_INVALID_STATUS_PROCESS = '400 transactions.errors.invalidStatusProcess',
  TRANSACTIONS_INVALID_STATUS_FINAL = '400 transactions.errors.invalidStatusFinal',
  TRANSACTIONS_INVALID_SOURCE_IDENTITY = '400 transactions.errors.invalidSourceIdentity',
  TRANSACTIONS_INVALID_SOURCE_ACCOUNT = '400 transactions.errors.invalidSourceAccount',
  TRANSACTIONS_INVALID_SOURCE_TAX_DOCUMENT_NUMBER = '400 transactions.errors.invalidSourceTaxDocumentNumber',
  TRANSACTIONS_INVALID_TARGET_IDENTITY_ID = '400 transactions.errors.invalidTargetIdentityId',
  TRANSACTIONS_INVALID_TARGET_USER_ACCOUNT = '400 transactions.errors.invalidTargetUserAccount',
  TRANSACTIONS_INVALID_TARGET_TAX_DOCUMENT_NUMBER = '400 transactions.errors.invalidTargetTaxDocumentNumber',
  TRANSACTIONS_INVALID_SOURCE_USER = '400 transactions.errors.invalidSourceUser',
  TRANSACTIONS_INVALID_TARGET_USER = '400 transactions.errors.invalidTargetUser',
  TRANSACTIONS_INVALID_SOURCE_IDENTITY_TYPE = '400 transactions.errors.invalidSourceIdentityType',
  TRANSACTIONS_INVALID_TARGET_IDENTITY = '400 transactions.errors.invalidtargetIdentity',
  TRANSACTIONS_INVALID_ACCESS = '400 transactions.errors.invalidAccess',
  TRANSACTIONS_INVALID_GRANTED_TRANSACTION_LIMIT = '400 transactions.errors.invalidGrantedTransactionLimit',
  TRANSACTIONS_INVALID_GRANTED_MONTH_LIMIT = '400 transactions.errors.invalidGrantedMonthLimit',
  TRANSACTIONS_SPENDING_LIMIT_EXCEEDED = '400 transactions.errors.spendingLimitExceeded',
  TRANSACTIONS_ARS_ACCOUNT_NOT_FOUND = '400 transactions.errors.arsAccountNotFound',

  // ========== GENERIC ERRORS ==========
  INTERNAL_SERVER_ERROR = '500 server.errors.internalError',
  NOT_FOUND = '404 server.errors.notFound',
  FORBIDDEN = '403 server.errors.forbidden',
}

/**
 * Extrai o status code de um código de erro
 */
export function getStatusCodeFromErrorCode(errorCode: string): number {
  const match = errorCode.match(/^(\d{3})/);
  return match ? parseInt(match[1], 10) : 500;
}

/**
 * Verifica se uma string é um código de erro no formato antigo
 */
export function isErrorCode(error: string): boolean {
  return /^\d{3}\s+\w+\.errors\.\w+$/.test(error);
}

