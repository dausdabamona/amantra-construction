import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers, body, query, params } = request;
    const userEmail = request.user?.email || 'anonymous';

    const startTime = Date.now();
    const message = `[${method}] ${url} - User: ${userEmail}`;

    this.loggerService.log(
      `${message} - Started`,
      'LoggingInterceptor',
    );

    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const duration = Date.now() - startTime;
        
        this.loggerService.log(
          `${message} - Completed (${response.statusCode}) in ${duration}ms`,
          'LoggingInterceptor',
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        this.loggerService.error(
          `${message} - Failed (${error.status || 500}) in ${duration}ms - ${error.message}`,
          error.stack,
          'LoggingInterceptor',
        );
        
        throw error;
      }),
    );
  }
}
