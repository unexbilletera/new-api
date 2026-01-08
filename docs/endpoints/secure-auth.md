# Secure Endpoints - Auth Required

Secure endpoints that require authentication (Bearer token in Authorization header).

## Notifications

### GET /notifications
**Description:** List user notifications  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `page` (number)
- `limit` (number)
- `status` (string, enum: 'pending', 'read')

**Response:** List notifications response

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

### GET /notifications/push-token
**Description:** Get push notification token  
**Headers (Required):** Authorization Bearer token  
**Response:** Get push token response

### POST /notifications/test
**Description:** Send test push notification  
**Headers (Required):** Authorization Bearer token  
**Body (Optional):**
- `title` (string)
- `message` (string)

**Response:** Send test push response

## Actions & Modules

### GET /actions/layout
**Description:** Get full actions layout  
**Headers (Required):** Authorization Bearer token  
**Response:** Layout response with all action sections

### GET /actions/home
**Description:** Get home actions  
**Headers (Required):** Authorization Bearer token  
**Response:** Action response array

### GET /actions/services
**Description:** Get services actions  
**Headers (Required):** Authorization Bearer token  
**Response:** Action response array

### GET /actions/modules
**Description:** Get available modules  
**Headers (Required):** Authorization Bearer token  
**Response:** Module response array

### GET /actions/modules/:key/enabled
**Description:** Check if module is enabled  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `key` (string, module key)

**Response:** Module status response

### GET /actions/filtered
**Description:** Get filtered actions by module  
**Headers (Required):** Authorization Bearer token  
**Response:** Actions with module filter response

### GET /actions/section/:section
**Description:** Get actions by section  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `section` (string, enum: 'home', 'bottom_tab', 'menu', 'quick_action', 'services')

**Response:** Action response array

### GET /actions
**Description:** Get all actions or filtered by section  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `section` (string, enum: 'home', 'bottom_tab', 'menu', 'quick_action', 'services')
- `activeOnly` (boolean)

**Response:** Layout response or action array

## App Information

### GET /app-info
**Description:** Get full app information  
**Headers (Required):** Authorization Bearer token  
**Headers (Optional):**
- `x-app-version` (string)

**Response:** Full app info response

### GET /app-info/basic
**Description:** Get basic app information  
**Headers (Required):** Authorization Bearer token  
**Headers (Optional):**
- `x-app-version` (string)

**Response:** App info response

### GET /app-info/version
**Description:** Check app version  
**Headers (Required):** Authorization Bearer token  
**Query (Optional):**
- `version` (string)
- `platform` (string)

**Headers (Optional):**
- `x-app-version` (string)

**Response:** Version check response

### GET /app-info/news
**Description:** Get app news  
**Headers (Required):** Authorization Bearer token  
**Response:** News response array

### GET /app-info/features
**Description:** Get app features  
**Headers (Required):** Authorization Bearer token  
**Response:** Features response

## Campaigns

### GET /campaigns/validate/:code
**Description:** Validate campaign code by path parameter  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `code` (string)

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

### GET /campaigns/my
**Description:** List user's used campaigns  
**Headers (Required):** Authorization Bearer token  
**Response:** List user campaigns response

## Terms of Service

### GET /terms/:serviceType
**Description:** Check term acceptance status  
**Headers (Required):** Authorization Bearer token  
**Path (Required):**
- `serviceType` (string, enum: 'manteca_pix', 'manteca_exchange')

**Response:** Term check response

### GET /terms/acceptances/list
**Description:** List all term acceptances  
**Headers (Required):** Authorization Bearer token  
**Response:** Term acceptance response array

### GET /terms/required/check
**Description:** Check all required terms  
**Headers (Required):** Authorization Bearer token  
**Response:** Check all required response

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
