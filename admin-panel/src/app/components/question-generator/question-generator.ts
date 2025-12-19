import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-question-generator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <h2>Question Generator</h2>
      <p class="description">Generate documentation-driven questions directly from the Knowledge Base.</p>
      
      <form [formGroup]="genForm" (ngSubmit)="onSubmit()">
        
        <!-- Source Topic -->
        <div class="input-group">
          <label for="topic">Source Topic (Knowledge Base)</label>
          <select id="topic" formControlName="sourceTopic">
            <option value="" disabled>Select a hook...</option>
            <option *ngFor="let hook of hooks" [value]="hook">{{ hook }}</option>
          </select>
        </div>

        <!-- Difficulty -->
        <div class="input-group">
          <label for="difficulty">Difficulty Level</label>
          <select id="difficulty" formControlName="difficulty">
            <option value="beginner">Beginner (Conceptual)</option>
            <option value="intermediate">Intermediate (Practical)</option>
            <option value="advanced">Advanced (Debugging)</option>
          </select>
        </div>

        <!-- Count -->
        <div class="input-group">
          <label for="count">Question Count: {{ genForm.get('count')?.value }}</label>
          <input type="range" id="count" min="1" max="10" formControlName="count">
        </div>

        <!-- Review Mode -->
        <div class="checkbox-group">
          <input type="checkbox" id="review" formControlName="reviewMode">
          <label for="review">Review Mode (Save as Draft)</label>
        </div>

        <div class="actions">
          <button type="submit" class="btn btn-primary" [disabled]="!genForm.valid || isGenerating">
            {{ isGenerating ? 'Generating...' : 'Generate Questions' }}
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .description {
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }
    
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      
      input {
        width: 1.25rem;
        height: 1.25rem;
      }
      
      label {
        margin-bottom: 0;
        cursor: pointer;
      }
    }

    .actions {
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class QuestionGeneratorComponent {
  genForm: FormGroup;
  isGenerating = false;

  hooks = [
    'useActionState', 'useCallback', 'useContext', 'useDebugValue', 
    'useDeferredValue', 'useEffect', 'useEffectEvent', 'useId', 
    'useImperativeHandle', 'useInsertionEffect', 'useLayoutEffect', 
    'useMemo', 'useOptimistic', 'useReducer', 'useRef', 
    'useState', 'useSyncExternalStore', 'useTransition'
  ];

  constructor(private fb: FormBuilder) {
    this.genForm = this.fb.group({
      sourceTopic: ['', Validators.required],
      difficulty: ['beginner', Validators.required],
      count: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      reviewMode: [true]
    });
  }

  onSubmit() {
    if (this.genForm.valid) {
      this.isGenerating = true;
      console.log('Generating questions with config:', this.genForm.value);
      
      // Simulate API call
      setTimeout(() => {
        this.isGenerating = false;
        alert('Simulation: Request sent to Azure Functions!');
      }, 1500);
    }
  }
}
