# Documentation Index

This directory contains comprehensive technical documentation following software engineering best practices.

## Documentation Standards

### ADR (Architecture Decision Records)
Records of architectural decisions made during the project. Each ADR documents:
- Context: Why a decision was needed
- Decision: What was decided
- Consequences: Impact and trade-offs
- Status: Proposed, Accepted, Deprecated, Superseded

Location: `adrs/`

### RFC (Request for Comments)
Proposals for significant technical changes or new features. Each RFC includes:
- Problem statement
- Proposed solution
- Alternatives considered
- Implementation plan
- Open questions

Location: `rfcs/`

### Technical Guides
Step-by-step guides for developers:
- Installation and setup
- Development workflows
- Testing strategies
- Deployment procedures

Location: `guides/`

### Architecture Documentation
System architecture and design:
- High-level overview
- Module structure
- Data flow diagrams
- Infrastructure design

Location: `architecture/`

### API Documentation
Complete API reference:
- Authentication mechanisms
- Endpoint specifications
- Request/response schemas
- Error codes and handling

Location: `api/`

### Operations Documentation
Production operations and maintenance:
- Monitoring and alerting
- Troubleshooting guides
- Incident response
- Performance optimization

Location: `operations/`

## Quick Navigation

### Getting Started
- [Installation Guide](guides/installation.md)
- [Environment Configuration](guides/environment.md)
- [Git Workflow](guides/git-workflow.md)

### Architecture
- [System Overview](architecture/overview.md)
- [Module Structure](architecture/modules.md)
- [Database Schema](architecture/database.md)

### Development
- [Testing Guide](guides/testing.md)
- [Module Example](guides/module-example.md)
- [Public Auth Testing](guides/testing-public-auth.md)
- [Backoffice Auth Testing](guides/testing-backoffice-auth.md)
- [PIX Cronos Testing](guides/testing-pix-cronos.md)
- [Cronos cURL Testing](guides/testing-cronos-curl.md)

### API Reference
- [Authentication](api/authentication.md)
- [Public Endpoints](api/public.md)
- [Secure Endpoints](api/secure.md)
- [Backoffice Endpoints](api/backoffice.md)
- [Error Codes](api/error-codes.md)

### Operations
- [Deployment Guide](operations/deployment.md)
- [Monitoring](operations/monitoring.md)
- [Troubleshooting](operations/troubleshooting.md)

## Contributing to Documentation

When adding or updating documentation:

1. **Choose the right location**
   - ADRs for architectural decisions
   - RFCs for proposals requiring discussion
   - Guides for procedural documentation
   - API docs for endpoint specifications

2. **Follow templates**
   - Use provided templates in each directory
   - Maintain consistent formatting
   - Include code examples where relevant

3. **Keep it current**
   - Update docs when code changes
   - Mark deprecated information clearly
   - Reference related documents

4. **Be clear and concise**
   - Use simple language
   - Provide examples
   - Include diagrams when helpful
