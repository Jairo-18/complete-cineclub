import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FriendInfoCard } from '../../components/friend-info-card/friend-info-card';
import { FriendLibraryTabs } from '../../components/friend-library-tabs/friend-library-tabs';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, FriendInfoCard, FriendLibraryTabs],
  templateUrl: './public-profile.html',
  styleUrls: ['./public-profile.scss'],
})
export class PublicProfile implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  userId = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('userId');
      if (!id) {
        this.router.navigate(['/home']);
        return;
      }
      this.userId.set(id);
    });
  }
}
