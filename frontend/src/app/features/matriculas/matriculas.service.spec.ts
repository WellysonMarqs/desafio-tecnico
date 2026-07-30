import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { apiErrorInterceptor, ApiRequestError } from '../../core/api/api-error.interceptor';
import { MatriculasService } from './matriculas.service';
import { Matricula } from './matricula.model';

describe('MatriculasService', () => {
  let service: MatriculasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(MatriculasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve consultar matriculas por aluno', () => {
    const response: Matricula[] = [{ id: 1, alunoId: 10, turmaId: 20, status: 'PENDENTE' }];

    service.listByAluno(10).subscribe(result => {
      expect(result).toEqual(response);
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/alunos/10/matriculas`);
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('deve normalizar erro de regra de negocio ao confirmar matricula', () => {
    let receivedError: unknown;

    service.confirm(99).subscribe({
      next: () => fail('A requisicao deveria falhar'),
      error: error => {
        receivedError = error;
      }
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/matriculas/99/confirmacao`);
    expect(request.request.method).toBe('POST');
    request.flush(
      {
        status: 409,
        code: 'TURMA_SEM_VAGAS',
        message: 'Nao ha vagas disponiveis para a turma informada.'
      },
      { status: 409, statusText: 'Conflict' }
    );

    expect(receivedError instanceof ApiRequestError).toBeTrue();
    expect((receivedError as ApiRequestError).code).toBe('TURMA_SEM_VAGAS');
    expect((receivedError as ApiRequestError).message).toBe('Nao ha vagas disponiveis para a turma informada.');
  });
});
