# Backoffice Endpoints - Auth Required

Backoffice endpoints that require authentication (Bearer token in Authorization header).

## Authentication

### POST /backoffice/auth/login ✅ TESTED
**Description:** Backoffice user login  
**Body (Required):**
- `email` (string, email format)
- `password` (string, min 6 chars)

**Response:** Login response with token

**Test Result:**
- ✅ Endpoint working correctly
- Returns accessToken (JWT) and user data with role information
- Status: 200 OK
- Response includes: accessToken, user (id, name, email, role with id, name, level)
- Tested with: adm@unex.ar / Admin123!

### GET /backoffice/auth/me ✅ TESTED
**Description:** Get current backoffice user  
**Headers (Required):** Authorization Bearer token  
**Response:** User response

**Test Result:**
- ✅ Endpoint working correctly
- Returns current authenticated backoffice user data
- Status: 200 OK
- Response includes: id, name, email, role (id, name, level), lastLoginAt, createdAt

## Client Management

### GET /backoffice/clients ✅ TESTED
**Description:** List clients  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `page` (number)
- `limit` (number)
- `status` (string)
- `startDate` (string, date format)
- `endDate` (string, date format)
- `search` (string)

**Response:** Client list response

**Test Result:**
- ✅ Endpoint working correctly
- Returns paginated list of clients with identities and account information
- Status: 200 OK
- Response includes: data array, total count, page, limit
- Each client includes: id, name, email, phone, status, accountTypes, accountOrigins, documentNumbers, etc.
- Fixed: Changed from `include` to `select` to avoid invalid datetime fields in database

### GET /backoffice/clients/:id/details ✅ TESTED
**Description:** Get client details  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Client details response

**Test Result:**
- ✅ Endpoint working correctly
- Returns complete client details including identities and accounts
- Status: 200 OK
- Response includes: client info, identities array (with type, country, taxDocumentNumber, status), accounts array (with id, type, balance, status)

### GET /backoffice/clients/:id/accounts ✅ TESTED
**Description:** Get client accounts  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Account list response

**Test Result:**
- ✅ Endpoint working correctly
- Returns array of client accounts
- Status: 200 OK
- Response includes: id, type, balance, status, createdAt for each account

### GET /backoffice/clients/:id/logs ✅ TESTED
**Description:** Get client access logs  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Query (Optional):**
- `page` (number)
- `limit` (number)

**Response:** Log list response

**Test Result:**
- ✅ Endpoint working correctly
- Returns paginated list of client access logs
- Status: 200 OK
- Response includes: data array, total count, page, limit
- Each log includes: id, userId, ipAddress, userAgent, device, finalStatus, createdAt

### GET /backoffice/clients/:id/transactions ✅ TESTED
**Description:** Get client transactions  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Query (Optional):**
- `page` (number)
- `limit` (number)

**Response:** Transaction list response

**Test Result:**
- ✅ Endpoint working correctly
- Returns paginated list of client transactions
- Status: 200 OK
- Response includes: data array, total count, page, limit
- Each transaction includes: id, date, number, type, status, amount, source/target info, bindId, coelsaId, etc.

### PATCH /backoffice/clients/:id ✅ TESTED
**Description:** Update client information  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `name` (string)
- `email` (string)
- `phone` (string)
- `status` (string)

**Response:** Updated client response

**Test Result:**
- ✅ Endpoint working correctly
- Successfully updates client information
- Status: 200 OK
- Returns updated client data with all fields
- Tested updating name field successfully

### POST /backoffice/clients/:id/block ✅ TESTED
**Description:** Block client account  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Required):**
- `reason` (string)

**Response:** Success response

**Test Result:**
- ✅ Endpoint working correctly
- Successfully blocks client account
- Status: 200 OK
- Response: { "success": true, "message": "Cliente bloqueado com sucesso" }

### POST /backoffice/clients/:id/unblock ✅ TESTED
**Description:** Unblock client account  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response

**Test Result:**
- ✅ Endpoint working correctly
- Successfully unblocks client account
- Status: 200 OK
- Response: { "success": true, "message": "Cliente desbloqueado com sucesso" }
- Note: No body required, do not send Content-Type header if no body

### POST /backoffice/clients/:id/disable
**Description:** Disable client account  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Required):**
- `reason` (string)

**Response:** Success response

### POST /backoffice/clients/:id/enable
**Description:** Enable client account  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response

## Onboarding Management

### GET /backoffice/onboarding/users
**Description:** List users in onboarding  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `page` (number)
- `limit` (number)
- `status` (string)
- `country` (string)
- `search` (string)

**Response:** Onboarding user list response

### GET /backoffice/onboarding/pending
**Description:** List pending onboarding users  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `page` (number)
- `limit` (number)
- `status` (string)
- `country` (string)
- `search` (string)

**Response:** Onboarding user list response

### GET /backoffice/onboarding/users/:id
**Description:** Get user onboarding details  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Onboarding user details response

### PATCH /backoffice/onboarding/users/:id
**Description:** Update user onboarding information  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body:** Dynamic object with fields to update

**Response:** Updated user response

### POST /backoffice/onboarding/users/:id/approve
**Description:** Approve user onboarding  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `notes` (string)

**Response:** Success response

### POST /backoffice/onboarding/users/:id/reject
**Description:** Reject user onboarding  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Required):**
- `stepsToCorrect` (array of strings)

**Body (Optional):**
- `reason` (string)

**Response:** Success response

### POST /backoffice/onboarding/users/:id/request-correction
**Description:** Request correction for user onboarding  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Required):**
- `stepsToCorrect` (array of strings)

