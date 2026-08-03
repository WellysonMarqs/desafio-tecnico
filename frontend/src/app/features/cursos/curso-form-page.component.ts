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
import { CursoPayload } from './curso.model';
import { CursosService } from './cursos.service';

@Component({
  selector: 'app-curso-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        [title]="editingId() ? 'Editar curso' : 'Cadastrar curso'"
        description="Tela isolada para manutencao da estrutura de cursos da instituicao."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="form-layout">
        <section class="card form-card" aria-labelledby="curso-form-title">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Cadastro separado</p>
              <h3 id="curso-form-title">{{ editingId() ? 'Atualizacao de curso' : 'Novo curso' }}</h3>
            </div>
            <div class="section-actions">
              <a class="ghost-button" routerLink="/cursos">Voltar para listagem</a>
              @if (editingId()) {
                <a class="ghost-button" [routerLink]="['/cursos', editingId()]">Ver detalhes</a>
              }
            </div>
          </div>

          @if (loading()) {
            <app-page-state title="Carregando cadastro" description="Buscando dados do curso selecionado." />
          } @else if (loadError()) {
            <app-page-state
              title="Falha ao carregar curso"
              [description]="errorMessage() || 'Nao foi possivel carregar os dados para edicao.'"
              tone="error"
              actionLabel="Tentar novamente"
              [action]="reload"
            />
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" class="entity-form">
              <label>
                <span>Nome</span>
                <input type="text" formControlName="nome" placeholder="Ex.: Engenharia de Software" />
              </label>

              <label>
                <span>Codigo</span>
                <input type="text" formControlName="codigo" placeholder="ENG-SW" />
              </label>

              @if (form.invalid && form.touched) {
                <p class="field-error" role="alert">Preencha nome e codigo do curso.</p>
              }

              <div class="form-footer">
                <button type="submit" [disabled]="form.invalid || saving()">
                  {{ saving() ? 'Salvando...' : editingId() ? 'Salvar alteracoes' : 'Criar curso' }}
                </button>
                <p>Os cursos estruturam disciplinas, turmas e a navegacao curricular do sistema.</p>
              </div>
            </form>
          }
        </section>
      </section>
    </section>
  `
})
export class CursoFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cursosService = inject(CursosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly editingId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    codigo: ['', [Validators.required, Validators.maxLength(40)]]
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(paramMap => {
      const id = Number(paramMap.get('id'));
      if (Number.isFinite(id) && id > 0) {
        this.editingId.set(id);
        this.fetchCurso(id);
        return;
      }

      this.editingId.set(null);
      this.loading.set(false);
      this.loadError.set(false);
      this.form.reset({ nome: '', codigo: '' });
    });
  }

  readonly reload = (): void => {
    const id = this.editingId();
    if (id) {
      this.fetchCurso(id);
    }
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
        next: curso => {
          void this.router.navigate(['/cursos', curso.id], {
            state: {
              successMessage: this.editingId() ? 'Curso atualizado com sucesso.' : 'Curso criado com sucesso.'
            }
          });
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  private fetchCurso(id: number): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.errorMessage.set('');

    this.cursosService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: curso => {
          this.form.setValue({ nome: curso.nome, codigo: curso.codigo });
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

    return 'Nao foi possivel concluir a operacao com cursos.';
  }
}
