import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Disciplina, DisciplinaPayload } from './disciplina.model';

@Injectable({ providedIn: 'root' })
export class DisciplinasService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiBaseUrl}/disciplinas`;

  list(): Observable<Disciplina[]> {
    return this.http.get<Disciplina[]>(this.resourceUrl);
  }

  getById(id: number): Observable<Disciplina> {
    return this.http.get<Disciplina>(`${this.resourceUrl}/${id}`);
  }

  create(payload: DisciplinaPayload): Observable<Disciplina> {
    return this.http.post<Disciplina>(this.resourceUrl, payload);
  }

  update(id: number, payload: DisciplinaPayload): Observable<Disciplina> {
    return this.http.put<Disciplina>(`${this.resourceUrl}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }
}
