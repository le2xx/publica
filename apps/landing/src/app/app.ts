import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type AddressResult = {
  id: string;
  fullAddress: string;
  country: string;
};

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  query = '';
  results: AddressResult[] = [];

  onSearch() {
    // Заглушка: имитируем результаты
    if (this.query.length > 3) {
      this.results = [
        {
          id: '1',
          fullAddress: '10 Downing Street, London, SW1A 2AA',
          country: 'United Kingdom',
        },
        {
          id: '2',
          fullAddress: '350 5th Ave, New York, NY 10118',
          country: 'United States',
        },
        {
          id: '3',
          fullAddress: 'Place de la Concorde, 75008 Paris',
          country: 'France',
        },
        {
          id: '4',
          fullAddress: '10 Downing Street, London, SW1A 2AA',
          country: 'United Kingdom',
        },
        {
          id: '5',
          fullAddress: '350 5th Ave, New York, NY 10118',
          country: 'United States',
        },
        {
          id: '6',
          fullAddress: 'Place de la Concorde, 75008 Paris',
          country: 'France',
        },
      ];
    } else {
      this.results = [];
    }
  }
}
