# Backoffice Domain

**Status:** `stable`
**Last Updated:** 2026-01-14
**Owner:** Unex Development Team

## Overview

The backoffice domain provides administrative endpoints for managing users, clients, roles, and system configuration.

## Endpoints

### Authentication
- [Backoffice Login](../authentication/backoffice-login.md) - Admin authentication

### User Management
- Client management
- User administration
- Onboarding approval
- Role assignment

### System Configuration
- System settings
- Feature flags
- Provider configuration

## Role-Based Access

- **Level 1**: Administrator (full access)
- **Level 2**: Manager (limited admin)
- **Level 3**: Support (read-only)

## Security

- Separate user table from public users
- Enhanced password requirements
- Audit logging for all actions
- Session monitoring

## Testing

- [Backoffice Auth Testing](../../guides/testing-backoffice-auth.md)

## References

- [Authentication Domain](../authentication/README.md)
- [Module Example](../../guides/module-example.md)
