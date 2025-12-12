import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'colombianDate',
  standalone: true,
})
export class ColombianDatePipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value.toString();
    }

    return date.toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      hour12: true,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
