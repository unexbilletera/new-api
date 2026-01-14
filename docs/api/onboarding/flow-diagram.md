# Onboarding Flow Diagram

**Status:** `stable`
**Last Updated:** 2026-01-14
**Owner:** Unex Development Team

## Complete Onboarding Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                         │
│                                                              │
│  POST /api/users/user/signup                                │
│  ├─ email, password, phone, language                        │
│  └─ Creates user with status: enable                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 1: START ONBOARDING                        │
│                                                              │
│  POST /api/public/onboarding/start                          │
│  ├─ Validates user not already onboarded                    │
│  ├─ Sets onboardingState.step = 'email_validation'          │
│  └─ Returns: { currentStep: 'email_validation' }            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          STEP 2: EMAIL VALIDATION                            │
│                                                              │
│  POST /api/users/user/sendEmailValidation                   │
│  ├─ Sends 6-digit code to user email                        │
│  └─ Code valid for 15 minutes                               │
│                                                              │
│  POST /api/users/user/verifyEmailCode                       │
│  ├─ Validates code                                          │
│  ├─ Sets emailVerifiedAt timestamp                          │
│  ├─ Updates onboardingState.step = 'phone_validation'       │
│  └─ Returns: { verified: true }                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          STEP 3: PHONE VALIDATION                            │
│                                                              │
│  POST /api/users/user/sendPhoneValidation                   │
│  ├─ Sends SMS code via Twilio                               │
│  └─ Code valid for 15 minutes                               │
│                                                              │
│  POST /api/users/user/verifyPhoneCode                       │
│  ├─ Validates code                                          │
│  ├─ Sets phoneVerifiedAt timestamp                          │
│  ├─ Updates onboardingState.step = 'password'               │
│  └─ Returns: { verified: true }                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          STEP 4: PASSWORD CREATION                           │
│                                                              │
│  POST /api/public/onboarding/password                       │
│  ├─ User creates/confirms password                          │
│  ├─ Password hashed with bcrypt                             │
│  ├─ Updates onboardingState.step = 'personal_data'          │
│  └─ Returns: { success: true }                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          STEP 5: PERSONAL DATA                               │
│                                                              │
│  POST /api/public/onboarding/personal-data                  │
│  ├─ firstName, lastName, birthdate                          │
│  ├─ gender, maritalStatus, country                          │
│  ├─ Updates user profile                                    │
│  ├─ Updates onboardingState.step = 'liveness'               │
│  └─ Returns: { success: true }                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          STEP 6: LIVENESS VERIFICATION                       │
│                                                              │
│  POST /api/public/onboarding/liveness                       │
│  ├─ Facial recognition/liveness check                       │
│  ├─ Integration with liveness provider                      │
│  ├─ Sets livenessVerifiedAt timestamp                       │
│  ├─ Updates onboardingState.step = 'identity'               │
│  └─ Returns: { verified: true }                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          STEP 7: IDENTITY ONBOARDING                         │
│                                                              │
│  POST /api/public/onboarding/identity                       │
│  ├─ Document number (CPF/CNPJ)                              │
│  ├─ Document type validation                                │
│  ├─ Creates identity record                                 │
│  ├─ Updates onboardingState.step = 'documents'              │
│  └─ Returns: { identity: { id, number, type } }             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          STEP 8: DOCUMENT UPLOAD                             │
│                                                              │
│  POST /api/public/onboarding/documents                      │
│  ├─ Upload document images (front/back)                     │
│  ├─ Upload selfie                                           │
│  ├─ Stores in S3                                            │
│  ├─ Updates onboardingState.completed = true                │
│  ├─ Updates onboardingState.completedAt = timestamp         │
│  └─ Returns: { success: true, completed: true }             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ONBOARDING COMPLETED                            │
│                                                              │
│  User can now:                                               │
│  ├─ Access all app features                                 │
│  ├─ Create transactions                                     │
│  ├─ Manage accounts                                         │
│  └─ Use full application                                    │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### Onboarding State Object

```json
{
  "step": "email_validation",
  "completed": false,
  "completedAt": null,
  "emailValidated": false,
  "phoneValidated": false,
  "personalDataCompleted": false,
  "livenessCompleted": false,
  "identityCompleted": false,
  "documentsUploaded": false
}
```

### Step Transitions

| Current Step         | Next Step           | Trigger                    |
|---------------------|---------------------|----------------------------|
| `null`              | `email_validation`  | POST /onboarding/start     |
| `email_validation`  | `phone_validation`  | Email verified             |
| `phone_validation`  | `password`          | Phone verified             |
| `password`          | `personal_data`     | Password created           |
| `personal_data`     | `liveness`          | Personal data saved        |
| `liveness`          | `identity`          | Liveness verified          |
| `identity`          | `documents`         | Identity created           |
| `documents`         | `completed`         | Documents uploaded         |

## Validation Rules

### Email Validation
- Must be valid email format
- Must not already be verified
- Code expires in 15 minutes
- Max 3 attempts per code

### Phone Validation
- Must be valid phone with country code
- Must not already be verified
- Code expires in 15 minutes
- SMS sent via Twilio

### Personal Data
- firstName: required, min 2 chars
- lastName: required, min 2 chars
- birthdate: required, user must be 18+
- gender: enum (male, female, other)
- maritalStatus: enum (single, married, divorced, widowed)

### Liveness
- Facial recognition required
- Must detect live person
- Integration with liveness provider

### Identity
- Document number format validation
- CPF: 11 digits
- CNPJ: 14 digits
- Must be unique in system

### Documents
- Supported formats: JPG, PNG, PDF
- Max file size: 5MB per file
- Required: document front, document back, selfie

## Error Handling

### Common Errors

- **Step Out of Order**: User tries to access step before completing previous
- **Already Completed**: User tries to redo completed onboarding
- **Validation Failed**: Code validation fails
- **Upload Failed**: Document upload fails

### Recovery

- User can restart from current step
- Codes can be resent
- Failed uploads can be retried

## Testing

See [Onboarding Steps](steps/) for detailed testing of each step.

## References

- [Onboarding README](README.md)
- [User Registration Flow](../../flows/user-registration-flow.md)
- [Email Validation](../users/email-validation.md)
- [Phone Validation](../users/phone-validation.md)
