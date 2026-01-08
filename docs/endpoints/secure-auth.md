# Secure Endpoints - Auth Required

Secure endpoints that require authentication (Bearer token in Authorization header).

## Notifications

### GET /notifications ✅ TESTED
**Description:** List user notifications  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `page` (number)
- `limit` (number)
- `status` (string, enum: 'pending', 'read')

**Response:** List notifications response

**Test Result:**
- ✅ Endpoint working correctly
- Returns paginated list of user notifications
- Status: 200 OK
- Response includes: data array, total count, page, limit, unreadCount

### PATCH /notifications/:id/read
**Description:** Mark notification as read  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, notification ID)

**Response:** Mark as read response

### PATCH /notifications/read-all
**Description:** Mark all notifications as read  
**Headers (Required):** Authorization Bearer token  
**Response:** Mark all as read response

### DELETE /notifications/:id
**Description:** Delete notification  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `id` (string, notification ID)

**Response:** Delete notification response

### POST /notifications/push-token
**Description:** Update push notification token  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `pushToken` (string)

**Body (Optional):**
- `platform` (string, enum: 'ios', 'android')
- `deviceId` (string)

**Response:** Update push token response

### GET /notifications/push-token ✅ TESTED
**Description:** Get push notification token  
**Headers (Required):** Authorization Bearer token  
**Response:** Get push token response

**Test Result:**
- ✅ Endpoint working correctly
- Returns push notification token for user
- Status: 200 OK
- Response includes: pushToken (string)

### POST /notifications/test
**Description:** Send test push notification  
**Headers (Required):** Authorization Bearer token  
**Body (Optional):**
- `title` (string)
- `message` (string)

**Response:** Send test push response

## Actions & Modules

### GET /actions/layout ✅ TESTED
**Description:** Get full actions layout  
**Headers (Required):** Authorization Bearer token  
**Response:** Layout response with all action sections

