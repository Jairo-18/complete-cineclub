import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  computed,
  signal,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { SIDEBAR_ITEMS } from '../../constants/layout.constants';
import { RouterLink } from '@angular/router';
import { SignInService } from '../../../auth/services/signIn.service';
import { TokenService } from '../../../auth/services/token.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, LoaderComponent],
  templateUrl: './side-bar.html',
  styleUrls: ['./side-bar.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scaleY(0)', transformOrigin: 'top' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scaleY(1)' })),
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'scaleY(1)', transformOrigin: 'top' }),
        animate('200ms ease-in', style({ opacity: 0, transform: 'scaleY(0)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateX(0)' }),
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateX(-10px)' })),
      ]),
    ]),
  ],
})
export class SideBar implements OnInit, OnDestroy {
  @Input() closeSideBar: boolean = false;
  @Output() collapsed: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() sidebarStateChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  isLoggedIn: boolean = false;
  isCollapsed: boolean = true;
  openSubMenu: Record<string, boolean> = {};

  private readonly _singInService: SignInService = inject(SignInService);
  private readonly _tokenService: TokenService = inject(TokenService);
  private readonly _elementRef: ElementRef = inject(ElementRef);
  private _roleSubscription?: Subscription;

  private userRole = signal<string | null>(null);

  isLoading = signal<boolean>(true);

  menuItems = computed(() => {
    const role = this.userRole();

    if (!role || role === '') return [];

    return SIDEBAR_ITEMS.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;

      return item.roles.includes(role);
    });
  });

  ngOnInit(): void {
    const currentRole = this._tokenService.getUserRole();

    if (currentRole !== null) {
      this.userRole.set(currentRole);
      this.isLoading.set(false);
    }

    this._roleSubscription = this._tokenService.userRole$.subscribe((role) => {
      this.userRole.set(role);

      this.isLoading.set(false);
    });
  }

  ngOnDestroy(): void {
    this._roleSubscription?.unsubscribe();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) this.closeAllSubMenus();
    this.collapsed.emit(this.isCollapsed);
    this.sidebarStateChanged.emit(this.isCollapsed);
  }

  closeSidebar(): void {
    if (!this.isCollapsed) {
      this.isCollapsed = true;
      this.closeAllSubMenus();
      this.collapsed.emit(this.isCollapsed);
      this.sidebarStateChanged.emit(this.isCollapsed);
    }
  }

  toggleSubMenu(title: string): void {
    if (this.openSubMenu[title]) {
      this.openSubMenu[title] = false;
    } else {
      Object.keys(this.openSubMenu).forEach((key) => {
        this.openSubMenu[key] = false;
      });
      this.openSubMenu[title] = true;
    }
  }

  closeAllSubMenus(): void {
    this.openSubMenu = {};
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isCollapsed && Object.values(this.openSubMenu).some((v) => v)) {
      const clickedInside = this._elementRef.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.closeAllSubMenus();
      }
    }
  }

  async signOut() {
    this.closeSidebar();
    await this._singInService.signOut();
    this.isLoggedIn = false;
  }
}
