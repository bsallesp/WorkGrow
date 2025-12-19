import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SocialLoginModule, SocialAuthServiceConfig, GoogleLoginProvider, SOCIAL_AUTH_CONFIG } from '@abacritt/angularx-social-login';

import { routes } from './app.routes';

const GOOGLE_CLIENT_ID = '232760690927-1no75qoqke8imcrgdvmikl2ai01v254h.apps.googleusercontent.com'; // Replace with your actual Client ID

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(SocialLoginModule),
    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(GOOGLE_CLIENT_ID)
          }
        ],
        onError: (err) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig,
    }
  ]
};
