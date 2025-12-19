import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <div class="app-container">
      <header class="app-header">
        <div class="logo">
            <h1>WorkGrow Admin</h1>
        </div>
        <nav>
            <a routerLink="/" class="nav-link">Generate</a>
            <a routerLink="/collections" class="nav-link">Collections</a>
            <ng-container *ngIf="auth.user$ | async as user; else loginBtn">
                <span class="user-name">{{ user.name }}</span>
                <button (click)="auth.signOut()" class="btn-link">Sign Out</button>
            </ng-container>
            <ng-template #loginBtn>
                <a routerLink="/login" class="nav-link">Login</a>
            </ng-template>
        </nav>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .app-header {
      margin-bottom: 3rem;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    nav {
        display: flex;
        gap: 1.5rem;
        align-items: center;
    }

    .nav-link {
        text-decoration: none;
        color: #374151;
        font-weight: 500;
    }

    .nav-link:hover {
        color: #2563eb;
    }

    .btn-link {
        background: none;
        border: none;
        color: #dc2626;
        cursor: pointer;
        font-size: 1rem;
    }
  `]
})
export class AppComponent {
  title = 'admin-panel';
  auth = inject(AuthService);
}
