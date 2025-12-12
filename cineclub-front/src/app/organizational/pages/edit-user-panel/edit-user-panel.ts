/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { map, Observable, startWith, take } from 'rxjs';
import { SupabaseClient } from '@supabase/supabase-js';
import { Country } from '../../../auth/interfaces/country.interface';
import { UserAdminService } from '../../services/userAdmin.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { RoleTypeInterface } from '../../../auth/interfaces/user.interface';
import { RamdomPasswordService } from '../../../shared/services/ramdomPassword.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-edit-user-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatIconModule,
    RouterLink,
    LoaderComponent,
  ],
  templateUrl: './edit-user-panel.html',
  styleUrl: './edit-user-panel.scss',
})
export class EditUserPanel implements OnInit {
  userForm!: FormGroup;
  loading: boolean = false;
  isEditMode: boolean = false;
  userId: string | null = null;
  countries: string[] = [];
  filteredCountries: Observable<string[]> = new Observable();
  roles: RoleTypeInterface[] = [];

  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _supabaseClient: SupabaseClient = inject(SupabaseClient);
  private readonly _userAdminService: UserAdminService = inject(UserAdminService);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly _ramdomPassword: RamdomPasswordService = inject(RamdomPasswordService);
  private readonly _ngZone: NgZone = inject(NgZone);

  ngOnInit() {
    this.initializeForm();
    this.loadCountries();
    this.loadRoles();
    this.checkMode();
  }

  initializeForm() {
    this.userForm = this._fb.group({
      fullName: ['', [Validators.required]],
      username: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      country: ['', [Validators.required]],
      roleTypeId: ['', [Validators.required]],
      bibliography: [''],
    });
  }

  async checkMode() {
    this.userId = this._route.snapshot.paramMap.get('id');

    if (this.userId && this.userId !== 'new') {
      this.isEditMode = true;
      this._ngZone.run(() => this.loadUserData());
    }
  }

  async loadUserData() {
    if (!this.userId) return;

    try {
      this.loading = true;

      const { data, error } = await this._supabaseClient
        .from('profile')
        .select(
          `
        id,
        fullName,
        username,
        email,
        phone,
        country,
        roleTypeId,
        bibliography
      `,
        )
        .eq('id', this.userId)
        .single();

      if (error) throw error;

      if (data) {
        this.userForm.patchValue({
          fullName: data.fullName,
          username: data.username,
          email: data.email,
          phone: data.phone,
          country: data.country,
          roleTypeId: data.roleTypeId,
          bibliography: data.bibliography || '',
        });
      }
    } catch (error: any) {
      console.error('❌ Error al cargar usuario:', error);
      this._notificationsService.error('No se pudo cargar el usuario.');
      this._router.navigate(['/organizational/see-users']);
    } finally {
      this._ngZone.run(() => {
        this.loading = false;
      });
    }
  }

  async loadCountries() {
    try {
      this._http
        .get<Country[]>('https://restcountries.com/v3.1/all?fields=name')
        .pipe(
          map((res) => res.map((c) => c.name.common).sort()),
          take(1),
        )
        .subscribe((countries) => {
          this.countries = countries;

          this.filteredCountries = this.userForm.get('country')!.valueChanges.pipe(
            startWith(''),
            map((value) => this._filterCountries(value || '')),
          );
        });
    } catch (error) {
      console.error('❌ Error al cargar países:', error);
    }
  }

  async loadRoles() {
    try {
      this.roles = await this._userAdminService.getRoleTypes();
    } catch (error) {
      console.error('❌ Error al cargar roles:', error);
    }
  }

  private _filterCountries(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.countries.filter((option) => option.toLowerCase().includes(filterValue));
  }

  async saveUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this._notificationsService.error('Por favor completa todos los campos requeridos.');
      return;
    }

    this.loading = true;

    try {
      if (this.isEditMode) {
        await this.updateUser();
      } else {
        await this.createUser();
      }
    } catch (error: any) {
      console.error('❌ Error al guardar usuario:', error);
      this._notificationsService.error(error.message || 'Error al guardar el usuario.');
    } finally {
      this.loading = false;
    }
  }

  async createUser() {
    const formData = this.userForm.value;
    const randomPassword = this._ramdomPassword.generateRandomPassword();

    const { data: existingProfile } = await this._supabaseClient
      .from('profile')
      .select('id')
      .eq('email', formData.email)
      .maybeSingle();

    if (existingProfile) {
      throw new Error('Este correo ya está registrado.');
    }

    const { data, error } = await this._supabaseClient.auth.signUp({
      email: formData.email,
      password: randomPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          fullName: formData.fullName,
          username: formData.username,
          country: formData.country,
          phone: formData.phone,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('No se pudo crear el usuario.');

    const { error: profileError } = await this._supabaseClient.from('profile').insert({
      id: data.user.id,
      email: data.user.email,
      fullName: formData.fullName,
      username: formData.username,
      country: formData.country,
      phone: formData.phone,
      roleTypeId: formData.roleTypeId,
      bibliography: formData.bibliography || '',
      created_at: new Date().toISOString(),
    });

    if (profileError) throw new Error('Error al crear el perfil: ' + profileError.message);

    const { error: resetError } = await this._supabaseClient.auth.resetPasswordForEmail(
      formData.email,
      {
        redirectTo: `${window.location.origin}/auth/set-password`,
      },
    );

    if (resetError) {
      console.error('❌ Error al enviar correo de contraseña:', resetError);
      this._notificationsService.warning(
        'Usuario creado, pero no se pudo enviar el correo. Usa "Restablecer contraseña" desde el login.',
      );
    } else {
      this._notificationsService.success(
        `Correo enviado a ${formData.email} para cambiar su contraseña`,
      );
    }

    this._router.navigate(['/organizational/see-users']);
  }

  async updateUser() {
    if (!this.userId) return;
    const formData = this.userForm.value;

    try {
      const { error } = await this._supabaseClient
        .from('profile')
        .update({
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          roleTypeId: formData.roleTypeId,
          bibliography: formData.bibliography,
        })
        .eq('id', this.userId);

      if (error) throw error;

      this._notificationsService.success('Usuario actualizado exitosamente.');
      this._router.navigate(['/organizational/see-users']);
    } catch (error: any) {
      console.error('❌ Error al actualizar usuario:', error);
      throw new Error(error.message || 'Error al actualizar el usuario.');
    }
  }

  cancel() {
    this._router.navigate(['/organizational/see-users']);
  }
}
