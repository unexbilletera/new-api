# Git Workflow Guide

## Commit Convention

### Format

```
type(scope): short summary
```

- Written in English
- Imperative mood (add, fix, update)
- Lowercase
- No period at end
- Maximum 72 characters
- No body, bullets, or descriptions
- No co-author tags

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `style`: Code style changes
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Revert previous commit

### Scope

Optional but recommended when helpful:

- `auth`: Authentication module
- `user`: User module
- `transaction`: Transaction module
- `prisma`: Database/ORM changes
- `api`: API changes
- `worker`: Background worker

### Examples

```bash
feat: add phone validation fallback
fix: handle jwt expiry
feat(auth): add transactional password validation
fix(prisma): resolve type errors in user model
refactor(sqs): optimize message processing
test(auth): add unit tests for token service
docs(readme): update installation instructions
chore(deps): update nestjs to v11
```

## Pull Request Guide

### Summary

Provide short context and intent (1-3 lines) explaining:
- What problem this solves
- Why this change is needed
- What approach was taken

### Changes Made

Concise bullets of what changed:
- Focus on what, not how
- Group related changes
- Highlight breaking changes
- Mention new dependencies

### Example

**Summary:**
Add SMS/email code fallback to real delivery. Users can now receive real codes while testing can still use mock codes when enabled.

**Changes Made:**
- Always send real code via SMS/email
- Accept mock code if debug mode enabled
- Show mock code only in debug field
- Add feature flag for code fallback

## Workflow Steps

1. Create feature branch from master
2. Make changes following code standards
3. Write/update tests
4. Run linter and type checks
5. Commit with semantic message
6. Push to remote
7. Create pull request
8. Address review feedback
9. Merge to master

## References

- [Code Standards](code-standards.md)
- [Testing Guide](testing.md)
