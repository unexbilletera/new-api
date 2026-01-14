# Module Structure

## Directory Organization

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
├── backoffice/          # Backoffice administration
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

Each feature module follows a consistent structure:

```
module/
├── controllers/    # HTTP request handlers
├── services/       # Business logic
├── models/         # Database access (Prisma)
├── dto/           # Data Transfer Objects (validation)
├── mappers/       # Entity to DTO mapping
└── module.ts      # NestJS module configuration
```

## Module Components

### Controllers

Handle HTTP requests and responses:
- Route definitions with decorators
- Request validation via DTOs
- Response mapping via mappers
- Guard and interceptor application
- Error handling

Example:
```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

### Services

Implement business logic:
- Orchestrate operations across models
- Validate business rules
- Handle transactions
- Manage external service integration
- Throw domain-specific exceptions

### Models

Manage database operations:
- Prisma client interactions
- Query optimization
- Transaction management
- Type-safe database access
- No business logic

### DTOs

Define request/response shapes:
- Class-validator decorators
- Type safety
- Automatic validation
- Documentation generation
- Request transformation

### Mappers

Transform between layers:
- Entity to response DTO
- Request DTO to entity
- Hide sensitive fields
- Format data for API response

## Example Module

The `backoffice/auth` module demonstrates best practices:

**Structure:**
```
backoffice/auth/
├── controllers/
│   └── auth.controller.ts
├── services/
│   └── auth.service.ts
├── models/
│   └── auth.model.ts
├── dto/
│   ├── login.dto.ts
│   └── login-response.dto.ts
├── mappers/
│   └── auth.mapper.ts
└── auth.module.ts
```

**Features:**
- Full DTOs with validation
- Controller with HTTP endpoints
- Service with business logic
- Model with Prisma access
- Module properly configured
- Guards for protection
- Comprehensive tests

## Module Configuration

Each module exports:
- Controllers to handle routes
- Services as providers
- Imports of required modules
- Exports of services used by other modules

Example:
```typescript
@Module({
  imports: [SharedModule],
  controllers: [AuthController],
  providers: [AuthService, AuthModel, AuthMapper],
  exports: [AuthService],
})
export class AuthModule {}
```

## Cross-Module Communication

### Import/Export

Modules share functionality via exports:
- Export services needed by other modules
- Import modules that provide required services
- Never import services directly
- Use module imports exclusively

### Shared Module

The SharedModule provides common services:
- PrismaService for database access
- LoggerService for logging
- ConfigService for configuration
- Available to all modules via import

## Testing Structure

Tests mirror module structure:

```
test/
├── unit/           # Unit tests (services, models)
├── integration/    # Integration tests (controller + service)
├── e2e/           # End-to-end tests (full HTTP flow)
└── performance/   # Performance tests (load testing)
```

## References

- [Architecture Overview](overview.md)
- [Worker Architecture](worker.md)
- [API Documentation](../api/)
- [Testing Guide](../guides/testing.md)
