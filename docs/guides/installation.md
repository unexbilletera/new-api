# Installation and Configuration

## Prerequisites

- Node.js 18+ and npm
- MySQL database
- Access to environment-specific configurations

## Installation

```bash
npm install
npm run prisma:generate
```

## Configuration

Create a `.env` file in the project root:

```env
NODE_ENV=development
WALLET_MYSQL_URL="mysql://user:password@host:port/database"
DATABASE_URL="mysql://user:password@host:port/database"
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRES_IN=1d
```

## Running the Application

### Development

```bash
npm run start:dev          # API with watch
npm run start:worker       # Worker (separate terminal)
```

### Production

```bash
npm run build              # Build
npm run start:prod:api     # API
npm run start:prod:worker  # Worker
```

### Sandbox

```bash
npm run start:sandbox:dev  # Sandbox API with watch
npm run sandbox-tunnel     # SSH tunnel (separate terminal)
```

### Production with Tunnel

```bash
npm run start:prod:dev     # Production API with watch
npm run prod-tunnel        # SSH tunnel (separate terminal)
```

## Environment Variables

- `WALLET_MYSQL_URL`: Database connection URL (Prisma)
- `DATABASE_URL`: Alternative database URL
- `JWT_SECRET`: Secret for JWT signing
- `JWT_EXPIRES_IN`: Token expiration time (e.g., 1d, 24h)
- `NODE_ENV`: Environment (development, sandbox, production)

## Next Steps

- Review [Environment Configuration](environment.md)
- Check [Architecture Overview](../architecture/overview.md)
- Read [Git Workflow Guide](git-workflow.md)
