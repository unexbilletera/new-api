# Module Example: Backoffice Authentication

This module serves as a complete example of the Controller-Service-Model (CSM) architecture pattern used throughout the application.

## Structure

```
backoffice/auth/
├── controllers/
│   └── auth.controller.ts          # HTTP endpoints
├── services/
│   └── auth.service.ts              # Business logic
├── models/
│   └── backoffice-user.model.ts     # Database access (Prisma)
├── dto/
│   ├── login.dto.ts                 # Input validation
│   └── login-response.dto.ts        # Response format
└── auth.module.ts                   # NestJS module
```

## Data Flow

```
POST /backoffice/auth/login
    ↓
AuthController.login()
    ↓ (validates LoginDto)
AuthService.login()
    ↓
BackofficeUserModel.validateCredentials()
    ↓ (accesses Prisma)
Prisma → MySQL
    ↓ (returns data)
BackofficeUserModel (processes)
    ↓
AuthService (generates token)
    ↓
AuthController (returns LoginResponseDto)
    ↓
Response JSON
```

## Components

### DTO (Data Transfer Object)

**`dto/login.dto.ts`**

Defines and validates input structure:

```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

- Uses `class-validator` decorators
- Automatic validation via NestJS
- Custom error messages
- Type safety

**`dto/login-response.dto.ts`**

Defines response structure:

```typescript
export class LoginResponseDto {
  accessToken: string;
  user: UserDto;
}
```

- Ensures API consistency
- Type-safe responses
- Clear contract with consumers

### Controller

**`controllers/auth.controller.ts`**

Handles HTTP requests:

```typescript
@Controller('backoffice/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(BackofficeAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }
}
```

- Route definitions with decorators
- DTO validation via `ValidationPipe`
- Guard application
- Dependency injection

### Service

**`services/auth.service.ts`**

Implements business logic:

```typescript
@Injectable()
export class AuthService {
  constructor(
    private userModel: BackofficeUserModel,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userModel.validateCredentials(
      dto.email,
      dto.password,
    );

    if (!user) {
      throw new UnauthorizedException('401 backoffice.errors.invalidCredentials');
    }

    const token = this.jwtService.sign({ userId: user.id });

    return {
      accessToken: token,
      user: this.mapUserToDto(user),
    };
  }
}
```

- Orchestrates model calls
- Business rule validation
- Error handling
- No direct database access

### Model

**`models/backoffice-user.model.ts`**

Manages database operations:

```typescript
@Injectable()
export class BackofficeUserModel {
  constructor(private prisma: PrismaService) {}

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.users.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        status: true,
        role: true,
      },
    });

    if (!user || user.status !== 'active') {
      return null;
    }

    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }
}
```

- Prisma client interactions
- Query optimization (select only needed fields)
- No business logic
- Type-safe database access

### Module

**`auth.module.ts`**

Configures NestJS module:

```typescript
@Module({
  imports: [SharedModule, JwtModule.register(...)],
  controllers: [AuthController],
  providers: [AuthService, BackofficeUserModel],
  exports: [AuthService],
})
export class AuthModule {}
```

- Registers components
- Imports dependencies
- Exports services for other modules

## Example Endpoints

### POST /backoffice/auth/login

**Request:**

```json
{
  "email": "admin@example.com",
  "password": "senha123"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Admin",
    "email": "admin@example.com",
    "role": {
      "id": "uuid",
      "name": "admin",
      "level": 1
    }
  }
}
```

**Errors:**

- `400`: Invalid data (validation)
- `401`: Invalid email or password
- `401`: User inactive

### GET /backoffice/auth/me

**Headers:**

```
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "name": "Admin",
    "email": "admin@example.com",
    "role": { ... }
  }
}
```

## Security Features

- **Password hashing**: bcrypt with 10 rounds
- **Status validation**: Active/inactive user check
- **Guard protection**: JWT authentication required
- **Token generation**: Secure JWT with expiration

## Using as Template

Follow these steps to create a new module:

1. **Copy structure**:
   ```bash
   cp -r src/backoffice/auth src/backoffice/your-module
   ```

2. **Rename files and classes**:
   - `auth.controller.ts` → `your-module.controller.ts`
   - `AuthController` → `YourModuleController`
   - Update all imports

3. **Adapt DTOs**:
   - Define your input validation
   - Define your response shapes
   - Add validation decorators

4. **Implement service logic**:
   - Add business rules
   - Orchestrate model calls
   - Handle errors appropriately

5. **Create model methods**:
   - Define database queries
   - Optimize with select/include
   - Return typed results

6. **Register module**:
   ```typescript
   @Module({
     imports: [SharedModule],
     controllers: [YourModuleController],
     providers: [YourModuleService, YourModuleModel],
     exports: [YourModuleService],
   })
   export class YourModule {}
   ```

7. **Write tests**:
   - Unit tests for service
   - Integration tests for controller
   - Mock Prisma and dependencies

## Best Practices

- **Single responsibility**: Each layer has one job
- **Dependency injection**: Use constructor injection
- **Error handling**: Use NestJS exceptions
- **Validation**: Always validate input with DTOs
- **Testing**: Test each layer independently
- **Type safety**: Use TypeScript types everywhere
- **Security**: Validate business rules in service

## References

- [Architecture Overview](../architecture/overview.md)
- [Module Structure](../architecture/modules.md)
- [Testing Guide](testing.md)
- [Code Standards](code-standards.md)
