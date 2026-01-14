# Testing Guide

This guide covers testing strategies and procedures for the application.

## Testing Overview

The project includes comprehensive testing across multiple layers:

- **Unit Tests**: Test individual components (services, models)
- **Integration Tests**: Test component interactions (controller + service + model)
- **E2E Tests**: Test complete HTTP flows
- **Performance Tests**: Load testing for critical endpoints
- **Manual Tests**: Postman collections and curl commands

## Running Tests

### Unit Tests

```bash
npm run test:unit
```

Test individual business logic in services and data access in models.

### Integration Tests

```bash
npm run test:integration
```

Test complete request flows from controller to database.

### E2E Tests

```bash
npm run test:e2e
```

Test full HTTP request/response cycles with real database.

### Performance Tests

```bash
npm run test:performance
```

Load testing for critical endpoints to identify bottlenecks.

### Test Coverage

```bash
npm run test:cov
```

Generate coverage report. Target: 80%+ coverage.

## Manual Testing Guides

### Authentication Testing

- [Public Authentication Testing](testing-public-auth.md) - Test public API authentication
- [Backoffice Authentication Testing](testing-backoffice-auth.md) - Test backoffice authentication

### Transaction Testing

- [PIX Cronos Testing](testing-pix-cronos.md) - Test PIX transaction endpoints
- [Cronos cURL Testing](testing-cronos-curl.md) - Direct Cronos API testing with cURL

## Test Structure

### Unit Tests

Located in `test/unit/`, organized by module:

```
test/unit/
├── public/
│   ├── authentication/
│   ├── users/
│   └── onboarding/
├── secure/
│   └── transactions/
├── backoffice/
│   └── auth/
└── shared/
    ├── email/
    └── sms/
```

### Integration Tests

Located in `test/integration/`, testing controller + service + model:

```
test/integration/
├── public/
├── secure/
└── backoffice/
```

### E2E Tests

Located in `test/e2e/`, testing complete API flows:

```
test/e2e/
├── auth.e2e-spec.ts
├── onboarding.e2e-spec.ts
└── transactions.e2e-spec.ts
```

## Testing Best Practices

### Unit Testing

- **Isolation**: Mock all dependencies (Prisma, external services)
- **Coverage**: Test all branches and edge cases
- **Naming**: Use descriptive test names: `should <behavior> when <condition>`
- **Arrange-Act-Assert**: Structure tests clearly
- **Fast**: Unit tests should run quickly

### Integration Testing

- **Real interactions**: Test actual component collaboration
- **Database**: Use test database or transactions
- **Mock externals**: Mock external APIs and services
- **Cleanup**: Reset state between tests

### E2E Testing

- **Complete flows**: Test entire user journeys
- **Real environment**: Use test database with seed data
- **HTTP client**: Use Supertest for HTTP requests
- **Authentication**: Handle JWT tokens properly

### Mocking

Use provided test utilities:

```typescript
import { createLoggerServiceMock } from 'test/utils/logger-mock';
import { createPrismaMock } from 'test/utils/prisma-mock';

const logger = createLoggerServiceMock();
const prisma = createPrismaMock();
```

## Test Data

### Fixtures

Create reusable test data:

```typescript
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  status: 'enable',
  // ...
};
```

### Database Seeds

For E2E tests, seed test database:

```bash
npm run prisma:seed:test
```

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Commits to master
- Scheduled nightly runs

### CI Pipeline

```yaml
- Lint code
- Type check
- Run unit tests
- Run integration tests
- Run E2E tests
- Generate coverage report
- Upload coverage to CodeCov
```

## Debugging Tests

### Run specific test file

```bash
npm run test -- path/to/test.spec.ts
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Debug in VS Code

Use the provided launch configuration:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "${file}"],
  "console": "integratedTerminal"
}
```

## Test Configuration

### Jest Configuration

Located in `test/config/`:

- `jest-unit.config.js` - Unit tests
- `jest-integration.config.js` - Integration tests
- `jest-e2e.config.js` - E2E tests
- `jest-performance.config.js` - Performance tests

### Environment Variables

Use `.env.test` for test-specific configuration:

```env
NODE_ENV=test
DATABASE_URL=mysql://test:test@localhost:3306/test_db
JWT_SECRET=test-secret
```

## Continuous Improvement

### Coverage Goals

- Unit tests: 90%+ coverage
- Integration tests: 80%+ coverage
- E2E tests: Cover critical user paths
- Overall: 80%+ coverage

### Regular Reviews

- Review test failures immediately
- Update tests when code changes
- Add tests for new features
- Remove obsolete tests

## References

- [Module Example](module-example.md)
- [Architecture Overview](../architecture/overview.md)
- [Code Standards](code-standards.md)
