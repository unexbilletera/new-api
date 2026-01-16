# Application Information

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Provides comprehensive application information including version checks, news updates, feature toggles, and maintenance status. Essential for mobile app configuration and feature management.

## Code References

**Controller:** `src/secure/app-info/controllers/app-info.controller.ts`
**Service:** `src/secure/app-info/services/app-info.service.ts`
**Database Tables:** `system_config`, `news`, `modules`

## Endpoints

### GET /app-info

Get complete application information including version, news, and features.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
x-app-version: 1.0.0 (optional)
```

#### Request Example

```bash
GET /app-info
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
x-app-version: 1.2.0
```

#### Success Response (200)

```json
{
  "info": {
    "minVersion": "1.0.0",
    "currentVersion": "1.3.0",
    "updateRequired": false,
    "updateUrl": "https://apps.apple.com/app/unex",
    "maintenanceMode": false,
    "maintenanceMessage": null,
    "features": {
      "pix": true,
      "exchange": true,
      "treasury": true,
      "transactions": true,
      "notifications": true
    }
  },
  "news": [
    {
      "id": 1,
      "title": "New PIX Feature",
      "message": "You can now make PIX transfers instantly!",
      "imageUrl": "https://cdn.unex.com/news/pix-feature.jpg",
      "actionUrl": "/pix/transfers",
      "priority": 1,
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-02-01T00:00:00.000Z",
      "active": true,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "features": {
    "pix": true,
    "exchange": true,
    "treasury": false,
    "transactions": true,
    "notifications": true
  }
}
```

#### Error Responses

**401 - Unauthorized**
```json
{
  "error": "401 auth.errors.unauthorized",
  "message": "Invalid or missing token",
  "code": 401
}
```

#### Code Flow

```
AppInfoController.getFullInfo()
  └─> AppInfoService.getFullInfo()
      ├─> AppInfoService.getAppInfo()  // Get version info
      │   └─> prisma.system_config.findMany()
      ├─> AppInfoService.getNews()  // Get active news
      │   └─> prisma.news.findMany()
      └─> AppInfoService.getFeatures()  // Get feature flags
          └─> prisma.modules.findMany()
```

---

### GET /app-info/basic

Get basic application information without news and features.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer {token}
x-app-version: 1.0.0 (optional)
```

#### Request Example

```bash
GET /app-info/basic
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
{
  "minVersion": "1.0.0",
  "currentVersion": "1.3.0",
  "updateRequired": false,
  "updateUrl": "https://apps.apple.com/app/unex",
  "maintenanceMode": false,
  "features": {
    "pix": true,
    "exchange": true
  }
}
```

---

### GET /app-info/version

Check if application version is up to date.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer {token}
x-app-version: 1.0.0 (optional)
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `version` | string | No | App version to check (alternative to header) |
| `platform` | string | No | Platform (ios, android) |

#### Request Example

```bash
GET /app-info/version?version=1.0.0&platform=ios
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
{
  "minVersion": "1.0.0",
  "currentVersion": "1.3.0",
  "userVersion": "1.0.0",
  "updateRequired": false,
  "updateRecommended": true,
  "updateUrl": "https://apps.apple.com/app/unex"
}
```

#### Code Flow

```
AppInfoController.checkVersion()
  └─> AppInfoService.checkVersion()
      ├─> prisma.system_config.findMany()  // Get version configs
      └─> isVersionLower()  // Compare versions
```

---

### GET /app-info/news

Get active news and announcements.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Request Example

```bash
GET /app-info/news
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
[
  {
    "id": 1,
    "title": "New Feature Available",
    "message": "Check out our new PIX integration!",
    "imageUrl": "https://cdn.unex.com/news/pix.jpg",
    "actionUrl": "/pix",
    "priority": 1,
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-02-01T00:00:00.000Z",
    "active": true,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

#### Code Flow

```
AppInfoController.getNews()
  └─> AppInfoService.getNews()
      └─> prisma.news.findMany()
          └─> Filter by status='enable', validFrom <= now, validTo >= now
```

---

### GET /app-info/features

Get available feature toggles.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Request Example

```bash
GET /app-info/features
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
{
  "pix": true,
  "exchange": true,
  "treasury": false,
  "transactions": true,
  "notifications": true
}
```

---

## Business Rules

1. **Version Comparison**: Semantic versioning (major.minor.patch)
2. **Update Required**: User version < minimum version
3. **Update Recommended**: User version < current version
4. **Maintenance Mode**: When enabled, app shows maintenance screen
5. **News Display**: Only active news within valid date range
6. **Feature Flags**: Combination of database modules and environment variables
7. **Platform-Specific**: Version checks can be platform-specific (iOS/Android)

## Version Comparison Logic

```javascript
// Version format: major.minor.patch
// Example: 1.2.3

// Update Required: userVersion < minVersion
// Update Recommended: userVersion < currentVersion

// Comparison:
// 1.0.0 < 1.3.0 → updateRequired: false, updateRecommended: true
// 0.9.0 < 1.0.0 → updateRequired: true, updateRecommended: true
```

## Feature Flag Sources

Features are determined by:
1. **Database Modules**: Active modules in `modules` table
2. **Environment Variables**: Feature toggles in `.env`
3. **Priority**: Environment variables override database settings

```env
FEATURE_PIX=true
FEATURE_EXCHANGE=true
FEATURE_TREASURY=false
FEATURE_TRANSACTIONS=true
FEATURE_NOTIFICATIONS=true
```

## News Management

News items are displayed when:
- Status is `enable`
- Not deleted (`deletedAt` is null)
- Current date >= `validFrom` (if set)
- Current date <= `validTo` (if set)
- Ordered by `order` desc, then `createdAt` desc

## System Configuration Keys

| Key | Description | Example |
|-----|-------------|---------|
| `min_app_version` | Minimum required version | `1.0.0` |
| `current_app_version` | Latest available version | `1.3.0` |
| `update_url` | App store URL | `https://apps.apple.com/...` |
| `maintenance_mode` | Maintenance mode flag | `true/false` |
| `maintenance_message` | Message during maintenance | `"System under maintenance"` |
| `min_app_version_ios` | Platform-specific min version | `1.0.0` |
| `min_app_version_android` | Platform-specific min version | `1.0.0` |

## Error Codes

- `401 auth.errors.unauthorized` - Invalid or missing JWT token

## Testing

### Manual Testing

```bash
# Get full info
curl -X GET http://localhost:3000/app-info \
  -H "Authorization: Bearer TOKEN" \
  -H "x-app-version: 1.0.0"

# Check version
curl -X GET "http://localhost:3000/app-info/version?version=1.0.0&platform=ios" \
  -H "Authorization: Bearer TOKEN"

# Get news only
curl -X GET http://localhost:3000/app-info/news \
  -H "Authorization: Bearer TOKEN"

# Get features
curl -X GET http://localhost:3000/app-info/features \
  -H "Authorization: Bearer TOKEN"
```

### Automated Testing

```bash
npm run test:unit -- app-info.service.spec.ts
npm run test:e2e -- app-info.e2e-spec.ts
```

## Use Cases

### Force Update Scenario

```json
// User on version 0.9.0, minimum is 1.0.0
{
  "updateRequired": true,
  "minVersion": "1.0.0",
  "currentVersion": "1.3.0",
  "userVersion": "0.9.0"
}
```

### Maintenance Mode

```json
{
  "maintenanceMode": true,
  "maintenanceMessage": "System will be back shortly. Scheduled maintenance in progress."
}
```

### Feature Rollout

```json
{
  "features": {
    "pix": true,          // Fully available
    "exchange": true,      // Fully available
    "treasury": false,     // Under development
    "newFeature": true     // Beta release
  }
}
```

## Related Endpoints

- [Terms Acceptance](terms.md)
- [Actions App](actions-app.md)
- [Campaigns](campaigns.md)

## References

- [App Management Domain Overview](README.md)
- [Feature Flag Strategy](../../architecture/feature-flags.md)
- [Version Management](../../operations/version-management.md)
