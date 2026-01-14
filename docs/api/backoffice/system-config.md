# Backoffice System Configuration

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

System-wide configuration management including feature flags, version settings, maintenance mode, and module management.

## Code References

**Controller:** `src/backoffice/system-config/controllers/system-config.controller.ts`
**Service:** `src/backoffice/system-config/services/system-config.service.ts`

## Endpoints

### Configuration Management

#### GET /backoffice/system-config

List system configurations with filters.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

**Query Parameters:**
- `group` (string, optional): Configuration group
- `search` (string, optional): Search by key
- `page`, `limit` (number, optional): Pagination

---

#### GET /backoffice/system-config/groups

List configuration groups.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

---

#### GET /backoffice/system-config/key/:key

Get configuration by key.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

**Path Parameters:**
- `key` (string): Configuration key (e.g., `min_app_version`)

---

#### POST /backoffice/system-config

Create new configuration.

**Auth:** Required (Backoffice JWT, MinLevel: 3)

**Request Body:**
```json
{
  "key": "maintenance_mode",
  "value": "false",
  "group": "system",
  "description": "System maintenance mode"
}
```

---

#### PUT /backoffice/system-config/:id

Update configuration.

**Auth:** Required (Backoffice JWT, MinLevel: 3)

---

#### DELETE /backoffice/system-config/:id

Delete configuration.

**Auth:** Required (Backoffice JWT, MinLevel: 3)

---

### Module Management

#### GET /backoffice/system-config/modules

List all system modules.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

---

#### GET /backoffice/system-config/modules/:id

Get module by ID.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

---

#### POST /backoffice/system-config/modules

Create new module.

**Auth:** Required (Backoffice JWT, MinLevel: 3)

**Request Body:**
```json
{
  "key": "pix_transfers",
  "name": "PIX Transfers",
  "description": "PIX transfer functionality",
  "isActive": true
}
```

---

#### PUT /backoffice/system-config/modules/:id

Update module.

**Auth:** Required (Backoffice JWT, MinLevel: 3)

---

#### PATCH /backoffice/system-config/modules/:id/toggle

Activate/deactivate module.

**Auth:** Required (Backoffice JWT, MinLevel: 2)

**Request Body:**
```json
{
  "isActive": true
}
```

---

#### DELETE /backoffice/system-config/modules/:id

Delete module.

**Auth:** Required (Backoffice JWT, MinLevel: 3)

---

## Common Configuration Keys

| Key | Description | Example Value |
|-----|-------------|---------------|
| `min_app_version` | Minimum required app version | `1.0.0` |
| `current_app_version` | Latest available version | `1.3.0` |
| `maintenance_mode` | Maintenance mode flag | `true/false` |
| `maintenance_message` | Message during maintenance | `"System under maintenance"` |
| `update_url` | App store URL | `https://apps.apple.com/...` |

## Business Rules

1. **Access Levels**: Read operations require MinLevel 1, write operations MinLevel 2 or 3
2. **Module Dependencies**: Some modules have dependencies that must be checked before deactivation
3. **Feature Flags**: Modules control feature availability in the mobile app

## References

- [Backoffice Domain](README.md)
- [App Info](../app-management/app-info.md)
