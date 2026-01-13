# Error and Success Codes

This document lists all error and success codes used in the API, following the pattern: `{statusCode} {module}.{type}.{code}`

## Format

- **Errors**: `{statusCode} {module}.errors.{errorCode}`
- **Success**: `{statusCode} {module}.success.{successCode}`

## Error Codes

### USERS ERRORS (400)

| Code                                              | Description                     | Translation                     |
| ------------------------------------------------- | ------------------------------- | ------------------------------- |
| `400 users.errors.invalidParameters`              | Invalid parameters              | Invalid parameters              |
| `400 users.errors.invalidUsername`                | Invalid username                | Invalid username                |
| `400 users.errors.invalidEmail`                   | Invalid email                   | Invalid email                   |
| `400 users.errors.invalidPassword`                | Invalid password                | Invalid password                |
| `400 users.errors.userNotFound`                   | User not found                  | User not found                  |
| `400 users.errors.invalidUserAccount`             | Invalid user account            | Invalid user account            |
| `400 users.errors.failBindChangeAliasRecently`    | Failed to change alias recently | Failed to change alias recently |
| `400 users.errors.failBindChangeAliasAlreadyUsed` | Alias already in use            | Alias already in use            |
| `400 users.errors.failBindChangeAliasSame`        | Alias is the same               | Alias is the same               |
| `400 users.errors.failBindChangeAliasInvalid`     | Invalid alias                   | Invalid alias                   |

### USERS ERRORS (401)

| Code                                  | Description         | Translation               |
| ------------------------------------- | ------------------- | ------------------------- |
| `401 users.errors.missingToken`       | Token not provided  | Token not provided        |
| `401 users.errors.expiredToken`       | Token expired       | Token expired             |
| `401 users.errors.invalidToken`       | Invalid token       | Invalid token             |
| `401 users.errors.invalidAccess`      | Invalid access      | Invalid access            |
| `401 users.errors.invalidCredentials` | Invalid credentials | Invalid email or password |
| `401 users.errors.userInactive`       | User inactive       | User inactive             |
| `401 users.errors.userDeleted`        | User deleted        | User deleted              |

### BACKOFFICE ERRORS (400)

| Code                                       | Description          | Translation          |
| ------------------------------------------ | -------------------- | -------------------- |
| `400 backoffice.errors.invalidParameters`  | Invalid parameters   | Invalid parameters   |
| `400 backoffice.errors.invalidEmail`       | Invalid email        | Invalid email        |
| `400 backoffice.errors.invalidPassword`    | Invalid password     | Invalid password     |
| `400 backoffice.errors.userNotFound`       | User not found       | User not found       |
| `400 backoffice.errors.invalidUserAccount` | Invalid user account | Invalid user account |

### BACKOFFICE ERRORS (401)

| Code                                            | Description              | Translation               |
| ----------------------------------------------- | ------------------------ | ------------------------- |
| `401 backoffice.errors.missingToken`            | Token not provided       | Token not provided        |
| `401 backoffice.errors.expiredToken`            | Token expired            | Token expired             |
| `401 backoffice.errors.invalidToken`            | Invalid token            | Invalid token             |
| `401 backoffice.errors.invalidCredentials`      | Invalid credentials      | Invalid email or password |
| `401 backoffice.errors.userInactive`            | User inactive            | User inactive             |
| `401 backoffice.errors.userDeleted`             | User deleted             | User deleted              |
| `401 backoffice.errors.insufficientPermissions` | Insufficient permissions | Insufficient permissions  |

### TRANSACTIONS ERRORS (400)

