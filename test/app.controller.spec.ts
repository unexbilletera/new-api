import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app/services/app.service';
import { AppGreetingResponseDto } from '../src/app/dto/response';

describe('AppController', () => {
  let controller: AppController;
  let service: jest.Mocked<AppService>;

  beforeEach(async () => {
    service = {
      getHello: jest.fn(),
    } as unknown as jest.Mocked<AppService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: service }],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('getHello', () => {
    it('should delegate to service', () => {
      const response: AppGreetingResponseDto = { message: 'Hello World!' };
      service.getHello.mockReturnValue(response);

      expect(controller.getHello()).toEqual(response);
      expect(service.getHello).toHaveBeenCalled();
    });

    it('should return the service response', () => {
      const response: AppGreetingResponseDto = { message: 'Application is running' };
      service.getHello.mockReturnValue(response);

      const result = controller.getHello();

      expect(result).toEqual(response);
      expect(result.message).toEqual('Application is running');
    });
  });
});
