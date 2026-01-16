# Backoffice Clients Management

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Complete client management for backoffice users. View client details, accounts, transactions, logs, and manage client status (block/unblock, enable/disable).

## Code References

**Controller:** `src/backoffice/clients/controllers/clients.controller.ts`
**Service:** `src/backoffice/clients/services/clients.service.ts`

## Endpoints

### GET /backoffice/clients

List all clients with filters (status, date, search).

**Auth:** Required (Backoffice JWT, MinLevel: 2)

### GET /backoffice/clients/:id/details

Get detailed client information.

**Auth:** Required (Backoffice JWT, MinLevel: 2)

### GET /backoffice/clients/:id/accounts

Get client bank accounts.

**Auth:** Required (Backoffice JWT, MinLevel: 2)

### GET /backoffice/clients/:id/logs

Get client activity logs.

**Auth:** Required (Backoffice JWT, MinLevel: 2)

### GET /backoffice/clients/:id/transactions

Get client transactions.

**Auth:** Required (Backoffice JWT, MinLevel: 2)

### PATCH /backoffice/clients/:id

Update client information.

**Auth:** Required (Backoffice JWT, MinLevel: 2)

### POST /backoffice/clients/:id/block

Block client.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

### POST /backoffice/clients/:id/unblock

Unblock client.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

### POST /backoffice/clients/:id/disable

Disable client with reason.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

### POST /backoffice/clients/:id/enable

Enable client.

**Auth:** Required (Backoffice JWT, MinLevel: 1)

## References

- [Backoffice Domain](README.md)
- [User Profile](../users/profile.md)
