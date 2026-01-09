# Architecture

## Structure

```
src/
├── public/          # Unauthenticated area (auth, onboarding, users)
├── secure/          # Authenticated area (transactions, notifications, etc)
├── backoffice/      # Backoffice (clients, roles, users, etc)
├── worker/          # SQS worker
└── shared/          # Shared resources (prisma, guards, helpers)
```

## CSM Pattern

Each module follows: **Controller → Service → Model**

```
Controller (HTTP) → Service (Business Logic) → Model (Prisma) → Database
```

## Authentication

- `AuthGuard`: For authenticated area (app)
- `BackofficeAuthGuard`: For backoffice
- `@CurrentUser()`: Decorator to get authenticated user

## Main Modules

- **Public**: Authentication, onboarding, profile
- **Secure**: Transactions, notifications, actions, app-info
- **Backoffice**: Client management, users, roles, onboarding

## Shared Resources

- `PrismaService`: Database access
- `LoggerService`: Logging system
- `ConfigService`: Environment configuration
- `PasswordHelper`: Password hash/comparison
- `JwtService`: Token generation/validation
