import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-card-recomendations',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './card-recomendations.html',
  styleUrl: './card-recomendations.scss',
})
export class CardRecomendations {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() image: string = '';
  @Input() author: string = '';
  @Input() tag: string = '';
  @Input() score: number = 0;
  @Input() likes: number = 0;
  @Input() comments: number = 0;

  get stars(): boolean[] {
    return Array(5)
      .fill(false)
      .map((_, i) => i < this.score);
  }
}