**Body (Optional):**
- `message` (string)

**Response:** Success response

## Actions Management

### GET /backoffice/actions
**Description:** List actions/services  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `group` (string)
- `search` (string)
- `activeOnly` (boolean)
- `page` (number)
- `limit` (number)

**Response:** Action list response

### GET /backoffice/actions/groups
**Description:** List action groups/modules  
**Headers (Required):** Authorization Bearer token  
**Response:** Group list response

### GET /backoffice/actions/:id
**Description:** Get action by ID  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Action response

### POST /backoffice/actions
**Description:** Create action  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `code` (string)
- `description` (string)

**Body (Optional):**
- `group` (string)
- `isActive` (boolean)
- `metadata` (object: { icon?, order? })

**Response:** Created action response

### PUT /backoffice/actions/:id
**Description:** Update action  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `description` (string)
- `group` (string)
- `isActive` (boolean)
- `metadata` (object)

**Response:** Updated action response

### PATCH /backoffice/actions/:id/toggle
**Description:** Toggle action active status  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Required):**
- `enabled` (boolean)

**Response:** Updated action response

### DELETE /backoffice/actions/:id
**Description:** Delete action  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response

### POST /backoffice/actions/reorder
**Description:** Reorder actions  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- Array of objects: `{ id: string, order: number }[]`

**Response:** Success response

### GET /backoffice/actions/check/:userId/:actionName
**Description:** Check if user can perform action  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `userId` (string, UUID)
- `actionName` (string)

**Response:** Check response with canPerform boolean

## System Configuration

### GET /backoffice/system-config
**Description:** List system configurations  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `group` (string)
- `search` (string)
- `page` (number)
- `limit` (number)

**Response:** System config list response

### GET /backoffice/system-config/groups
**Description:** List configuration groups  
**Headers (Required):** Authorization Bearer token  
**Response:** Group list response

### GET /backoffice/system-config/key/:key
**Description:** Get configuration by key  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `key` (string)

**Response:** System config response

### POST /backoffice/system-config
**Description:** Create system configuration  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `key` (string)
- `value` (string)

**Body (Optional):**
- `description` (string)
- `group` (string)

**Response:** Created config response

### PUT /backoffice/system-config/:id
**Description:** Update system configuration  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `value` (string)
- `description` (string)
- `group` (string)

**Response:** Updated config response

### DELETE /backoffice/system-config/:id
**Description:** Delete system configuration  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response

## Modules Management

### GET /backoffice/system-config/modules
**Description:** List system modules  
**Headers (Required):** Authorization Bearer token  
**Response:** Module list response

### GET /backoffice/system-config/modules/:id
**Description:** Get module by ID  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (number)

**Response:** Module response

### POST /backoffice/system-config/modules
**Description:** Create module  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `name` (string)
- `isActive` (boolean)

**Body (Optional):**
- `description` (string)

**Response:** Created module response

### PUT /backoffice/system-config/modules/:id
**Description:** Update module  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (number)

**Body (Optional):**
- `name` (string)
- `description` (string)
- `isActive` (boolean)

**Response:** Updated module response

### PATCH /backoffice/system-config/modules/:id/toggle
**Description:** Toggle module active status  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (number)

**Body (Required):**
- `isActive` (boolean)

**Response:** Updated module response

### DELETE /backoffice/system-config/modules/:id
**Description:** Delete module  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (number)

**Response:** Success response

## Roles Management

### GET /backoffice/management/roles
**Description:** List backoffice roles  
**Headers (Required):** Authorization Bearer token  
**Response:** Role list response

### GET /backoffice/management/roles/:id
**Description:** Get role by ID  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Role response

### POST /backoffice/management/roles
**Description:** Create role  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `name` (string)
- `level` (number, min 1, max 10)

**Body (Optional):**
- `description` (string)

**Response:** Created role response

### PUT /backoffice/management/roles/:id
**Description:** Update role  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `name` (string)
- `description` (string)
- `level` (number, min 1, max 10)

**Response:** Updated role response

### DELETE /backoffice/management/roles/:id
**Description:** Delete role  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response

## Users Management

### GET /backoffice/management/users ✅ TESTED
**Description:** List backoffice users  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `page` (number)
- `limit` (number)
- `search` (string)
- `roleId` (string, UUID)
- `status` (string)

**Response:** Backoffice user list response

**Test Result:**
- ✅ Endpoint working correctly
- Returns paginated list of backoffice users
- Status: 200 OK
- Response includes: data array, total count, page, limit
- Each user includes: id, name, email, status, roleId, role (id, name, level), lastLoginAt, createdAt, updatedAt

### GET /backoffice/management/users/:id ✅ TESTED
**Description:** Get backoffice user by ID  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Backoffice user response

**Test Result:**
- ✅ Endpoint working correctly
- Returns backoffice user details by ID
- Status: 200 OK
- Response includes: id, name, email, status, roleId, role (id, name, level), lastLoginAt, createdAt, updatedAt
- Note: BackofficeUsersModule was added to app.module.ts

### POST /backoffice/management/users
**Description:** Create backoffice user  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `name` (string)
- `email` (string, email format)
- `password` (string, min 8 chars)
- `roleId` (string, UUID)

**Response:** Created user response

### PUT /backoffice/management/users/:id
**Description:** Update backoffice user  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Body (Optional):**
- `name` (string)
- `email` (string, email format)
- `password` (string, min 8 chars)
- `roleId` (string, UUID)
- `status` (string)

**Response:** Updated user response

### DELETE /backoffice/management/users/:id
**Description:** Delete backoffice user  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, UUID)

**Response:** Success response
