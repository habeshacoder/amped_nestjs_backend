import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { Response } from 'express';

describe('MetricsController', () => {
  let controller: MetricsController;
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [MetricsService],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    service = module.get<MetricsService>(MetricsService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return Prometheus-formatted text and 200 status', async () => {
      // Record a test request to populate custom metrics
      service.recordRequest('GET', '/test', '200', 0.042);

      const mockSend = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ send: mockSend });
      const mockSetHeader = jest.fn();

      const res = {
        setHeader: mockSetHeader,
        status: mockStatus,
      } as unknown as Response;

      await controller.getMetrics(res);

      expect(mockSetHeader).toHaveBeenCalledWith(
        'Content-Type',
        expect.stringContaining('text/plain'),
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockSend).toHaveBeenCalledWith(
        expect.stringContaining('# HELP http_requests_total'),
      );
      expect(mockSend).toHaveBeenCalledWith(
        expect.stringContaining(
          'http_requests_total{method="GET",route="/test",status_code="200"} 1',
        ),
      );
      expect(mockSend).toHaveBeenCalledWith(
        expect.stringContaining('# HELP http_request_duration_seconds'),
      );
    });
  });
});
