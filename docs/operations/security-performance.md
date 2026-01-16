# Security and Performance

## Security Features

### Password Security

- **Hashing**: bcrypt with 10 rounds
- **Storage**: Existing stored hashes are used without rehashing
- **Validation**: Secure comparison with timing attack protection

### Brute-Force Protection

Applied to public and backoffice login endpoints:

- **Tracking**: By identifier and IP address
- **Window**: 15-minute rolling window
- **Lockout**: 30-minute lockout period
- **Response**: Returns 429 (Too Many Requests) during lockout
- **Reset**: Counters cleared on successful login

### Rate Limiting

Reusable per-key limiter with configurable parameters:

- **Configurable thresholds**: Requests per time window
- **Block duration**: Optional lockout period
- **Use cases**: API throttling, endpoint protection

### Suspicious Activity Detection

Non-blocking logging utility that flags:

- **New device detection**: Unfamiliar devices accessing account
- **IP changes**: Unusual IP address patterns
- **User agent changes**: Different browsers/clients
- **Impossible travel**: Geographic location changes too fast
- **High frequency login**: Rapid login attempts
- **Integration**: Logging hook (non-blocking)

### Entropy Helpers

Secure token generation utilities:

- **Random tokens**: Cryptographically secure tokens
- **Verification codes**: Numeric/alphanumeric codes
- **UUIDs**: Unique identifiers
- **Challenges**: PKCE-compatible challenge strings
- **Nonces**: One-time use values
- **Session IDs**: Secure session identifiers
- **Configuration**: Length and character set options

## Performance and Reliability

### Prisma Optimization

Enhanced database service with resilience features:

- **Retry logic**: Automatic retry for deadlocks and connection errors
- **Backoff strategy**: Exponential backoff with jitter
- **Query timeout**: 30-second default timeout
- **Connection pooling**: Configurable limits and timeouts
  - `connection_limit`: Maximum pool size
  - `pool_timeout`: Connection acquisition timeout
- **Transaction helper**: Managed transactions with timeout
  - `maxWait`: Maximum wait time for transaction lock
  - `timeout`: Transaction execution timeout

### Circuit Breaker

Prevents cascading failures with state management:

- **States**: CLOSED → OPEN → HALF_OPEN
- **Thresholds**:
  - Failures to open: 5 consecutive failures
  - Successes to close: 2 consecutive successes
  - Open timeout: 15 seconds before half-open
  - Rolling window: 60 seconds for failure tracking
- **Use cases**: External API calls, service integrations

### Cache Service

In-memory cache-aside pattern:

- **TTL**: Configurable, default 5 minutes
- **Pattern invalidation**: Clear by key pattern
- **Full clear**: Purge entire cache
- **Use cases**:
  - Hot paths
  - External API results
  - Frequently accessed data

## Current Integration

### Active Features

- **Bcrypt hashing**: All password operations
- **Brute-force protection**: Public and backoffice login flows

### Available Features

Ready to integrate:

- Rate limiter utility
- Suspicious activity detection hook
- Cache service
- Circuit breaker
- Prisma optimized wrapper

## Recommended Implementation

### Rate Limiting

Apply to endpoint groups:

- Login endpoints: 5 requests/minute
- Password recovery: 3 requests/hour
- Registration: 3 requests/minute
- Webhook endpoints: 100 requests/minute

Implementation options:
- Rate limiter utility
- Fastify rate limiting plugin
- Global throttling middleware

### Circuit Breaker Integration

Wrap external API calls:

- **Payment providers**: Cronos, Valida, Exchange
- **Third-party services**: SMS, Email
- **Configuration**: Cache results where safe
- **Monitoring**: Log circuit state changes

### Prisma Optimization

Apply to high-contention operations:

- **Payment processing**: Transaction creation/confirmation
- **Notifications**: Bulk notification queries
- **User operations**: Profile updates
- **Benefits**: Reduced deadlocks and timeouts

### Monitoring and Logging

Track security and performance metrics:

- Brute-force detection events
- Circuit breaker state changes
- Cache hit/miss rates
- Database retry attempts
- Suspicious activity logs

### Distributed Environments

For production deployments:

- **Redis-backed rate limiting**: Shared state across instances
- **Distributed cache**: Redis or Memcached
- **Centralized logging**: Structured logging with context
- **Metrics collection**: Prometheus/CloudWatch integration

## Best Practices

1. **Defense in Depth**: Layer multiple security measures
2. **Fail Safely**: Default to secure state on errors
3. **Monitor Everything**: Log security-relevant events
4. **Rate Limit Aggressively**: Protect against abuse
5. **Cache Wisely**: Balance freshness vs. performance
6. **Test Resilience**: Verify failover mechanisms
7. **Document Limits**: Clear communication of rate limits

## References

- [Architecture Overview](../architecture/overview.md)
- [Operations Guide](deployment.md)
- [Monitoring Guide](monitoring.md)
