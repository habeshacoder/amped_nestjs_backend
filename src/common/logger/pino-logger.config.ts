import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';

export function createPinoHttpConfig(config: ConfigService) {
  const nodeEnv = config.get<string>('NODE_ENV') || 'development';
  const isProd = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  return {
    pinoHttp: {
      level: isTest ? 'silent' : isProd ? 'info' : 'debug',
      transport:
        isProd || isTest
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                colorize: true,
              },
            },
      genReqId: (req: IncomingMessage, res?: ServerResponse) => {
        const reqId = (req.headers?.['x-request-id'] as string) || randomUUID();
        if (res && typeof res.setHeader === 'function') {
          res.setHeader('x-request-id', reqId);
        }
        return reqId;
      },
      customProps: (req: IncomingMessage) => ({
        requestId: (req as any).id,
      }),
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.token',
          'res.headers["set-cookie"]',
        ],
        censor: '***REDACTED***',
      },
    },
  };
}
