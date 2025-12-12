import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CollectionRequestInterface } from '../../../shared/interfaces/collection-request.interface';

@Component({
  selector: 'app-sent-collection-requests',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './sent-collection-requests.html',
  styleUrl: './sent-collection-requests.scss',
})
export class SentCollectionRequestsComponent {
  @Input() requests: CollectionRequestInterface[] = [];
  @Input() loading: boolean = false;

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/defaultUser.png')) {
      return;
    }
    img.src = '/assets/images/defaultUser.png';
  }
}
