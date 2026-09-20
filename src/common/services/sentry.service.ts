import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.init();
  }

  init(): boolean {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    if (!dsn || dsn.trim() === '') {
      return false;
    }

    try {
      Sentry.init({
        dsn,
        environment:
          this.configService.get<string>('NODE_ENV') || 'development',
        tracesSampleRate: 1.0,
      });
      this.isInitialized = true;
      this.logger.log('Sentry error tracking initialized successfully');
      return true;
    } catch (error) {
      this.logger.warn(
        `Failed to initialize Sentry: ${(error as Error).message}`,
      );
      return false;
    }
  }

  captureException(exception: unknown, context?: Record<string, any>): void {
    if (!this.isInitialized) {
      return;
    }
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(exception);
    });
  }

  get initialized(): boolean {
    return this.isInitialized;
  }
}
