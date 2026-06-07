import { Component, inject } from '@angular/core';
import { HoldingsService } from '../../services/holdings.service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Holding, HoldingView } from '../../models/holding.model';

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

  onAddHolding(): void {
    const now = new Date().toISOString();

    const newHolding: Holding = {
      id: crypto.randomUUID(),
      ticker: 'MSFT',
      companyName: 'Microsoft',
      shareCount: 2,
      averageCost: 420,
      currentPrice: 450,
      sector: 'Technology',
      categories: ['Mega Cap', 'AI'],
      notes: 'Temporary hardcoded add.',
      createdAt: now,
      updatedAt: now,
    };

    this.holdingsService.addHolding(newHolding);
  }

  onUpdateHolding(holding: HoldingView): void {
    const updatedHolding: Holding = {
      ...holding,
      shareCount: holding.shareCount + 1,
      updatedAt: new Date().toISOString(),
    };

    this.holdingsService.updateHolding(updatedHolding);
  }

  onDeleteHolding(holding: HoldingView): void {
    const confirmed = confirm(`Delete ${holding.ticker}?`);

    if (!confirmed) {
      return;
    }

    this.holdingsService.deleteHolding(holding.id);
  }
}
