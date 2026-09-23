import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime();

    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const durationInSeconds = seconds + nanoseconds / 1e9;
      const route = req.route?.path || req.baseUrl || req.path || 'unknown';
      const statusCode = res.statusCode ? res.statusCode.toString() : '200';
      const method = req.method;

      this.metricsService.recordRequest(
        method,
        route,
        statusCode,
        durationInSeconds,
      );
    });

    next();
  }
}
