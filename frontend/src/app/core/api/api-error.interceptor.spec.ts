import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';

import { ApiRequestError, apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  it('normaliza o erro padrao da API em ApiRequestError', async () => {
    const request = new HttpRequest('GET', '/api/alunos');
    const next: HttpHandlerFn = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              status: 409,
              code: 'MATRICULA_DUPLICADA',
              message: 'Aluno ja matriculado nesta turma.',
              correlationId: 'corr-123'
            }
          })
      );

    await expectAsync(firstValueFrom(apiErrorInterceptor(request, next))).toBeRejectedWith(
      jasmine.objectContaining<ApiRequestError>({
        name: 'ApiRequestError',
        status: 409,
        code: 'MATRICULA_DUPLICADA',
        correlationId: 'corr-123',
        message: 'Aluno ja matriculado nesta turma.'
      })
    );
  });
});
