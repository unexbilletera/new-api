# Backoffice System Logs

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

System logs and audit trail management for backoffice users. View and analyze system logs, user activities, and audit trail.

## Code References

**Controller:** `src/backoffice/logs/controllers/logs.controller.ts`
**Service:** `src/backoffice/logs/services/logs.service.ts`

## Endpoints

### GET /backoffice/logs

List system logs with pagination.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)
**Last Tested:** 2026-01-14

#### Query Parameters

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Records per page (default: 10)

#### Success Response (200)

```json
{
  "logs": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

---

### GET /backoffice/logs/stats

Get log statistics within a date range.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)

#### Query Parameters

- `startDate` (string, optional): Start date (ISO 8601)
- `endDate` (string, optional): End date (ISO 8601)

#### Success Response (200)

```json
{
  "totalLogs": 1000,
  "byAction": {...},
  "byUser": {...}
}
```

---

### GET /backoffice/logs/actions

List all recorded action types.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)

#### Success Response (200)

```json
{
  "actions": [
    "user.login",
    "user.create",
    "transaction.create"
  ]
}
```

---

### GET /backoffice/logs/user/:userId

Get logs for specific user.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)

#### Path Parameters

- `userId` (string): User identifier

#### Query Parameters

- `page` (number, optional): Page number
- `limit` (number, optional): Records per page

---

### GET /backoffice/logs/:id

Get log details by ID.

**Status:** `stable`
**Auth:** Required (Backoffice JWT, MinLevel: 2)

#### Path Parameters

- `id` (string): Log identifier

#### Success Response (200)

```json
{
  "id": "uuid",
  "action": "user.login",
  "userId": "uuid",
  "ipAddress": "192.168.1.1",
  "userAgent": "...",
  "createdAt": "2026-01-14T10:00:00.000Z"
}
```

---

## Business Rules

1. **Access Level**: Requires MinLevel 2 (Manager or above)
2. **Audit Trail**: All logs are immutable
3. **Retention**: Logs kept for 12 months
4. **Privacy**: Sensitive data is masked

## References

- [Backoffice Domain](README.md)
- [Backoffice Users](users.md)
