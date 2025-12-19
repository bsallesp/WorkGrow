import { Component } from '@angular/core';
import { QuestionGeneratorComponent } from './components/question-generator/question-generator';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [QuestionGeneratorComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>WorkGrow Admin</h1>
      </header>
      <main>
        <app-question-generator></app-question-generator>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .app-header {
      margin-bottom: 3rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }
  `]
})
export class AppComponent {
  title = 'admin-panel';
}
