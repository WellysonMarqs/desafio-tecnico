import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Disciplina } from '../disciplinas/disciplina.model';
import { DisciplinasService } from '../disciplinas/disciplinas.service';
import { Turma } from './turma.model';
import { TurmasService } from './turmas.service';

@Component({
  selector: 'app-turma-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Detalhes da turma"
        description="Consulta individual da turma com contexto de capacidade, status e disciplina vinculada."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="details-layout">
        <section class="card details-card">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Oferta academica</p>
              <h3>{{ turma()?.codigo || 'Turma' }}</h3>
            </div>
            <div class="section-actions">
              <a class="ghost-button" routerLink="/turmas">Voltar para listagem</a>
              @if (turma()) {
                <a class="secondary-button" [routerLink]="['/turmas/cadastro', turma()!.id]">Editar cadastro</a>
              }
            </div>
          </div>

          @if (loading()) {
            <app-page-state title="Carregando detalhes" description="Buscando turma e disciplina vinculada." />
          } @else if (loadError()) {
            <app-page-state
              title="Falha ao carregar turma"
              [description]="errorMessage() || 'Nao foi possivel obter os detalhes da turma.'"
              tone="error"
              actionLabel="Tentar novamente"
              [action]="reload"
            />
          } @else if (turma()) {
            <div class="details-grid">
              <article class="detail-item">
                <span>Codigo</span>
                <strong>{{ turma()!.codigo }}</strong>
              </article>
              <article class="detail-item">
                <span>Disciplina vinculada</span>
                <strong>{{ disciplinaNome() }}</strong>
              </article>
              <article class="detail-item">
                <span>Capacidade</span>
                <strong>{{ turma()!.capacidade }}</strong>
              </article>
              <article class="detail-item">
                <span>Vagas disponiveis</span>
                <strong>{{ turma()!.vagasDisponiveis }}</strong>
              </article>
              <article class="detail-item">
                <span>Status</span>
                <strong>{{ turma()!.status }}</strong>
              </article>
              <article class="detail-item">
                <span>Identificador</span>
                <strong>#{{ turma()!.id }}</strong>
              </article>
            </div>
          }
        </section>
      </section>
    </section>
  `
})
export class TurmaDetailsPageComponent {
  private readonly turmasService = inject(TurmasService);
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly turma = signal<Turma | null>(null);
  readonly disciplinas = signal<Disciplina[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal(typeof history.state?.successMessage === 'string' ? history.state.successMessage : '');

  readonly disciplinaNome = computed(() => {
    const turma = this.turma();
    if (!turma) {
      return '-';
    }

    return this.disciplinas().find(disciplina => disciplina.id === turma.disciplinaId)?.nome ?? `Disciplina #${turma.disciplinaId}`;
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

    this.disciplinasService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: disciplinas => this.disciplinas.set(disciplinas),
        error: error => {
          this.loadError.set(true);
          this.errorMessage.set(this.describeError(error));
        }
      });

    this.turmasService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: turma => this.turma.set(turma),
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

    return 'Nao foi possivel carregar os detalhes da turma.';
  }
}
