# Environment Configuration

## Overview

The system loads environment variables based on `NODE_ENV`:

- `NODE_ENV=development` → loads `.env` (default)
- `NODE_ENV=sandbox` → loads `.env` (configured for sandbox)
- `NODE_ENV=production` → loads `.env` (configured for production)

## Available Scripts

### Development

```bash
npm run start:dev          # API with watch
npm run start:worker       # Worker with watch
```

### Sandbox

```bash
npm run start:sandbox:dev   # Development with watch
npm run start:sandbox        # Simple development
npm run start:sandbox:prod   # Compiled production
npm run sandbox-tunnel       # SSH tunnel for remote database
```

### Production

```bash
npm run start:prod:dev      # Development with watch
npm run start:prod:env       # Simple development
npm run start:prod:prod      # Compiled production
npm run prod-tunnel          # SSH tunnel for remote database
```

## Configuration

The `.env` file should contain:

- `NODE_ENV`: Current environment
- `WALLET_MYSQL_URL`: Database URL (use `127.0.0.1:3306` with SSH tunnel)
- `DATABASE_URL`: Alternative database URL
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_EXPIRES_IN`: Token expiration time

## SSH Tunnel Setup

To connect to remote database (sandbox/production):

1. Start tunnel in separate terminal:

   ```bash
   npm run sandbox-tunnel   # or npm run prod-tunnel
   ```

2. Configure `.env` with `WALLET_MYSQL_URL` pointing to `127.0.0.1:3306`

3. Start application normally

## Environment-Specific Features

### Development
- Hot reload enabled
- Debug logging
- Mock services available
- Local database

### Sandbox
- SSH tunnel to remote database
- Staging AWS services
- Limited feature flags
- Integration testing

### Production
- SSH tunnel to production database
- Production AWS services
- All features enabled
- Performance monitoring

## References

- [Installation Guide](installation.md)
- [Operations Documentation](../operations/)
