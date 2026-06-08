import { Injectable, signal, computed } from '@angular/core';
import { Holding, HoldingView } from '../models/holding.model';

@Injectable({
  providedIn: 'root',
})
export class HoldingsService {
  private readonly tempUserId = 'temp';
  private readonly holdings = signal<Holding[]>([]);

  readonly holdingViews = computed<HoldingView[]>(() => {
    const holdings = this.holdings();

    const totalPortfolioValue = this.holdings().reduce((total, holding) => {
      const price = holding.currentPrice ?? holding.averageCost;
      return total + holding.shareCount * price;
    }, 0);

    return holdings.map((holding) => this.calculateHoldingView(holding, totalPortfolioValue));
  });

  addHolding(holding: Holding): void {
    const normalizedHolding = this.normalizeHolding(holding);

    if (this.hasDuplicateTicker(normalizedHolding.ticker, normalizedHolding.userId)) {
      throw new Error(`You already own ${normalizedHolding.ticker}.`);
    }

    this.holdings.update((holdings) => [...holdings, normalizedHolding]);
  }

  getHoldings(): Holding[] {
    return this.holdings();
  }

  replaceHoldings(holdings: Holding[]): void {
    this.holdings.set(holdings.map((holding) => this.normalizeHolding(holding)));
  }

  updateHolding(updatedHolding: Holding): void {
    const normalizedHolding = this.normalizeHolding(updatedHolding);

    if (
      this.hasDuplicateTicker(
        normalizedHolding.ticker,
        normalizedHolding.userId,
        normalizedHolding.id
      )
    ) {
      throw new Error(`You already own ${normalizedHolding.ticker}.`);
    }

    this.holdings.update((holdings) =>
      holdings.map((holding) =>
        holding.id === normalizedHolding.id ? normalizedHolding : holding
      )
    );
  }

  deleteHolding(id: string): void {
    this.holdings.update((holdings) =>
      holdings.filter((holding) => holding.id !== id)
    );
  }

  private calculateHoldingView(holding: Holding, totalPortfolioValue: number): HoldingView {
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
    }
  }

  private normalizeHolding(holding: Holding): Holding {
    return {
      ...holding,
      userId: holding.userId || this.tempUserId,
      ticker: holding.ticker.trim().toUpperCase(),
    };
  }

  private hasDuplicateTicker(ticker: string, userId: string, ignoredHoldingId?: string): boolean {
    return this.holdings().some(
      (holding) =>
        holding.userId === userId &&
        holding.ticker === ticker &&
        holding.id !== ignoredHoldingId
    );
  }
}
