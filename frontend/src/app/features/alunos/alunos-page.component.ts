import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Aluno, AlunoPayload } from './aluno.model';
import { AlunosService } from './alunos.service';

@Component({
  selector: 'app-alunos-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Alunos"
        description="Cadastre e mantenha a base de alunos usada nas futuras matriculas."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <div class="feature-grid">
        <section class="card" aria-labelledby="aluno-form-title">
          <div class="section-heading">
            <h3 id="aluno-form-title">{{ editingId() ? 'Editar aluno' : 'Novo aluno' }}</h3>
            @if (editingId()) {
              <button type="button" class="ghost-button" (click)="cancelEdit()">Cancelar edicao</button>
            }
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="entity-form">
            <label>
              <span>Nome</span>
              <input type="text" formControlName="nome" />
            </label>

            <label>
              <span>E-mail</span>
              <input type="email" formControlName="email" />
            </label>

            <label>
              <span>Matricula</span>
              <input type="text" formControlName="matricula" />
            </label>

            @if (form.invalid && form.touched) {
              <p class="field-error" role="alert">Preencha nome, e-mail valido e matricula.</p>
            }

            <button type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Salvando...' : editingId() ? 'Atualizar aluno' : 'Criar aluno' }}
            </button>
          </form>
        </section>

        <section class="card" aria-labelledby="alunos-list-title">
          <div class="section-heading">
            <h3 id="alunos-list-title">Lista de alunos</h3>
            <button type="button" class="ghost-button" (click)="loadAlunos()" [disabled]="loading()">Recarregar</button>
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
            <app-page-state title="Nenhum aluno cadastrado" description="Crie o primeiro aluno para iniciar o cadastro base." />
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
                        <button type="button" class="ghost-button" (click)="startEdit(aluno)">Editar</button>
                        <button type="button" class="danger-button" (click)="remove(aluno)" [disabled]="saving()">Excluir</button>
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
export class AlunosPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly alunosService = inject(AlunosService);
  private readonly destroyRef = inject(DestroyRef);

  readonly alunos = signal<Aluno[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly hasLoadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    matricula: ['', [Validators.required, Validators.maxLength(40)]]
  });

  constructor() {
    this.loadAlunos();
  }

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

  submit(): void {
    this.form.markAllAsTouched();
    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.form.invalid) {
      return;
    }

    const payload = this.form.getRawValue() as AlunoPayload;
    const request$ = this.editingId()
      ? this.alunosService.update(this.editingId() as number, payload)
      : this.alunosService.create(payload);

    this.saving.set(true);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set(this.editingId() ? 'Aluno atualizado com sucesso.' : 'Aluno criado com sucesso.');
          this.cancelEdit();
          this.loadAlunos();
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  startEdit(aluno: Aluno): void {
    this.editingId.set(aluno.id);
    this.form.setValue({ nome: aluno.nome, email: aluno.email, matricula: aluno.matricula });
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ nome: '', email: '', matricula: '' });
  }

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
          if (this.editingId() === aluno.id) {
            this.cancelEdit();
          }
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
