import { Injectable, signal, computed } from '@angular/core';
import { Holding, HoldingView } from '../models/holding.model';

@Injectable({
  providedIn: 'root',
})
export class HoldingsService {
  private readonly holdings = signal<Holding[]>([
    {
      id: '1',
      ticker: 'OSCR',
      companyName: 'Oscar Health',
      shareCount: 25,
      averageCost: 18,
      currentPrice: 21,
      sector: 'Healthcare',
      categories: ['Growth', 'Small Cap'],
      notes: 'Thought earnings looked strong.',
      purchaseDate: '2026-06-06',
      createdAt: '2026-06-06T10:00:00Z',
      updatedAt: '2026-06-06T10:00:00Z',
    },
    {
      id: '2',
      ticker: 'SHOP',
      companyName: 'Shopify',
      shareCount: 5,
      averageCost: 95,
      currentPrice: 102,
      sector: 'Technology',
      categories: ['Canadian', 'Growth'],
      notes: 'Retested breakout level.',
      createdAt: '2026-06-06T10:00:00Z',
      updatedAt: '2026-06-06T10:00:00Z',
    },
    {
      id: '3',
      ticker: 'PEP',
      companyName: 'PepsiCo',
      shareCount: 3,
      averageCost: 170,
      sector: 'Consumer Defensive',
      categories: ['Dividend', 'Defensive'],
      notes: 'No live price yet, fallback to average cost.',
      createdAt: '2026-06-06T10:00:00Z',
      updatedAt: '2026-06-06T10:00:00Z',
    },
  ]);

  readonly holdingViews = computed<HoldingView[]>(() => {
    const holdings = this.holdings();

    const totalPortfolioValue = holdings.reduce((total, holding) => {
      const price = holding.currentPrice ?? holding.averageCost;
      return total + holding.shareCount * price;
    }, 0);

    return holdings.map((holding) => {
      const effectiveCurrentPrice = holding.currentPrice ?? holding.averageCost;
      const totalCostInvested = holding.shareCount * holding.averageCost;
      const marketValue = holding.shareCount * effectiveCurrentPrice;
      const unrealizedPL = marketValue - totalCostInvested;
      const unrealizedPLPercent = totalCostInvested === 0 ? 0 : (unrealizedPL / totalCostInvested) * 100;
      const allocationPercent =
        totalPortfolioValue === 0 ? 0 : (marketValue / totalPortfolioValue) * 100;

      return {
        ...holding,
        effectiveCurrentPrice,
        totalCostInvested,
        marketValue,
        unrealizedPL,
        unrealizedPLPercent,
        allocationPercent,
      };
    });
  });
}
