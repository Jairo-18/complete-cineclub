import { Component } from '@angular/core';
import { LibraryInterface } from '../../interfaces/library.interface';
import { CardRecomendations } from '../card-recomendations/card-recomendations';
import { CommonModule } from '@angular/common';
import { BOOKS } from '../../constants/library.constants';

@Component({
  selector: 'app-books-content',
  standalone: true,
  imports: [CardRecomendations, CommonModule],
  templateUrl: './books-content.html',
  styleUrl: './books-content.scss',
})
export class BooksContent {
  books: LibraryInterface[] = BOOKS;
}
