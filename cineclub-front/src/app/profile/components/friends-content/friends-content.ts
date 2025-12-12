/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, Input, Output, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { FriendInterface } from '../../interfaces/friends.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-friends-content',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIcon,
    LoaderComponent,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
  ],
  templateUrl: './friends-content.html',
  styleUrls: ['./friends-content.scss'],
})
export class FriendsContent implements OnInit, OnDestroy {
  @Input() friendsInterface: FriendInterface[] = [];
  @Input() loading: boolean = false;
  @Input() hasNext: boolean = false;
  @Input() isLoadingMore: boolean = false;
  @Input() total: number = 0;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() search = new EventEmitter<string>();
  @Output() loadMore = new EventEmitter<void>();
  @Output() removeFriend = new EventEmitter<string>();

  searchQuery = '';
  searchTimeout: any;

  private readonly _dialog: MatDialog = inject(MatDialog);
  private scrollHandler: (() => void) | null = null;
  private scrollTarget: EventTarget | null = null;

  ngOnInit() {
    this.setupScrollListener();
  }

  ngOnDestroy() {
    if (this.scrollTarget && this.scrollHandler) {
      this.scrollTarget.removeEventListener('scroll', this.scrollHandler);
    }
  }

  private setupScrollListener() {
    const mainElement = document.querySelector('main.main');
    this.scrollTarget = mainElement || window;

    this.scrollHandler = () => {
      if (mainElement) {
        this.checkScroll(mainElement);
      } else {
        this.checkScrollWindow();
      }
    };

    this.scrollTarget.addEventListener('scroll', this.scrollHandler);
  }

  private checkScroll(element: Element) {
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;
    const scrollPercentage = (scrollPosition / scrollHeight) * 100;

    if (scrollPercentage >= 50 && this.hasNext && !this.isLoadingMore && !this.loading) {
      this.loadMore.emit();
    }
  }

  private checkScrollWindow() {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    const scrollPercentage = (scrollPosition / pageHeight) * 100;

    if (scrollPercentage >= 50 && this.hasNext && !this.isLoadingMore && !this.loading) {
      this.loadMore.emit();
    }
  }

  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.search.emit(this.searchQuery);
    }, 500);
  }

  clearSearch() {
    this.searchQuery = '';
    this.search.emit('');
  }

  openRemoveFriendDialog(friendId: string, friendName: string) {
    const dialogRef = this._dialog.open(YesNoDialogComponent, {
      data: {
        title: '¿Eliminar amigo?',
        message: `¿Estás seguro de que deseas eliminar a ${friendName} de tu lista de amigos?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.removeFriend.emit(friendId);
      }
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('assets/images/defaultUser.png')) {
      return;
    }
    img.src = '/assets/images/defaultUser.png';
  }
}
