import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  code?: string;
  message?: string;
  path?: string;
  correlationId?: string;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId?: string;

  constructor(payload: ApiErrorResponse, fallbackMessage: string) {
    super(payload.message ?? fallbackMessage);
    this.name = 'ApiRequestError';
    this.status = payload.status ?? 0;
    this.code = payload.code ?? 'ERRO_DESCONHECIDO';
    this.correlationId = payload.correlationId;
  }
}

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const payload = (error.error as ApiErrorResponse | null) ?? null;
      const normalizedError = new ApiRequestError(
        payload ?? { status: error.status, message: error.message },
        'Nao foi possivel concluir a requisicao.'
      );

      return throwError(() => normalizedError);
    })
  );
