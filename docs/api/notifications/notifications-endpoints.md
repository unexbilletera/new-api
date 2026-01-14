# Notifications Endpoints

**Status:** `stable`
**Last Updated:** 2026-01-14
**Last Testing:** 2026-01-14
**Test Status:** ✅ PASSED
**Owner:** Unex Development Team
**Version:** v1.0

## Overview

Complete notification management including listing, marking as read, deletion, and push notification token management.

## Code References

**Controller:** `src/secure/notifications/controllers/notifications.controller.ts`
**Service:** `src/secure/notifications/services/notifications.service.ts`
**Model:** `src/secure/notifications/models/notifications.model.ts`

## Endpoints

### GET /notifications

List user notifications with pagination.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Authorization: Bearer {token}
```

#### Query Parameters

**Optional:**
- `page` (number): Page number (default: 1)
- `limit` (number): Records per page (default: 10, max: 100)
- `status` (string): Filter by status (`pending`, `read`)

#### Request Example

```bash
GET /notifications?page=1&limit=10&status=pending
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Transaction Completed",
      "message": "Your PIX transfer was completed successfully",
      "type": "transaction",
      "status": "pending",
      "data": {
        "transactionId": "uuid",
        "amount": 100.50
      },
      "createdAt": "2026-01-14T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "unreadCount": 15
}
```

#### Code Flow

```
NotificationsController.list()
  └─> NotificationsService.list()
      └─> NotificationsModel.findByUserId()
          └─> prisma.notifications.findMany()
```

---

### PATCH /notifications/:id/read

Mark specific notification as read.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer {token}
```

#### Path Parameters

- `id` (string): Notification ID

#### Request Example

```bash
PATCH /notifications/uuid-123/read
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
{
  "message": "Notification marked as read",
  "code": "200 notifications.success.markedAsRead"
}
```

#### Code Flow

```
NotificationsController.markAsRead()
  └─> NotificationsService.markAsRead()
      └─> NotificationsModel.markAsRead()
          └─> prisma.notifications.update()
```

---

### PATCH /notifications/read-all

Mark all user notifications as read.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer {token}
```

#### Request Example

```bash
PATCH /notifications/read-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
{
  "message": "All notifications marked as read",
  "code": "200 notifications.success.allMarkedAsRead",
  "count": 15
}
```

#### Code Flow

```
NotificationsController.markAllAsRead()
  └─> NotificationsService.markAllAsRead()
      └─> NotificationsModel.markAllAsRead()
          └─> prisma.notifications.updateMany()
```

---

### DELETE /notifications/:id

Delete specific notification.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer {token}
```

#### Path Parameters

- `id` (string): Notification ID

#### Request Example

```bash
DELETE /notifications/uuid-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
{
  "message": "Notification deleted successfully",
  "code": "200 notifications.success.deleted"
}
```

#### Code Flow

```
NotificationsController.delete()
  └─> NotificationsService.delete()
      └─> NotificationsModel.delete()
          └─> prisma.notifications.delete()
```

---

### POST /notifications/push-token

Update push notification token.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Request Body

**Required:**
- `pushToken` (string): Push notification token

**Optional:**
- `platform` (string): Platform (ios, android)
- `deviceId` (string): Device identifier

#### Request Example

```json
{
  "pushToken": "ExponentPushToken[...]",
  "platform": "ios",
  "deviceId": "device-uuid-123"
}
```

#### Success Response (200)

```json
{
  "message": "Push token updated successfully",
  "code": "200 notifications.success.tokenUpdated"
}
```

#### Code Flow

```
NotificationsController.updatePushToken()
  └─> NotificationsService.updatePushToken()
      └─> NotificationsModel.updatePushToken()
          └─> prisma.users.update()
```

---

### GET /notifications/push-token

Get current push notification token.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14
**Test Status:** ✅ PASSED

#### Headers

```
Authorization: Bearer {token}
```

#### Request Example

```bash
GET /notifications/push-token
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

```json
{
  "pushToken": "ExponentPushToken[...]",
  "platform": "ios",
  "deviceId": "device-uuid-123"
}
```

#### Code Flow

```
NotificationsController.getPushToken()
  └─> NotificationsService.getPushToken()
      └─> NotificationsModel.getPushToken()
          └─> prisma.users.findUnique()
```

---

### POST /notifications/test

Send test push notification.

**Status:** `stable`
**Auth:** Required (JWT)
**Last Tested:** 2026-01-14

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Request Body

**Optional:**
- `title` (string): Notification title
- `message` (string): Notification message

#### Request Example

```json
{
  "title": "Test Notification",
  "message": "This is a test push notification"
}
```

#### Success Response (200)

```json
{
  "message": "Test notification sent successfully",
  "code": "200 notifications.success.testSent"
}
```

#### Code Flow

```
NotificationsController.sendTest()
  └─> NotificationsService.sendTestNotification()
      └─> PushNotificationService.send()
```

---

## Notification Types

- **transaction**: Transaction status updates
- **security**: Security alerts
- **marketing**: Promotional messages
- **system**: System announcements

## Business Rules

1. **Ownership**: Users can only access their own notifications
2. **Pagination**: Maximum 100 records per page
3. **Auto-cleanup**: Notifications older than 90 days are auto-deleted
4. **Push Token**: Required for receiving push notifications

## Error Codes

- `404 notifications.errors.notFound` - Notification not found
- `401 users.errors.invalidToken` - Invalid or expired token
- `400 notifications.errors.invalidParameters` - Invalid input data

## Testing

### Manual Testing

See [Testing Guide](../../guides/testing.md)

### Automated Testing

```bash
npm run test:unit -- notifications.service.spec.ts
npm run test:e2e -- notifications.e2e-spec.ts
```

## References

- [Notifications Domain Overview](README.md)
- [Error Codes](../error-codes.md)
