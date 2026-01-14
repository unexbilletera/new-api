/**
 * Onboarding status enum
 */
export enum OnboardingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
}

/**
 * Account status enum
 */
export enum AccountStatus {
  ENABLE = 'enable',
  DISABLE = 'disable',
}

/**
 * Identity status enum
 */
export enum IdentityStatus {
  ENABLE = 'enable',
  DISABLE = 'disable',
  PENDING = 'pending',
}

/**
 * Generic entity status enum
 */
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

/**
 * Verification status enum
 */
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired',
}
