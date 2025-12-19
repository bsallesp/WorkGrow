import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CollectionService, Collection, Performance } from '../../services/collection.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <header>
        <h1>My Collections</h1>
        <button class="btn btn-secondary" routerLink="/">Generate New Questions</button>
      </header>

      <div class="stats-overview" *ngIf="performances.length > 0">
          <h2>Recent Performance</h2>
          <div class="perf-list">
              <div *ngFor="let p of performances" class="perf-item">
                  <span class="perf-col">{{ p.collectionName }}</span>
                  <span class="perf-score" [class.good]="(p.score/p.totalQuestions) > 0.7">{{ p.score }}/{{ p.totalQuestions }}</span>
                  <span class="perf-date">{{ p.date | date:'short' }}</span>
              </div>
          </div>
      </div>

      <div class="collections-grid">
        <div *ngIf="loading" class="loading-state">
            <p>Loading collections...</p>
        </div>

        <div *ngIf="error" class="error-state">
            <p>{{ error }}</p>
            <button class="btn btn-primary" (click)="loadData()">Retry</button>
        </div>

        <ng-container *ngIf="!loading && !error">
            <div *ngFor="let col of collections" class="collection-card" (click)="startQuiz(col.id)">
              <h3>{{ col.name }}</h3>
              <div class="meta">
                <span>{{ col.questionsCount }} Questions</span>
                <span *ngIf="col.tags?.length" class="tags">{{ col.tags?.slice(0, 3)?.join(', ') }}</span>
              </div>
              <button class="btn btn-primary">Start Quiz</button>
            </div>
            
            <div *ngIf="collections.length === 0" class="empty-state">
                <p>No collections found. Generate some questions and save them!</p>
            </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .collections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .collection-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      cursor: pointer;
      transition: transform 0.2s;
      border: 1px solid #e5e7eb;
    }
    .collection-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .meta {
      color: #6b7280;
      font-size: 0.9rem;
      margin: 1rem 0;
      display: flex;
      justify-content: space-between;
    }
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-primary {
      background: #2563eb;
      color: white;
      width: 100%;
    }
    .btn-secondary {
      background: #e5e7eb;
      color: #374151;
    }
    .stats-overview {
        margin-bottom: 2rem;
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }
    .perf-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
    }
    .perf-score.good {
        color: #059669;
        font-weight: bold;
    }
    .loading-state, .error-state, .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 8px;
        color: #6b7280;
    }
    .error-state {
        color: #dc2626;
    }
  `]
})
export class CollectionsComponent implements OnInit {
  collections: Collection[] = [];
  performances: Performance[] = [];
  loading = false;
  error: string | null = null;

  constructor(
      private collectionService: CollectionService, 
      private router: Router,
      private authService: AuthService
    ) {}

  ngOnInit() {
    console.log('CollectionsComponent initialized');
    
    // Subscribe to user changes to reload data or redirect
    this.authService.user$.subscribe(user => {
        if (!user) {
            // If user logs out while on this page, redirect to home
            this.router.navigate(['/']);
        } else {
            this.loadData();
        }
    });
  }

  loadData() {
    this.loading = true;
    this.error = null;
    console.log('Loading collections data...');
    
    this.collectionService.getCollections().subscribe({
        next: (cols) => {
            console.log('Collections loaded:', cols);
            this.collections = cols;
            this.loading = false;
        },
        error: (err) => {
            console.error('Error loading collections:', err);
            this.error = 'Failed to load collections. Please try again.';
            this.loading = false;
        }
    });

    this.collectionService.getPerformance().subscribe({
        next: (perfs) => {
            console.log('Performance loaded:', perfs);
            this.performances = perfs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
        },
        error: (err) => {
            console.error('Error loading performance:', err);
            // Don't block main UI for performance load error
        }
    });
  }

  startQuiz(id: string) {
    this.router.navigate(['/quiz', id]);
  }
}
