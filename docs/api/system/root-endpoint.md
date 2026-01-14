# Root Endpoint

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Root API endpoint that returns a greeting message. Used for basic API availability check.

## Code References

**Controller:** `src/app.controller.ts`
**Service:** `src/app/services/app.service.ts`

## Endpoints

### GET /

API greeting endpoint.

**Status:** `stable`
**Auth:** Not required
**Last Tested:** 2026-01-14

#### Request Example

```bash
GET /
```

#### Success Response (200)

```json
{
  "message": "Hello from Unex API!"
}
```

#### Code Flow

```
AppController.getHello()
  └─> AppService.getHello()
      └─> Returns greeting message
```

## Business Rules

1. **Public Access**: No authentication required
2. **Always Available**: Should return 200 if API is running

## Usage

Used for:
- Basic API health verification
- Load balancer health checks
- Quick availability tests

## Testing

### Manual Testing

```bash
curl http://localhost:3000/
```

### Expected Response

```json
{
  "message": "Hello from Unex API!"
}
```

## References

- [Health Check](health-check.md)
- [System Endpoints Overview](README.md)
