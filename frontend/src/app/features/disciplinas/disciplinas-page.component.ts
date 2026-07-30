import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Curso } from '../cursos/curso.model';
import { CursosService } from '../cursos/cursos.service';
import { Disciplina, DisciplinaPayload } from './disciplina.model';
import { DisciplinasService } from './disciplinas.service';

@Component({
  selector: 'app-disciplinas-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        title="Disciplinas"
        description="Mantenha as disciplinas vinculadas aos cursos ja cadastrados."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <div class="feature-grid">
        <section class="card" aria-labelledby="disciplina-form-title">
          <div class="section-heading">
            <h3 id="disciplina-form-title">{{ editingId() ? 'Editar disciplina' : 'Nova disciplina' }}</h3>
            @if (editingId()) {
              <button type="button" class="ghost-button" (click)="cancelEdit()">Cancelar edicao</button>
            }
          </div>

          @if (!cursoOptions().length && !coursesLoading()) {
            <app-page-state
              title="Cadastre um curso antes"
              description="Disciplinas dependem de um curso existente. Acesse a tela de cursos para continuar."
            />
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" class="entity-form">
              <label>
                <span>Nome</span>
                <input type="text" formControlName="nome" />
              </label>

              <label>
                <span>Codigo</span>
                <input type="text" formControlName="codigo" />
              </label>

              <label>
                <span>Curso</span>
                <select formControlName="cursoId">
                  <option value="">Selecione um curso</option>
                  @for (curso of cursoOptions(); track curso.id) {
                    <option [value]="curso.id">{{ curso.nome }}</option>
                  }
                </select>
              </label>

              @if (form.invalid && form.touched) {
                <p class="field-error" role="alert">Preencha nome, codigo e curso vinculado.</p>
              }

              <button type="submit" [disabled]="form.invalid || saving() || !cursoOptions().length">
                {{ saving() ? 'Salvando...' : editingId() ? 'Atualizar disciplina' : 'Criar disciplina' }}
              </button>
            </form>
          }
        </section>

        <section class="card" aria-labelledby="disciplinas-list-title">
          <div class="section-heading">
            <h3 id="disciplinas-list-title">Lista de disciplinas</h3>
            <button type="button" class="ghost-button" (click)="reloadAll()" [disabled]="loading()">Recarregar</button>
          </div>

          @if (loading()) {
            <app-page-state title="Carregando disciplinas" description="Buscando disciplinas e cursos de apoio na API." />
          } @else if (hasLoadError()) {
            <app-page-state
              title="Falha ao carregar disciplinas"
              [description]="errorMessage() || 'Verifique a disponibilidade da API e tente novamente.'"
              tone="error"
              actionLabel="Tentar novamente"
              [action]="reloadAll"
            />
          } @else if (!disciplinas().length) {
            <app-page-state title="Nenhuma disciplina cadastrada" description="Crie a primeira disciplina para formar a base curricular." />
          } @else {
            <div class="table-wrapper">
              <table>
                <caption class="sr-only">Tabela de disciplinas cadastradas</caption>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Codigo</th>
                    <th>Curso</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  @for (disciplina of disciplinasComCurso(); track disciplina.id) {
                    <tr>
                      <td>{{ disciplina.nome }}</td>
                      <td>{{ disciplina.codigo }}</td>
                      <td>{{ disciplina.cursoNome }}</td>
                      <td class="actions-cell">
                        <button type="button" class="ghost-button" (click)="startEdit(disciplina)">Editar</button>
                        <button type="button" class="danger-button" (click)="remove(disciplina)" [disabled]="saving()">Excluir</button>
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
export class DisciplinasPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly cursosService = inject(CursosService);
  private readonly destroyRef = inject(DestroyRef);

  readonly disciplinas = signal<Disciplina[]>([]);
  readonly cursos = signal<Curso[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly hasLoadError = signal(false);
  readonly coursesLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingId = signal<number | null>(null);

  readonly cursoOptions = computed(() => this.cursos());
  readonly disciplinasComCurso = computed(() =>
    this.disciplinas().map(disciplina => ({
      ...disciplina,
      cursoNome: this.cursos().find(curso => curso.id === disciplina.cursoId)?.nome ?? `Curso #${disciplina.cursoId}`
    }))
  );

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    codigo: ['', [Validators.required, Validators.maxLength(40)]],
    cursoId: [0, [Validators.required, Validators.min(1)]]
  });

  constructor() {
    this.reloadAll();
  }

  reloadAll = (): void => {
    this.loadCursos();
    this.loadDisciplinas();
  };

  private loadCursos(): void {
    this.coursesLoading.set(true);

    this.cursosService
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.coursesLoading.set(false))
      )
      .subscribe({
        next: cursos => {
          this.cursos.set(cursos);
        },
        error: error => {
          this.hasLoadError.set(true);
          this.errorMessage.set(this.describeError(error));
        }
      });
  }

  private loadDisciplinas(): void {
    this.loading.set(true);
    this.hasLoadError.set(false);
    this.errorMessage.set('');

    this.disciplinasService
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: disciplinas => {
          this.disciplinas.set(disciplinas);
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
    const payload: DisciplinaPayload = {
      nome: rawValue.nome,
      codigo: rawValue.codigo,
      cursoId: Number(rawValue.cursoId)
    };

    const request$ = this.editingId()
      ? this.disciplinasService.update(this.editingId() as number, payload)
      : this.disciplinasService.create(payload);

    this.saving.set(true);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set(this.editingId() ? 'Disciplina atualizada com sucesso.' : 'Disciplina criada com sucesso.');
          this.cancelEdit();
          this.loadDisciplinas();
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  startEdit(disciplina: Disciplina): void {
    this.editingId.set(disciplina.id);
    this.form.setValue({ nome: disciplina.nome, codigo: disciplina.codigo, cursoId: disciplina.cursoId });
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ nome: '', codigo: '', cursoId: 0 });
  }

  remove(disciplina: Disciplina): void {
    const confirmed = window.confirm(`Deseja remover a disciplina ${disciplina.nome}?`);
    if (!confirmed) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');
    this.saving.set(true);

    this.disciplinasService
      .remove(disciplina.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          if (this.editingId() === disciplina.id) {
            this.cancelEdit();
          }
          this.successMessage.set('Disciplina removida com sucesso.');
          this.loadDisciplinas();
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  private describeError(error: unknown): string {
    if (error instanceof ApiRequestError) {
      return error.message;
    }

    return 'Nao foi possivel concluir a operacao com disciplinas.';
  }
}
