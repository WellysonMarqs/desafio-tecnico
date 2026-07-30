import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Curso, CursoPayload } from './curso.model';

@Injectable({ providedIn: 'root' })
export class CursosService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiBaseUrl}/cursos`;

  list(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.resourceUrl);
  }

  create(payload: CursoPayload): Observable<Curso> {
    return this.http.post<Curso>(this.resourceUrl, payload);
  }

  update(id: number, payload: CursoPayload): Observable<Curso> {
    return this.http.put<Curso>(`${this.resourceUrl}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }
}
