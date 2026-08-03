import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavigationGroup {
  title: string;
  description: string;
  links: Array<{ label: string; route: string; exact?: boolean }>;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <a class="skip-link" href="#conteudo-principal">Pular para o conteudo principal</a>

      <div class="content-grid">
        <nav class="sidebar" aria-label="Navegacao principal">
          @for (group of navigationGroups; track group.title) {
            <section class="nav-group">
              <div class="nav-group-header">
                <p>{{ group.title }}</p>
                <span>{{ group.description }}</span>
              </div>
              <div class="nav-links">
                @for (link of group.links; track link.route) {
                  <a
                    [routerLink]="link.route"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: link.exact ?? false }"
                  >
                    {{ link.label }}
                  </a>
                }
              </div>
            </section>
          }
        </nav>

        <main id="conteudo-principal" class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AppShellComponent {
  readonly navigationGroups: NavigationGroup[] = [
    {
      title: 'Resumo',
      description: 'visao inicial',
      links: [{ label: 'Dashboard', route: '/resumo', exact: true }]
    },
    {
      title: 'Alunos',
      description: 'base academica',
      links: [
        { label: 'Listagem', route: '/alunos', exact: true },
        { label: 'Cadastro', route: '/alunos/cadastro', exact: true }
      ]
    },
    {
      title: 'Cursos',
      description: 'estrutura institucional',
      links: [
        { label: 'Listagem', route: '/cursos', exact: true },
        { label: 'Cadastro', route: '/cursos/cadastro', exact: true }
      ]
    },
    {
      title: 'Disciplinas',
      description: 'matriz curricular',
      links: [
        { label: 'Listagem', route: '/disciplinas', exact: true },
        { label: 'Cadastro', route: '/disciplinas/cadastro', exact: true }
      ]
    },
    {
      title: 'Turmas',
      description: 'oferta e vagas',
      links: [
        { label: 'Listagem', route: '/turmas', exact: true },
        { label: 'Cadastro', route: '/turmas/cadastro', exact: true }
      ]
    },
    {
      title: 'Matriculas',
      description: 'operacao principal',
      links: [
        { label: 'Listagem', route: '/matriculas', exact: true },
        { label: 'Cadastro', route: '/matriculas/cadastro', exact: true }
      ]
    }
  ];
}
