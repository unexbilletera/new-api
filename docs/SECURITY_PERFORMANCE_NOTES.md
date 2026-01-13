# Security & Performance Improvements

## Security

- Password hashing: bcrypt (10 rounds). Use existing stored hashes; no rehash required.
- Brute-force protection: applied to public and backoffice logins (identifier/IP tracking, 15m window, 30m lockout, lockout errors return 429). Counters are cleared on successful login.
- Rate limiter utility: reusable per-key limiter with optional block duration for throttling APIs.
- Suspicious activity detection utility: flags new device/IP/UA changes, impossible travel (basic heuristic), high login frequency; non-blocking logging hook.
- Entropy helpers: secure tokens/codes/UUIDs/challenges/nonces/session IDs; configurable length; PKCE-friendly challenge/hash helpers.

## Performance & Reliability

- Prisma optimized service: retry/backoff for deadlocks/connection errors, query timeout (30s), exponential backoff with jitter, pooling params (connection_limit, pool_timeout), transaction helper with maxWait/timeout.
- Circuit breaker utility: CLOSED/OPEN/HALF_OPEN states, thresholds (failures=5, successes=2, openTimeout=15s, rollingWindow=60s) to prevent cascading failures.
- Cache service: in-memory cache-aside with TTL (default 5m), pattern invalidation and full clear for hot paths or external API results.

## Current integration

- Active now: bcrypt hashing; brute-force checks in public/backoffice login flows.
- Available to wire: rate limiter, suspicious-activity hook (non-blocking), cache service, circuit breaker, prisma-optimized wrapper (swap where high contention/deadlock risk or long-running queries exist).

## Recommended next steps

- Apply rate limits per endpoint group (e.g., login, forgot-password, signup, webhook) using the rate limiter or Fastify/global throttling.
- Wrap external API calls (Cronos/Valida/Exchange/etc.) with circuit breaker + cache where safe.
- Use Prisma optimized executeWithRetry/executeTransaction on hotspots (payments/transactions/notifications listing) to mitigate deadlocks/timeouts.
- Add logging/metrics around brute-force and circuit breaker events; consider Redis-backed stores for distributed environments.
