import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Curso } from './curso.model';
import { CursosService } from './cursos.service';

@Component({
  selector: 'app-curso-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Detalhes do curso"
        description="Consulta individual para revisar o cadastro do curso sem misturar manutencao com listagem."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="details-layout">
        <section class="card details-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Estrutura institucional</p>
              <h3>{{ curso()?.nome || 'Curso' }}</h3>
            </div>
            <div class="section-actions">
              <a class="ghost-button" routerLink="/cursos">Voltar para listagem</a>
              @if (curso()) {
                <a class="secondary-button" [routerLink]="['/cursos/cadastro', curso()!.id]">Editar cadastro</a>
              }
            </div>
          </div>

          @if (loading()) {
            <app-page-state title="Carregando detalhes" description="Buscando o registro do curso." />
          } @else if (loadError()) {
            <app-page-state
              title="Falha ao carregar curso"
              [description]="errorMessage() || 'Nao foi possivel obter os detalhes do curso.'"
              tone="error"
              actionLabel="Tentar novamente"
              [action]="reload"
            />
          } @else if (curso()) {
            <div class="details-grid">
              <article class="detail-item">
                <span>Nome</span>
                <strong>{{ curso()!.nome }}</strong>
              </article>
              <article class="detail-item">
                <span>Codigo</span>
                <strong>{{ curso()!.codigo }}</strong>
              </article>
              <article class="detail-item">
                <span>Identificador</span>
                <strong>#{{ curso()!.id }}</strong>
              </article>
            </div>
          }
        </section>
      </section>
    </section>
  `
})
export class CursoDetailsPageComponent {
  private readonly cursosService = inject(CursosService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly curso = signal<Curso | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal(typeof history.state?.successMessage === 'string' ? history.state.successMessage : '');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(paramMap => {
      const id = Number(paramMap.get('id'));
      if (Number.isFinite(id) && id > 0) {
        this.fetchCurso(id);
      }
    });
  }

  readonly reload = (): void => {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(id) && id > 0) {
      this.fetchCurso(id);
    }
  };

  private fetchCurso(id: number): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.errorMessage.set('');

    this.cursosService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: curso => this.curso.set(curso),
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

    return 'Nao foi possivel carregar os detalhes do curso.';
  }
}
