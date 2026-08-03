import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Turma, TurmaPayload } from './turma.model';

@Injectable({ providedIn: 'root' })
export class TurmasService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiBaseUrl}/turmas`;

  list(): Observable<Turma[]> {
    return this.http.get<Turma[]>(this.resourceUrl);
  }

  getById(id: number): Observable<Turma> {
    return this.http.get<Turma>(`${this.resourceUrl}/${id}`);
  }

  create(payload: TurmaPayload): Observable<Turma> {
    return this.http.post<Turma>(this.resourceUrl, payload);
  }

  update(id: number, payload: TurmaPayload): Observable<Turma> {
    return this.http.put<Turma>(`${this.resourceUrl}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }
}
