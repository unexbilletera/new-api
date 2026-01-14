# API Changelog

All notable changes to the API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Comprehensive API documentation reorganization
- Domain-based documentation structure
- Flow diagrams for complete user journeys

### Changed
- Strict phone format validation for Brazil and Argentina (+XX XXXXXXXXX)
- Phone normalization to database format with space after country code
- Corrected public onboarding endpoints mapping (13 endpoints)

### Fixed
- Phone validation now rejects special characters except +
- Onboarding endpoints documentation aligned with actual implementation

### Refactored
- Removed inline comments from test utilities
- Cleaned up test factories and mocks documentation

## [2026-01-14]

### Added
- Transactional password security layer (4-digit PIN)
- Enhanced user profile optimization
- Push notification token management

### Changed
- User profile endpoint now returns optimized response
- Email verification state management improvements

### Fixed
- Onboarding state update issues
- Database connection error logging

## [2026-01-07]

### Added
- PIX Cronos transaction endpoints
- SQS worker for asynchronous processing
- Transaction confirmation workflow

### Changed
- Improved error code standardization
- Enhanced authentication flow

## Format

Changes are grouped by type:

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
