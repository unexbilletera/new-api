# Application Actions

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Manages application actions, layouts, and feature modules. Provides dynamic action configuration for mobile app UI.

## Code References

**Controller:** `src/secure/actions-app/controllers/actions-app.controller.ts`
**Service:** `src/secure/actions-app/services/actions-app.service.ts`

## Endpoints

### GET /actions/layout

Get complete actions layout.

**Status:** `stable`  
**Auth:** Required (JWT)  
**Last Tested:** 2026-01-14

#### Success Response (200)

\`\`\`json
{
  "sections": [
    {
      "name": "HOME",
      "actions": [...]
    }
  ]
}
\`\`\`

### GET /actions/home

Get home section actions.

**Status:** `stable`  
**Auth:** Required (JWT)

### GET /actions/services

Get services section actions.

**Status:** `stable`  
**Auth:** Required (JWT)

### GET /actions/modules

List available modules.

**Status:** `stable`  
**Auth:** Required (JWT)

### GET /actions/modules/:key/enabled

Check if module is enabled.

**Status:** `stable`  
**Auth:** Required (JWT)

### GET /actions/filtered

Get filtered actions by permissions.

**Status:** `stable`  
**Auth:** Required (JWT)

### GET /actions/section/:section

Get actions by section.

**Status:** `stable`  
**Auth:** Required (JWT)

### GET /actions

Get all actions with optional filters.

**Status:** `stable`  
**Auth:** Required (JWT)

## References

- [App Management Domain](README.md)
- [App Info](app-info.md)
