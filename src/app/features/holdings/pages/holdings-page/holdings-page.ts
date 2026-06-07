import { Component, inject } from '@angular/core';
import { HoldingsService } from '../../services/holdings.service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-holdings-page',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './holdings-page.html',
  styleUrl: './holdings-page.scss',
})
export class HoldingsPage {
  private readonly holdingsService = inject(HoldingsService);

  readonly holdingViews = this.holdingsService.holdingViews;
}
