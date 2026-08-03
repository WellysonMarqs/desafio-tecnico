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
import { AlunoPayload } from './aluno.model';
import { AlunosService } from './alunos.service';

@Component({
  selector: 'app-aluno-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        [title]="editingId() ? 'Editar aluno' : 'Cadastrar aluno'"
        description="Tela exclusiva para inclusao e edicao dos dados base do estudante."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="form-layout">
        <section class="card form-card" aria-labelledby="aluno-form-title">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Cadastro separado</p>
              <h3 id="aluno-form-title">{{ editingId() ? 'Atualizacao de cadastro' : 'Novo aluno' }}</h3>
            </div>
            <div class="section-actions">
              <a class="ghost-button" routerLink="/alunos">Voltar para listagem</a>
              @if (editingId()) {
                <a class="ghost-button" [routerLink]="['/alunos', editingId()]">Ver detalhes</a>
              }
            </div>
          </div>

          @if (loading()) {
            <app-page-state title="Carregando cadastro" description="Buscando dados do aluno selecionado." />
          } @else if (loadError()) {
            <app-page-state
              title="Falha ao carregar aluno"
              [description]="errorMessage() || 'Nao foi possivel carregar os dados para edicao.'"
              tone="error"
              actionLabel="Tentar novamente"
              [action]="reload"
            />
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" class="entity-form">
              <label>
                <span>Nome</span>
                <input type="text" formControlName="nome" placeholder="Ex.: Maria Souza" />
              </label>

              <label>
                <span>E-mail</span>
                <input type="email" formControlName="email" placeholder="maria.souza@universidade.edu.br" />
              </label>

              <label>
                <span>Matricula</span>
                <input type="text" formControlName="matricula" placeholder="2026A001" />
              </label>

              @if (form.invalid && form.touched) {
                <p class="field-error" role="alert">Preencha nome, e-mail valido e matricula.</p>
              }

              <div class="form-footer">
                <button type="submit" [disabled]="form.invalid || saving()">
                  {{ saving() ? 'Salvando...' : editingId() ? 'Salvar alteracoes' : 'Criar aluno' }}
                </button>
                <p>Os dados salvos ficam disponiveis imediatamente na listagem e no fluxo de matriculas.</p>
              </div>
            </form>
          }
        </section>
      </section>
    </section>
  `
})
export class AlunoFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly alunosService = inject(AlunosService);
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
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    matricula: ['', [Validators.required, Validators.maxLength(40)]]
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(paramMap => {
      const id = Number(paramMap.get('id'));
      if (Number.isFinite(id) && id > 0) {
        this.editingId.set(id);
        this.fetchAluno(id);
        return;
      }

      this.editingId.set(null);
      this.loading.set(false);
      this.loadError.set(false);
      this.form.reset({ nome: '', email: '', matricula: '' });
    });
  }

  readonly reload = (): void => {
    const id = this.editingId();
    if (id) {
      this.fetchAluno(id);
    }
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
        next: aluno => {
          void this.router.navigate(['/alunos', aluno.id], {
            state: {
              successMessage: this.editingId() ? 'Aluno atualizado com sucesso.' : 'Aluno criado com sucesso.'
            }
          });
        },
        error: error => this.errorMessage.set(this.describeError(error))
      });
  }

  private fetchAluno(id: number): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.errorMessage.set('');

    this.alunosService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: aluno => {
          this.form.setValue({ nome: aluno.nome, email: aluno.email, matricula: aluno.matricula });
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

    return 'Nao foi possivel concluir a operacao com alunos.';
  }
}
