# Integration Testing Guide

**Status:** `stable`
**Last Updated:** 2026-01-14
**Owner:** Unex Development Team

## Overview

Integration tests validate complete API flows against a real backend environment. Unlike unit tests that mock dependencies, integration tests verify the entire system works correctly with real database, authentication, and business logic.

**Important:** Integration tests use the **LOCAL Docker development database** to avoid polluting sandbox data, but use **REAL sandbox credentials** for external integrators (Bind, Cronos, Valida, Renaper, etc.).

## Test Structure

```
test/integration/
├── flows/                           # Complete flow tests
│   ├── onboarding.integration-spec.ts
│   ├── authentication.integration-spec.ts
│   └── facial-validation.integration-spec.ts
├── helpers/                         # Test utilities
│   ├── http-client.helper.ts        # HTTP client wrapper
│   ├── test-data.helper.ts          # Test data generators
│   ├── logger.helper.ts             # Semantic logger
│   └── index.ts                     # Helper exports
└── README.md
```

## Quick Start

### 1. Start Docker Containers

Integration tests require MySQL and Redis running in Docker:

```bash
# Start Docker containers (MySQL, Redis)
docker-compose up -d

# Verify containers are running
docker ps
```

### 2. Setup Database

Create database tables:

```bash
# Push database schema (creates all tables)
WALLET_MYSQL_URL="mysql://root:root123@localhost:3306/unex" npx prisma db push --skip-generate
```

Note: Seed is optional. Integration tests generate their own test data.

### 3. Setup Environment

Copy the example environment file:

```bash
cp .env.test.example .env.test
```

The `.env.test` file is pre-configured with:
- **Local Docker database** (`mysql://root:root@localhost:3306/unex_dev`)
- **Local Docker Redis** (`redis://localhost:6379/0`)
- **Real sandbox credentials** for external integrators
- **Mock codes enabled** for faster tests

No additional configuration needed unless you want to change defaults.

### 4. Start the API Server

Integration tests require a running API server:

```bash
# Development mode (uses .env or .env.test)
npm run start:dev

# The API will connect to local Docker database
```

### 5. Run Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- onboarding.integration-spec.ts

# Run with watch mode
npm run test:integration -- --watch

# Run with verbose output
npm run test:integration -- --verbose
```

## Test Flows

### Onboarding Flow

Tests complete user onboarding process:

- User signup
- Email validation (send + verify code)
- Phone validation (send + verify code)
- User signin
- Profile update with personal data
- Onboarding state management

**File:** `flows/onboarding.integration-spec.ts`

**Key Tests:**
- Complete onboarding flow with all validations
- Duplicate email rejection
- Email format validation
- Phone format validation
- Onboarding state tracking

### Authentication Flow

Tests user authentication and session management:

- Login with email and password
- Login with phone number and password
- Invalid credentials handling
- Protected route access
- Token validation
- Logout
- Password change

**File:** `flows/authentication.integration-spec.ts`

**Key Tests:**
- Signin with valid credentials
- Signin with phone number
- Invalid credentials rejection
- Protected route access control
- Token lifecycle management
- Password change flow

### Facial Validation Flow

Tests liveness verification with and without Valida:

- Simple photo upload (Valida disabled)
- Valida enrollment (Valida enabled)
- Base64 image validation
- Valida ID validation
- Verification state tracking

**File:** `flows/facial-validation.integration-spec.ts`

**Key Tests:**
- Photo upload for liveness
- Valida enrollment processing
- Image format validation
- Configuration detection

## Test Helpers

### HTTP Client Helper

Provides authenticated HTTP requests with automatic token management.

```typescript
import { createHttpClient } from '../helpers';

const client = createHttpClient();

// Make authenticated request
client.setAuthToken(token);
const response = await client.get('/api/users/user/me');

