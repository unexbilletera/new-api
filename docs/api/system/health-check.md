# Health Check

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

API health check endpoint that verifies the API is online and operational. Used by monitoring systems and load balancers.

## Code References

**Controller:** `src/health/health.controller.ts`
**Service:** `src/health/services/health.service.ts`

## Endpoints

### GET /health

Check API health status.

**Status:** `stable`
**Auth:** Not required
**Last Tested:** 2026-01-14

#### Request Example

```bash
GET /health
```

#### Success Response (200)

```json
{
  "status": "ok",
  "timestamp": "2026-01-14T10:00:00.000Z"
}
```

#### Code Flow

```
HealthController.check()
  └─> HealthService.check()
      └─> Returns health status
```

## Business Rules

1. **Public Access**: No authentication required
2. **Always Available**: Should return 200 if API is running
3. **Monitoring**: Used by load balancers and monitoring tools

## Usage

Used for:
- Load balancer health checks
- Monitoring system alerts
- Uptime verification
- Kubernetes liveness/readiness probes

## Testing

### Manual Testing

```bash
curl http://localhost:3000/health
```

### Expected Response

```json
{
  "status": "ok",
  "timestamp": "2026-01-14T10:00:00.000Z"
}
```

## References

- [Root Endpoint](root-endpoint.md)
- [System Endpoints Overview](README.md)
