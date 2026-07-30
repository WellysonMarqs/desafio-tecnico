import { Routes } from '@angular/router';

import { AlunosPageComponent } from './features/alunos/alunos-page.component';
import { CursosPageComponent } from './features/cursos/cursos-page.component';
import { DisciplinasPageComponent } from './features/disciplinas/disciplinas-page.component';
import { MatriculasPageComponent } from './features/matriculas/matriculas-page.component';
import { TurmasPageComponent } from './features/turmas/turmas-page.component';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'alunos' },
  { path: 'alunos', component: AlunosPageComponent, title: 'Alunos | Gestao academica' },
  { path: 'cursos', component: CursosPageComponent, title: 'Cursos | Gestao academica' },
  { path: 'disciplinas', component: DisciplinasPageComponent, title: 'Disciplinas | Gestao academica' },
  { path: 'turmas', component: TurmasPageComponent, title: 'Turmas | Gestao academica' },
  { path: 'matriculas', component: MatriculasPageComponent, title: 'Matriculas | Gestao academica' },
  { path: '**', redirectTo: 'alunos' }
];