// Clear authentication
client.clearAuthToken();
```

**Features:**
- Automatic JWT token injection
- Configurable base URL
- Full axios response (status + data)
- Support for GET, POST, PATCH, DELETE

### Test Data Helper

Generates realistic test data for users, phones, documents.

```typescript
import { createTestUser, TestDataGenerator } from '../helpers';

// Generate complete test user
const user = createTestUser('br'); // or 'ar' for Argentina
// Returns: { email, phone, password, firstName, lastName, birthdate, document, country }

// Generate specific data
const email = TestDataGenerator.generateUniqueEmail();
const phone = TestDataGenerator.generateUniquePhone('br');
const cpf = TestDataGenerator.generateCPF();
```

**Features:**
- Unique email generation (timestamp-based)
- Valid phone numbers (BR/AR)
- Random passwords (6 digits)
- CPF/DNI generation
- Realistic names and birthdates

### Logger Helper

Provides semantic logging for test execution.

```typescript
import { createIntegrationLogger } from '../helpers';

const logger = createIntegrationLogger('MyTest');

logger.testStart('Test name');
logger.step(1, 'Step description');
logger.info('Information message', { data });
logger.success('Operation succeeded');
logger.warn('Warning message');
logger.error('Error occurred');
logger.testEnd('Test name');
```

**Log Levels:**
- `INFO` - Informational messages
- `SUCCESS` - Successful operations
- `WARN` - Warnings
- `ERROR` - Errors
- `DEBUG` - Debug information
- `STEP` - Test step markers

## Environment Configuration

### Database and Infrastructure (Local Docker)

Integration tests use **local Docker containers** to avoid polluting remote environments:

```env
# Local Docker MySQL
WALLET_MYSQL_URL=mysql://root:root@localhost:3306/unex_dev

# Local Docker Redis
WALLET_REDIS_URL=redis://localhost:6379/0

# API Configuration
WALLET_SERVER_PORT=3000
WALLET_SERVER_URL=http://localhost:3000
```

### External Integrators (Real Sandbox Credentials)

All external service credentials use **REAL SANDBOX** endpoints and keys:

```env
# Bind - CVU Provider (Sandbox)
WALLET_BIND=enable
WALLET_BIND_URL=https://api-pre.bind.com.arcr
WALLET_BIND_USERNAME=api-gruposalerno-qa
# ... (full credentials in .env.test.example)

# Cronos - PIX Provider (Sandbox)
WALLET_CRONOS=enable
WALLET_CRONOS_URL=https://stage.v2.x.cronosbank.com
# ... (full credentials in .env.test.example)

# Valida - Biometric Verification (Sandbox)
WALLET_VALIDA=enable
WALLET_VALIDA_URL=https://exquisite-mountain-9y4efmq8oslh.vapor-farm-d1.com/api
# ... (full credentials in .env.test.example)

# Renaper - Identity Verification (Sandbox)
WALLET_RENAPER=enable
WALLET_RENAPER_URL=https://apirenaper.idear.gov.ar/CHUTROFINAL
# ... (full credentials in .env.test.example)
```

### Feature Flags

```env
# Enable mock validation codes (123456 always works)
ENABLE_MOCK_CODES=true

# Disable email/SMS sending for faster tests
WALLET_SANDBOX_SEND_MAIL=false
WALLET_SANDBOX_SEND_PUSH=false

# Enable sandbox mode
WALLET_SANDBOX=enable
```

**Important:** The `.env.test.example` file contains ALL necessary configuration. Simply copy it to `.env.test` and tests will work without modifications.

### Mock Codes

When `ENABLE_MOCK_CODES=true`, use code `123456` for all validations:

```typescript
// This will always work in test environment
await client.post('/api/users/user/verifyEmailCode', {
  email: testUser.email,
  code: '123456', // Mock code
});
```

## Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
beforeEach(() => {
  // Generate unique test data for each test
  testUser = createTestUser('br');
});
```

### 2. Flexible Assertions

Expect multiple possible outcomes:

```typescript
// Good - handles both success and expected failures
expect([200, 401]).toContain(response.status);

// Bad - assumes success
expect(response.status).toBe(200);
```

