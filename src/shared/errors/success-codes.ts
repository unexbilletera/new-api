/**
 * Códigos de sucesso padronizados seguindo o padrão da API antiga
 * Formato: {statusCode} {modulo}.success.{codigoSucesso}
 *
 * Exemplo: "200 users.success.login"
 */

export enum SuccessCodes {
  // ========== USERS SUCCESS (200) ==========
  USERS_LOGIN_SUCCESS = '200 users.success.login',
  USERS_LOGOUT_SUCCESS = '200 users.success.logout',
  USERS_REGISTER_SUCCESS = '200 users.success.register',
  USERS_PASSWORD_RESET_SUCCESS = '200 users.success.passwordReset',
  USERS_PROFILE_UPDATED = '200 users.success.profileUpdated',
  USERS_PASSWORD_CHANGED = '200 users.success.passwordChanged',

  // ========== BACKOFFICE SUCCESS (200) ==========
  BACKOFFICE_LOGIN_SUCCESS = '200 backoffice.success.login',
  BACKOFFICE_LOGOUT_SUCCESS = '200 backoffice.success.logout',
  BACKOFFICE_PROFILE_UPDATED = '200 backoffice.success.profileUpdated',
  BACKOFFICE_PASSWORD_CHANGED = '200 backoffice.success.passwordChanged',

  // ========== TRANSACTIONS SUCCESS (200) ==========
  TRANSACTIONS_CREATED = '200 transactions.success.created',
  TRANSACTIONS_CONFIRMED = '200 transactions.success.confirmed',
  TRANSACTIONS_CANCELLED = '200 transactions.success.cancelled',
  TRANSACTIONS_COMPLETED = '200 transactions.success.completed',

  // ========== GENERIC SUCCESS ==========
  OPERATION_SUCCESS = '200 server.success.operationSuccess',
  DATA_RETRIEVED = '200 server.success.dataRetrieved',
}
