import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { UserReviews } from '../user-reviews/user-reviews';

@Component({
  selector: 'app-card-tabs-reviews',
  imports: [MatIconModule, MatTabsModule, UserReviews],
  templateUrl: './card-tabs-reviews.html',
  styleUrl: './card-tabs-reviews.scss',
})
export class CardTabsReviews {}
