import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main>
      <h1>Desafio Tecnico Academico</h1>
      <p>Frontend inicial estruturado para evolucao por features.</p>
    </main>
  `
})
class AppComponent {}

bootstrapApplication(AppComponent).catch(err => console.error(err));
