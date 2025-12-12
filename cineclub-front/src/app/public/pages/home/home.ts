import { MatButtonModule } from '@angular/material/button';
import { Component, inject, OnInit } from '@angular/core';
import { SupabaseService } from '../../../auth/services/supabase.service';
import { distinctUntilChanged, Subscription } from 'rxjs';
import { HomeLogout } from '../../components/home-logout/home-logout';
import { CommonModule } from '@angular/common';
import { HomeLogged } from '../../components/home-logged/home-logged';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatButtonModule, HomeLogout, CommonModule, HomeLogged],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly _supabaseService: SupabaseService = inject(SupabaseService);
  private sub?: Subscription;

  isReady: boolean = false;
  isLoggedIn: boolean = false;

  ngOnInit() {
    this.sub = this._supabaseService.user$
      .pipe(distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe((user) => {
        this.isReady = true;
        this.isLoggedIn = !!user;
      });
  }
}
