import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Disciplina } from '../disciplinas/disciplina.model';
import { DisciplinasService } from '../disciplinas/disciplinas.service';
import { Turma, TurmaPayload, TurmaStatus } from './turma.model';
import { TurmasService } from './turmas.service';

@Component({
  selector: 'app-turmas-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Turmas"
        description="Gerencie turmas abertas e fechadas com capacidade e vagas disponiveis expostas pela API."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <div class="feature-grid">
        <section class="card" aria-labelledby="turma-form-title">
          <div class="section-heading">
            <h3 id="turma-form-title">{{ editingId() ? 'Editar turma' : 'Nova turma' }}</h3>
            @if (editingId()) {
              <button type="button" class="ghost-button" (click)="cancelEdit()">Cancelar edicao</button>
            }
          </div>

          @if (!disciplinaOptions().length && !disciplinasLoading()) {
            <app-page-state
              title="Cadastre uma disciplina antes"
              description="Turmas dependem de uma disciplina existente. Conclua esse cadastro antes de continuar."
            />
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" class="entity-form">
              <label>
                <span>Codigo</span>
                <input type="text" formControlName="codigo" />
              </label>

              <label>
                <span>Disciplina</span>
                <select formControlName="disciplinaId">
                  <option value="">Selecione uma disciplina</option>
                  @for (disciplina of disciplinaOptions(); track disciplina.id) {
                    <option [value]="disciplina.id">{{ disciplina.nome }}</option>
                  }
                </select>
              </label>

              <label>
                <span>Capacidade</span>
                <input type="number" min="1" formControlName="capacidade" />
              </label>

              <label>
                <span>Status</span>
                <select formControlName="status">
                  <option value="ABERTA">Aberta</option>
                  <option value="FECHADA">Fechada</option>
                </select>
              </label>

              @if (form.invalid && form.touched) {
                <p class="field-error" role="alert">Preencha codigo, disciplina, capacidade valida e status.</p>
              }

              <button type="submit" [disabled]="form.invalid || saving() || !disciplinaOptions().length">
                {{ saving() ? 'Salvando...' : editingId() ? 'Atualizar turma' : 'Criar turma' }}
              </button>
            </form>
          }
        </section>

        <section class="card" aria-labelledby="turmas-list-title">
          <div class="section-heading">
            <h3 id="turmas-list-title">Lista de turmas</h3>
            <button type="button" class="ghost-button" (click)="reloadAll()" [disabled]="loading()">Recarregar</button>
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
            <app-page-state title="Nenhuma turma cadastrada" description="Crie a primeira turma para preparar o fluxo de matricula da proxima entrega." />
          } @else {
            <div class="table-wrapper">
              <table>
                <caption class="sr-only">Tabela de turmas cadastradas</caption>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Disciplina</th>
                    <th>Capacidade</th>
                    <th>Vagas disponiveis</th>
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
                        <button type="button" class="ghost-button" (click)="startEdit(turma)">Editar</button>
                        <button type="button" class="danger-button" (click)="remove(turma)" [disabled]="saving()">Excluir</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      </div>
    </section>
  `
})
export class TurmasPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly turmasService = inject(TurmasService);
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly destroyRef = inject(DestroyRef);

  readonly turmas = signal<Turma[]>([]);
  readonly disciplinas = signal<Disciplina[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly hasLoadError = signal(false);
  readonly disciplinasLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingId = signal<number | null>(null);

  readonly disciplinaOptions = computed(() => this.disciplinas());
  readonly turmasComDisciplina = computed(() =>
    this.turmas().map(turma => ({
      ...turma,
      disciplinaNome:
        this.disciplinas().find(disciplina => disciplina.id === turma.disciplinaId)?.nome ?? `Disciplina #${turma.disciplinaId}`
    }))
  );

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(40)]],
    disciplinaId: [0, [Validators.required, Validators.min(1)]],
    capacidade: [1, [Validators.required, Validators.min(1)]],
    status: ['ABERTA' as TurmaStatus, [Validators.required]]
  });

  constructor() {
    this.reloadAll();
  }

  reloadAll = (): void => {
    this.loadDisciplinas();
    this.loadTurmas();
  };

  private loadDisciplinas(): void {
    this.disciplinasLoading.set(true);

    this.disciplinasService
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.disciplinasLoading.set(false))
      )
      .subscribe({
        next: disciplinas => {
          this.disciplinas.set(disciplinas);
        },
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

  submit(): void {
    this.form.markAllAsTouched();
    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.form.invalid) {
      return;
    }

    const rawValue = this.form.getRawValue();
    const payload: TurmaPayload = {
      codigo: rawValue.codigo,
      disciplinaId: Number(rawValue.disciplinaId),
      capacidade: Number(rawValue.capacidade),
      status: rawValue.status
    };

    const request$ = this.editingId()
      ? this.turmasService.update(this.editingId() as number, payload)
      : this.turmasService.create(payload);

    this.saving.set(true);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set(this.editingId() ? 'Turma atualizada com sucesso.' : 'Turma criada com sucesso.');
          this.cancelEdit();
          this.loadTurmas();
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  startEdit(turma: Turma): void {
    this.editingId.set(turma.id);
    this.form.setValue({
      codigo: turma.codigo,
      disciplinaId: turma.disciplinaId,
      capacidade: turma.capacidade,
      status: turma.status
    });
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ codigo: '', disciplinaId: 0, capacidade: 1, status: 'ABERTA' as TurmaStatus });
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
          if (this.editingId() === turma.id) {
            this.cancelEdit();
          }
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
