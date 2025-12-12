import { Component, Input, signal, computed, inject, OnChanges } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ProfileInterface } from '../../interfaces/profile.interface';
import { MatButtonModule } from '@angular/material/button';
import { FriendRequestService } from '../../../shared/services/friend-request.service';
import { TokenService } from '../../../auth/services/token.service';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { ProfileService } from '../../services/profile.service';

type FriendStatus = 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE' | 'SELF';

@Component({
  selector: 'app-friend-info-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './friend-info-card.html',
  styleUrls: ['./friend-info-card.scss'],
})
export class FriendInfoCard implements OnChanges {
  @Input({ required: true }) friendId!: string;

  private readonly location: Location = inject(Location);
  private readonly _friendRequestService: FriendRequestService = inject(FriendRequestService);
  private readonly _tokenService: TokenService = inject(TokenService);
  private readonly _dialog: MatDialog = inject(MatDialog);
  private readonly _profileService: ProfileService = inject(ProfileService);

  profile = signal<ProfileInterface | null>(null);
  loading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  showFullBibliography = signal<boolean>(false);
  friendStatus = signal<FriendStatus>('NONE');
  actionLoading = signal<boolean>(false);

  goBack(): void {
    this.location.back();
  }

  readonly avatarUrl = computed(() => {
    const profileData = this.profile();
    if (!profileData) return '/assets/images/defaultUser.png';
    return profileData.avatarUrl || '/assets/images/defaultUser.png';
  });

  ngOnChanges(): void {
    this.loadFriendProfile();
    this.checkFriendStatus();
  }

  readonly displayedBibliography = computed(() => {
    const bio = this.profile()?.bibliography ?? '';
    if (bio.length <= 500 || this.showFullBibliography()) return bio;
    return bio.slice(0, 500) + '...';
  });

  toggleBibliography(): void {
    this.showFullBibliography.update((v) => !v);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/defaultUser.png')) {
      return;
    }
    img.src = '/assets/images/defaultUser.png';
  }

  async loadFriendProfile(): Promise<void> {
    if (!this.friendId) return;

    try {
      this.loading.set(true);
      this.errorMessage.set(null);

      const supabaseProfile = await this._profileService.getProfile(this.friendId);

      if (!supabaseProfile) {
        throw new Error('Este usuario aún no ha completado su perfil.');
      }

      const profileData: ProfileInterface = {
        id: supabaseProfile.id,
        fullName: supabaseProfile.fullName || 'Usuario',
        username: supabaseProfile.username || '',
        email: supabaseProfile.email || '',
        country: supabaseProfile.country || '',
        avatarUrl: supabaseProfile.avatarUrl || '',
        bibliography: supabaseProfile.bibliography || '',
        phone: supabaseProfile.phone || '',
        roleTypeId: '',
        created_at: new Date(),
      };

      this.profile.set(profileData);
    } catch (err: Error | unknown) {
      console.error('Error cargando perfil del amigo:', err);
      this.errorMessage.set(
        err instanceof Error ? err.message : 'Error desconocido al cargar el perfil.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  checkFriendStatus(): void {
    const currentUserId = this._tokenService.getUserId();
    if (!currentUserId || !this.friendId) return;

    this._friendRequestService
      .getFriendshipStatus(this.friendId, currentUserId)
      .subscribe((status) => {
        this.friendStatus.set(status);
      });
  }

  async sendRequest() {
    if (this.actionLoading()) return;
    this.actionLoading.set(true);
    try {
      await firstValueFrom(this._friendRequestService.sendFriendRequest(this.friendId));
      this.checkFriendStatus();
    } catch (error) {
      console.error('Error sending friend request', error);
    } finally {
      this.actionLoading.set(false);
    }
  }

  removeFriend() {
    if (this.actionLoading()) return;

    const friendName = this.profile()?.fullName || 'este usuario';
    const dialogRef = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: '¿Eliminar amigo?',
        message: `¿Estás seguro de que deseas eliminar a ${friendName} de tu lista de amigos?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (confirm) => {
      if (confirm) {
        this.actionLoading.set(true);
        try {
          await firstValueFrom(this._friendRequestService.removeFriend(this.friendId));
          this.checkFriendStatus();
        } catch (error) {
          console.error('Error removing friend', error);
        } finally {
          this.actionLoading.set(false);
        }
      }
    });
  }

  async cancelRequest() {
    if (this.actionLoading()) return;
    this.actionLoading.set(true);
    try {
      await firstValueFrom(this._friendRequestService.cancelFriendRequest(this.friendId));
      this.checkFriendStatus();
    } catch (error) {
      console.error('Error canceling request', error);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async acceptRequest() {
    if (this.actionLoading()) return;
    this.actionLoading.set(true);
    try {
      await firstValueFrom(this._friendRequestService.acceptFriendRequest(this.friendId));
      this.checkFriendStatus();
    } catch (error) {
      console.error('Error accepting request', error);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async rejectRequest() {
    if (this.actionLoading()) return;
    this.actionLoading.set(true);
    try {
      await firstValueFrom(this._friendRequestService.rejectFriendRequest(this.friendId));
      this.checkFriendStatus();
    } catch (error) {
      console.error('Error rejecting request', error);
    } finally {
      this.actionLoading.set(false);
    }
  }
}
