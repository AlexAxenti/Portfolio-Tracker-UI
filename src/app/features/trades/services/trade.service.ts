import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { toReadableHttpError } from '../../../core/http-error';
import { HoldingsService } from '../../holdings/services/holdings.service';
import { Trade, TradeInput } from '../models/trade.model';

@Injectable({
  providedIn: 'root',
})
export class TradeService {
  private readonly http = inject(HttpClient);
  private readonly holdingsService = inject(HoldingsService);
  private readonly tradesUrl = `${environment.apiUrl}/api/trades`;

  readonly trades = signal<Trade[]>([]);

  loadTrades(): Observable<Trade[]> {
    return this.http.get<Trade[]>(this.tradesUrl).pipe(
      tap((trades) => this.trades.set(trades)),
      catchError((error) =>
        throwError(() => toReadableHttpError(error, 'Trades could not be loaded.'))
      )
    );
  }

  getTrades(): Trade[] {
    return this.trades();
  }

  getTradesByTicker(ticker: string): Trade[] {
    const normalizedTicker = this.normalizeTicker(ticker);
    return this.trades().filter((trade) => trade.ticker === normalizedTicker);
  }

  createTrade(input: TradeInput): Observable<Trade> {
    return this.http.post<Trade>(this.tradesUrl, this.toTradeRequest(input)).pipe(
      tap((createdTrade) => this.trades.update((trades) => [...trades, createdTrade])),
      switchMap((createdTrade) =>
        this.holdingsService.loadHoldings().pipe(map(() => createdTrade))
      ),
      catchError((error) =>
        throwError(() => toReadableHttpError(error, 'Trade changes could not be applied.'))
      )
    );
  }

  updateTrade(id: string, input: TradeInput): Observable<Trade> {
    return this.http.put<Trade>(`${this.tradesUrl}/${id}`, this.toTradeRequest(input)).pipe(
      tap((updatedTrade) =>
        this.trades.update((trades) =>
          trades.map((trade) => (trade.id === updatedTrade.id ? updatedTrade : trade))
        )
      ),
      switchMap((updatedTrade) =>
        this.holdingsService.loadHoldings().pipe(map(() => updatedTrade))
      ),
      catchError((error) =>
        throwError(() => toReadableHttpError(error, 'Trade changes could not be applied.'))
      )
    );
  }

  deleteTrade(id: string): Observable<void> {
    return this.http.delete<void>(`${this.tradesUrl}/${id}`).pipe(
      tap(() => this.trades.update((trades) => trades.filter((trade) => trade.id !== id))),
      switchMap(() => this.holdingsService.loadHoldings()),
      map(() => undefined),
      catchError((error) =>
        throwError(() => toReadableHttpError(error, 'Trade could not be deleted.'))
      )
    );
  }

  private toTradeRequest(input: TradeInput): TradeInput {
    return {
      ...input,
      ticker: this.normalizeTicker(input.ticker),
      price: this.roundToThreeDecimals(input.price),
      notes: input.notes?.trim() || undefined,
    };
  }

  private normalizeTicker(ticker: string): string {
    return ticker.trim().toUpperCase();
  }

  private roundToThreeDecimals(value: number): number {
    return Math.round(value * 1000) / 1000;
  }
}
