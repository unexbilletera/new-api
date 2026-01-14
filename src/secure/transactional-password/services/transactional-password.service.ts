import { Injectable, BadRequestException } from '@nestjs/common';
import { TransactionalPasswordModel } from '../models/transactional-password.model';
import { PasswordHelper } from '../../../shared/security/password.helper';
import { ErrorHelper, ErrorCodes, SuccessCodes } from '../../../shared/errors/app-error';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class TransactionalPasswordService {
  constructor(
    private readonly model: TransactionalPasswordModel,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Create new transactional password
   */
  async createPassword(
    userId: string,
    password: string,
  ): Promise<{ message: string; code: string }> {
    try {
      // Check if user already has a transactional password
      const hasPassword = await this.model.hasPassword(userId);
      if (hasPassword) {
        this.logger.warn(
          `User attempted to create transactional password but one already exists - userId: ${userId}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONAL_PASSWORD_ALREADY_EXISTS,
        );
      }

      // Hash the password
      const hashedPassword = await PasswordHelper.hash(password);

      // Save to database
      await this.model.create(userId, hashedPassword);

      this.logger.success(
        `User created transactional password - userId: ${userId}`,
      );

      return {
        message: SuccessCodes.TRANSACTIONAL_PASSWORD_CREATED,
        code: SuccessCodes.TRANSACTIONAL_PASSWORD_CREATED,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Failed to create transactional password - userId: ${userId}`, error as Error);
      throw ErrorHelper.internalServerError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Validate transactional password
   */
  async validatePassword(userId: string, password: string): Promise<boolean> {
    try {
      const hashedPassword = await this.model.findByUserId(userId);

      if (!hashedPassword) {
        this.logger.warn(
          `Transactional password validation failed: password not found - userId: ${userId}`,
        );
        return false;
      }

      const isValid = await PasswordHelper.compare(password, hashedPassword);

      if (!isValid) {
        this.logger.warn(
          `Transactional password validation failed: incorrect password - userId: ${userId}`,
        );
      } else {
        this.logger.success(
          `Transactional password validated successfully - userId: ${userId}`,
        );
      }

      return isValid;
    } catch (error) {
      this.logger.error(
        `Error validating transactional password - userId: ${userId}`,
        error as Error,
      );
      return false;
    }
  }

  /**
   * Check if user has transactional password
   */
  async hasPassword(userId: string): Promise<boolean> {
    try {
      return await this.model.hasPassword(userId);
    } catch (error) {
      this.logger.error(
        `Error checking transactional password - userId: ${userId}`,
        error as Error,
      );
      return false;
    }
  }

  /**
   * Update transactional password
   */
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string; code: string }> {
    try {
      // Validate current password
      const isCurrentValid = await this.validatePassword(userId, currentPassword);
      if (!isCurrentValid) {
        this.logger.warn(
          `User attempted to update transactional password with incorrect current password - userId: ${userId}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONAL_PASSWORD_INCORRECT,
        );
      }

      // Check if new password is same as current
      if (currentPassword === newPassword) {
        this.logger.warn(
          `User attempted to update transactional password with same value - userId: ${userId}`,
        );
        throw ErrorHelper.badRequest(
          ErrorCodes.TRANSACTIONAL_PASSWORD_SAME_AS_CURRENT,
        );
      }

      // Hash and save new password
      const hashedPassword = await PasswordHelper.hash(newPassword);
      await this.model.update(userId, hashedPassword);

      this.logger.success(
        `User updated transactional password - userId: ${userId}`,
      );

      return {
        message: SuccessCodes.TRANSACTIONAL_PASSWORD_UPDATED,
        code: SuccessCodes.TRANSACTIONAL_PASSWORD_UPDATED,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to update transactional password - userId: ${userId}`,
        error as Error,
      );

      throw ErrorHelper.internalServerError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get transactional password status
   */
  async getStatus(
    userId: string,
  ): Promise<{ created: boolean; createdAt?: Date }> {
    try {
      const hasPassword = await this.model.hasPassword(userId);

      return {
        created: hasPassword,
      };
    } catch (error) {
      this.logger.error(
        `Error getting transactional password status - userId: ${userId}`,
        error as Error,
      );
      throw ErrorHelper.internalServerError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
