import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
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
  selector: 'app-turmas-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Turmas"
        description="Listagem da oferta academica com capacidade, vagas disponiveis e status operacional."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="overview-grid" aria-label="Indicadores de turmas">
        <article class="overview-card">
          <span class="overview-label">Turmas cadastradas</span>
          <strong>{{ turmas().length }}</strong>
          <p>Oferta academica atualmente registrada.</p>
        </article>
        <article class="overview-card">
          <span class="overview-label">Turmas abertas</span>
          <strong>{{ openCount() }}</strong>
          <p>Disponiveis para novas matriculas pendentes.</p>
        </article>
        <article class="overview-card">
          <span class="overview-label">Vagas totais livres</span>
          <strong>{{ totalVacancies() }}</strong>
          <p>Soma de vagas disponiveis expostas pela API.</p>
        </article>
      </section>

      <section class="card" aria-labelledby="turmas-list-title">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Oferta e capacidade</p>
            <h3 id="turmas-list-title">Listagem de turmas</h3>
          </div>
          <div class="section-actions">
            <button type="button" class="ghost-button" (click)="reloadAll()" [disabled]="loading()">Recarregar</button>
            <a class="secondary-button" routerLink="/turmas/cadastro">Nova turma</a>
          </div>
        </div>

        @if (loading()) {
          <app-page-state title="Carregando turmas" description="Buscando turmas e disciplinas de apoio na API." />
        } @else if (hasLoadError()) {
          <app-page-state
            title="Falha ao carregar turmas"
            [description]="errorMessage() || 'Verifique a disponibilidade da API e tente novamente.'"
            tone="error"
            actionLabel="Tentar novamente"
            [action]="reloadAll"
          />
        } @else if (!turmas().length) {
          <app-page-state
            title="Nenhuma turma cadastrada"
            description="Crie a primeira turma para preparar o fluxo de matriculas."
            actionLabel="Abrir cadastro"
            [action]="openCreatePage"
          />
        } @else {
          <div class="table-wrapper">
            <table>
              <caption class="sr-only">Tabela de turmas cadastradas</caption>
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Disciplina</th>
                  <th>Capacidade</th>
                  <th>Vagas</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                @for (turma of turmasComDisciplina(); track turma.id) {
                  <tr>
                    <td>{{ turma.codigo }}</td>
                    <td>{{ turma.disciplinaNome }}</td>
                    <td>{{ turma.capacidade }}</td>
                    <td>{{ turma.vagasDisponiveis }}</td>
                    <td>
                      <span class="status-badge" [class.status-badge--closed]="turma.status === 'FECHADA'">
                        {{ turma.status }}
                      </span>
                    </td>
                    <td class="actions-cell">
                      <a class="ghost-button" [routerLink]="['/turmas', turma.id]">Detalhes</a>
                      <a class="ghost-button" [routerLink]="['/turmas/cadastro', turma.id]">Editar</a>
                      <button type="button" class="danger-button" (click)="remove(turma)" [disabled]="saving()">Excluir</button>
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
export class TurmasPageComponent {
  private readonly turmasService = inject(TurmasService);
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly turmas = signal<Turma[]>([]);
  readonly disciplinas = signal<Disciplina[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly hasLoadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal(typeof history.state?.successMessage === 'string' ? history.state.successMessage : '');

  readonly turmasComDisciplina = computed(() =>
    this.turmas().map(turma => ({
      ...turma,
      disciplinaNome:
        this.disciplinas().find(disciplina => disciplina.id === turma.disciplinaId)?.nome ?? `Disciplina #${turma.disciplinaId}`
    }))
  );

  readonly openCount = (): number => this.turmas().filter(turma => turma.status === 'ABERTA').length;
  readonly totalVacancies = (): number => this.turmas().reduce((sum, turma) => sum + turma.vagasDisponiveis, 0);

  constructor() {
    this.reloadAll();
  }

  readonly openCreatePage = (): void => {
    void this.router.navigate(['/turmas/cadastro']);
  };

  reloadAll = (): void => {
    this.loadDisciplinas();
    this.loadTurmas();
  };

  private loadDisciplinas(): void {
    this.disciplinasService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: disciplinas => this.disciplinas.set(disciplinas),
        error: error => {
          this.hasLoadError.set(true);
          this.errorMessage.set(this.describeError(error));
        }
      });
  }

  private loadTurmas(): void {
    this.loading.set(true);
    this.hasLoadError.set(false);
    this.errorMessage.set('');

    this.turmasService
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: turmas => {
          this.turmas.set(turmas);
          this.hasLoadError.set(false);
        },
        error: error => {
          this.hasLoadError.set(true);
          this.errorMessage.set(this.describeError(error));
        }
      });
  }

  remove(turma: Turma): void {
    const confirmed = window.confirm(`Deseja remover a turma ${turma.codigo}?`);
    if (!confirmed) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');
    this.saving.set(true);

    this.turmasService
      .remove(turma.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Turma removida com sucesso.');
          this.loadTurmas();
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  private describeError(error: unknown): string {
    if (error instanceof ApiRequestError) {
      return error.message;
    }

    return 'Nao foi possivel concluir a operacao com turmas.';
  }
}
