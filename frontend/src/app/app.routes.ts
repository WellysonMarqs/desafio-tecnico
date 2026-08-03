import { Routes } from '@angular/router';

import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { AlunoDetailsPageComponent } from './features/alunos/aluno-details-page.component';
import { AlunoFormPageComponent } from './features/alunos/aluno-form-page.component';
import { AlunosPageComponent } from './features/alunos/alunos-page.component';
import { CursoDetailsPageComponent } from './features/cursos/curso-details-page.component';
import { CursoFormPageComponent } from './features/cursos/curso-form-page.component';
import { CursosPageComponent } from './features/cursos/cursos-page.component';
import { DisciplinaDetailsPageComponent } from './features/disciplinas/disciplina-details-page.component';
import { DisciplinaFormPageComponent } from './features/disciplinas/disciplina-form-page.component';
import { DisciplinasPageComponent } from './features/disciplinas/disciplinas-page.component';
import { MatriculaFormPageComponent } from './features/matriculas/matricula-form-page.component';
import { MatriculasPageComponent } from './features/matriculas/matriculas-page.component';
import { TurmaDetailsPageComponent } from './features/turmas/turma-details-page.component';
import { TurmaFormPageComponent } from './features/turmas/turma-form-page.component';
import { TurmasPageComponent } from './features/turmas/turmas-page.component';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'resumo' },
  { path: 'resumo', component: DashboardPageComponent, title: 'Resumo | Gestao academica' },
  { path: 'alunos', component: AlunosPageComponent, title: 'Alunos | Gestao academica' },
  { path: 'alunos/cadastro', component: AlunoFormPageComponent, title: 'Cadastro de aluno | Gestao academica' },
  { path: 'alunos/cadastro/:id', component: AlunoFormPageComponent, title: 'Edicao de aluno | Gestao academica' },
  { path: 'alunos/:id', component: AlunoDetailsPageComponent, title: 'Detalhes do aluno | Gestao academica' },
  { path: 'cursos', component: CursosPageComponent, title: 'Cursos | Gestao academica' },
  { path: 'cursos/cadastro', component: CursoFormPageComponent, title: 'Cadastro de curso | Gestao academica' },
  { path: 'cursos/cadastro/:id', component: CursoFormPageComponent, title: 'Edicao de curso | Gestao academica' },
  { path: 'cursos/:id', component: CursoDetailsPageComponent, title: 'Detalhes do curso | Gestao academica' },
  { path: 'disciplinas', component: DisciplinasPageComponent, title: 'Disciplinas | Gestao academica' },
  { path: 'disciplinas/cadastro', component: DisciplinaFormPageComponent, title: 'Cadastro de disciplina | Gestao academica' },
  { path: 'disciplinas/cadastro/:id', component: DisciplinaFormPageComponent, title: 'Edicao de disciplina | Gestao academica' },
  { path: 'disciplinas/:id', component: DisciplinaDetailsPageComponent, title: 'Detalhes da disciplina | Gestao academica' },
  { path: 'turmas', component: TurmasPageComponent, title: 'Turmas | Gestao academica' },
  { path: 'turmas/cadastro', component: TurmaFormPageComponent, title: 'Cadastro de turma | Gestao academica' },
  { path: 'turmas/cadastro/:id', component: TurmaFormPageComponent, title: 'Edicao de turma | Gestao academica' },
  { path: 'turmas/:id', component: TurmaDetailsPageComponent, title: 'Detalhes da turma | Gestao academica' },
  { path: 'matriculas', component: MatriculasPageComponent, title: 'Listagem de matriculas | Gestao academica' },
  { path: 'matriculas/cadastro', component: MatriculaFormPageComponent, title: 'Cadastro de matricula | Gestao academica' },
  { path: '**', redirectTo: 'resumo' }
];
