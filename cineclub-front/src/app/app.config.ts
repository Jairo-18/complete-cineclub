import {
  ApplicationConfig,
  importProvidersFrom,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  MAT_DATE_LOCALE,
  MAT_NATIVE_DATE_FORMATS,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { routes } from './app.routes';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { getMaterialPaginatorTranslations } from './shared/utilities/material-paginator-translations';
import { ToastrModule } from 'ngx-toastr';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { notificationsInterceptorInterceptor } from './shared/interceptors/notifications.interceptor.interceptor';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideNativeDateAdapter(MAT_NATIVE_DATE_FORMATS),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, notificationsInterceptorInterceptor]),
    ),
    importProvidersFrom(
      ToastrModule.forRoot({
        preventDuplicates: true,
      }),
    ),
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { maxWidth: '700px', width: '95vw', padding: '40px' },
    },
    { provide: MatPaginatorIntl, useValue: getMaterialPaginatorTranslations() },
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: SupabaseClient, useValue: supabase },
  ],
};
