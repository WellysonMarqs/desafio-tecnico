import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Matricula, MatriculaPayload } from './matricula.model';

@Injectable({ providedIn: 'root' })
export class MatriculasService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiBaseUrl}/matriculas`;
  private readonly alunosUrl = `${environment.apiBaseUrl}/alunos`;
  private readonly turmasUrl = `${environment.apiBaseUrl}/turmas`;

  create(payload: MatriculaPayload): Observable<Matricula> {
    return this.http.post<Matricula>(this.resourceUrl, payload);
  }

  confirm(id: number): Observable<Matricula> {
    return this.http.post<Matricula>(`${this.resourceUrl}/${id}/confirmacao`, {});
  }

  cancel(id: number): Observable<Matricula> {
    return this.http.post<Matricula>(`${this.resourceUrl}/${id}/cancelamento`, {});
  }

  listByAluno(alunoId: number): Observable<Matricula[]> {
    return this.http.get<Matricula[]>(`${this.alunosUrl}/${alunoId}/matriculas`);
  }

  listByTurma(turmaId: number): Observable<Matricula[]> {
    return this.http.get<Matricula[]>(`${this.turmasUrl}/${turmaId}/matriculas`);
  }
}
