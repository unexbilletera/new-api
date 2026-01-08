# Project Structure

## Directory Tree

```
src/
├── public/              # Unauthenticated area
│   ├── auth/           # Login, registration, password recovery
│   ├── onboarding/     # Initial registration, validations, KYC
│   └── users/          # Public profile, email/SMS validations
│
├── secure/              # Authenticated area
│   ├── transactions/   # Create transactions, history, status
│   ├── notifications/   # Push notifications, emails, SMS
│   ├── actions-app/    # App actions and modules
│   ├── app-info/       # App information and news
│   ├── campaigns/      # Campaign codes
│   └── terms/          # Terms acceptance
│
├── backoffice/          # Backoffice
│   ├── auth/           # Backoffice authentication
│   ├── clients/        # Client management
│   ├── users/          # Backoffice user management
│   ├── roles/          # Role management
│   ├── onboarding/     # Onboarding approval
│   ├── actions/        # Action management
│   └── system-config/  # System configuration
│
├── worker/              # SQS message processing
│
└── shared/              # Shared resources
    ├── prisma/         # Prisma service (global)
    ├── guards/         # Authentication/authorization guards
    ├── decorators/     # Custom decorators
    ├── helpers/        # Helper functions
    ├── interceptors/   # Interceptors (logging, etc)
    └── filters/        # Exception filters
```

## Module Pattern

Each module follows the **Controller → Service → Model** pattern:

```
module/
├── controllers/    # Handles HTTP requests
├── services/       # Business logic
├── models/         # Database access (Prisma)
└── dto/           # Data Transfer Objects (validation)
```

## Example Module

The `backoffice/auth` module is a complete example:

- DTOs with validation (`class-validator`)
- Controller with HTTP endpoints
- Service with business logic
- Model with database access (Prisma)
- Module configured
- Guards for protection
