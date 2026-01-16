# Notifications Domain

**Status:** `stable`
**Last Updated:** 2026-01-14
**Owner:** Unex Development Team

## Overview

The notifications domain manages push notifications, notification history, and notification preferences for users.

## Endpoints

### Notification Management
- `GET /notifications` - List user notifications
- `PATCH /notifications/:id/read` - Mark notification as read
- `PATCH /notifications/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

### Push Notifications
- `POST /notifications/push-token` - Update push token
- `GET /notifications/push-token` - Get push token
- `POST /notifications/test` - Send test notification

## Notification Types

- **Transaction**: Transaction status updates
- **Security**: Security alerts
- **Marketing**: Promotional messages
- **System**: System announcements

## Testing

Last tested: 2026-01-14
Status: ✅ All endpoints working

## References

- [API Documentation](../README.md)
