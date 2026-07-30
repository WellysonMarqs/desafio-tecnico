import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Curso, CursoPayload } from './curso.model';
import { CursosService } from './cursos.service';

@Component({
  selector: 'app-cursos-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Cursos"
        description="Gerencie os cursos que organizam a estrutura academica e as disciplinas vinculadas."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <div class="feature-grid">
        <section class="card" aria-labelledby="curso-form-title">
          <div class="section-heading">
            <h3 id="curso-form-title">{{ editingId() ? 'Editar curso' : 'Novo curso' }}</h3>
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
              <span>Codigo</span>
              <input type="text" formControlName="codigo" />
            </label>

            @if (form.invalid && form.touched) {
              <p class="field-error" role="alert">Preencha nome e codigo do curso.</p>
            }

            <button type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Salvando...' : editingId() ? 'Atualizar curso' : 'Criar curso' }}
            </button>
          </form>
        </section>

        <section class="card" aria-labelledby="cursos-list-title">
          <div class="section-heading">
            <h3 id="cursos-list-title">Lista de cursos</h3>
            <button type="button" class="ghost-button" (click)="loadCursos()" [disabled]="loading()">Recarregar</button>
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
            <app-page-state title="Nenhum curso cadastrado" description="Cadastre o primeiro curso para liberar o cadastro de disciplinas." />
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
                        <button type="button" class="ghost-button" (click)="startEdit(curso)">Editar</button>
                        <button type="button" class="danger-button" (click)="remove(curso)" [disabled]="saving()">Excluir</button>
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
export class CursosPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cursosService = inject(CursosService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cursos = signal<Curso[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly hasLoadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    codigo: ['', [Validators.required, Validators.maxLength(40)]]
  });

  constructor() {
    this.loadCursos();
  }

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

  submit(): void {
    this.form.markAllAsTouched();
    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.form.invalid) {
      return;
    }

    const payload = this.form.getRawValue() as CursoPayload;
    const request$ = this.editingId()
      ? this.cursosService.update(this.editingId() as number, payload)
      : this.cursosService.create(payload);

    this.saving.set(true);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set(this.editingId() ? 'Curso atualizado com sucesso.' : 'Curso criado com sucesso.');
          this.cancelEdit();
          this.loadCursos();
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  startEdit(curso: Curso): void {
    this.editingId.set(curso.id);
    this.form.setValue({ nome: curso.nome, codigo: curso.codigo });
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ nome: '', codigo: '' });
  }

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
          if (this.editingId() === curso.id) {
            this.cancelEdit();
          }
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
