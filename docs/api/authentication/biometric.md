# Biometric Authentication

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Biometric device registration and authentication management. Supports device registration with biometric authentication.

## Code References

**Controller:** `src/public/biometric/controllers/biometric.controller.ts`
**Services:**
- `src/public/biometric/services/device-registration.service.ts`
- `src/public/biometric/services/challenge-verification.service.ts`
- `src/public/biometric/services/device-management.service.ts`

## Endpoints

### POST /api/auth/challenge

Generate biometric challenge.

**Status:** `stable`  
**Auth:** Required (JWT)  
**Last Tested:** 2026-01-14

### POST /api/auth/verify

Verify biometric signature.

**Status:** `stable`  
**Auth:** Required (JWT)

### POST /api/auth/register-device

Register device with biometrics.

**Status:** `stable`  
**Auth:** Required (JWT)

### POST /api/auth/register-device-soft

Register device with soft authentication.

**Status:** `stable`  
**Auth:** Required (JWT)

### POST /api/auth/device/send-sms-validation

Send SMS validation to device.

**Status:** `stable`  
**Auth:** Required (JWT)

### POST /api/auth/device/verify-sms-and-activate

Verify SMS and activate device.

**Status:** `stable`  
**Auth:** Required (JWT)

### POST /api/auth/revoke-device

Revoke device.

**Status:** `stable`  
**Auth:** Required (JWT)

### GET /api/auth/devices/:userId

List registered devices.

**Status:** `stable`  
**Auth:** Required (JWT)

### GET /api/auth/device/health-check

Check device health.

**Status:** `stable`  
**Auth:** Required (JWT)

## References

- [Authentication Domain](README.md)
- [Public Login](public-login.md)
