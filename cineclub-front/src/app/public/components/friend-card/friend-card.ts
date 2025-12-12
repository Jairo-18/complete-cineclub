import {
  Component,
  inject,
  HostListener,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { UserMongoComplete } from '../../../auth/interfaces/user.interface';
import { FriendRequestService } from '../../../shared/services/friend-request.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-friend-card',
  standalone: true,
  imports: [MatIconModule, CommonModule, RouterLink, MatButtonModule, LoaderComponent],
  templateUrl: './friend-card.html',
  styleUrl: './friend-card.scss',
})
export class FriendCard {
  private readonly _friendRequestService: FriendRequestService = inject(FriendRequestService);
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);

  @Input() loading: boolean = false;
  sendingRequest: Record<string, boolean> = {};
  cancelingRequest: Record<string, boolean> = {};
  acceptingRequest: Record<string, boolean> = {};
  rejectingRequest: Record<string, boolean> = {};

  @Input() users: UserMongoComplete[] = [];
  @Input() paginationParams: PaginationInterface = {
    page: 1,
    size: 5,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  showStickyCard: boolean = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.showStickyCard = window.scrollY > 100;
  }

  nextPage(): void {
    this.next.emit();
  }

  prevPage(): void {
    this.prev.emit();
  }

  sendFriendRequest(userId: string, index?: number): void {
    if (this.sendingRequest[userId]) return;

    this.sendingRequest[userId] = true;

    this._friendRequestService.sendFriendRequest(userId).subscribe({
      next: (response) => {
        this._notificationsService.success(
          response.message || 'Solicitud de amistad enviada correctamente',
        );
        this.users = this.users.map((user) =>
          user.id === userId ? { ...user, hasPendingRequest: true, isSender: true } : user,
        );
        this.sendingRequest[userId] = false;

        if (index !== undefined) {
          setTimeout(() => this.scrollToNextCard(index), 500);
        }
      },
      error: (err) => {
        console.error('❌ Error al enviar solicitud de amistad:', err);
        const errorMessage = err?.error?.message || 'No se pudo enviar la solicitud de amistad';
        this._notificationsService.error(errorMessage);
        this.sendingRequest[userId] = false;
      },
    });
  }

  cancelFriendRequest(userId: string): void {
    if (this.cancelingRequest[userId]) return;

    this.cancelingRequest[userId] = true;

    this._friendRequestService.cancelFriendRequest(userId).subscribe({
      next: (response) => {
        this._notificationsService.success(
          response.message || 'Solicitud de amistad cancelada correctamente',
        );

        this.users = this.users.map((user) =>
          user.id === userId ? { ...user, hasPendingRequest: false, isSender: null } : user,
        );
        this.cancelingRequest[userId] = false;
      },
      error: (err) => {
        console.error('❌ Error al cancelar solicitud de amistad:', err);
        const errorMessage = err?.error?.message || 'No se pudo cancelar la solicitud de amistad';
        this._notificationsService.error(errorMessage);
        this.cancelingRequest[userId] = false;
      },
    });
  }

  acceptFriendRequest(userId: string): void {
    if (this.acceptingRequest[userId]) return;

    this.acceptingRequest[userId] = true;

    this._friendRequestService.acceptFriendRequest(userId).subscribe({
      next: (response) => {
        this._notificationsService.success(
          response.message || 'Solicitud de amistad aceptada correctamente',
        );
        this.removeUserFromList(userId);
        this.acceptingRequest[userId] = false;
      },
      error: (err) => {
        console.error('❌ Error al aceptar solicitud:', err);
        this._notificationsService.error('No se pudo aceptar la solicitud');
        this.acceptingRequest[userId] = false;
      },
    });
  }

  rejectFriendRequest(userId: string): void {
    if (this.rejectingRequest[userId]) return;

    this.rejectingRequest[userId] = true;

    this._friendRequestService.rejectFriendRequest(userId).subscribe({
      next: (response) => {
        this._notificationsService.success(
          response.message || 'Solicitud de amistad rechazada correctamente',
        );
        this.users = this.users.map((user) =>
          user.id === userId ? { ...user, hasPendingRequest: false, isSender: null } : user,
        );
        this.rejectingRequest[userId] = false;
      },
      error: (err) => {
        console.error('❌ Error al rechazar solicitud:', err);
        this._notificationsService.error('No se pudo rechazar la solicitud');
        this.rejectingRequest[userId] = false;
      },
    });
  }

  private removeUserFromList(userId: string): void {
    this.users = this.users.filter((user) => user.id !== userId);
  }

  private _sliderContainer!: ElementRef;

  @ViewChild('sliderContainer')
  set sliderContainer(value: ElementRef) {
    if (value) {
      this._sliderContainer = value;
      this.setupScrollListener();
    }
  }

  get sliderContainer(): ElementRef {
    return this._sliderContainer;
  }

  setupScrollListener() {
    if (this._sliderContainer?.nativeElement) {
      const element = this._sliderContainer.nativeElement;

      element.onscroll = () => {
        const scrollPosition = element.scrollLeft + element.clientWidth;
        const scrollWidth = element.scrollWidth;
        const threshold = 50;

        if (
          scrollWidth - scrollPosition <= threshold &&
          !this.loading &&
          this.paginationParams.hasNextPage
        ) {
          this.next.emit();
        }
      };
    }
  }

  scrollToNextCard(currentIndex: number): void {
    if (!this.sliderContainer) return;

    const container = this.sliderContainer.nativeElement;
    const cards = container.children;

    if (currentIndex < cards.length - 1) {
      const nextCard = cards[currentIndex + 1];
      nextCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/defaultUser.png')) {
      return;
    }
    img.src = '/assets/images/defaultUser.png';
  }
}
