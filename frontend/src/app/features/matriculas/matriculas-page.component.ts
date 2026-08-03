import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { finalize } from 'rxjs';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Aluno } from '../alunos/aluno.model';
import { AlunosService } from '../alunos/alunos.service';
import { Matricula } from './matricula.model';
import { MatriculasService } from './matriculas.service';
import { Turma } from '../turmas/turma.model';
import { TurmasService } from '../turmas/turmas.service';

interface MatriculaViewModel extends Matricula {
  alunoNome: string;
  alunoMatricula: string;
  turmaCodigo: string;
  turmaStatus: string;
  vagasDisponiveis: number;
}

@Component({
  selector: 'app-matriculas-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Listagem de matriculas"
        description="Consulte matriculas por aluno ou turma e execute confirmacao e cancelamento a partir da listagem."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="card" aria-labelledby="consulta-title">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Consultas operacionais</p>
            <h3 id="consulta-title">Listagem e acoes</h3>
          </div>
        </div>

        @if (baseLoading()) {
          <app-page-state title="Carregando base da consulta" description="Buscando alunos e turmas disponiveis para filtrar matriculas." />
        } @else if (baseLoadError()) {
          <app-page-state
            title="Falha ao carregar alunos e turmas"
            [description]="errorMessage() || 'Verifique a disponibilidade da API antes de consultar matriculas.'"
            tone="error"
            actionLabel="Tentar novamente"
            [action]="reloadBaseData"
          />
        } @else {
          <form [formGroup]="queryForm" class="query-form" (ngSubmit)="$event.preventDefault()">
            <label>
              <span>Matriculas por aluno</span>
              <select formControlName="alunoId" (change)="handleAlunoSelection()" [disabled]="!alunoOptions().length">
                <option value="">Selecione um aluno</option>
                @for (aluno of alunoOptions(); track aluno.id) {
                  <option [value]="aluno.id">{{ aluno.nome }} · {{ aluno.matricula }}</option>
                }
              </select>
            </label>

            <label>
              <span>Matriculas por turma</span>
              <select formControlName="turmaId" (change)="handleTurmaSelection()" [disabled]="!turmaOptions().length">
                <option value="">Selecione uma turma</option>
                @for (turma of turmaOptions(); track turma.id) {
                  <option [value]="turma.id">{{ turma.codigo }} · {{ turma.status }}</option>
                }
              </select>
            </label>
          </form>

          <div class="query-feedback-grid">
            <section class="query-panel" aria-labelledby="matriculas-aluno-title">
              <div class="section-heading section-heading--compact">
                <h4 id="matriculas-aluno-title">Por aluno</h4>
                @if (selectedAlunoLabel()) {
                  <span class="selection-chip">{{ selectedAlunoLabel() }}</span>
                }
              </div>

              @if (alunoQueryLoading()) {
                <app-page-state title="Carregando matriculas do aluno" description="Consultando a API para o aluno selecionado." />
              } @else if (alunoQueryError()) {
                <app-page-state
                  title="Falha na consulta por aluno"
                  [description]="alunoQueryMessage()"
                  tone="error"
                  actionLabel="Tentar novamente"
                  [action]="retryAlunoQuery"
                />
              } @else if (!selectedAlunoId()) {
                <app-page-state title="Selecione um aluno" description="A lista de matriculas por aluno aparece aqui." />
              } @else if (!matriculasPorAluno().length) {
                <app-page-state title="Nenhuma matricula encontrada" description="O aluno selecionado ainda nao possui matriculas registradas." />
              } @else {
                <div class="table-wrapper">
                  <table>
                    <caption class="sr-only">Tabela de matriculas filtradas por aluno</caption>
                    <thead>
                      <tr>
                        <th>Turma</th>
                        <th>Status</th>
                        <th>Vagas</th>
                        <th>Criada em</th>
                        <th>Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (matricula of matriculasPorAluno(); track matricula.id) {
                        <tr>
                          <td>{{ matricula.turmaCodigo }}</td>
                          <td>
                            <span class="status-badge" [class.status-badge--closed]="matricula.status === 'CANCELADA'">
                              {{ matricula.status }}
                            </span>
                          </td>
                          <td>{{ matricula.vagasDisponiveis }}</td>
                          <td>{{ matricula.criadaEm ? (matricula.criadaEm | date: 'dd/MM/yyyy HH:mm') : '-' }}</td>
                          <td class="actions-cell">
                            @if (matricula.status === 'PENDENTE') {
                              <button type="button" class="ghost-button" (click)="confirmFromAluno(matricula)" [disabled]="actionInProgress()">
                                Confirmar
                              </button>
                            }
                            @if (matricula.status !== 'CANCELADA') {
                              <button type="button" class="danger-button" (click)="cancelFromAluno(matricula)" [disabled]="actionInProgress()">
                                Cancelar
                              </button>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>

            <section class="query-panel" aria-labelledby="matriculas-turma-title">
              <div class="section-heading section-heading--compact">
                <h4 id="matriculas-turma-title">Por turma</h4>
                @if (selectedTurmaLabel()) {
                  <span class="selection-chip">{{ selectedTurmaLabel() }}</span>
                }
              </div>

              @if (turmaQueryLoading()) {
                <app-page-state title="Carregando matriculas da turma" description="Consultando a API para a turma selecionada." />
              } @else if (turmaQueryError()) {
                <app-page-state
                  title="Falha na consulta por turma"
                  [description]="turmaQueryMessage()"
                  tone="error"
                  actionLabel="Tentar novamente"
                  [action]="retryTurmaQuery"
                />
              } @else if (!selectedTurmaId()) {
                <app-page-state title="Selecione uma turma" description="A lista de matriculas por turma aparece aqui." />
              } @else if (!matriculasPorTurma().length) {
                <app-page-state title="Nenhuma matricula encontrada" description="A turma selecionada ainda nao possui matriculas registradas." />
              } @else {
                <div class="table-wrapper">
                  <table>
                    <caption class="sr-only">Tabela de matriculas filtradas por turma</caption>
                    <thead>
                      <tr>
                        <th>Aluno</th>
                        <th>Status</th>
                        <th>Turma</th>
                        <th>Criada em</th>
                        <th>Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (matricula of matriculasPorTurma(); track matricula.id) {
                        <tr>
                          <td>
                            <div class="table-primary">{{ matricula.alunoNome }}</div>
                            <div class="table-secondary">{{ matricula.alunoMatricula }}</div>
                          </td>
                          <td>
                            <span class="status-badge" [class.status-badge--closed]="matricula.status === 'CANCELADA'">
                              {{ matricula.status }}
                            </span>
                          </td>
                          <td>
                            <div class="table-primary">{{ matricula.turmaCodigo }}</div>
                            <div class="table-secondary">{{ matricula.turmaStatus }} · {{ matricula.vagasDisponiveis }} vaga(s)</div>
                          </td>
                          <td>{{ matricula.criadaEm ? (matricula.criadaEm | date: 'dd/MM/yyyy HH:mm') : '-' }}</td>
                          <td class="actions-cell">
                            @if (matricula.status === 'PENDENTE') {
                              <button type="button" class="ghost-button" (click)="confirmFromTurma(matricula)" [disabled]="actionInProgress()">
                                Confirmar
                              </button>
                            }
                            @if (matricula.status !== 'CANCELADA') {
                              <button type="button" class="danger-button" (click)="cancelFromTurma(matricula)" [disabled]="actionInProgress()">
                                Cancelar
                              </button>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          </div>
        }
      </section>
    </section>
  `
})
export class MatriculasPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly alunosService = inject(AlunosService);
  private readonly turmasService = inject(TurmasService);
  private readonly matriculasService = inject(MatriculasService);
  private readonly destroyRef = inject(DestroyRef);

  readonly alunos = signal<Aluno[]>([]);
  readonly turmas = signal<Turma[]>([]);
  readonly baseLoading = signal(true);
  readonly baseLoadError = signal(false);
  readonly actionInProgress = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal(typeof history.state?.successMessage === 'string' ? history.state.successMessage : '');

  readonly matriculasAluno = signal<Matricula[]>([]);
  readonly matriculasTurma = signal<Matricula[]>([]);
  readonly alunoQueryLoading = signal(false);
  readonly turmaQueryLoading = signal(false);
  readonly alunoQueryError = signal(false);
  readonly turmaQueryError = signal(false);
  readonly alunoQueryMessage = signal('');
  readonly turmaQueryMessage = signal('');
  readonly selectedAlunoId = signal<number | null>(null);
  readonly selectedTurmaId = signal<number | null>(null);

  readonly alunoOptions = computed(() => this.alunos());
  readonly turmaOptions = computed(() => this.turmas());

  readonly selectedAlunoLabel = computed(() => {
    const aluno = this.alunos().find(item => item.id === this.selectedAlunoId());
    return aluno ? `${aluno.nome} · ${aluno.matricula}` : '';
  });

  readonly selectedTurmaLabel = computed(() => {
    const turma = this.turmas().find(item => item.id === this.selectedTurmaId());
    return turma ? `${turma.codigo} · ${turma.status} · ${turma.vagasDisponiveis} vaga(s)` : '';
  });

  readonly matriculasPorAluno = computed<MatriculaViewModel[]>(() =>
    this.matriculasAluno().map(matricula => this.enrichMatricula(matricula))
  );

  readonly matriculasPorTurma = computed<MatriculaViewModel[]>(() =>
    this.matriculasTurma().map(matricula => this.enrichMatricula(matricula))
  );

  readonly queryForm = this.fb.nonNullable.group({
    alunoId: [0],
    turmaId: [0]
  });

  constructor() {
    this.reloadBaseData();
  }

  reloadBaseData = (): void => {
    this.baseLoading.set(true);
    this.baseLoadError.set(false);
    this.errorMessage.set('');

    let alunosLoaded = false;
    let turmasLoaded = false;
    let failed = false;

    const finalizeBaseLoading = (): void => {
      if ((alunosLoaded && turmasLoaded) || failed) {
        this.baseLoading.set(false);
      }
    };

    this.alunosService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: alunos => {
          this.alunos.set(alunos);
          alunosLoaded = true;
          finalizeBaseLoading();
        },
        error: error => {
          failed = true;
          this.baseLoadError.set(true);
          this.errorMessage.set(this.describeError(error));
          finalizeBaseLoading();
        }
      });

    this.turmasService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: turmas => {
          this.turmas.set(turmas);
          turmasLoaded = true;
          finalizeBaseLoading();
        },
        error: error => {
          failed = true;
          this.baseLoadError.set(true);
          this.errorMessage.set(this.describeError(error));
          finalizeBaseLoading();
        }
      });
  };

  handleAlunoSelection(): void {
    const alunoId = Number(this.queryForm.controls.alunoId.value);
    if (!alunoId) {
      this.selectedAlunoId.set(null);
      this.matriculasAluno.set([]);
      this.alunoQueryError.set(false);
      this.alunoQueryMessage.set('');
      return;
    }

    this.selectedAlunoId.set(alunoId);
    this.fetchMatriculasByAluno(alunoId);
  }

  handleTurmaSelection(): void {
    const turmaId = Number(this.queryForm.controls.turmaId.value);
    if (!turmaId) {
      this.selectedTurmaId.set(null);
      this.matriculasTurma.set([]);
      this.turmaQueryError.set(false);
      this.turmaQueryMessage.set('');
      return;
    }

    this.selectedTurmaId.set(turmaId);
    this.fetchMatriculasByTurma(turmaId);
  }

  retryAlunoQuery = (): void => {
    if (this.selectedAlunoId()) {
      this.fetchMatriculasByAluno(this.selectedAlunoId() as number);
    }
  };

  retryTurmaQuery = (): void => {
    if (this.selectedTurmaId()) {
      this.fetchMatriculasByTurma(this.selectedTurmaId() as number);
    }
  };

  confirmFromAluno(matricula: MatriculaViewModel): void {
    this.confirmMatricula(matricula);
  }

  confirmFromTurma(matricula: MatriculaViewModel): void {
    this.confirmMatricula(matricula);
  }

  cancelFromAluno(matricula: MatriculaViewModel): void {
    this.cancelMatricula(matricula);
  }

  cancelFromTurma(matricula: MatriculaViewModel): void {
    this.cancelMatricula(matricula);
  }

  private fetchMatriculasByAluno(alunoId: number): void {
    this.alunoQueryLoading.set(true);
    this.alunoQueryError.set(false);
    this.alunoQueryMessage.set('');

    this.matriculasService
      .listByAluno(alunoId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.alunoQueryLoading.set(false))
      )
      .subscribe({
        next: matriculas => {
          this.matriculasAluno.set(matriculas);
        },
        error: error => {
          this.alunoQueryError.set(true);
          this.alunoQueryMessage.set(this.describeError(error));
        }
      });
  }

  private fetchMatriculasByTurma(turmaId: number): void {
    this.turmaQueryLoading.set(true);
    this.turmaQueryError.set(false);
    this.turmaQueryMessage.set('');

    this.matriculasService
      .listByTurma(turmaId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.turmaQueryLoading.set(false))
      )
      .subscribe({
        next: matriculas => {
          this.matriculasTurma.set(matriculas);
        },
        error: error => {
          this.turmaQueryError.set(true);
          this.turmaQueryMessage.set(this.describeError(error));
        }
      });
  }

  private confirmMatricula(matricula: MatriculaViewModel): void {
    this.runMatriculaAction(this.matriculasService.confirm(matricula.id), `Matricula ${matricula.id} confirmada com sucesso.`);
  }

  private cancelMatricula(matricula: MatriculaViewModel): void {
    this.runMatriculaAction(this.matriculasService.cancel(matricula.id), `Matricula ${matricula.id} cancelada com sucesso.`);
  }

  private runMatriculaAction(request$: ReturnType<MatriculasService['confirm']>, successMessage: string): void {
    this.actionInProgress.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.actionInProgress.set(false))
      )
      .subscribe({
        next: matricula => {
          this.successMessage.set(successMessage);
          this.applyMatriculaMutation(matricula);
          this.refreshAfterMutation(matricula.alunoId, matricula.turmaId);
        },
        error: error => {
          this.errorMessage.set(this.describeError(error));
        }
      });
  }

  private refreshAfterMutation(alunoId: number, turmaId: number): void {
    this.reloadBaseData();

    if (this.selectedAlunoId() === alunoId) {
      this.fetchMatriculasByAluno(alunoId);
    }

    if (this.selectedTurmaId() === turmaId) {
      this.fetchMatriculasByTurma(turmaId);
    }
  }

  private applyMatriculaMutation(matricula: Matricula): void {
    this.matriculasAluno.update(items => this.replaceMatricula(items, matricula));
    this.matriculasTurma.update(items => this.replaceMatricula(items, matricula));
  }

  private replaceMatricula(items: Matricula[], matricula: Matricula): Matricula[] {
    return items.map(item => (item.id === matricula.id ? { ...item, ...matricula } : item));
  }

  private enrichMatricula(matricula: Matricula): MatriculaViewModel {
    const aluno = this.alunos().find(item => item.id === matricula.alunoId);
    const turma = this.turmas().find(item => item.id === matricula.turmaId);

    return {
      ...matricula,
      alunoNome: aluno?.nome ?? `Aluno #${matricula.alunoId}`,
      alunoMatricula: aluno?.matricula ?? '-',
      turmaCodigo: turma?.codigo ?? `Turma #${matricula.turmaId}`,
      turmaStatus: turma?.status ?? '-',
      vagasDisponiveis: turma?.vagasDisponiveis ?? 0
    };
  }

  private describeError(error: unknown): string {
    if (error instanceof ApiRequestError) {
      return this.mapBusinessError(error);
    }

    return 'Nao foi possivel concluir a operacao de matricula.';
  }

  private mapBusinessError(error: ApiRequestError): string {
    const knownMessages: Record<string, string> = {
      TURMA_FECHADA: 'A turma selecionada esta fechada e nao aceita novas matriculas.',
      TURMA_SEM_VAGAS: 'Nao ha vagas disponiveis para confirmar esta matricula.',
      MATRICULA_DUPLICADA: 'O aluno selecionado ja possui matricula para esta turma.',
      TRANSICAO_STATUS_INVALIDA: 'A acao solicitada nao e permitida para o status atual da matricula.',
      ALUNO_NAO_ENCONTRADO: 'O aluno informado nao foi encontrado na base atual.',
      TURMA_NAO_ENCONTRADA: 'A turma informada nao foi encontrada na base atual.',
      MATRICULA_NAO_ENCONTRADA: 'A matricula informada nao foi encontrada.'
    };

    const message = knownMessages[error.code];
    if (message) {
      return message;
    }

    return error.message;
  }
}
