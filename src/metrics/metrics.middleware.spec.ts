import { MetricsMiddleware } from './metrics.middleware';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

describe('MetricsMiddleware', () => {
  let middleware: MetricsMiddleware;
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
    jest.spyOn(service, 'recordRequest');
    middleware = new MetricsMiddleware(service);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should register a finish listener and record metrics on response finish', () => {
    let finishCallback: () => void = jest.fn();

    const mockReq = {
      method: 'GET',
      route: { path: '/health' },
    } as unknown as Request;

    const mockRes = {
      statusCode: 200,
      on: jest.fn((event: string, cb: () => void) => {
        if (event === 'finish') {
          finishCallback = cb;
        }
      }),
    } as unknown as Response;

    const next = jest.fn();

    middleware.use(mockReq, mockRes, next);

    expect(next).toHaveBeenCalled();
    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));

    // Simulate response finish
    finishCallback();

    expect(service.recordRequest).toHaveBeenCalledWith(
      'GET',
      '/health',
      '200',
      expect.any(Number),
    );
  });
});
