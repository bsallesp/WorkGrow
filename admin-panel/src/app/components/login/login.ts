import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleSigninButtonModule, SocialLoginModule } from '@abacritt/angularx-social-login';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, GoogleSigninButtonModule, SocialLoginModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>Welcome to WorkGrow</h1>
        <p>Sign in to track your progress and manage collections.</p>
        
        <div class="auth-buttons">
            <as-google-signin-button></as-google-signin-button>
            <div class="divider">or</div>
            <button class="btn-guest" (click)="loginAsGuest()">Continue as Guest</button>
        </div>

        <div *ngIf="authService.user$ | async as user" class="user-info">
          <p>Logged in as {{ user.name }}</p>
          <button (click)="handleNavigation()">Continue</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: 2rem;
      background-color: #f3f4f6;
    }
    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
      min-width: 320px;
    }
    .auth-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin: 2rem 0;
    }
    .divider {
        color: #6b7280;
        font-size: 0.9rem;
    }
    .btn-guest {
        background: #4b5563;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        width: 100%;
        max-width: 240px;
    }
    .btn-guest:hover {
        background: #374151;
    }
    .user-info {
        margin-top: 1rem;
    }
    button {
        background: #2563eb;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
    }
  `]
})
export class LoginComponent implements OnInit {
  returnUrl: string = '/collections';

  constructor(
    public authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
      console.log('LoginComponent initialized');
      this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/collections';
      
      this.authService.user$.subscribe(user => {
          console.log('Auth user state:', user);
          if (user) {
              this.handleNavigation();
          }
      });
  }

  handleNavigation() {
    console.log('Navigating to:', this.returnUrl);
    // Prevent redirect loop to login or root if returnUrl is invalid
    if (this.returnUrl === '/' || this.returnUrl === '/login') {
        this.returnUrl = '/collections';
    }
    this.router.navigateByUrl(this.returnUrl);
  }

  loginAsGuest() {
    this.authService.loginAsGuest();
  }
}
