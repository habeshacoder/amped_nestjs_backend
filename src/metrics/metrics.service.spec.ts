import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return valid content type', () => {
    expect(service.getContentType()).toContain('text/plain');
  });

  it('should record request metrics and return output containing custom metrics', async () => {
    service.recordRequest('POST', '/auth/signin', '200', 0.125);
    const metrics = await service.getMetrics();

    expect(metrics).toContain('http_requests_total');
    expect(metrics).toContain('method="POST"');
    expect(metrics).toContain('route="/auth/signin"');
    expect(metrics).toContain('status_code="200"');
    expect(metrics).toContain('http_request_duration_seconds');
  });
});
