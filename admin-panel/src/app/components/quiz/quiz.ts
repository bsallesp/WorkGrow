import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CollectionService, Collection } from '../../services/collection.service';
import { timeout } from 'rxjs';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="loading-state" *ngIf="loading">
        <p>Loading quiz...</p>
        <div class="debug-logs">
            <p *ngFor="let log of debugInfo">{{ log }}</p>
        </div>
        <button class="btn btn-secondary mt-4" (click)="manualRetry()">Force Reload (Fetch)</button>
    </div>

    <div class="error-state" *ngIf="error">
        <p>{{ error }}</p>
        <div class="debug-logs">
            <p *ngFor="let log of debugInfo">{{ log }}</p>
        </div>
        <button class="btn btn-primary" routerLink="/collections">Go Back</button>
    </div>

    <div class="container" *ngIf="collection && !loading">
      <header>
        <h1>{{ collection.name }}</h1>
        <button class="btn btn-text" routerLink="/collections">Exit</button>
      </header>

      <div *ngIf="!finished" class="quiz-area">
        <div class="progress-bar">
            <div class="fill" [style.width.%]="(currentIndex / collection.questions.length) * 100"></div>
        </div>
        <div class="question-count">Question {{ currentIndex + 1 }} of {{ collection.questions.length }}</div>

        <div class="question-card">
          <h3>{{ currentQuestion.content.question_text }}</h3>
          
          <div class="options">
            <button 
                *ngFor="let opt of currentQuestion.content.options; let i = index" 
                class="option-btn" 
                [class.selected]="selectedAnswer === i"
                (click)="selectAnswer(i)">
                {{ opt }}
            </button>
          </div>

          <div class="actions">
              <button class="btn btn-primary" [disabled]="selectedAnswer === null" (click)="submitAnswer()">
                  {{ currentIndex === collection.questions.length - 1 ? 'Finish' : 'Next' }}
              </button>
          </div>
        </div>
      </div>

      <div *ngIf="finished" class="results-area">
          <div class="score-card">
              <h2>Quiz Complete!</h2>
              <div class="score-display">
                  {{ score }} / {{ collection.questions.length }}
              </div>
              <p>Great job practicing!</p>
              <button class="btn btn-primary" routerLink="/collections">Back to Collections</button>
          </div>

          <div class="review-list">
              <h3>Review</h3>
              <div *ngFor="let ans of answers; let i = index" class="review-item" [class.correct]="ans.isCorrect" [class.wrong]="!ans.isCorrect">
                  <p><strong>Q{{i+1}}:</strong> {{ collection.questions[i].content.question_text }}</p>
                  <p>Your Answer: {{ collection.questions[i].content.options[ans.selected] }}</p>
                  <p *ngIf="!ans.isCorrect">Correct Answer: {{ collection.questions[i].content.options[collection.questions[i].content.correct_answer_index] }}</p>
                  <div class="explanation">
                      <small>{{ collection.questions[i].explanation }}</small>
                  </div>
              </div>
          </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .quiz-area {
        max-width: 600px;
        margin: 0 auto;
    }
    .progress-bar {
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 1rem;
    }
    .fill {
        height: 100%;
        background: #2563eb;
        transition: width 0.3s ease;
    }
    .question-card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin: 2rem 0;
    }
    .option-btn {
        padding: 1rem;
        text-align: left;
        background: #f9fafb;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .option-btn:hover {
        background: #f3f4f6;
    }
    .option-btn.selected {
        border-color: #2563eb;
        background: #eff6ff;
    }
    .actions {
        display: flex;
        justify-content: flex-end;
    }
    .btn {
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 600;
    }
    .btn-primary {
        background: #2563eb;
        color: white;
    }
    .btn-primary:disabled {
        background: #93c5fd;
        cursor: not-allowed;
    }
    .results-area {
        text-align: center;
    }
    .score-display {
        font-size: 4rem;
        font-weight: bold;
        color: #2563eb;
        margin: 1rem 0;
    }
    .review-list {
        margin-top: 3rem;
        text-align: left;
    }
    .review-item {
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        background: white;
        border-left: 4px solid transparent;
    }
    .review-item.correct {
        border-left-color: #059669;
        background: #ecfdf5;
    }
    .review-item.wrong {
        border-left-color: #dc2626;
        background: #fef2f2;
    }
  `]
})
export class QuizComponent implements OnInit, OnDestroy {
  collection: any = null;
  currentIndex = 0;
  selectedAnswer: number | null = null;
  answers: any[] = [];
  finished = false;
  score = 0;

  loading = true;
  error: string | null = null;
  debugInfo: string[] = [];
  
  private safetyTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private collectionService: CollectionService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  addLog(msg: string) {
      console.log(msg);
      this.ngZone.run(() => {
          this.debugInfo.push(new Date().toISOString().split('T')[1] + ': ' + msg);
          this.cdr.detectChanges(); // Force UI update immediately
      });
  }

  tryFetchFallback(id: string) {
      this.addLog('Attempting fetch fallback...');
      const url = `http://localhost:7071/api/Collections/${id}`;
      fetch(url, {
          headers: {
              'Authorization': 'Bearer DEMO_TOKEN' // Force demo token for test
          }
      })
      .then(res => {
          this.addLog(`Fetch status: ${res.status}`);
          return res.json();
      })
      .then(data => {
          this.ngZone.run(() => {
              this.addLog('Fetch successful! Using fallback data.');
              this.collection = data;
              this.loading = false;
              this.error = null;
              this.cdr.detectChanges();
          });
      })
      .catch(err => {
          this.ngZone.run(() => {
              this.addLog('Fetch failed too: ' + err.message);
              this.error = 'Failed to load quiz. Even fallback failed: ' + err.message;
              this.cdr.detectChanges();
          });
      });
  }

  manualRetry() {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
          this.loading = true;
          this.error = null;
          this.tryFetchFallback(id);
      }
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.addLog(`Quiz initialized with ID: ${id}`);
    
    if (id) {
        // Safety Valve: Force fetch fallback if Angular HTTP hangs for more than 3 seconds
        // Running outside Angular to ensure timer works even if Zone is unstable
        this.ngZone.runOutsideAngular(() => {
            this.safetyTimeout = setTimeout(() => {
                this.ngZone.run(() => {
                    if (this.loading) {
                        this.addLog('Safety timeout triggered! Switching to direct fetch...');
                        this.tryFetchFallback(id);
                    }
                });
            }, 3000);
        });

        this.addLog('Calling getCollection with timeout...');
        this.collectionService.getCollection(id)
        .pipe(timeout(5000))
        .subscribe({
            next: (col) => {
                this.ngZone.run(() => {
                    this.addLog('Collection loaded successfully');
                    this.collection = col;
                    this.loading = false;
                    this.clearSafetyTimeout();
                    this.cdr.detectChanges();
                });
            },
            error: (err) => {
                this.ngZone.run(() => {
                    this.addLog('Error loading collection (or timeout): ' + JSON.stringify(err));
                    console.error('Error loading collection:', err);
                    // Don't set error immediately, let fallback try first
                    
                    // Fallback attempt with fetch to diagnose
                    this.tryFetchFallback(id);
                });
            },
            complete: () => {
                this.addLog('Subscription completed');
            }
        });
    } else {
        this.addLog('No ID found in route parameters');
        console.error('No ID found in route parameters');
        this.error = 'Invalid quiz ID.';
        this.loading = false;
    }
  }

  ngOnDestroy() {
      this.clearSafetyTimeout();
  }

  clearSafetyTimeout() {
      if (this.safetyTimeout) {
          clearTimeout(this.safetyTimeout);
          this.safetyTimeout = null;
      }
  }

  get currentQuestion() {
      return this.collection?.questions[this.currentIndex];
  }

  selectAnswer(index: number) {
      this.selectedAnswer = index;
  }

  submitAnswer() {
      if (this.selectedAnswer === null) return;

      const isCorrect = this.selectedAnswer === this.currentQuestion.content.correct_answer_index;
      if (isCorrect) this.score++;

      this.answers.push({
          questionId: this.currentQuestion.id,
          selected: this.selectedAnswer,
          isCorrect
      });

      this.selectedAnswer = null;

      if (this.currentIndex < this.collection.questions.length - 1) {
          this.currentIndex++;
      } else {
          this.finishQuiz();
      }
  }

  finishQuiz() {
      this.finished = true;
      this.collectionService.savePerformance(
          this.collection.id,
          this.score,
          this.collection.questions.length,
          this.answers
      ).subscribe();
  }
}
