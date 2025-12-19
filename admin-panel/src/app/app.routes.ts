import { Routes, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { QuestionGeneratorComponent } from './components/question-generator/question-generator';
import { LoginComponent } from './components/login/login';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

const authGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    
    // Check both service state and local storage for maximum reliability
    const isLoggedIn = auth.isLoggedIn;
    const hasGoogleToken = !!localStorage.getItem('google_token');
    const isGuest = localStorage.getItem('guest_mode') === 'true';
    
    console.log('AuthGuard:', { 
        path: state.url,
        isLoggedIn, 
        hasGoogleToken, 
        isGuest 
    });

    if (isLoggedIn || hasGoogleToken || isGuest) {
        return true;
    }

    // Auto-enable guest mode if accessing a quiz directly to prevent redirect loops/friction
    if (state.url.startsWith('/quiz/')) {
        console.log('AuthGuard: Auto-enabling guest mode for quiz access');
        auth.loginAsGuest();
        return true;
    }

    console.log('AuthGuard: Access denied, redirecting to login');
    const returnUrl = state.url;
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};

export const routes: Routes = [
    { path: '', component: QuestionGeneratorComponent, pathMatch: 'full' },
    { 
        path: 'login', 
        component: LoginComponent
    },
    { 
        path: 'collections', 
        loadComponent: () => import('./components/collections/collections').then(m => m.CollectionsComponent),
        canActivate: [authGuard]
    },
    { 
        path: 'quiz/:id', 
        loadComponent: () => import('./components/quiz/quiz').then(m => m.QuizComponent),
        canActivate: [authGuard]
    },
    { path: '**', redirectTo: '' }
];
