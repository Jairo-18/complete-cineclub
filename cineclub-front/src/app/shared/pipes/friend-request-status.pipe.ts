import { Pipe, PipeTransform } from '@angular/core';
import { FriendRequestStatus } from '../interfaces/friend-request.interface';

@Pipe({
  name: 'friendStatus',
  standalone: true,
})
export class FriendRequestStatusPipe implements PipeTransform {
  transform(status: FriendRequestStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'ACCEPTED':
        return 'Aceptada';
      case 'REJECTED':
        return 'Rechazada';
      default:
        return status;
    }
  }
}
