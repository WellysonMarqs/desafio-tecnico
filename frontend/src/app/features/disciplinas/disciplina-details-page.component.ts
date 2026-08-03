import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  selector: 'app-disciplina-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Detalhes da disciplina"
        description="Consulta individual da disciplina com o curso vinculado para revisao rapida do contexto."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="details-layout">
        <section class="card details-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Matriz curricular</p>
              <h3>{{ disciplina()?.nome || 'Disciplina' }}</h3>
            </div>
            <div class="section-actions">
              <a class="ghost-button" routerLink="/disciplinas">Voltar para listagem</a>
              @if (disciplina()) {
                <a class="secondary-button" [routerLink]="['/disciplinas/cadastro', disciplina()!.id]">Editar cadastro</a>
              }
            </div>
          </div>

          @if (loading()) {
            <app-page-state title="Carregando detalhes" description="Buscando disciplina e curso vinculado." />
          } @else if (loadError()) {
            <app-page-state
              title="Falha ao carregar disciplina"
              [description]="errorMessage() || 'Nao foi possivel obter os detalhes da disciplina.'"
              tone="error"
              actionLabel="Tentar novamente"
              [action]="reload"
            />
          } @else if (disciplina()) {
            <div class="details-grid">
              <article class="detail-item">
                <span>Nome</span>
                <strong>{{ disciplina()!.nome }}</strong>
              </article>
              <article class="detail-item">
                <span>Codigo</span>
                <strong>{{ disciplina()!.codigo }}</strong>
              </article>
              <article class="detail-item">
                <span>Curso vinculado</span>
                <strong>{{ cursoNome() }}</strong>
              </article>
              <article class="detail-item">
                <span>Identificador</span>
                <strong>#{{ disciplina()!.id }}</strong>
              </article>
            </div>
          }
        </section>
      </section>
    </section>
  `
})
export class DisciplinaDetailsPageComponent {
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly cursosService = inject(CursosService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly disciplina = signal<Disciplina | null>(null);
  readonly cursos = signal<Curso[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal(typeof history.state?.successMessage === 'string' ? history.state.successMessage : '');

  readonly cursoNome = computed(() => {
    const disciplina = this.disciplina();
    if (!disciplina) {
      return '-';
    }

    return this.cursos().find(curso => curso.id === disciplina.cursoId)?.nome ?? `Curso #${disciplina.cursoId}`;
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(paramMap => {
      const id = Number(paramMap.get('id'));
      if (Number.isFinite(id) && id > 0) {
        this.fetchData(id);
      }
    });
  }

  readonly reload = (): void => {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(id) && id > 0) {
      this.fetchData(id);
    }
  };

  private fetchData(id: number): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.errorMessage.set('');

    this.cursosService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: cursos => this.cursos.set(cursos),
        error: error => {
          this.loadError.set(true);
          this.errorMessage.set(this.describeError(error));
        }
      });

    this.disciplinasService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: disciplina => this.disciplina.set(disciplina),
        error: error => {
          this.loadError.set(true);
          this.errorMessage.set(this.describeError(error));
        }
      });
  }

  private describeError(error: unknown): string {
    if (error instanceof ApiRequestError) {
      return error.message;
    }

    return 'Nao foi possivel carregar os detalhes da disciplina.';
  }
}
