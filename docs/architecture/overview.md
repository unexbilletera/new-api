# Architecture Overview

## System Architecture

The application follows a modular monolith architecture with NestJS and Fastify, organized into distinct domains with clear boundaries and responsibilities.

## High-Level Structure

```
src/
├── public/          # Unauthenticated area (auth, onboarding, users)
├── secure/          # Authenticated area (transactions, notifications, etc)
├── backoffice/      # Backoffice administration (clients, roles, users)
├── worker/          # SQS worker for asynchronous processing
└── shared/          # Shared resources (prisma, guards, helpers)
```

## Design Patterns

### Controller-Service-Model (CSM)

Each module follows the CSM pattern for clear separation of concerns:

```
Controller (HTTP) → Service (Business Logic) → Model (Prisma) → Database
```

- **Controllers**: Handle HTTP requests, validation, and response mapping
- **Services**: Implement business logic and orchestration
- **Models**: Manage data access through Prisma ORM

### Dependency Injection

All components use NestJS dependency injection for:
- Loose coupling between modules
- Easy testing with mocks
- Clear dependency graphs
- Singleton service management

## Authentication Architecture

### Guards

- `AuthGuard`: Protects secure endpoints (JWT validation)
- `BackofficeAuthGuard`: Protects backoffice endpoints (role-based)
- `@CurrentUser()`: Decorator to access authenticated user in controllers

### Token Strategy

- JWT tokens for stateless authentication
- Token expiration configurable per environment
- Refresh token support for long-lived sessions

## Main Domains

### Public Domain

Handles unauthenticated operations:
- Authentication (login, registration, password recovery)
- Onboarding (multi-step user registration)
- Public profile operations
- Email/SMS validation

### Secure Domain

Handles authenticated user operations:
- Transactions (create, history, status)
- Notifications (push, email, SMS)
- App actions and modules
- App information and news
- Campaign codes
- Terms acceptance

### Backoffice Domain

Administrative operations:
- Client management
- User management
- Role management
- Onboarding approval
- Action management
- System configuration

### Worker Domain

Asynchronous message processing via AWS SQS:
- PIX transaction processing
- Background jobs
- Integration with external systems

## Shared Resources

### Core Services

- `PrismaService`: Global database access layer
- `LoggerService`: Structured logging system
- `ConfigService`: Environment configuration management
- `PasswordHelper`: Bcrypt password hashing
- `JwtService`: Token generation and validation

### Cross-Cutting Concerns

- **Guards**: Authentication and authorization
- **Decorators**: Custom parameter decorators
- **Helpers**: Utility functions
- **Interceptors**: Logging, transformation
- **Filters**: Exception handling

## Technology Stack

- **Framework**: NestJS with Fastify
- **Database**: MySQL via Prisma ORM
- **Authentication**: JWT
- **Cloud Services**: AWS (S3, SQS, SES)
- **Messaging**: Twilio (SMS)
- **Validation**: class-validator
- **Testing**: Jest

## References

- [Module Structure](modules.md)
- [Worker Architecture](worker.md)
- [Database Schema](database.md)
- [API Documentation](../api/)
