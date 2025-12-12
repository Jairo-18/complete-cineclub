import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CollectionRequestInterface } from '../../../shared/interfaces/collection-request.interface';

@Component({
  selector: 'app-received-collection-requests',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './received-collection-requests.html',
  styleUrl: './received-collection-requests.scss',
})
export class ReceivedCollectionRequestsComponent {
  @Input() requests: CollectionRequestInterface[] = [];
  @Input() loading: boolean = false;

  @Output() accept = new EventEmitter<string>();
  @Output() reject = new EventEmitter<string>();

  onAccept(requestId: string) {
    this.accept.emit(requestId);
  }

  onReject(requestId: string) {
    this.reject.emit(requestId);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/defaultUser.png')) {
      return;
    }
    img.src = '/assets/images/defaultUser.png';
  }
}
