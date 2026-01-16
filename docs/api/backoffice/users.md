# Backoffice Users Management

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Backoffice user management. Create, update, and manage backoffice administrator accounts.

## Code References

**Controller:** `src/backoffice/users/controllers/backoffice-users.controller.ts`
**Service:** `src/backoffice/users/services/backoffice-users.service.ts`

## Endpoints

### GET /backoffice/management/users

List backoffice users.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)
**Last Tested:** 2026-01-14

#### Query Parameters

- `page` (number, optional): Page number
- `limit` (number, optional): Records per page
- `search` (string, optional): Search by name or email
- `status` (string, optional): Filter by status (active/inactive)
- `roleId` (string, optional): Filter by role ID

#### Success Response (200)

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Admin User",
      "email": "admin@example.com",
      "status": "active",
      "role": {
        "id": "uuid",
        "name": "Administrator",
        "level": 1
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

---

### GET /backoffice/management/users/:id

Get backoffice user details.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)

#### Path Parameters

- `id` (string): User identifier

#### Success Response (200)

```json
{
  "id": "uuid",
  "name": "Admin User",
  "email": "admin@example.com",
  "status": "active",
  "role": {
    "id": "uuid",
    "name": "Administrator",
    "level": 1,
    "permissions": [...]
  },
  "createdAt": "2026-01-01T00:00:00.000Z",
  "lastLoginAt": "2026-01-14T10:00:00.000Z"
}
```

---

### POST /backoffice/management/users

Create backoffice user.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 3)

#### Request Body

```json
{
  "name": "New Admin",
  "email": "newadmin@example.com",
  "password": "securePassword123",
  "roleId": "uuid",
  "status": "active"
}
```

#### Success Response (201)

```json
{
  "id": "uuid",
  "name": "New Admin",
  "email": "newadmin@example.com",
  "message": "User created successfully"
}
```

#### Error Responses

**409 - Email Already In Use**
```json
{
  "error": "409 backoffice.errors.emailInUse",
  "message": "Email is already in use",
  "code": 409
}
```

---

### PUT /backoffice/management/users/:id

Update backoffice user.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 3)

#### Path Parameters

- `id` (string): User identifier

#### Request Body

```json
{
  "name": "Updated Name",
  "email": "updatedemail@example.com",
  "roleId": "uuid",
  "status": "active"
}
```

#### Success Response (200)

```json
{
  "id": "uuid",
  "name": "Updated Name",
  "email": "updatedemail@example.com",
  "message": "User updated successfully"
}
```

---

### DELETE /backoffice/management/users/:id

Delete backoffice user.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 3)

#### Path Parameters

- `id` (string): User identifier

#### Success Response (200)

```json
{
  "message": "User deleted successfully"
}
```

#### Error Responses

**400 - Cannot Delete Self**
```json
{
  "error": "400 backoffice.errors.cannotDeleteSelf",
  "message": "Cannot delete your own user",
  "code": 400
}
```

---

## Business Rules

1. **Access Level**: Requires MinLevel 2 to list/view, MinLevel 3 to create/update/delete
2. **Self Deletion**: Users cannot delete their own account
3. **Email Uniqueness**: Email must be unique across all backoffice users
4. **Password Security**: Passwords must meet security requirements (min 8 characters)
5. **Role Assignment**: User must have a valid role assigned

## Error Codes

- `400 backoffice.errors.cannotDeleteSelf` - Cannot delete own account
- `401 backoffice.errors.unauthorized` - Invalid or missing token
- `403 backoffice.errors.insufficientLevel` - Insufficient access level
- `404 backoffice.errors.userNotFound` - User not found
- `409 backoffice.errors.emailInUse` - Email already in use

## References

- [Backoffice Domain](README.md)
- [Backoffice Login](../authentication/backoffice-login.md)
- [Roles Management](roles.md)
