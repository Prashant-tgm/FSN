import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'An unexpected error occurred';

    // ── NestJS HttpException ───────────────────────────────────────────────
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;
        title = res.error || exception.message;
        // Handle ValidationPipe errors (array of messages)
        detail = Array.isArray(res.message)
          ? res.message.join('; ')
          : res.message || exception.message;
      } else {
        title = exception.message;
        detail = String(exceptionResponse);
      }
    }

    // ── Prisma Known Errors ────────────────────────────────────────────────
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        title = 'Conflict';
        const field = (exception.meta?.target as string[])?.join(', ') || 'field';
        detail = `A record with this ${field} already exists`;
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        title = 'Not Found';
        detail = 'The requested record does not exist';
      } else {
        this.logger.error(`Prisma error ${exception.code}`, exception.stack);
      }
    }

    // ── Unknown Errors ─────────────────────────────────────────────────────
    else {
      this.logger.error(
        `Unhandled exception: ${(exception as Error)?.message}`,
        (exception as Error)?.stack,
      );
    }

    // ── RFC 7807 Problem Details response ─────────────────────────────────
    response.status(status).json({
      status,
      title,
      detail,
      instance: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
