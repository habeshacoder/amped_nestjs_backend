import { ConfigService } from '@nestjs/config';
import { createPinoHttpConfig } from './pino-logger.config';
import { IncomingMessage, ServerResponse } from 'http';

describe('createPinoHttpConfig', () => {
  let mockConfigService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    };
  });

  it('should use silent log level in test environment', () => {
    mockConfigService.get = jest.fn().mockReturnValue('test');
    const config = createPinoHttpConfig(mockConfigService as ConfigService);
    expect(config.pinoHttp.level).toBe('silent');
    expect(config.pinoHttp.transport).toBeUndefined();
  });

  it('should use info log level in production environment without pino-pretty', () => {
    mockConfigService.get = jest.fn().mockReturnValue('production');
    const config = createPinoHttpConfig(mockConfigService as ConfigService);
    expect(config.pinoHttp.level).toBe('info');
    expect(config.pinoHttp.transport).toBeUndefined();
  });

  it('should use debug log level and pino-pretty in development environment', () => {
    mockConfigService.get = jest.fn().mockReturnValue('development');
    const config = createPinoHttpConfig(mockConfigService as ConfigService);
    expect(config.pinoHttp.level).toBe('debug');
    expect(config.pinoHttp.transport).toBeDefined();
  });

  it('should preserve incoming x-request-id header and set it on the response', () => {
    const config = createPinoHttpConfig(mockConfigService as ConfigService);
    const req = {
      headers: { 'x-request-id': 'client-correlation-id-abc' },
    } as unknown as IncomingMessage;
    const res = {
      setHeader: jest.fn(),
    } as unknown as ServerResponse;

    const id = (config.pinoHttp.genReqId as any)(req, res);

    expect(id).toBe('client-correlation-id-abc');
    expect(res.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      'client-correlation-id-abc',
    );
  });

  it('should generate a random UUID and set it on the response if x-request-id header is absent', () => {
    const config = createPinoHttpConfig(mockConfigService as ConfigService);
    const req = {
      headers: {},
    } as unknown as IncomingMessage;
    const res = {
      setHeader: jest.fn(),
    } as unknown as ServerResponse;

    const id = (config.pinoHttp.genReqId as any)(req, res);

    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', id);
  });

  it('should extract requestId into customProps for log entry correlation', () => {
    const config = createPinoHttpConfig(mockConfigService as ConfigService);
    const req = { id: 'req-456' } as unknown as IncomingMessage;

    const props = (config.pinoHttp.customProps as any)(req);

    expect(props).toEqual({ requestId: 'req-456' });
  });

  it('should configure redaction paths for sensitive headers and body fields', () => {
    const config = createPinoHttpConfig(mockConfigService as ConfigService);
    expect(config.pinoHttp.redact).toEqual({
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.token',
        'res.headers["set-cookie"]',
      ],
      censor: '***REDACTED***',
    });
  });
});
