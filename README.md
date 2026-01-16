# API Project

A comprehensive NestJS-based API application built with TypeScript, featuring authentication, transaction processing, backoffice management, and worker services.

## Description

This project implements a modular API architecture using the NestJS framework, organized into distinct areas for public access, authenticated operations, and administrative functions. The application follows the Controller-Service-Model pattern and includes comprehensive documentation for all major features.

## Documentation

Comprehensive documentation is available in the [docs](docs) directory, organized following software engineering best practices:

### Getting Started

- [Installation Guide](docs/guides/installation.md) - Setup and installation instructions
- [Environment Configuration](docs/guides/environment.md) - Environment variables and configuration
- [Git Workflow](docs/guides/git-workflow.md) - Commit conventions and pull request guide
- [Module Example](docs/guides/module-example.md) - Complete module implementation guide

### Architecture

- [Overview](docs/architecture/overview.md) - System architecture and design patterns
- [Module Structure](docs/architecture/modules.md) - Directory organization and module layout
- [Worker Architecture](docs/architecture/worker.md) - SQS worker and background processing

### API Reference

- [API Documentation](docs/api/README.md) - Complete API reference index
- [Public Endpoints](docs/api/public-no-auth.md) - Unauthenticated endpoints
- [Authenticated Endpoints](docs/api/public-auth.md) - User endpoints
- [Secure Endpoints](docs/api/secure-auth.md) - Secure user operations
- [Backoffice Endpoints](docs/api/backoffice-auth.md) - Administrative endpoints
- [Error Codes](docs/api/error-codes.md) - Error handling and status codes
- [Onboarding Flow](docs/api/onboarding/) - Multi-step registration process

### Operations

- [Operations Overview](docs/operations/README.md) - Production operations guide
- [Security and Performance](docs/operations/security-performance.md) - Security features and performance optimization
- [Provider Features](docs/operations/provider-features.md) - Payment provider capabilities

### Architecture Decision Records (ADRs)

- [ADR Template](docs/adrs/TEMPLATE.md) - Template for documenting architectural decisions

### Request for Comments (RFCs)

- [RFC Template](docs/rfcs/TEMPLATE.md) - Template for proposing significant changes

## Project setup

For detailed installation instructions, see the [Installation Guide](docs/guides/installation.md).

```bash
$ yarn install
$ yarn run prisma:generate
```

## Configuration

Configure your environment variables by creating a `.env` file in the project root. Refer to the [Environment Configuration](docs/guides/environment.md) guide for complete details.

```env
NODE_ENV=development
DATABASE_URL="mysql://user:password@host:port/database"
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRES_IN=1d
```

## Compile and run the project

The application includes both API and worker services. For complete execution details, refer to the [Installation Guide](docs/guides/installation.md).

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod

# worker service
$ yarn run start:worker
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Architecture

The application follows a modular architecture organized into three main areas:

- **Public** - Unauthenticated endpoints for authentication, user registration, and onboarding
- **Secure** - Authenticated endpoints for transactions, notifications, and user operations
- **Backoffice** - Administrative endpoints for client management, user administration, and system configuration
- **Worker** - Background service for processing SQS messages and asynchronous tasks

Each module implements the Controller-Service-Model pattern. For a detailed architecture overview, see the [Architecture Documentation](docs/architecture/overview.md) and [Module Structure](docs/architecture/modules.md).

## API Reference

The application provides comprehensive REST APIs across multiple domains:

- Authentication and user management
- Transaction processing
- Notification services
- Campaign management
- Administrative operations

For a complete list of available endpoints, see the [API Documentation](docs/api/README.md). Error handling and status codes are documented in [Error Codes](docs/api/error-codes.md).

## Testing

The project includes comprehensive testing suites for all modules:

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

### Testing Guides

Comprehensive testing guides are available in the documentation for testing various API flows and integrations.

## Deployment

When deploying to production, ensure all environment variables are properly configured. Refer to the [Environment Configuration](docs/guides/environment.md) and [Operations Guide](docs/operations/README.md) for details on environment-specific settings and deployment best practices.

For deployment best practices and production optimization, check out the [deployment documentation](https://docs.nestjs.com/deployment).

## License

This project is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
