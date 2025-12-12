import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthCallbackService } from '../../services/callBack.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-auth-call-back',
  standalone: true,
  imports: [LoaderComponent],
  templateUrl: './auth-call-back.html',
  styleUrl: './auth-call-back.scss',
})
export class AuthCallBack implements OnInit {
  private readonly _authCallbackService: AuthCallbackService = inject(AuthCallbackService);
  private readonly _router: Router = inject(Router);
  private readonly _platformId: object = inject(PLATFORM_ID);

  async ngOnInit() {
    if (!isPlatformBrowser(this._platformId)) return;

    try {
      await this._authCallbackService.handleCallback();

      if (window.opener) {
        window.close();
      }
    } catch (error) {
      console.error('❌ Error durante el callback:', error);
      await this._router.navigate(['/auth/login']);
    }
  }
}