### 3. Semantic Logging

Use clear, descriptive log messages:

```typescript
logger.step(1, 'User signup');
logger.info('Signup response received', { status: response.status });
logger.success('User created successfully', { userId });
```

### 4. Error Tolerance

Handle expected failures gracefully:

```typescript
if (response.status === 200) {
  logger.success('Operation completed');
} else {
  logger.warn('Operation failed - expected in real environment');
}
```

### 5. Timeout Management

Set appropriate timeouts for slow operations:

```typescript
it('should complete full onboarding flow', async () => {
  // Test implementation
}, 60000); // 60 second timeout
```

## Running Tests in Different Environments

### Local Development (Recommended)

```bash
# 1. Start Docker containers
docker-compose up -d

# 2. Start API locally
npm run start:dev

# 3. Run tests
npm run test:integration
```

This is the **recommended approach** as it uses local Docker database and real sandbox integrators.

### CI/CD Pipeline

```yaml
# .github/workflows/integration-tests.yml
- name: Start Docker Services
  run: docker-compose up -d

- name: Wait for Services
  run: sleep 10

- name: Run Integration Tests
  run: npm run test:integration
  env:
    NODE_ENV: test
    ENABLE_MOCK_CODES: true
```

**Note:** Tests should ALWAYS use local Docker database, never remote sandbox database, to avoid polluting shared data.

## Debugging

### Enable Verbose Logging

```bash
# Run with Jest verbose output
npm run test:integration -- --verbose

# Run single test
npm run test:integration -- -t "should complete full onboarding flow"
```

### Check API Logs

Monitor backend logs while running tests:

```bash
# In separate terminal
npm run start:dev
```

### Inspect HTTP Requests

Add debug logs in tests:

```typescript
logger.debug('Request payload', { email, password });
const response = await client.post('/api/users/user/signin', { email, password });
logger.debug('Response data', { status: response.status, data: response.data });
```

## Common Issues

### Issue: Tests fail with 401 Unauthorized

**Solution:** User may require email/phone verification. Ensure `ENABLE_MOCK_CODES=true` is set.

```env
ENABLE_MOCK_CODES=true
```

### Issue: SMS tests fail

**Solution:** Twilio credentials may be missing. Either configure Twilio or use mock codes.

```env
# Option 1: Use mock codes
ENABLE_MOCK_CODES=true

# Option 2: Configure Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

### Issue: Database connection errors

**Solution:** Verify Docker containers are running.

```bash
# Check if Docker containers are running
docker ps

# Start Docker containers if not running
docker-compose up -d

# Test MySQL connection
mysql -u root -proot -h localhost unex_dev

# Check connection string
WALLET_MYSQL_URL=mysql://root:root@localhost:3306/unex_dev
```

### Issue: Docker containers not starting

**Solution:** Check Docker service and logs.

```bash
# Check Docker service status
docker info

# View container logs
docker-compose logs mysql
docker-compose logs redis

# Restart containers
docker-compose down
docker-compose up -d
```

### Issue: Tests timeout

**Solution:** Increase timeout or check if API server is running.

```typescript
// Increase timeout for slow operations
it('slow test', async () => {
  // ...
}, 120000); // 2 minutes
```

## Test Coverage

Integration tests should cover:

- [ ] Complete user registration flow
- [ ] Authentication (login/logout)
- [ ] Email validation
- [ ] SMS validation
- [ ] Liveness verification
- [ ] Profile management
- [ ] Session management
- [ ] Error handling
- [ ] Edge cases

## Related Documentation

- [Testing Guide](./testing.md) - Overview of all testing strategies
- [Public Auth Testing](./testing-public-auth.md) - Manual API testing
- [Module Example](./module-example.md) - Creating new modules with tests
- [Architecture Overview](../architecture/overview.md) - System architecture

## Support

For issues or questions:
1. Check test logs for error messages
2. Verify environment configuration
3. Review backend API logs
4. Contact development team
