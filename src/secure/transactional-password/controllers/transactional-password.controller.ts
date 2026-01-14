import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { TransactionalPasswordService } from '../services/transactional-password.service';
import {
  CreateTransactionalPasswordDto,
  ValidateTransactionalPasswordDto,
  UpdateTransactionalPasswordDto,
} from '../dto';
import { LoggerService } from '../../../shared/logger/logger.service';

interface CurrentUserPayload {
  userId: string;
  email: string;
  roleId: string;
}

@ApiTags('2.3 Secure - Transactional Password')
@Controller('transactional-password')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionalPasswordController {
  constructor(
    private readonly transactionalPasswordService: TransactionalPasswordService,
    private readonly logger: LoggerService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create transactional password',
    description:
      'Create a new 4-digit transactional password for the authenticated user. The password must be exactly 4 digits.',
  })
  @ApiBody({
    type: CreateTransactionalPasswordDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Transactional password created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid request or transactional password already exists for this user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTransactionalPasswordDto,
  ) {
    this.logger.info(
      `User creating transactional password - userId: ${user.userId}`,
      'TransactionalPasswordController.create',
    );

    return await this.transactionalPasswordService.createPassword(
      user.userId,
      dto.password,
    );
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate transactional password',
    description:
      'Validate the provided transactional password against the stored hash.',
  })
  @ApiBody({
    type: ValidateTransactionalPasswordDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Transactional password validated successfully',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        message: { type: 'string' },
        code: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transactional password or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  async validate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ValidateTransactionalPasswordDto,
  ) {
    this.logger.info(
      `User validating transactional password - userId: ${user.userId}`,
      'TransactionalPasswordController.validate',
    );

    const isValid = await this.transactionalPasswordService.validatePassword(
      user.userId,
      dto.password,
    );

    if (!isValid) {
      this.logger.warn(
        `Transactional password validation failed - userId: ${user.userId}`,
        'TransactionalPasswordController.validate',
      );
    }

    return {
      valid: isValid,
      message: isValid
        ? '200 transactionalPassword.success.validated'
        : '400 transactionalPassword.errors.incorrectPassword',
      code: isValid
        ? '200 transactionalPassword.success.validated'
        : '400 transactionalPassword.errors.incorrectPassword',
    };
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get transactional password status',
    description:
      'Check if the authenticated user has a transactional password configured.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactional password status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        created: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        message: { type: 'string' },
        code: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  async getStatus(@CurrentUser() user: CurrentUserPayload) {
    this.logger.info(
      `User checking transactional password status - userId: ${user.userId}`,
      'TransactionalPasswordController.getStatus',
    );

    const status = await this.transactionalPasswordService.getStatus(
      user.userId,
    );

    return {
      ...status,
      message: '200 server.success.dataRetrieved',
      code: '200 server.success.dataRetrieved',
    };
  }

  @Put('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update transactional password',
    description:
      'Update the transactional password. Requires the current password for verification.',
  })
  @ApiBody({
    type: UpdateTransactionalPasswordDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Transactional password updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or incorrect current password',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateTransactionalPasswordDto,
  ) {
    this.logger.info(
      `User updating transactional password - userId: ${user.userId}`,
      'TransactionalPasswordController.update',
    );

    return await this.transactionalPasswordService.updatePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
