import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserModel } from '../models/user.model';
import { ValidaService } from '../../../shared/valida/valida.service';
import { AppConfigService } from '../../../shared/config/config.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { LivenessCheckDto } from '../dto/user-profile.dto';
import { LivenessCheckResponseDto } from '../dto/response';

@Injectable()
export class LivenessService {
  constructor(
    private userModel: UserModel,
    private validaService: ValidaService,
    private appConfigService: AppConfigService,
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  async livenessCheck(userId: string, dto: LivenessCheckDto): Promise<LivenessCheckResponseDto> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('users.errors.userNotFound');
    }

    const validaEnabled = this.appConfigService.isValidaEnabled();

    if (!validaEnabled) {
      if (!dto.image) {
        throw new Error('users.errors.imageRequired');
      }

      await this.userModel.updateLivenessSimple(userId, dto.image);

      return {
        data: {
          text: '',
          url: '',
        },
        next: 'verifySuccess',
      };
    }

    const result: {
      data: {
        text: string;
        url: string;
      };
      next: string | null;
    } = {
      data: {
        text: '',
        url: '',
      },
      next: null,
    };

    if (user.status === 'pending' || !user.livenessVerifiedAt) {
      try {
        if (!user.validaId) {
          let validaEnrollment;
          try {
            validaEnrollment = await this.validaService.createEnrollment({
              refId: user.number || user.id,
              enrollmentFlow: 'l',
              baseUrl: this.configService.get<string>('APP_BASE_URL'),
              apiPath: '/api',
            });
          } catch (error) {
            this.logger.warn('[VALIDA] Failed to create enrollment, trying to get status', {
              error: (error as Error).message,
            });
            validaEnrollment = await this.validaService.getEnrollmentStatus({
              refId: user.number || user.id,
            });
          }

          if (validaEnrollment && validaEnrollment.url) {
            const parts = validaEnrollment.url.split('/').filter(Boolean);
            const validaId = parts[parts.length - 1];

            const notes = (user.notes || '') +
              `${new Date().toISOString()} - VALIDA ENROLLMENT CREATED validaId: ${validaId}\n`;

            await this.userModel.updateWithValidaEnrollment(userId, validaId, notes);

            result.next = 'verifyValida';
            result.data.url = validaEnrollment.url;
          } else {
            this.logger.warn('[VALIDA] Enrollment response missing URL', {
              userId: user.id,
              userNumber: user.number,
              enrollmentResponse: validaEnrollment,
            });
          }
        } else if (user.validaId) {
          const validaEnrollment = await this.validaService.getEnrollmentInfo({
            refId: user.number || user.id,
          });

          if (
            validaEnrollment &&
            validaEnrollment.enrollment &&
            validaEnrollment.enrollment.status === 'success'
          ) {
            const livenessVerifiedAt = new Date();
            let livenessImage: string | null = null;

            if (validaEnrollment.images && validaEnrollment.images.selfie) {
              livenessImage = validaEnrollment.images.selfie;
            }

            const notes = (user.notes || '') +
              `${new Date().toISOString()} - VALIDA ENROLLMENT VERIFIED validaId: ${user.validaId}\n`;

            const currentOnboardingState = (user.onboardingState as any) || {
              completedSteps: [],
              needsCorrection: [],
            };

            if (!Array.isArray(currentOnboardingState.completedSteps)) {
              currentOnboardingState.completedSteps = [];
            }

            if (!currentOnboardingState.completedSteps.includes('1.11')) {
              currentOnboardingState.completedSteps.push('1.11');
            }
            if (!currentOnboardingState.completedSteps.includes('1.12')) {
              currentOnboardingState.completedSteps.push('1.12');
            }

            await this.userModel.updateWithValidaVerification(userId, livenessImage, notes, currentOnboardingState);

            result.next = 'verifySuccess';
          } else if (
            validaEnrollment.enrollment &&
            ['failed', 'system-error'].includes(validaEnrollment.enrollment.status || '')
          ) {
            const notes = (user.notes || '') +
              `${new Date().toISOString()} - VALIDA ENROLLMENT ERROR validaId: ${user.validaId}\n`;

            await this.userModel.updateValidaStatus(userId, 'error', notes);

            result.next = 'verifyWarning';
            result.data.text = 'Hubo un problema para iniciar el proceso para tu identidad.';
          } else if (
            validaEnrollment.enrollment &&
            ['new', 'incomplete', 'funnel-end', 'funnel_end'].includes(
              validaEnrollment.enrollment.status || ''
            )
          ) {
            const notes = (user.notes || '') +
              `${new Date().toISOString()} - VALIDA ENROLLMENT PROCESS validaId: ${user.validaId}\n`;

            await this.userModel.updateValidaNotes(userId, notes);

            const validaConfig = this.appConfigService.getValidaConfig();
            result.next = 'verifyValida';
            result.data.url = `${validaConfig.apiUrl}/../e/${user.validaId}`;
          } else if (
            validaEnrollment.enrollment &&
            validaEnrollment.enrollment.status === 'void'
          ) {
            const notes = (user.notes || '') +
              `${new Date().toISOString()} - VALIDA ENROLLMENT CANCELED validaId: ${user.validaId}\n`;

            const newEnrollment = await this.validaService.createEnrollment({
              refId: user.number || user.id,
              enrollmentFlow: 'l',
              baseUrl: this.configService.get<string>('APP_BASE_URL'),
              apiPath: '/api',
            });

            if (newEnrollment && newEnrollment.url) {
              const parts = newEnrollment.url.split('/').filter(Boolean);
              const newValidaId = parts[parts.length - 1];

              await this.userModel.updateValidaId(
                userId,
                newValidaId,
                notes + `${new Date().toISOString()} - VALIDA ENROLLMENT CREATED validaId: ${newValidaId}\n`,
              );

              result.next = 'verifyValida';
              result.data.url = newEnrollment.url;
            }
          }
        }
      } catch (error) {
        this.logger.error('[VALIDA] Error in liveness check', error);
        if (dto.image) {
          await this.userModel.updateLivenessSimple(userId, dto.image);

          return {
            data: {
              text: '',
              url: '',
            },
            next: 'verifySuccess',
          };
        }
        throw error;
      }
    }

    return result;
  }
}
