# API Project

A comprehensive NestJS-based API application built with TypeScript, featuring authentication, transaction processing, backoffice management, and worker services.

## Description

This project implements a modular API architecture using the NestJS framework, organized into distinct areas for public access, authenticated operations, and administrative functions. The application follows the Controller-Service-Model pattern and includes comprehensive documentation for all major features.

## Documentation

Detailed documentation is available in the [docs](docs) directory:

### Core Documentation
- [Architecture](docs/ARCHITECTURE.md) - System architecture and design patterns
- [Project Structure](docs/STRUCTURE.md) - Directory organization and module layout
- [Installation Guide](docs/INSTALL.md) - Setup and installation instructions
- [Environment Configuration](docs/ENVIRONMENT.md) - Environment variables and configuration

### API Documentation
- [Endpoints Map](docs/ENDPOINTS_MAP.md) - Complete API endpoints reference
- [Error Codes](docs/ERROR_CODES.md) - Error handling and status codes
- [Provider Features](docs/PROVIDER_FEATURES.md) - Provider-specific features and capabilities

### Module Documentation
- [Backoffice Authentication](docs/BACKOFFICE_AUTH_MODULE.md) - Backoffice authentication system
- [Worker Service](docs/WORKER.md) - SQS worker and background processing

### Testing Documentation
- [Public Authentication Testing](docs/PUBLIC_AUTH_TESTING.md) - Public API authentication test guide
- [Backoffice Authentication Testing](docs/BACKOFFICE_AUTH_TESTING.md) - Backoffice authentication test guide
- [PIX Cronos Testing](docs/PIX_CRONOS_TESTING.md) - PIX integration testing guide

## Project setup

For detailed installation instructions, see the [Installation Guide](docs/INSTALL.md).

```bash
$ yarn install
$ yarn run prisma:generate
```

## Configuration

Configure your environment variables by creating a `.env` file in the project root. Refer to the [Environment Configuration](docs/ENVIRONMENT.md) guide for complete details.

```env
NODE_ENV=development
DATABASE_URL="mysql://user:password@host:port/database"
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRES_IN=1d
```

## Compile and run the project

The application includes both API and worker services. For complete execution details, refer to the [Installation Guide](docs/INSTALL.md).

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

Each module implements the Controller-Service-Model pattern. For a detailed architecture overview, see the [Architecture Documentation](docs/ARCHITECTURE.md) and [Project Structure](docs/STRUCTURE.md).

## API Reference

The application provides comprehensive REST APIs across multiple domains:

- Authentication and user management
- Transaction processing
- Notification services
- Campaign management
- Administrative operations

For a complete list of available endpoints, see the [Endpoints Map](docs/ENDPOINTS_MAP.md). Error handling and status codes are documented in [Error Codes](docs/ERROR_CODES.md).

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

- [Public Authentication Testing](docs/PUBLIC_AUTH_TESTING.md) - Test public API authentication flows
- [Backoffice Authentication Testing](docs/BACKOFFICE_AUTH_TESTING.md) - Test backoffice authentication and authorization
- [PIX Cronos Testing](docs/PIX_CRONOS_TESTING.md) - Test PIX integration and payment flows

## Deployment

When deploying to production, ensure all environment variables are properly configured. Refer to the [Environment Configuration](docs/ENVIRONMENT.md) for details on environment-specific settings.

For deployment best practices and production optimization, check out the [deployment documentation](https://docs.nestjs.com/deployment).

## License

This project is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
