# Backoffice Roles Management

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Role and permissions management for backoffice users. Configure role levels and access permissions.

## Code References

**Controller:** `src/backoffice/roles/controllers/roles.controller.ts`
**Service:** `src/backoffice/roles/services/roles.service.ts`

## Endpoints

### GET /backoffice/management/roles

List all roles.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)
**Last Tested:** 2026-01-14

#### Success Response (200)

```json
{
  "roles": [
    {
      "id": "uuid",
      "name": "Administrator",
      "level": 1,
      "description": "Full system access"
    }
  ]
}
```

---

### GET /backoffice/management/roles/:id

Get role details.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)

#### Path Parameters

- `id` (string): Role identifier

#### Success Response (200)

```json
{
  "id": "uuid",
  "name": "Administrator",
  "level": 1,
  "description": "Full system access",
  "permissions": [...]
}
```

---

### POST /backoffice/management/roles

Create new role.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 3)

#### Request Body

```json
{
  "name": "Manager",
  "level": 2,
  "description": "Manager role",
  "permissions": ["users:read", "logs:read"]
}
```

#### Success Response (201)

```json
{
  "id": "uuid",
  "name": "Manager",
  "level": 2,
  "message": "Role created successfully"
}
```

---

### PUT /backoffice/management/roles/:id

Update role.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 3)

#### Path Parameters

- `id` (string): Role identifier

#### Request Body

```json
{
  "name": "Manager Updated",
  "description": "Updated description",
  "permissions": ["users:read", "logs:read", "clients:read"]
}
```

---

### DELETE /backoffice/management/roles/:id

Delete role.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 3)

#### Path Parameters

- `id` (string): Role identifier

#### Error Responses

**400 - Role In Use**
```json
{
  "error": "400 roles.errors.roleInUse",
  "message": "Cannot delete role with linked users",
  "code": 400
}
```

---

## Role Levels

| Level | Name | Description |
|-------|------|-------------|
| 1 | Administrator | Full system access |
| 2 | Manager | Limited admin access |
| 3 | Support | Read-only access |

## Business Rules

1. **Level Hierarchy**: Lower number = higher privilege
2. **Cannot Delete In-Use**: Roles with linked users cannot be deleted
3. **Minimum Level**: Operations require MinLevel 2 or 3

## References

- [Backoffice Domain](README.md)
- [Backoffice Login](../authentication/backoffice-login.md)
- [Backoffice Users](users.md)
