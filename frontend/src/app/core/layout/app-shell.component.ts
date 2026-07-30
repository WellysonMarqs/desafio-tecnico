import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <a class="skip-link" href="#conteudo-principal">Pular para o conteudo principal</a>

      <header class="topbar">
        <div>
          <p class="eyebrow">Sistema academico</p>
          <h1>Gestao academica</h1>
          <p class="subtitle">
            Cadastros base de alunos, cursos, disciplinas, turmas e fluxo principal de matriculas com integracao REST.
          </p>
        </div>
      </header>

      <div class="content-grid">
        <nav class="sidebar" aria-label="Navegacao principal">
          <a routerLink="/alunos" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Alunos
          </a>
          <a routerLink="/cursos" routerLinkActive="active">Cursos</a>
          <a routerLink="/disciplinas" routerLinkActive="active">Disciplinas</a>
          <a routerLink="/turmas" routerLinkActive="active">Turmas</a>
          <a routerLink="/matriculas" routerLinkActive="active">Matriculas</a>
        </nav>

        <main id="conteudo-principal" class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AppShellComponent {}
