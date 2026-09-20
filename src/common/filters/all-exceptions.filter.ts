import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain-exceptions';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof DomainException) {
      statusCode = exception.getStatus();
      code = exception.code;
      const res = exception.getResponse() as Record<string, any>;
      message = res.message || exception.message;
      error = exception.name;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name;
        code = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || exception.message;
        error = resObj.error || exception.name;
        code = resObj.code || resObj.error || exception.name;
      }
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P')
    ) {
      // Prisma database errors
      const prismaError = exception as { code: string; message: string };
      switch (prismaError.code) {
        case 'P2002':
          statusCode = HttpStatus.CONFLICT;
          code = 'P2002';
          error = 'Conflict';
          message = 'A record with this unique constraint already exists.';
          break;
        case 'P2003':
          statusCode = HttpStatus.BAD_REQUEST;
          code = 'P2003';
          error = 'Bad Request';
          message =
            'Foreign key constraint violated: referenced entity does not exist.';
          break;
        case 'P2025':
        case 'P2001':
          statusCode = HttpStatus.NOT_FOUND;
          code = 'P2025';
          error = 'Not Found';
          message = 'The requested database record was not found.';
          break;
        case 'P2000':
          statusCode = HttpStatus.BAD_REQUEST;
          code = 'P2000';
          error = 'Bad Request';
          message = 'Provided value exceeds maximum database field length.';
          break;
        default:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          code = 'DATABASE_ERROR';
          error = 'Internal Server Error';
          message = 'A database error occurred.';
          break;
      }
    } else if (exception instanceof Error) {
      const isProduction = process.env.NODE_ENV === 'production';
      message = isProduction ? 'Internal server error' : exception.message;
      error = exception.name;
      code = 'INTERNAL_SERVER_ERROR';
    }

    const requestId =
      (request?.headers?.['x-request-id'] as string) ||
      (request as any)?.id ||
      'unknown';
    const timestamp = new Date().toISOString();
    const path = request?.url || '';

    if (statusCode >= 500) {
      this.logger.error(
        `HTTP ${statusCode} [${request?.method || 'UNKNOWN'}] ${
          request?.url || ''
        }: ${
          exception instanceof Error ? exception.message : 'Unknown exception'
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `HTTP ${statusCode} [${request?.method || 'UNKNOWN'}] ${
          request?.url || ''
        }: ${JSON.stringify(message)}`,
      );
    }

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      error,
      path,
      timestamp,
      requestId,
    });
  }
}
