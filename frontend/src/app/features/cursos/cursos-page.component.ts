import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Curso } from './curso.model';
import { CursosService } from './cursos.service';

@Component({
  selector: 'app-cursos-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Cursos"
        description="Listagem principal dos cursos para consulta rapida, manutencao e acesso a detalhes."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="overview-grid" aria-label="Indicadores de cursos">
        <article class="overview-card">
          <span class="overview-label">Total de cursos</span>
          <strong>{{ cursos().length }}</strong>
          <p>Estrutura institucional disponivel para disciplinas.</p>
        </article>
        <article class="overview-card">
          <span class="overview-label">Codigos unicos</span>
          <strong>{{ uniqueCodesCount() }}</strong>
          <p>Validacao visual rapida da base cadastrada.</p>
        </article>
      </section>

      <section class="card" aria-labelledby="cursos-list-title">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Catalogo institucional</p>
            <h3 id="cursos-list-title">Listagem de cursos</h3>
          </div>
          <div class="section-actions">
            <button type="button" class="ghost-button" (click)="loadCursos()" [disabled]="loading()">Recarregar</button>
            <a class="secondary-button" routerLink="/cursos/cadastro">Novo curso</a>
          </div>
        </div>

        @if (loading()) {
          <app-page-state title="Carregando cursos" description="Buscando dados atualizados na API." />
        } @else if (hasLoadError()) {
          <app-page-state
            title="Falha ao carregar cursos"
            [description]="errorMessage() || 'Verifique a disponibilidade da API e tente novamente.'"
            tone="error"
            actionLabel="Tentar novamente"
            [action]="loadCursos"
          />
        } @else if (!cursos().length) {
          <app-page-state
            title="Nenhum curso cadastrado"
            description="Cadastre o primeiro curso para liberar a organizacao curricular."
            actionLabel="Abrir cadastro"
            [action]="openCreatePage"
          />
        } @else {
          <div class="table-wrapper">
            <table>
              <caption class="sr-only">Tabela de cursos cadastrados</caption>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Codigo</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                @for (curso of cursos(); track curso.id) {
                  <tr>
                    <td>{{ curso.nome }}</td>
                    <td>{{ curso.codigo }}</td>
                    <td class="actions-cell">
                      <a class="ghost-button" [routerLink]="['/cursos', curso.id]">Detalhes</a>
                      <a class="ghost-button" [routerLink]="['/cursos/cadastro', curso.id]">Editar</a>
                      <button type="button" class="danger-button" (click)="remove(curso)" [disabled]="saving()">Excluir</button>
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
export class CursosPageComponent {
  private readonly cursosService = inject(CursosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly cursos = signal<Curso[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly hasLoadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal(typeof history.state?.successMessage === 'string' ? history.state.successMessage : '');

  constructor() {
    this.loadCursos();
  }

  readonly openCreatePage = (): void => {
    void this.router.navigate(['/cursos/cadastro']);
  };

  readonly uniqueCodesCount = (): number => new Set(this.cursos().map(curso => curso.codigo)).size;

  loadCursos = (): void => {
    this.loading.set(true);
    this.hasLoadError.set(false);
    this.errorMessage.set('');

    this.cursosService
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: cursos => {
          this.cursos.set(cursos);
          this.hasLoadError.set(false);
        },
        error: error => {
          this.hasLoadError.set(true);
          this.errorMessage.set(this.describeError(error));
        }
      });
  };

  remove(curso: Curso): void {
    const confirmed = window.confirm(`Deseja remover o curso ${curso.nome}?`);
    if (!confirmed) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');
    this.saving.set(true);

    this.cursosService
      .remove(curso.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Curso removido com sucesso.');
          this.loadCursos();
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  private describeError(error: unknown): string {
    if (error instanceof ApiRequestError) {
      return error.message;
    }

    return 'Nao foi possivel concluir a operacao com cursos.';
  }
}
