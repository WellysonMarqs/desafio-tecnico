import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Curso } from '../cursos/curso.model';
import { CursosService } from '../cursos/cursos.service';
import { Disciplina } from './disciplina.model';
import { DisciplinasService } from './disciplinas.service';

@Component({
  selector: 'app-disciplinas-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Disciplinas"
        description="Listagem da matriz curricular com ligacao clara entre disciplina e curso."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="overview-grid" aria-label="Indicadores de disciplinas">
        <article class="overview-card">
          <span class="overview-label">Total de disciplinas</span>
          <strong>{{ disciplinas().length }}</strong>
          <p>Itens da base curricular cadastrados no sistema.</p>
        </article>
        <article class="overview-card">
          <span class="overview-label">Cursos vinculados</span>
          <strong>{{ cursos().length }}</strong>
          <p>Base de apoio usada para relacionamento.</p>
        </article>
      </section>

      <section class="card" aria-labelledby="disciplinas-list-title">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Matriz curricular</p>
            <h3 id="disciplinas-list-title">Listagem de disciplinas</h3>
          </div>
          <div class="section-actions">
            <button type="button" class="ghost-button" (click)="reloadAll()" [disabled]="loading()">Recarregar</button>
            <a class="secondary-button" routerLink="/disciplinas/cadastro">Nova disciplina</a>
          </div>
        </div>

        @if (loading()) {
          <app-page-state title="Carregando disciplinas" description="Buscando disciplinas e cursos de apoio na API." />
        } @else if (hasLoadError()) {
          <app-page-state
            title="Falha ao carregar disciplinas"
            [description]="errorMessage() || 'Verifique a disponibilidade da API e tente novamente.'"
            tone="error"
            actionLabel="Tentar novamente"
            [action]="reloadAll"
          />
        } @else if (!disciplinas().length) {
          <app-page-state
            title="Nenhuma disciplina cadastrada"
            description="Cadastre a primeira disciplina para formar a base curricular."
            actionLabel="Abrir cadastro"
            [action]="openCreatePage"
          />
        } @else {
          <div class="table-wrapper">
            <table>
              <caption class="sr-only">Tabela de disciplinas cadastradas</caption>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Codigo</th>
                  <th>Curso</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                @for (disciplina of disciplinasComCurso(); track disciplina.id) {
                  <tr>
                    <td>{{ disciplina.nome }}</td>
                    <td>{{ disciplina.codigo }}</td>
                    <td>{{ disciplina.cursoNome }}</td>
                    <td class="actions-cell">
                      <a class="ghost-button" [routerLink]="['/disciplinas', disciplina.id]">Detalhes</a>
                      <a class="ghost-button" [routerLink]="['/disciplinas/cadastro', disciplina.id]">Editar</a>
                      <button type="button" class="danger-button" (click)="remove(disciplina)" [disabled]="saving()">Excluir</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </section>
  `
})
export class DisciplinasPageComponent {
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly cursosService = inject(CursosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly disciplinas = signal<Disciplina[]>([]);
  readonly cursos = signal<Curso[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly hasLoadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal(typeof history.state?.successMessage === 'string' ? history.state.successMessage : '');

  readonly disciplinasComCurso = computed(() =>
    this.disciplinas().map(disciplina => ({
      ...disciplina,
      cursoNome: this.cursos().find(curso => curso.id === disciplina.cursoId)?.nome ?? `Curso #${disciplina.cursoId}`
    }))
  );

  constructor() {
    this.reloadAll();
  }

  readonly openCreatePage = (): void => {
    void this.router.navigate(['/disciplinas/cadastro']);
  };

  reloadAll = (): void => {
    this.loadCursos();
    this.loadDisciplinas();
  };

  private loadCursos(): void {
    this.cursosService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: cursos => this.cursos.set(cursos),
        error: error => {
          this.hasLoadError.set(true);
          this.errorMessage.set(this.describeError(error));
        }
      });
  }

  private loadDisciplinas(): void {
    this.loading.set(true);
    this.hasLoadError.set(false);
    this.errorMessage.set('');

    this.disciplinasService
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: disciplinas => {
          this.disciplinas.set(disciplinas);
          this.hasLoadError.set(false);
        },
        error: error => {
          this.hasLoadError.set(true);
          this.errorMessage.set(this.describeError(error));
        }
      });
  }

  remove(disciplina: Disciplina): void {
    const confirmed = window.confirm(`Deseja remover a disciplina ${disciplina.nome}?`);
    if (!confirmed) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');
    this.saving.set(true);

    this.disciplinasService
      .remove(disciplina.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Disciplina removida com sucesso.');
          this.loadDisciplinas();
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  private describeError(error: unknown): string {
    if (error instanceof ApiRequestError) {
      return error.message;
    }

    return 'Nao foi possivel concluir a operacao com disciplinas.';
  }
}
