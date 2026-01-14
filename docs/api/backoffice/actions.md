# Backoffice Actions Management

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Backoffice management of application actions and services. Allows administrators to configure, enable/disable, and reorder app actions.

## Code References

**Controller:** `src/backoffice/actions/controllers/actions.controller.ts`
**Service:** `src/backoffice/actions/services/actions.service.ts`

## Endpoints

### GET /backoffice/actions

List all actions with filters.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

### GET /backoffice/actions/groups

List action groups/modules.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

### GET /backoffice/actions/:id

Get action by ID.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

### POST /backoffice/actions

Create new action.

**Auth:** Required (Backoffice JWT, MinLevel: 3)

### PUT /backoffice/actions/:id

Update action.

**Auth:** Required (Backoffice JWT, MinLevel: 3)

### PATCH /backoffice/actions/:id/toggle

Enable/disable action.

**Auth:** Required (Backoffice JWT, MinLevel: 2)

### DELETE /backoffice/actions/:id

Delete action.

**Auth:** Required (Backoffice JWT, MinLevel: 3)

### POST /backoffice/actions/reorder

Reorder actions.

**Auth:** Required (Backoffice JWT, MinLevel: 2)

### GET /backoffice/actions/check/:userId/:actionName

Check if user can perform action.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

## References

- [Backoffice Domain](README.md)
- [Actions App](../app-management/actions-app.md)
