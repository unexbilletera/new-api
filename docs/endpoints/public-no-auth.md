# Public Endpoints - No Auth Required

Public endpoints that do not require authentication.

## Health Checks

### GET / ✅ TESTED
**Description:** Health check endpoint, returns greeting message  
**Parameters:** None  
**Response:** Greeting message

**Test Result:**
- ✅ Endpoint working correctly
- Response: `{ "message": "Hello World!" }`
- Status: 200 OK

### GET /health ✅ TESTED
**Description:** Health check endpoint, verifies database and server status  
**Parameters:** None  
**Response:** Status object with uptime, timestamp, and checks

**Test Result:**
- ✅ Endpoint working correctly
- Response includes: status, uptime, timestamp, and database/server checks
- Status: 200 OK
- Database: up
- Server: up

## Authentication & Registration

### POST /api/users/user/signup
**Description:** Register a new user account  
**Body (Required):**
- `email` (string, email format)
- `password` (string, exactly 6 digits)
- `phone` (string)
- `language` (string, enum: 'es', 'pt', 'en')

**Body (Optional):**
- `firstName` (string)
- `lastName` (string)
- `deviceIdentifier` (string)
- `mobileDevice` (object)
- `browser` (object)

**Response:** Signup response or device registration required

### POST /api/users/user/signin
**Description:** Authenticate user and get access token  
**Body (Required):**
- `identifier` (string, email or phone)
- `password` (string, min 6 chars)

**Body (Optional):**
- `systemVersion` (string)
- `deviceIdentifier` (string)
- `mobileDevice` (object)
- `browser` (object)

**Response:** Signin response with token or device registration required

## Email Validation

### POST /api/users/user/sendEmailValidation
**Description:** Send email validation code  
**Body (Required):**
- `email` (string, email format)

**Response:** Email validation response

### POST /api/users/user/verifyEmailCode
**Description:** Verify email validation code  
**Body (Required):**
- `email` (string, email format)
- `code` (string)

**Response:** Email code verification response

## Phone Validation

### POST /api/users/user/sendPhoneValidation
**Description:** Send phone validation code  
**Body (Required):**
- `phone` (string, phone number format)

**Response:** Phone validation response

### POST /api/users/user/verifyPhoneCode
**Description:** Verify phone validation code  
**Body (Required):**
- `phone` (string, phone number format)
- `code` (string)

**Response:** Phone code verification response

## Password Recovery

### POST /api/users/user/forgot
**Description:** Request password recovery  
**Body (Required):**
- `email` (string, email format)

**Response:** Forgot password response

### POST /api/users/user/verify
**Description:** Verify password recovery code and set new password  
**Body (Required):**
- `email` (string, email format)
- `code` (string)
- `newPassword` (string, exactly 6 digits)

**Response:** Password verification response

### POST /api/users/user/unlock
**Description:** Unlock user account  
**Body (Required):**
- `id` (string, UUID format)
- `password` (string, min 1 char)

**Body (Optional):**
- `systemVersion` (string)
- `mobileDevice` (object)
- `browser` (object)

**Response:** Unlock account response

## Security

### POST /api/security/token
**Description:** Get security token  
**Parameters:** None  
**Response:** Token response

## Onboarding

### POST /api/onboarding/user/start
**Description:** Start user onboarding process  
**Body (Required):**
- `email` (string, email format)

**Response:** Start user onboarding response

### POST /api/onboarding/user/verify-code
**Description:** Verify onboarding code  
**Body (Required):**
- `email` (string, email format)
- `code` (string)
- `type` (string, enum: 'email', 'phone')

**Body (Optional):**
- `phone` (string, phone number format)

**Response:** Verify onboarding code response

### POST /api/onboarding/user/send-email-validation
**Description:** Send email validation during onboarding  
**Body (Required):**
- `email` (string, email format)

**Response:** Email validation response

### POST /api/onboarding/user/send-phone-validation
**Description:** Send phone validation during onboarding  
**Body (Required):**
- `phone` (string, phone number format)

**Response:** Phone validation response

## Test Endpoints

### POST /test/auth/login ✅ TESTED
**Description:** Test endpoint for user login (development only)  
**Body (Required):**
- `email` (string)
- `password` (string)

**Response:** Token and user data

**Test Result:**
- ✅ Endpoint working correctly
- Returns JWT token and complete user data including identity information
- Status: 200 OK
- Response includes: token, user (id, email, name, status, identity)

### POST /test/auth/backoffice-login ✅ TESTED
**Description:** Test endpoint for backoffice login (development only)  
**Body (Required):**
- `email` (string)
- `password` (string)

**Response:** Token and user data

**Test Result:**
- ✅ Endpoint working correctly
- Returns JWT token and complete backoffice user data including role information
- Status: 200 OK
- Response includes: token, user (id, email, name, status, role with level and permissions)
- Tested with: adm@unex.ar / Admin123!
