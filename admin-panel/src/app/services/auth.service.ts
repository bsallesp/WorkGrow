import { Injectable } from '@angular/core';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject: BehaviorSubject<SocialUser | null>;
  user$: Observable<SocialUser | null>;
  
  constructor(private socialAuthService: SocialAuthService) {
    console.log('AuthService initialized');
    
    // Initialize with guest user if persisted, to avoid race conditions
    const initialUser = this.getPersistedGuestUser();
    this.userSubject = new BehaviorSubject<SocialUser | null>(initialUser);
    this.user$ = this.userSubject.asObservable();

    this.socialAuthService.authState.subscribe((user) => {
      console.log('SocialAuth state change:', user);
      
      // If a Google user is detected, they take precedence
      if (user) {
        this.userSubject.next(user);
        if (user.idToken) {
            localStorage.setItem('google_token', user.idToken);
            localStorage.removeItem('guest_mode');
        }
      } else {
        // If no Google user, check if we should be in guest mode
        // Only clear user if we are NOT in guest mode
        if (localStorage.getItem('guest_mode') === 'true') {
            console.log('Keeping guest session active despite no Google user');
            if (!this.userSubject.value) {
                this.setGuestUser();
            }
        } else {
            // Only clear if we were not already null (to avoid noise)
            if (this.userSubject.value) {
                this.userSubject.next(null);
            }
        }
      }
    });
  }

  private getPersistedGuestUser(): SocialUser | null {
      if (localStorage.getItem('guest_mode') === 'true') {
          return {
            provider: 'GUEST',
            id: 'demo-user-id',
            email: 'guest@workgrow.demo',
            name: 'Guest User',
            photoUrl: 'https://ui-avatars.com/api/?name=Guest+User',
            firstName: 'Guest',
            lastName: 'User',
            authToken: 'DEMO_TOKEN',
            idToken: 'DEMO_TOKEN',
            authorizationCode: '',
            response: null
        };
      }
      return null;
  }

  loginAsGuest() {
      console.log('Logging in as guest');
      localStorage.setItem('guest_mode', 'true');
      this.setGuestUser();
  }

  private setGuestUser() {
      const guestUser: SocialUser = {
          provider: 'GUEST',
          id: 'demo-user-id',
          email: 'guest@workgrow.demo',
          name: 'Guest User',
          photoUrl: 'https://ui-avatars.com/api/?name=Guest+User',
          firstName: 'Guest',
          lastName: 'User',
          authToken: 'DEMO_TOKEN',
          idToken: 'DEMO_TOKEN',
          authorizationCode: '',
          response: null
      };
      this.userSubject.next(guestUser);
  }

  get currentUser(): SocialUser | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  get token(): string | null {
    return this.currentUser?.idToken || localStorage.getItem('google_token');
  }

  getAuthHeaders(): { [header: string]: string } {
    const token = this.token;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
  
  signOut() {
      this.socialAuthService.signOut().catch(() => {}); // Catch if not logged in with provider
      localStorage.removeItem('guest_mode');
      localStorage.removeItem('google_token');
      this.userSubject.next(null);
  }
}
