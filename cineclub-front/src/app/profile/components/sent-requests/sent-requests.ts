import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FriendRequestStatusPipe } from '../../../shared/pipes/friend-request-status.pipe';
import { FriendRequestInterface } from '../../../shared/interfaces/friend-request.interface';
import { UserMongoComplete } from '../../../auth/interfaces/user.interface';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sent-requests',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, FriendRequestStatusPipe, MatButtonModule],
  templateUrl: './sent-requests.html',
  styleUrl: './sent-requests.scss',
})
export class SentRequestsComponent {
  @Input() requests: (FriendRequestInterface & { user?: UserMongoComplete })[] = [];
  @Input() loading: boolean = false;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() cancel = new EventEmitter<string>();

  onCancel(receiverId: string) {
    this.cancel.emit(receiverId);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/defaultUser.png')) {
      return;
    }
    img.src = '/assets/images/defaultUser.png';
  }
}
