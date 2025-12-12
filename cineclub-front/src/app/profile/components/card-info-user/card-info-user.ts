import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ProfileInterface } from '../../interfaces/profile.interface';
import { ProfileService } from '../../services/profile.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { TokenService } from '../../../auth/services/token.service';

@Component({
  selector: 'app-card-info-user',
  standalone: true,
  imports: [MatIconModule, CommonModule, LoaderComponent],
  templateUrl: './card-info-user.html',
  styleUrls: ['./card-info-user.scss'],
})
export class CardInfoUser implements OnInit {
  profile = signal<ProfileInterface | null>(null);
  avatarUrl = signal<string>('/assets/images/defaultUser.png');
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  editingField = signal<keyof ProfileInterface | null>(null);
  tempValue = signal<string>('');
  showFullBibliography = signal<boolean>(false);

  private readonly _profileService: ProfileService = inject(ProfileService);
  private readonly _tokenService: TokenService = inject(TokenService);

  ngOnInit(): void {
    this.loadProfile();
  }

  readonly displayedBibliography = computed(() => {
    const bio = this.profile()?.bibliography ?? '';
    if (bio.length <= 500 || this.showFullBibliography()) return bio;
    return bio.slice(0, 500) + '...';
  });

  toggleBibliography(): void {
    this.showFullBibliography.update((v) => !v);
  }

  async loadProfile(): Promise<void> {
    try {
      if (this._tokenService.isLoggingOut()) return;

      this.loading.set(true);

      const userId = this._tokenService.getUserId();
      if (!userId) {
        throw new Error('No hay una sesión activa. Por favor, inicia sesión nuevamente.');
      }

      const profile = await this._profileService.getProfile(userId);

      if (!profile) throw new Error('No se encontró el perfil.');

      this.profile.set(profile as ProfileInterface);

      if (profile.avatarUrl) {
        this.avatarUrl.set(profile.avatarUrl);
      }
    } catch (err: Error | unknown) {
      console.error('❌ Error cargando perfil:', err);
      this.errorMessage.set(
        err instanceof Error ? err.message : 'Error desconocido al cargar el perfil.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  startEditing(field: keyof ProfileInterface): void {
    const currentProfile = this.profile();
    if (!currentProfile) return;
    const currentValue = String(currentProfile[field] ?? '');
    this.tempValue.set(currentValue);
    this.editingField.set(field);
  }

  async saveField(field: keyof ProfileInterface): Promise<void> {
    const userId = this.profile()?.id;
    if (!userId) return;

    const newValue = this.tempValue().trim();

    if (newValue.length > 1500) {
      this.errorMessage.set('La bibliografía no puede superar los 1500 caracteres.');
      return;
    }

    const updateData = { [field]: newValue } as Partial<ProfileInterface>;

    try {
      const updated = await this._profileService.updateProfile(userId, updateData);
      this.profile.set(updated);
      this.editingField.set(null);
      this.errorMessage.set(null);
    } catch (error) {
      this.errorMessage.set(
        `Error al actualizar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  cancelEditing(): void {
    this.editingField.set(null);
    this.tempValue.set('');
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/defaultUser.png')) {
      return;
    }
    img.src = '/assets/images/defaultUser.png';
  }
}
