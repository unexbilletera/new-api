# Environment System

The system loads environment variables based on `NODE_ENV`:

- `NODE_ENV=sandbox` → loads `.env` (configured for sandbox)
- `NODE_ENV=production` → loads `.env` (configured for production)
- `NODE_ENV=development` → loads `.env` (default)

## Available Scripts

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

## SSH Tunnel

To connect to remote database (sandbox/production):

1. Start tunnel in separate terminal:

   ```bash
   npm run sandbox-tunnel   # or npm run prod-tunnel
   ```

2. Configure `.env` with `WALLET_MYSQL_URL` pointing to `127.0.0.1:3306`

3. Start application normally
