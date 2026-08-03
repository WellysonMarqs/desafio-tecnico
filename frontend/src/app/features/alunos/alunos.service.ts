import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Aluno, AlunoPayload } from './aluno.model';

@Injectable({ providedIn: 'root' })
export class AlunosService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiBaseUrl}/alunos`;

  list(): Observable<Aluno[]> {
    return this.http.get<Aluno[]>(this.resourceUrl);
  }

  getById(id: number): Observable<Aluno> {
    return this.http.get<Aluno>(`${this.resourceUrl}/${id}`);
  }

  create(payload: AlunoPayload): Observable<Aluno> {
    return this.http.post<Aluno>(this.resourceUrl, payload);
  }

  update(id: number, payload: AlunoPayload): Observable<Aluno> {
    return this.http.put<Aluno>(`${this.resourceUrl}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }
}
