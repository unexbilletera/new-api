# Password Change & Session Management

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Password change and session management endpoints for authenticated users.

## Code References

**Controller:** `src/public/users/controllers/user.controller.ts`
**Services:**
- `src/public/users/services/password.service.ts`
- `src/public/users/services/session.service.ts`
**Model:** `src/public/users/models/user.model.ts`

## Endpoints

---

### POST /api/users/user/change-password

Change authenticated user's password.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePass456"
}
```

#### Request Fields

- `currentPassword` (string, required): Current password for verification
- `newPassword` (string, required): New password (min 8 characters)

#### Success Response (200)

```json
{
  "message": "Password changed successfully",
  "passwordUpdatedAt": "2026-01-14T10:30:00.000Z"
}
```

#### Error Responses

**400 - Invalid Current Password**
```json
{
  "error": "400 users.errors.invalidPassword",
  "message": "Current password is incorrect",
  "code": 400
}
```

**400 - Weak Password**
```json
{
  "error": "400 users.errors.weakPassword",
  "message": "Password must be at least 8 characters with letters and numbers",
  "code": 400
}
```

**400 - Same Password**
```json
{
  "error": "400 users.errors.samePassword",
  "message": "New password must be different from current password",
  "code": 400
}
```

---

### POST /api/users/user/signout

Logout user and invalidate session.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body

```json
{
  "deviceId": "device-uuid-123"
}
```

#### Request Fields

- `deviceId` (string, optional): Device identifier to logout from specific device

#### Success Response (200)

```json
{
  "message": "Logout successful",
  "loggedOut": true
}
```

#### Error Responses

**401 - Unauthorized**
```json
{
  "error": "401 users.errors.unauthorized",
  "message": "Invalid or missing token",
  "code": 401
}
```

---

## Password Change Flow

```
1. User submits current + new password
   POST /user/change-password
   └─> Validate current password with bcrypt
   └─> Validate new password strength
   └─> Check new != current
   └─> Hash new password
   └─> Update user.password
   └─> Update user.passwordUpdatedAt
   └─> Clear recovery tokens
   └─> Invalidate all sessions
   └─> Log password change event
```

---

## Session Management Flow

```
1. User logs out
   POST /user/signout
   └─> Clear user.accessToken
   └─> Clear user.unlockToken
   └─> If deviceId provided:
       └─> Invalidate specific device session
   └─> Log signout event
```

---

## Business Rules

### Password Change
1. **Password Policy**: Minimum 8 characters with at least one letter and one number
2. **Current Password Required**: Must verify current password before change
3. **Password History**: New password must be different from current
4. **Session Invalidation**: All active sessions invalidated after password change
5. **Security Event**: Password changes logged with IP and user agent
6. **Token Cleanup**: Recovery and unlock tokens cleared

### Session Management
1. **Token Invalidation**: JWT token invalidated on signout
2. **Device Logout**: Optional device-specific logout
3. **Cleanup**: All temporary tokens cleared
4. **Event Logging**: Signout events logged for security audit

---

## Security Considerations

### Password Change
- Password hashed with bcrypt (10 rounds)
- Current password verified before allowing change
- All sessions invalidated (requires re-login)
- Password change events logged with IP/user agent
- Rate limiting: Max 5 password changes per day
- Strong password policy enforced

### Session Management
- Tokens cleared from database on signout
- Client should delete stored tokens
- Device-specific logout supported
- All signout events logged

---

## Code Flow

### Change Password

```
PasswordService.changePassword()
  └─> UserModel.findById()
  └─> Validate current password (bcrypt.compare)
  └─> Validate new password strength
  └─> Check new !== current
  └─> Hash new password (bcrypt.hash)
  └─> UserModel.changePassword()
      ├─> Update password
      ├─> Set passwordUpdatedAt
      ├─> Clear recovery token
      ├─> Clear accessToken
      ├─> Clear unlockToken
      └─> Update updatedAt
  └─> Log event to users_access_log
```

### Signout

```
SessionService.signout()
  └─> UserModel.findById()
  └─> If deviceId:
      └─> DeviceModel.revokeDevice()
  └─> UserModel.clearTokens()
      ├─> Clear accessToken
      └─> Clear unlockToken
  └─> Log signout event
```

---

## Testing

### Test Cases

#### Password Change
1. ✅ Valid password change - should update password
2. ✅ Invalid current password - should return 400
3. ✅ Weak new password - should return 400
4. ✅ Same password - should return 400
5. ✅ Session invalidation - should require re-login
6. ✅ Password verification - should accept new password on next login

#### Signout
1. ✅ Basic signout - should invalidate session
2. ✅ Device-specific signout - should only logout that device
3. ✅ Token cleanup - should clear all tokens
4. ✅ Event logging - should log signout event

### Manual Testing

```bash
# Change password
curl -X POST http://localhost:3000/api/users/user/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPass123",
    "newPassword": "newSecurePass456"
  }'

# Signout
curl -X POST http://localhost:3000/api/users/user/signout \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "device-123"}'
```

### Automated Testing

```bash
npm run test:e2e -- password-session.e2e-spec.ts
```

---

## Error Codes

### Password Change
- `400 users.errors.invalidPassword` - Current password incorrect
- `400 users.errors.weakPassword` - Password doesn't meet requirements
- `400 users.errors.samePassword` - New password same as current
- `401 users.errors.unauthorized` - Invalid or missing JWT

### Signout
- `401 users.errors.unauthorized` - Invalid or missing JWT token

---

## References

- [User Profile](profile.md)
- [Email Change](email-change.md)
- [Account Closure](account-management.md)
- [Authentication](../authentication/public-login.md)
- [Security Best Practices](../../operations/security-performance.md)

---

## Changelog

### 2026-01-14
- Added comprehensive documentation
- Documented session invalidation behavior

### 2025-12-10
- Added device-specific signout
- Improved security logging

### 2025-11-20
- Strengthened password policy
- Added rate limiting
