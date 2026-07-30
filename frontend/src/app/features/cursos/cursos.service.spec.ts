import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { apiErrorInterceptor, ApiRequestError } from '../../core/api/api-error.interceptor';
import { CursosService } from './cursos.service';

describe('CursosService', () => {
  let service: CursosService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CursosService,
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CursosService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('lista cursos a partir da API', () => {
    const response = [
      { id: 1, nome: 'ADS', codigo: 'ADS' },
      { id: 2, nome: 'SI', codigo: 'SI' }
    ];

    service.list().subscribe(cursos => {
      expect(cursos).toEqual(response);
    });

    const request = httpController.expectOne('http://localhost:8080/api/cursos');
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('normaliza erro da API ao criar curso', () => {
    const payload = { nome: 'ADS', codigo: 'ADS' };

    service.create(payload).subscribe({
      next: () => fail('Era esperado erro de API'),
      error: (error: ApiRequestError) => {
        expect(error).toEqual(
          jasmine.objectContaining({
            status: 409,
            code: 'CURSO_DUPLICADO',
            message: 'Ja existe curso com o codigo informado.'
          })
        );
      }
    });

    const request = httpController.expectOne('http://localhost:8080/api/cursos');
    expect(request.request.method).toBe('POST');
    request.flush(
      {
        status: 409,
        code: 'CURSO_DUPLICADO',
        message: 'Ja existe curso com o codigo informado.'
      },
      { status: 409, statusText: 'Conflict' }
    );
  });
});
