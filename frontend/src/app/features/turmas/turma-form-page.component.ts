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
import { Disciplina } from '../disciplinas/disciplina.model';
import { DisciplinasService } from '../disciplinas/disciplinas.service';
import { TurmaPayload, TurmaStatus } from './turma.model';
import { TurmasService } from './turmas.service';

@Component({
  selector: 'app-turma-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeaderComponent, PageStateComponent, FeedbackBannerComponent],
  template: `
    <section class="feature-page">
      <app-page-header
        [title]="editingId() ? 'Editar turma' : 'Cadastrar turma'"
        description="Tela separada para configurar oferta, capacidade e status das turmas."
      />

      <app-feedback-banner [message]="successMessage()" tone="success" />
      <app-feedback-banner [message]="errorMessage()" tone="error" />

      <section class="form-layout">
        <section class="card form-card" aria-labelledby="turma-form-title">
          <div class="section-heading">
            <div>
              <p class="section-kicker">Cadastro separado</p>
              <h3 id="turma-form-title">{{ editingId() ? 'Atualizacao de turma' : 'Nova turma' }}</h3>
            </div>
            <div class="section-actions">
              <a class="ghost-button" routerLink="/turmas">Voltar para listagem</a>
              @if (editingId()) {
                <a class="ghost-button" [routerLink]="['/turmas', editingId()]">Ver detalhes</a>
              }
            </div>
          </div>

          @if (baseLoading()) {
            <app-page-state title="Carregando cadastro" description="Buscando turma e disciplinas de apoio." />
          } @else if (loadError()) {
            <app-page-state
              title="Falha ao carregar turma"
              [description]="errorMessage() || 'Nao foi possivel carregar os dados para edicao.'"
              tone="error"
              actionLabel="Tentar novamente"
              [action]="reload"
            />
          } @else if (!disciplinas().length) {
            <app-page-state
              title="Cadastre uma disciplina antes"
              description="Turmas dependem de uma disciplina existente na base."
              actionLabel="Abrir disciplinas"
              [action]="openDisciplinas"
            />
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" class="entity-form">
              <label>
                <span>Codigo</span>
                <input type="text" formControlName="codigo" placeholder="TUR-2026-01" />
              </label>

              <label>
                <span>Disciplina</span>
                <select formControlName="disciplinaId">
                  <option value="0">Selecione uma disciplina</option>
                  @for (disciplina of disciplinas(); track disciplina.id) {
                    <option [value]="disciplina.id">{{ disciplina.nome }} · {{ disciplina.codigo }}</option>
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

              <div class="form-footer">
                <button type="submit" [disabled]="form.invalid || saving() || !disciplinas().length">
                  {{ saving() ? 'Salvando...' : editingId() ? 'Salvar alteracoes' : 'Criar turma' }}
                </button>
                <p>Aqui ficam as regras operacionais que afetam matricula e disponibilidade de vagas.</p>
              </div>
            </form>
          }
        </section>
      </section>
    </section>
  `
})
export class TurmaFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly turmasService = inject(TurmasService);
  private readonly disciplinasService = inject(DisciplinasService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly disciplinas = signal<Disciplina[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly baseLoading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(40)]],
    disciplinaId: [0, [Validators.required, Validators.min(1)]],
    capacidade: [1, [Validators.required, Validators.min(1)]],
    status: ['ABERTA' as TurmaStatus, [Validators.required]]
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

  readonly openDisciplinas = (): void => {
    void this.router.navigate(['/disciplinas']);
  };

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
        next: turma => {
          void this.router.navigate(['/turmas', turma.id], {
            state: {
              successMessage: this.editingId() ? 'Turma atualizada com sucesso.' : 'Turma criada com sucesso.'
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

    this.disciplinasService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: disciplinas => {
          this.disciplinas.set(disciplinas);
          const id = this.editingId();
          if (id) {
            this.fetchTurma(id);
            return;
          }

          this.form.reset({ codigo: '', disciplinaId: 0, capacidade: 1, status: 'ABERTA' });
          this.baseLoading.set(false);
        },
        error: error => {
          this.loadError.set(true);
          this.baseLoading.set(false);
          this.errorMessage.set(this.describeError(error));
        }
      });
  }

  private fetchTurma(id: number): void {
    this.turmasService
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.baseLoading.set(false))
      )
      .subscribe({
        next: turma => {
          this.form.setValue({
            codigo: turma.codigo,
            disciplinaId: turma.disciplinaId,
            capacidade: turma.capacidade,
            status: turma.status
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

    return 'Nao foi possivel concluir a operacao com turmas.';
  }
}