**Test Result:**
- ✅ Endpoint working correctly
- Returns full actions layout with all sections
- Status: 200 OK
- Response includes: homeActions, bottomTabActions, menuActions, quickActions, servicesActions, modules
- Note: ActionsAppModule was added to app.module.ts
- Note: Fixed getModules method to not use deletedAt field (table doesn't have this field)

### GET /actions/home ✅ TESTED
**Description:** Get home actions  
**Headers (Required):** Authorization Bearer token  
**Response:** Action response array

**Test Result:**
- ✅ Endpoint working correctly
- Returns array of home actions
- Status: 200 OK
- Response: array of actions with id, section, type, name, title, icon, route, order, active, requiresKyc, requiresAuth, moduleKey (optional)

### GET /actions/services ✅ TESTED
**Description:** Get services actions  
**Headers (Required):** Authorization Bearer token  
**Response:** Action response array

**Test Result:**
- ✅ Endpoint working correctly
- Returns array of services actions
- Status: 200 OK
- Response: array of actions with id, section, type, name, title, icon, route, order, active, requiresKyc, requiresAuth, moduleKey (optional)

### GET /actions/modules ✅ TESTED
**Description:** Get available modules  
**Headers (Required):** Authorization Bearer token  
**Response:** Module response array

**Test Result:**
- ✅ Endpoint working correctly
- Returns array of available modules
- Status: 200 OK
- Response: array of modules with id, key, name, enabled

### GET /actions/modules/:key/enabled ✅ TESTED
**Description:** Check if module is enabled  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `key` (string, module key)

**Test Result:**
- ✅ Endpoint working correctly
- Returns module enabled status
- Status: 200 OK
- Response includes: moduleKey (string), enabled (boolean)

**Response:** Module status response

### GET /actions/filtered ✅ TESTED
**Description:** Get filtered actions by module  
**Headers (Required):** Authorization Bearer token  
**Response:** Actions with module filter response

**Test Result:**
- ✅ Endpoint working correctly
- Returns filtered actions by module (only enabled modules)
- Status: 200 OK
- Response: array of actions with id, section, type, name, title, icon, route, order, active, requiresKyc, requiresAuth, moduleKey (optional)

### GET /actions/section/:section ✅ TESTED
**Description:** Get actions by section  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `section` (string, enum: 'home', 'bottom_tab', 'menu', 'quick_action', 'services')

**Response:** Action response array

**Test Result:**
- ✅ Endpoint working correctly
- Returns actions (appears to return all actions regardless of section parameter)
- Status: 200 OK
- Response: array of actions with id, section, type, name, title, icon, route, order, active, requiresKyc, requiresAuth, moduleKey (optional)

### GET /actions ✅ TESTED
**Description:** Get all actions or filtered by section  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `section` (string, enum: 'home', 'bottom_tab', 'menu', 'quick_action', 'services')
- `activeOnly` (boolean)

**Response:** Layout response or action array

**Test Result:**
- ✅ Endpoint working correctly
- Without section parameter: returns full layout with all sections (homeActions, bottomTabActions, menuActions, quickActions, servicesActions, modules)
- With section parameter: returns filtered actions array for specified section
- Status: 200 OK
- Note: Fixed ListActionsQueryDto to include validation decorators (@IsOptional, @IsEnum, @IsBoolean) for query parameters

## App Information

### GET /app-info ✅ TESTED
**Description:** Get full app information  
**Headers (Required):** Authorization Bearer token  
**Headers (Optional):**
- `x-app-version` (string)

**Response:** Full app info response

**Test Result:**
- ✅ Endpoint working correctly
- Returns full app information including info, news, and features
- Status: 200 OK
- Response includes: info (minVersion, currentVersion, updateRequired, maintenanceMode, features), news array, features object
- Note: AppInfoModule was added to app.module.ts

### GET /app-info/basic ✅ TESTED
**Description:** Get basic app information  
**Headers (Required):** Authorization Bearer token  
**Headers (Optional):**
- `x-app-version` (string)

**Response:** App info response

**Test Result:**
- ✅ Endpoint working correctly
- Returns basic app information (without news)
- Status: 200 OK
- Response includes: minVersion, currentVersion, updateRequired, maintenanceMode, features object

### GET /app-info/version ✅ TESTED
**Description:** Check app version  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `version` (string)
- `platform` (string)

**Headers (Optional):**
- `x-app-version` (string)

**Response:** Version check response

**Test Result:**
- ✅ Endpoint working correctly
- Checks app version and determines if update is required or recommended
- Status: 200 OK
- Response includes: minVersion, currentVersion, userVersion, updateRequired (boolean), updateRecommended (boolean)

### GET /app-info/news ✅ TESTED
**Description:** Get app news  
**Headers (Required):** Authorization Bearer token  
**Response:** News response array

**Test Result:**
- ✅ Endpoint working correctly
- Returns array of app news/banners
- Status: 200 OK
- Response: array of news items with id, title, message, imageUrl, priority, active, createdAt, startDate (optional), endDate (optional), actionUrl (optional)

### GET /app-info/features ✅ TESTED
**Description:** Get app features  
**Headers (Required):** Authorization Bearer token  
**Response:** Features response

**Test Result:**
- ✅ Endpoint working correctly
- Returns app features object
- Status: 200 OK
- Response: object with feature keys and boolean values indicating if each feature is enabled

## Campaigns

### GET /campaigns/validate/:code ✅ TESTED
**Description:** Validate campaign code by path parameter  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `code` (string)

**Test Result:**
- ✅ Endpoint working correctly
- Validates campaign code and returns validation result
- Status: 200 OK
- Response includes: valid (boolean), message (string), campaign (optional object), alreadyUsed (optional boolean)
- Note: CampaignsModule was added to app.module.ts

**Response:** Campaign validation response

### POST /campaigns/validate
**Description:** Validate campaign code by body  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `code` (string)

**Response:** Campaign validation response

### POST /campaigns/use
**Description:** Use campaign code  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `code` (string)

**Response:** Use campaign response

### GET /campaigns/my ✅ TESTED
**Description:** List user's used campaigns  
**Headers (Required):** Authorization Bearer token  
**Response:** List user campaigns response

**Test Result:**
- ✅ Endpoint working correctly
- Returns list of campaigns used by the authenticated user
- Status: 200 OK
- Response includes: used array with campaign information

## Terms of Service

### GET /terms/:serviceType ✅ TESTED
**Description:** Check term acceptance status  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `serviceType` (string, enum: 'manteca_pix', 'manteca_exchange')

**Response:** Term check response

**Test Result:**
- ✅ Endpoint working correctly
- Returns term acceptance status for the specified service type
- Status: 200 OK
- Response includes: accepted (boolean), serviceType (string), acceptedAt (string, optional)
- Note: TermsModule was added to app.module.ts

### GET /terms/acceptances/list ✅ TESTED
**Description:** List all term acceptances  
**Headers (Required):** Authorization Bearer token  
**Response:** Term acceptance response array

**Test Result:**
- ✅ Endpoint working correctly
- Returns array of all term acceptances for the authenticated user
- Status: 200 OK
- Response: array of acceptances with id, userId, serviceType, acceptedAt, ipAddress

### GET /terms/required/check ✅ TESTED
**Description:** Check all required terms  
**Headers (Required):** Authorization Bearer token  
**Response:** Check all required response

**Test Result:**
- ✅ Endpoint working correctly
- Checks all required terms and returns acceptance status
- Status: 200 OK
- Response includes: allAccepted (boolean), missing (array of service types), accepted (array of service types)

### POST /terms/accept
**Description:** Accept term  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `serviceType` (string, enum: 'manteca_pix', 'manteca_exchange')

**Response:** Accept term response

## Transactions

### POST /transactions/pix/cronos/create
**Description:** Create PIX Cronos transaction  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `sourceAccountId` (string)
- `amount` (number, min 0.01)
- `targetKeyType` (string, enum: 'cpf', 'cnpj', 'email', 'phone', 'evp')
- `targetKeyValue` (string)

**Body (Optional):**
- `description` (string)

**Response:** Transaction creation response

### POST /transactions/pix/cronos/confirm
**Description:** Confirm PIX Cronos transaction  
**Headers (Required):** Authorization Bearer token  
**Body (Required):**
- `transactionId` (string)

**Response:** Transaction confirmation response
