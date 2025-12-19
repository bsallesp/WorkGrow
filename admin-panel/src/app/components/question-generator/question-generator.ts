import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocumentationService, Domain, Topic, Question, GenerateRequest } from '../../services/documentation';

@Component({
  selector: 'app-question-generator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <!-- Quick Catalog View -->
    <div class="card catalog-card" *ngIf="!isLoading && availableDomains.length > 0">
      <h2>Quick Catalog Generation</h2>
      <p class="description">Browse available documentation and instantly generate questions.</p>
      
      <div *ngFor="let domain of availableDomains" class="domain-section">
        <div class="domain-header">
            <h3 class="domain-title">{{ domain.name }}</h3>
            <button class="btn btn-sm btn-primary" (click)="openAutoDialog(domain.id)">
                Auto Generate from {{ domain.name }}
            </button>
        </div>
        <div class="topic-grid">
          <div *ngFor="let topic of domain.topics" class="topic-item">
            <div class="topic-info">
              <span class="topic-name">{{ topic.name }}</span>
              <span class="topic-type badge">{{ topic.type }}</span>
            </div>
            <!-- Auto Generate removed from here -->
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Custom Form -->
    <div class="card">
      <h2>Custom Generator</h2>
      <p class="description">Fine-tune generation parameters (Difficulty, Count, etc).</p>
      
      <form [formGroup]="genForm" (ngSubmit)="onSubmit()">
        
        <!-- Domain Selection (e.g., React 19, Postgres) -->
        <div class="input-group">
          <label for="domain">Documentation Domain</label>
          <select id="domain" formControlName="domain" (change)="onDomainChange()">
            <option value="" disabled>Select a domain...</option>
            <option *ngFor="let domain of availableDomains" [value]="domain.id">{{ domain.name }}</option>
          </select>
          <div *ngIf="isLoading" class="loading-hint">Loading domains...</div>
        </div>

        <!-- Topic Selection (Dynamic based on Domain) -->
        <div class="input-group">
          <label for="topic">Source Topic</label>
          <select id="topic" formControlName="sourceTopic">
            <option value="" disabled>Select a topic...</option>
            <option *ngFor="let topic of currentTopics" [value]="topic.id">{{ topic.name }} ({{ topic.type }})</option>
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
            {{ isGenerating ? 'Generating...' : 'Generate Custom' }}
          </button>
        </div>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

      </form>
    </div>

    <!-- Results Preview -->
    <div class="card results-card" *ngIf="generatedQuestions.length > 0">
      <h3>Generated Questions</h3>
      <div *ngIf="generatedQuestions[0].collectionName" class="collection-badge">
        Collection: {{ generatedQuestions[0].collectionName }}
      </div>

      <div *ngFor="let q of generatedQuestions; let i = index" class="question-item">
        <div class="tags-container" *ngIf="q.tags && q.tags.length > 0">
            <span class="tag-badge" *ngFor="let tag of q.tags">{{ tag }}</span>
        </div>
        <p class="q-text"><strong>{{ i + 1 }}. {{ q.content.question_text }}</strong></p>
        <ul class="q-options">
          <li *ngFor="let opt of q.content.options; let j = index" 
              [class.correct]="j === q.content.correct_answer_index">
            {{ opt }}
          </li>
        </ul>
        <p class="q-explanation"><em>Explanation: {{ q.explanation }}</em></p>
      </div>
    </div>

    <!-- Auto Generate Modal -->
    <div class="modal-overlay" *ngIf="showAutoDialog">
      <div class="modal-content">
        <h3>Generate Questions for {{ selectedAutoDomainId }}</h3>
        <p>This will pick a random topic from the domain.</p>
        
        <div class="input-group">
            <label>Number of Questions</label>
            <input type="number" [(ngModel)]="autoCount" min="1" max="10" class="form-control">
        </div>

        <div class="input-group">
            <label>Collection Name (Optional)</label>
            <input type="text" [(ngModel)]="autoCollectionName" placeholder="e.g. My React Review" class="form-control">
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="closeAutoDialog()">Cancel</button>
          <button class="btn btn-primary" (click)="confirmAutoGenerate()" [disabled]="isGenerating">
            {{ isGenerating ? 'Generating...' : 'Generate Now' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ... Existing Styles ... */
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

    .loading-hint {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .error-message {
      color: var(--error-color);
      margin-top: 1rem;
      font-size: 0.9rem;
    }

    .results-card {
      margin-top: 2rem;
    }

    .collection-badge {
        background: #dbeafe;
        color: #1e40af;
        padding: 0.5rem 1rem;
        border-radius: var(--radius-sm);
        margin-bottom: 1.5rem;
        font-weight: 500;
        display: inline-block;
    }

    .question-item {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }
    }

    .tags-container {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
    }

    .tag-badge {
        font-size: 0.7rem;
        background: #f3f4f6;
        color: #4b5563;
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        border: 1px solid #e5e7eb;
    }

    .q-text {
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .q-options {
      list-style-type: none;
      padding-left: 1rem;
      margin-bottom: 0.5rem;

      li {
        margin-bottom: 0.25rem;
        
        &.correct {
          color: var(--success-color);
          font-weight: 500;
        }
      }
    }

    .q-explanation {
      font-size: 0.9rem;
      color: var(--text-secondary);
      background-color: var(--background-color);
      padding: 0.5rem;
      border-radius: var(--radius-sm);
    }

    /* New Styles for Catalog Grid */
    .catalog-card {
        margin-bottom: 2rem;
    }

    .domain-section {
        margin-bottom: 1.5rem;
    }

    .domain-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
    }

    .domain-title {
        font-size: 1.1rem;
        color: var(--text-primary);
        margin-bottom: 0;
        border-bottom: none;
        padding-bottom: 0;
    }

    .topic-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
    }

    .topic-item {
        background: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s;

        &:hover {
            border-color: var(--primary-color);
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
    }

    .topic-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .topic-name {
        font-weight: 500;
    }

    .badge {
        font-size: 0.75rem;
        padding: 0.1rem 0.5rem;
        border-radius: 1rem;
        background: #e0e7ff;
        color: #4338ca;
        display: inline-block;
        width: fit-content;
    }

    .btn-sm {
        padding: 0.25rem 0.75rem;
        font-size: 0.875rem;
    }

    .btn-outline {
        background: transparent;
        border: 1px solid var(--primary-color);
        color: var(--primary-color);
        
        &:hover {
            background: var(--primary-color);
            color: white;
        }
    }

    /* Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
    }

    .modal-content {
        background: white;
        padding: 2rem;
        border-radius: var(--radius-md);
        width: 90%;
        max-width: 400px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .form-control {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        margin-top: 0.5rem;
    }
  `]
})
export class QuestionGeneratorComponent implements OnInit {
  genForm: FormGroup;
  isGenerating = false;
  isLoading = false;
  errorMessage = '';

  availableDomains: Domain[] = [];
  currentTopics: Topic[] = [];
  generatedQuestions: Question[] = [];

  // Auto Generate State
  showAutoDialog = false;
  selectedAutoDomainId: string | null = null;
  autoCount = 3;
  autoCollectionName = '';

  constructor(
    private fb: FormBuilder,
    private docService: DocumentationService
  ) {
    this.genForm = this.fb.group({
      domain: ['', Validators.required],
      sourceTopic: ['', Validators.required],
      difficulty: ['beginner', Validators.required],
      count: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      reviewMode: [true]
    });
  }

  ngOnInit() {
    this.loadCatalog();
  }

  loadCatalog() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.docService.getCatalog().subscribe({
      next: (domains) => {
        this.availableDomains = domains;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load catalog', err);
        this.errorMessage = 'Failed to load documentation catalog. Ensure backend is running.';
        this.isLoading = false;
      }
    });
  }

  onDomainChange() {
    const selectedDomainId = this.genForm.get('domain')?.value;
    const domain = this.availableDomains.find(d => d.id === selectedDomainId);
    
    this.currentTopics = domain ? domain.topics : [];
    
    // Reset topic selection
    this.genForm.patchValue({ sourceTopic: '' });
  }

  onSubmit() {
    if (this.genForm.valid) {
      const request: GenerateRequest = {
        domainId: this.genForm.value.domain,
        topicId: this.genForm.value.sourceTopic,
        difficulty: this.genForm.value.difficulty,
        count: this.genForm.value.count
      };
      this.triggerGeneration(request);
    }
  }

  // Auto Generate Logic
  openAutoDialog(domainId: string) {
    this.selectedAutoDomainId = domainId;
    this.autoCount = 3; // Reset to default
    this.autoCollectionName = ''; // Reset
    this.showAutoDialog = true;
  }

  closeAutoDialog() {
    this.showAutoDialog = false;
    this.selectedAutoDomainId = null;
  }

  confirmAutoGenerate() {
    if (this.selectedAutoDomainId) {
        const request: GenerateRequest = {
            domainId: this.selectedAutoDomainId,
            topicId: '', // Backend will pick random
            difficulty: 'intermediate', // Default to intermediate for quick gen
            count: this.autoCount,
            collectionName: this.autoCollectionName || undefined
        };
        this.showAutoDialog = false;
        this.triggerGeneration(request);
    }
  }

  triggerGeneration(request: GenerateRequest) {
    this.isGenerating = true;
    this.errorMessage = '';
    this.generatedQuestions = [];

    console.log('Sending request to Azure Functions:', request);
      
    this.docService.generateQuestions(request).subscribe({
      next: (questions) => {
        this.generatedQuestions = questions;
        this.isGenerating = false;
      },
      error: (err) => {
        console.error('Generation failed', err);
        this.errorMessage = 'Failed to generate questions. Please try again.';
        this.isGenerating = false;
      }
    });
  }
}
