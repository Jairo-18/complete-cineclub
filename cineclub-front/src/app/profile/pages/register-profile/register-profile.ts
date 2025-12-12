import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthCard } from '../../../auth/components/auth-card/auth-card';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { map, Observable, startWith, take } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Country } from '../../../auth/interfaces/country.interface';
import { SupabaseService } from '../../../auth/services/supabase.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { Router, NavigationStart } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { TokenService } from '../../../auth/services/token.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { Location } from '@angular/common';

@Component({
  selector: 'app-register-profile',
  standalone: true,
  imports: [
    AuthCard,
    ReactiveFormsModule,
    MatSelectModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatIconModule,
    MatInputModule,
    CommonModule,
  ],
  templateUrl: './register-profile.html',
  styleUrl: './register-profile.scss',
})
export class RegisterProfile implements OnInit, OnDestroy {
  complementInfo: FormGroup;
  filteredCountries: Observable<string[]> = new Observable();
  countries: string[] = [];
  isSubmitting: boolean = false;

  private readonly _supabaseService: SupabaseService = inject(SupabaseService);
  private readonly _profileService: ProfileService = inject(ProfileService);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _router: Router = inject(Router);
  private readonly _tokenService: TokenService = inject(TokenService);
  private readonly _supabaseClient: SupabaseClient = inject(SupabaseClient);
  private readonly _location: Location = inject(Location);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private navigationSubscription?: any;

  constructor() {
    this.complementInfo = this._fb.group({
      fullName: ['', [Validators.required]],
      country: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      username: [''],
      bibliography: [''],
      roleTypeId: ['ee3609d2-da86-4e9e-84a5-fb8814b17031'],
    });
  }

  ngOnInit() {
    history.pushState(null, '', location.href);

    this.navigationSubscription = this._router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (event.navigationTrigger === 'popstate') {
          this._notificationsService.info('Debes completar tu perfil antes de continuar');
          history.pushState(null, '', location.href);
        }
      }
    });

    this._http
      .get<Country[]>('https://restcountries.com/v3.1/all?fields=name')
      .pipe(
        map((res) => res.map((c) => c.name.common).sort()),
        take(1),
      )
      .subscribe((countries) => {
        this.countries = countries;
        this.filteredCountries = this.complementInfo.get('country')!.valueChanges.pipe(
          startWith(''),
          map((value) => this._filterCountries(value || '')),
        );
      });
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  private _filterCountries(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.countries.filter((option) => option.toLowerCase().includes(filterValue));
  }

  async registerProfile() {
    if (this.complementInfo.invalid) {
      this.complementInfo.markAllAsTouched();
      this._notificationsService.error('Por favor completa todos los campos correctamente');
      return;
    }

    if (this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      const user = this._supabaseService.currentUserValue;

      if (!user) {
        this._notificationsService.error('No se encontró usuario autenticado');
        this._router.navigate(['/auth/login']);
        return;
      }

      const profileData = {
        username: this.complementInfo.get('username')?.value,
        fullName: this.complementInfo.get('fullName')?.value,
        country: this.complementInfo.get('country')?.value,
        phone: this.complementInfo.get('phone')?.value,
        bibliography: this.complementInfo.get('bibliography')?.value,
        roleTypeId: this.complementInfo.get('roleTypeId')?.value,
      };

      await this._profileService.updateProfile(user.id, profileData);

      const { data: userWithRole, error: roleError } = await this._supabaseClient
        .from('profile')
        .select(
          `
          id,
          roleTypeId,
          roleType:roleType!fk_profile_roletype (
            id,
            code,
            name
          )
        `,
        )
        .eq('id', user.id)
        .single();

      if (roleError || !userWithRole) {
        console.error('❌ Error obteniendo rol:', roleError);
        throw new Error('No se pudo obtener el rol del usuario');
      }

      const transformedUser = {
        ...userWithRole,
        roleType: Array.isArray(userWithRole.roleType)
          ? userWithRole.roleType[0]
          : userWithRole.roleType,
      };

      const currentSession = this._tokenService.getSession();
      if (currentSession) {
        this._tokenService.saveSession(
          currentSession.access_token,
          currentSession.refresh_token,
          transformedUser,
        );
      }

      this._notificationsService.success('¡Perfil completado exitosamente!');

      await new Promise((resolve) => setTimeout(resolve, 200));

      this._router.navigate(['/']);
    } catch (error) {
      console.error('Error guardando perfil:', error);
      this._notificationsService.error('Error al guardar el perfil. Inténtalo de nuevo.');
    } finally {
      this.isSubmitting = false;
    }
  }
}
