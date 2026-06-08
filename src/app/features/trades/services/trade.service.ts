import { Injectable, inject, signal } from '@angular/core';
import { Holding } from '../../holdings/models/holding.model';
import { HoldingsService } from '../../holdings/services/holdings.service';
import { Trade, TradeInput } from '../models/trade.model';

@Injectable({
  providedIn: 'root',
})
export class TradeService {
  private readonly holdingsService = inject(HoldingsService);
  private readonly holdingSnapshots = new Map<string, Holding>();

  readonly trades = signal<Trade[]>([]);

  getTrades(): Trade[] {
    return this.trades();
  }

  getTradesByTicker(ticker: string): Trade[] {
    const normalizedTicker = this.normalizeTicker(ticker);
    return this.trades().filter((trade) => trade.ticker === normalizedTicker);
  }

  createTrade(input: TradeInput): Trade {
    const trade: Trade = {
      ...input,
      id: crypto.randomUUID(),
      ticker: this.normalizeTicker(input.ticker),
      price: this.roundToThreeDecimals(input.price),
      notes: input.notes?.trim() || undefined,
    };
    const currentHoldings = this.cloneHoldings();
    const nextHoldings = this.applyTrade(currentHoldings, trade);

    this.holdingsService.replaceHoldings(nextHoldings);
    this.storeSellSnapshot(trade, currentHoldings);
    this.trades.update((trades) => [...trades, trade]);

    return trade;
  }

  updateTrade(id: string, input: TradeInput): Trade {
    const existingTrade = this.trades().find((trade) => trade.id === id);

    if (!existingTrade) {
      throw new Error('This trade could not be found.');
    }

    const updatedTrade: Trade = {
      ...input,
      id,
      ticker: this.normalizeTicker(input.ticker),
      price: this.roundToThreeDecimals(input.price),
      notes: input.notes?.trim() || undefined,
    };

    const reversedHoldings = this.reverseTrade(this.cloneHoldings(), existingTrade);
    const nextHoldings = this.applyTrade(reversedHoldings, updatedTrade);

    this.holdingsService.replaceHoldings(nextHoldings);
    this.holdingSnapshots.delete(existingTrade.id);
    this.storeSellSnapshot(updatedTrade, reversedHoldings);
    this.trades.update((trades) =>
      trades.map((trade) => (trade.id === id ? updatedTrade : trade))
    );

    return updatedTrade;
  }

  deleteTrade(id: string): void {
    const existingTrade = this.trades().find((trade) => trade.id === id);

    if (!existingTrade) {
      throw new Error('This trade could not be found.');
    }

    const nextHoldings = this.reverseTrade(this.cloneHoldings(), existingTrade);

    this.holdingsService.replaceHoldings(nextHoldings);
    this.holdingSnapshots.delete(existingTrade.id);
    this.trades.update((trades) => trades.filter((trade) => trade.id !== id));
  }

  private applyTrade(holdings: Holding[], trade: Trade): Holding[] {
    return trade.type === 'buy'
      ? this.applyBuyTrade(holdings, trade)
      : this.applySellTrade(holdings, trade);
  }

  private reverseTrade(holdings: Holding[], trade: Trade): Holding[] {
    return trade.type === 'buy'
      ? this.reverseBuyTrade(holdings, trade)
      : this.reverseSellTrade(holdings, trade);
  }

  private applyBuyTrade(holdings: Holding[], trade: Trade): Holding[] {
    const holding = holdings.find((item) => item.ticker === trade.ticker);
    const now = new Date().toISOString();

    if (!holding) {
      return [
        ...holdings,
        {
          id: crypto.randomUUID(),
          ticker: trade.ticker,
          shareCount: trade.quantity,
          averageCost: this.roundToThreeDecimals(trade.price),
          currentPrice: trade.price,
          purchaseDate: trade.tradeDate,
          createdAt: now,
          updatedAt: now,
        },
      ];
    }

    const totalShares = holding.shareCount + trade.quantity;
    const averageCost = this.roundToThreeDecimals(
      (holding.shareCount * holding.averageCost + trade.quantity * trade.price) /
      totalShares
    );

    return holdings.map((item) =>
      item.id === holding.id
        ? {
            ...item,
            shareCount: totalShares,
            averageCost,
            currentPrice: item.currentPrice ?? trade.price,
            updatedAt: now,
          }
        : item
    );
  }

  private applySellTrade(holdings: Holding[], trade: Trade): Holding[] {
    const holding = holdings.find((item) => item.ticker === trade.ticker);

    if (!holding) {
      throw new Error(`You do not own ${trade.ticker}.`);
    }

    if (trade.quantity > holding.shareCount) {
      throw new Error(`You only own ${holding.shareCount} shares of ${trade.ticker}.`);
    }

    const remainingShares = holding.shareCount - trade.quantity;

    if (remainingShares === 0) {
      return holdings.filter((item) => item.id !== holding.id);
    }

    const now = new Date().toISOString();

    return holdings.map((item) =>
      item.id === holding.id
        ? {
            ...item,
            shareCount: remainingShares,
            updatedAt: now,
          }
        : item
    );
  }

  private reverseBuyTrade(holdings: Holding[], trade: Trade): Holding[] {
    const holding = holdings.find((item) => item.ticker === trade.ticker);

    if (!holding || holding.shareCount < trade.quantity) {
      throw new Error(`Cannot safely reverse the ${trade.ticker} buy trade.`);
    }

    const remainingShares = holding.shareCount - trade.quantity;

    if (remainingShares === 0) {
      return holdings.filter((item) => item.id !== holding.id);
    }

    const remainingCost =
      holding.shareCount * holding.averageCost - trade.quantity * trade.price;

    if (remainingCost < 0) {
      throw new Error(`Cannot safely recalculate ${trade.ticker} average cost.`);
    }

    const now = new Date().toISOString();

    return holdings.map((item) =>
      item.id === holding.id
        ? {
            ...item,
            shareCount: remainingShares,
            averageCost: this.roundToThreeDecimals(remainingCost / remainingShares),
            updatedAt: now,
          }
        : item
    );
  }

  private reverseSellTrade(holdings: Holding[], trade: Trade): Holding[] {
    const holding = holdings.find((item) => item.ticker === trade.ticker);
    const previousHolding = this.holdingSnapshots.get(trade.id);
    const now = new Date().toISOString();

    if (!holding) {
      if (!previousHolding) {
        throw new Error(`Cannot safely reverse the ${trade.ticker} sell trade.`);
      }

      return [...holdings, { ...previousHolding, updatedAt: now }];
    }

    const averageCost = this.roundToThreeDecimals(
      previousHolding?.averageCost ?? holding.averageCost
    );

    return holdings.map((item) =>
      item.id === holding.id
        ? {
            ...item,
            shareCount: item.shareCount + trade.quantity,
            averageCost,
            updatedAt: now,
          }
        : item
    );
  }

  private cloneHoldings(): Holding[] {
    return this.holdingsService.getHoldings().map((holding) => ({ ...holding }));
  }

  private storeSellSnapshot(trade: Trade, holdings: Holding[]): void {
    if (trade.type !== 'sell') {
      return;
    }

    const holding = holdings.find((item) => item.ticker === trade.ticker);

    if (holding) {
      this.holdingSnapshots.set(trade.id, { ...holding });
    }
  }

  private normalizeTicker(ticker: string): string {
    return ticker.trim().toUpperCase();
  }

  private roundToThreeDecimals(value: number): number {
    return Math.round(value * 1000) / 1000;
  }
}
