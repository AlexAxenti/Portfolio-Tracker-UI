import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { toReadableHttpError } from '../../../core/http-error';
import { environment } from '../../../../environments/environment';
import { Holding, HoldingView } from '../models/holding.model';

@Injectable({
  providedIn: 'root',
})
export class HoldingsService {
  private readonly http = inject(HttpClient);
  private readonly holdingsUrl = `${environment.apiUrl}/api/holdings`;
  private readonly holdings = signal<Holding[]>([]);

  readonly holdingViews = computed<HoldingView[]>(() => {
    const holdings = this.holdings();

    const totalPortfolioValue = this.holdings().reduce((total, holding) => {
      const price = holding.currentPrice ?? holding.averageCost;
      return total + holding.shareCount * price;
    }, 0);

    return holdings.map((holding) => this.calculateHoldingView(holding, totalPortfolioValue));
  });

  loadHoldings(): Observable<Holding[]> {
    return this.http.get<Holding[]>(this.holdingsUrl).pipe(
      tap((holdings) => this.holdings.set(holdings)),
      catchError((error) =>
        throwError(() => toReadableHttpError(error, 'Holdings could not be loaded.'))
      )
    );
  }

  addHolding(holding: Holding): Observable<Holding> {
    return this.http.post<Holding>(this.holdingsUrl, this.toHoldingRequest(holding)).pipe(
      tap((createdHolding) => this.holdings.update((holdings) => [...holdings, createdHolding])),
      catchError((error) =>
        throwError(() => toReadableHttpError(error, 'Holding changes could not be applied.'))
      )
    );
  }

  getHoldings(): Holding[] {
    return this.holdings();
  }

  replaceHoldings(holdings: Holding[]): void {
    this.holdings.set(holdings);
  }

  updateHolding(updatedHolding: Holding): Observable<Holding> {
    return this.http
      .put<Holding>(
        `${this.holdingsUrl}/${updatedHolding.id}`,
        this.toHoldingRequest(updatedHolding)
      )
      .pipe(
        tap((savedHolding) =>
          this.holdings.update((holdings) =>
            holdings.map((holding) =>
              holding.id === savedHolding.id ? savedHolding : holding
            )
          )
        ),
        catchError((error) =>
          throwError(() => toReadableHttpError(error, 'Holding changes could not be applied.'))
        )
    );
  }

  deleteHolding(id: string): Observable<void> {
    return this.http.delete<void>(`${this.holdingsUrl}/${id}`).pipe(
      tap(() =>
        this.holdings.update((holdings) =>
          holdings.filter((holding) => holding.id !== id)
        )
      ),
      catchError((error) =>
        throwError(() => toReadableHttpError(error, 'Holding could not be deleted.'))
      )
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

  private toHoldingRequest(holding: Holding): Omit<
    Holding,
    | 'id'
    | 'userId'
    | 'createdAt'
    | 'updatedAt'
  > {
    return {
      ticker: holding.ticker.trim().toUpperCase(),
      companyName: holding.companyName,
      shareCount: holding.shareCount,
      averageCost: holding.averageCost,
      currentPrice: holding.currentPrice,
      priceLastUpdatedAt: holding.priceLastUpdatedAt,
      sector: holding.sector,
      categories: holding.categories,
      notes: holding.notes,
      purchaseDate: holding.purchaseDate,
    };
  }
}
