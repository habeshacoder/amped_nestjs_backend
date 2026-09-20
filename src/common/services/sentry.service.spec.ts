import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SentryService } from './sentry.service';
import * as Sentry from '@sentry/node';

jest.mock('@sentry/node');

describe('SentryService', () => {
  let service: SentryService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SentryService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<SentryService>(SentryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should remain uninitialized when SENTRY_DSN is absent', () => {
    configService.get.mockReturnValue(undefined);

    const initialized = service.init();

    expect(initialized).toBe(false);
    expect(service.initialized).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('should initialize Sentry when SENTRY_DSN is provided', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'SENTRY_DSN') return 'https://test@sentry.io/123';
      if (key === 'NODE_ENV') return 'production';
      return undefined;
    });

    const initialized = service.init();

    expect(initialized).toBe(true);
    expect(service.initialized).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
      }),
    );
  });

  it('should not throw on captureException if not initialized', () => {
    configService.get.mockReturnValue(undefined);
    service.init();

    expect(() => service.captureException(new Error('fail'))).not.toThrow();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('should capture exception via Sentry when initialized', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'SENTRY_DSN') return 'https://test@sentry.io/123';
      return 'test';
    });
    service.init();

    const mockScope = { setExtras: jest.fn() };
    (Sentry.withScope as jest.Mock).mockImplementation((cb) => cb(mockScope));

    const error = new Error('Database crash');
    service.captureException(error, { userId: 42 });

    expect(Sentry.withScope).toHaveBeenCalled();
    expect(mockScope.setExtras).toHaveBeenCalledWith({ userId: 42 });
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});
