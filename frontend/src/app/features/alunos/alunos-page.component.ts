import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Aluno } from './aluno.model';
import { AlunosService } from './alunos.service';

@Component({
  selector: 'app-alunos-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Alunos"
        description="Tela dedicada de listagem para acompanhamento da base academica e acesso rapido aos detalhes."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="overview-grid" aria-label="Indicadores de alunos">
        <article class="overview-card">
          <span class="overview-label">Total cadastrado</span>
          <strong>{{ alunos().length }}</strong>
          <p>Base disponivel para o fluxo de matriculas.</p>
        </article>
        <article class="overview-card">
          <span class="overview-label">Com e-mail institucional</span>
          <strong>{{ institutionEmailCount() }}</strong>
          <p>Indicador simples de padrao de contato.</p>
        </article>
      </section>

      <section class="card" aria-labelledby="alunos-list-title">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Base academica</p>
            <h3 id="alunos-list-title">Listagem de alunos</h3>
          </div>
          <div class="section-actions">
            <button type="button" class="ghost-button" (click)="loadAlunos()" [disabled]="loading()">Recarregar</button>
            <a class="secondary-button" routerLink="/alunos/cadastro">Novo aluno</a>
          </div>
        </div>

        @if (loading()) {
          <app-page-state title="Carregando alunos" description="Buscando dados atualizados na API." />
        } @else if (hasLoadError()) {
          <app-page-state
            title="Falha ao carregar alunos"
            [description]="errorMessage() || 'Verifique a disponibilidade da API e tente novamente.'"
            tone="error"
            actionLabel="Tentar novamente"
            [action]="loadAlunos"
          />
        } @else if (!alunos().length) {
          <app-page-state
            title="Nenhum aluno cadastrado"
            description="Use a tela de cadastro para iniciar a base de alunos do sistema academico."
            actionLabel="Abrir cadastro"
            [action]="openCreatePage"
          />
        } @else {
          <div class="table-wrapper">
            <table>
              <caption class="sr-only">Tabela de alunos cadastrados</caption>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Matricula</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                @for (aluno of alunos(); track aluno.id) {
                  <tr>
                    <td>{{ aluno.nome }}</td>
                    <td>{{ aluno.email }}</td>
                    <td>{{ aluno.matricula }}</td>
                    <td class="actions-cell">
                      <a class="ghost-button" [routerLink]="['/alunos', aluno.id]">Detalhes</a>
                      <a class="ghost-button" [routerLink]="['/alunos/cadastro', aluno.id]">Editar</a>
                      <button type="button" class="danger-button" (click)="remove(aluno)" [disabled]="saving()">Excluir</button>
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
export class AlunosPageComponent {
  private readonly alunosService = inject(AlunosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly alunos = signal<Aluno[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly hasLoadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal(typeof history.state?.successMessage === 'string' ? history.state.successMessage : '');

  constructor() {
    this.loadAlunos();
  }

  readonly openCreatePage = (): void => {
    void this.router.navigate(['/alunos/cadastro']);
  };

  readonly institutionEmailCount = (): number =>
    this.alunos().filter(aluno => aluno.email.includes('.edu') || aluno.email.includes('.ac.')).length;

  loadAlunos = (): void => {
    this.loading.set(true);
    this.hasLoadError.set(false);
    this.errorMessage.set('');

    this.alunosService
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: alunos => {
          this.alunos.set(alunos);
          this.hasLoadError.set(false);
        },
        error: error => {
          this.hasLoadError.set(true);
          this.errorMessage.set(this.describeError(error));
        }
      });
  };

  remove(aluno: Aluno): void {
    const confirmed = window.confirm(`Deseja remover o aluno ${aluno.nome}?`);
    if (!confirmed) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');
    this.saving.set(true);

    this.alunosService
      .remove(aluno.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Aluno removido com sucesso.');
          this.loadAlunos();
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  private describeError(error: unknown): string {
    if (error instanceof ApiRequestError) {
      return error.message;
    }

    return 'Nao foi possivel concluir a operacao com alunos.';
  }
}
