import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiRequestError } from '../../core/api/api-error.interceptor';
import { FeedbackBannerComponent } from '../../shared/ui/feedback-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PageStateComponent } from '../../shared/ui/page-state.component';
import { Curso } from '../cursos/curso.model';
import { CursosService } from '../cursos/cursos.service';
import { DisciplinaPayload } from './disciplina.model';
import { DisciplinasService } from './disciplinas.service';

@Component({
  selector: 'app-disciplina-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        [title]="editingId() ? 'Editar disciplina' : 'Cadastrar disciplina'"
        description="Tela exclusiva para montagem e manutencao da base curricular."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="form-layout">
        <section class="card form-card" aria-labelledby="disciplina-form-title">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Cadastro separado</p>
              <h3 id="disciplina-form-title">{{ editingId() ? 'Atualizacao de disciplina' : 'Nova disciplina' }}</h3>
            </div>
            <div class="section-actions">
              <a class="ghost-button" routerLink="/disciplinas">Voltar para listagem</a>
              @if (editingId()) {
                <a class="ghost-button" [routerLink]="['/disciplinas', editingId()]">Ver detalhes</a>
              }
            </div>
          </div>

          @if (baseLoading()) {
            <app-page-state title="Carregando cadastro" description="Buscando disciplina e cursos de apoio." />
          } @else if (loadError()) {
            <app-page-state
              title="Falha ao carregar disciplina"
              [description]="errorMessage() || 'Nao foi possivel carregar os dados para edicao.'"
              tone="error"
              actionLabel="Tentar novamente"
              [action]="reload"
            />
          } @else if (!cursos().length) {
            <app-page-state
              title="Cadastre um curso antes"
              description="Disciplinas dependem de um curso existente na base."
              actionLabel="Abrir cursos"
              [action]="openCursos"
            />
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" class="entity-form">
              <label>
                <span>Nome</span>
                <input type="text" formControlName="nome" placeholder="Ex.: Programacao Distribuida" />
              </label>

              <label>
                <span>Codigo</span>
                <input type="text" formControlName="codigo" placeholder="PD-401" />
              </label>

              <label>
                <span>Curso</span>
                <select formControlName="cursoId">
                  <option value="0">Selecione um curso</option>
                  @for (curso of cursos(); track curso.id) {
                    <option [value]="curso.id">{{ curso.nome }} · {{ curso.codigo }}</option>
                  }
                </select>
              </label>

              @if (form.invalid && form.touched) {
                <p class="field-error" role="alert">Preencha nome, codigo e curso vinculado.</p>
              }

              <div class="form-footer">
                <button type="submit" [disabled]="form.invalid || saving() || !cursos().length">
                  {{ saving() ? 'Salvando...' : editingId() ? 'Salvar alteracoes' : 'Criar disciplina' }}
                </button>
                <p>Relacione a disciplina ao curso correto para manter coesao da matriz curricular.</p>
              </div>
            </form>
          }
        </section>
      </section>
    </section>
  `
})
export class DisciplinaFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly cursosService = inject(CursosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly cursos = signal<Curso[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly baseLoading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    codigo: ['', [Validators.required, Validators.maxLength(40)]],
    cursoId: [0, [Validators.required, Validators.min(1)]]
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(paramMap => {
      const id = Number(paramMap.get('id'));
      this.editingId.set(Number.isFinite(id) && id > 0 ? id : null);
      this.loadPage();
    });
  }

  readonly reload = (): void => {
    this.loadPage();
  };

  readonly openCursos = (): void => {
    void this.router.navigate(['/cursos']);
  };

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
        next: disciplina => {
          void this.router.navigate(['/disciplinas', disciplina.id], {
            state: {
              successMessage: this.editingId() ? 'Disciplina atualizada com sucesso.' : 'Disciplina criada com sucesso.'
            }
          });
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  private loadPage(): void {
    this.baseLoading.set(true);
    this.loadError.set(false);
    this.errorMessage.set('');

    this.cursosService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: cursos => {
          this.cursos.set(cursos);
          const id = this.editingId();
          if (id) {
            this.fetchDisciplina(id);
            return;
          }

          this.form.reset({ nome: '', codigo: '', cursoId: 0 });
          this.baseLoading.set(false);
        },
        error: error => {
          this.loadError.set(true);
          this.baseLoading.set(false);
          this.errorMessage.set(this.describeError(error));
        }
      });
  }

  private fetchDisciplina(id: number): void {
    this.disciplinasService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.baseLoading.set(false))
      )
      .subscribe({
        next: disciplina => {
          this.form.setValue({
            nome: disciplina.nome,
            codigo: disciplina.codigo,
            cursoId: disciplina.cursoId
          });
        },
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

    return 'Nao foi possivel concluir a operacao com disciplinas.';
  }
}
