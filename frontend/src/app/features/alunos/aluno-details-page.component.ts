import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Aluno } from './aluno.model';
import { AlunosService } from './alunos.service';

@Component({
  selector: 'app-aluno-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Detalhes do aluno"
        description="Consulta individual do cadastro para apoiar revisao e navegacao a partir da listagem."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="details-layout">
        <section class="card details-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Ficha academica</p>
              <h3>{{ aluno()?.nome || 'Aluno' }}</h3>
            </div>
            <div class="section-actions">
              <a class="ghost-button" routerLink="/alunos">Voltar para listagem</a>
              @if (aluno()) {
                <a class="secondary-button" [routerLink]="['/alunos/cadastro', aluno()!.id]">Editar cadastro</a>
              }
            </div>
          </div>

          @if (loading()) {
            <app-page-state title="Carregando detalhes" description="Buscando o registro do aluno." />
          } @else if (loadError()) {
            <app-page-state
              title="Falha ao carregar aluno"
              [description]="errorMessage() || 'Nao foi possivel obter os detalhes do aluno.'"
              tone="error"
              actionLabel="Tentar novamente"
              [action]="reload"
            />
          } @else if (aluno()) {
            <div class="details-grid">
              <article class="detail-item">
                <span>Nome completo</span>
                <strong>{{ aluno()!.nome }}</strong>
              </article>
              <article class="detail-item">
                <span>E-mail</span>
                <strong>{{ aluno()!.email }}</strong>
              </article>
              <article class="detail-item">
                <span>Matricula</span>
                <strong>{{ aluno()!.matricula }}</strong>
              </article>
              <article class="detail-item">
                <span>Identificador</span>
                <strong>#{{ aluno()!.id }}</strong>
              </article>
            </div>
          }
        </section>
      </section>
    </section>
  `
})
export class AlunoDetailsPageComponent {
  private readonly alunosService = inject(AlunosService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly aluno = signal<Aluno | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal(typeof history.state?.successMessage === 'string' ? history.state.successMessage : '');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(paramMap => {
      const id = Number(paramMap.get('id'));
      if (Number.isFinite(id) && id > 0) {
        this.fetchAluno(id);
      }
    });
  }

  readonly reload = (): void => {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(id) && id > 0) {
      this.fetchAluno(id);
    }
  };

  private fetchAluno(id: number): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.errorMessage.set('');

    this.alunosService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: aluno => this.aluno.set(aluno),
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

    return 'Nao foi possivel carregar os detalhes do aluno.';
  }
}