| Code                                                     | Description                        | Translation                        |
| -------------------------------------------------------- | ---------------------------------- | ---------------------------------- |
| `400 transactions.errors.missingContextUserId`           | Missing context user ID            | Missing context user ID            |
| `400 transactions.errors.missingAction`                  | Missing action                     | Missing action                     |
| `400 transactions.errors.invalidAction`                  | Invalid action                     | Invalid action                     |
| `400 transactions.errors.missingStatus`                  | Missing status                     | Missing status                     |
| `400 transactions.errors.invalidStatus`                  | Invalid status                     | Invalid status                     |
| `400 transactions.errors.invalidActionStatus`            | Invalid action status              | Invalid action status              |
| `400 transactions.errors.invalidType`                    | Invalid type                       | Invalid type                       |
| `400 transactions.errors.invalidAccountType`             | Invalid account type               | Invalid account type               |
| `400 transactions.errors.duplicateCoelsaId`              | Duplicate Coelsa ID                | Duplicate Coelsa ID                |
| `400 transactions.errors.missingId`                      | Missing ID                         | Missing ID                         |
| `400 transactions.errors.invalidId`                      | Invalid ID                         | Invalid ID                         |
| `400 transactions.errors.invalidStatusPending`           | Invalid pending status             | Invalid pending status             |
| `400 transactions.errors.invalidStatusProcess`           | Invalid process status             | Invalid process status             |
| `400 transactions.errors.invalidStatusFinal`             | Invalid final status               | Invalid final status               |
| `400 transactions.errors.invalidSourceIdentity`          | Invalid source identity            | Invalid source identity            |
| `400 transactions.errors.invalidSourceAccount`           | Invalid source account             | Invalid source account             |
| `400 transactions.errors.invalidSourceTaxDocumentNumber` | Invalid source tax document number | Invalid source tax document number |
| `400 transactions.errors.invalidTargetIdentityId`        | Invalid target identity ID         | Invalid target identity ID         |
| `400 transactions.errors.invalidTargetUserAccount`       | Invalid target user account        | Invalid target user account        |
| `400 transactions.errors.invalidTargetTaxDocumentNumber` | Invalid target tax document number | Invalid target tax document number |
| `400 transactions.errors.invalidSourceUser`              | Invalid source user                | Invalid source user                |
| `400 transactions.errors.invalidTargetUser`              | Invalid target user                | Invalid target user                |
| `400 transactions.errors.invalidSourceIdentityType`      | Invalid source identity type       | Invalid source identity type       |
| `400 transactions.errors.invalidtargetIdentity`          | Invalid target identity            | Invalid target identity            |
| `400 transactions.errors.invalidAccess`                  | Invalid access                     | Invalid access                     |
| `400 transactions.errors.invalidGrantedTransactionLimit` | Invalid granted transaction limit  | Invalid granted transaction limit  |
| `400 transactions.errors.invalidGrantedMonthLimit`       | Invalid granted month limit        | Invalid granted month limit        |
| `400 transactions.errors.spendingLimitExceeded`          | Spending limit exceeded            | Spending limit exceeded            |
| `400 transactions.errors.arsAccountNotFound`             | ARS account not found              | ARS account not found              |

### GENERIC ERRORS

| Code                              | Description           | Translation           |
| --------------------------------- | --------------------- | --------------------- |
| `500 server.errors.internalError` | Internal server error | Internal server error |
| `404 server.errors.notFound`      | Resource not found    | Resource not found    |
| `403 server.errors.forbidden`     | Access forbidden      | Access forbidden      |

## Success Codes

### USERS SUCCESS (200)

| Code                                | Description                   | Translation                   |
| ----------------------------------- | ----------------------------- | ----------------------------- |
| `200 users.success.login`           | Login successful              | Login successful              |
| `200 users.success.logout`          | Logout successful             | Logout successful             |
| `200 users.success.register`        | Registration successful       | Registration successful       |
| `200 users.success.passwordReset`   | Password reset successful     | Password reset successful     |
| `200 users.success.profileUpdated`  | Profile updated successfully  | Profile updated successfully  |
| `200 users.success.passwordChanged` | Password changed successfully | Password changed successfully |

### BACKOFFICE SUCCESS (200)

| Code                                     | Description                   | Translation                   |
| ---------------------------------------- | ----------------------------- | ----------------------------- |
| `200 backoffice.success.login`           | Login successful              | Login successful              |
| `200 backoffice.success.logout`          | Logout successful             | Logout successful             |
| `200 backoffice.success.profileUpdated`  | Profile updated successfully  | Profile updated successfully  |
| `200 backoffice.success.passwordChanged` | Password changed successfully | Password changed successfully |

### TRANSACTIONS SUCCESS (200)

| Code                                 | Description                        | Translation                        |
| ------------------------------------ | ---------------------------------- | ---------------------------------- |
| `200 transactions.success.created`   | Transaction created successfully   | Transaction created successfully   |
| `200 transactions.success.confirmed` | Transaction confirmed successfully | Transaction confirmed successfully |
| `200 transactions.success.cancelled` | Transaction cancelled successfully | Transaction cancelled successfully |
| `200 transactions.success.completed` | Transaction completed successfully | Transaction completed successfully |

### GENERIC SUCCESS

| Code                                  | Description                 | Translation                 |
| ------------------------------------- | --------------------------- | --------------------------- |
| `200 server.success.operationSuccess` | Operation successful        | Operation successful        |
| `200 server.success.dataRetrieved`    | Data retrieved successfully | Data retrieved successfully |

## Response Format

### Error Response

```json
{
  "error": "401 users.errors.invalidCredentials",
  "message": "401 users.errors.invalidCredentials",
  "code": 401
}
```

### Success Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... },
  "message": "200 users.success.login",
  "code": "200 users.success.login"
}
```

## Adding New Codes

1. Add code to appropriate enum (`error-codes.ts` or `success-codes.ts`)
2. Update this document with description and translation
3. Use code in code through `ErrorCodes` or `SuccessCodes`
