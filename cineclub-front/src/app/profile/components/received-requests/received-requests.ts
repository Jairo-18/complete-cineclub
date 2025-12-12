import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FriendRequestStatusPipe } from '../../../shared/pipes/friend-request-status.pipe';
import { FriendRequestInterface } from '../../../shared/interfaces/friend-request.interface';
import { UserMongoComplete } from '../../../auth/interfaces/user.interface';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-received-requests',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, FriendRequestStatusPipe, MatButtonModule],
  templateUrl: './received-requests.html',
  styleUrl: './received-requests.scss',
})
export class ReceivedRequestsComponent {
  @Input() requests: (FriendRequestInterface & { user?: UserMongoComplete })[] = [];
  @Input() loading: boolean = false;
  @Output() accept = new EventEmitter<string>();
  @Output() reject = new EventEmitter<string>();

  onAccept(senderId: string) {
    this.accept.emit(senderId);
  }

  onReject(senderId: string) {
    this.reject.emit(senderId);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/defaultUser.png')) {
      return;
    }
    img.src = '/assets/images/defaultUser.png';
  }
}
