import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  EMPTY,
  Observable,
  catchError,
  defer,
  endWith,
  finalize,
  ignoreElements,
  switchMap,
  take,
  tap,
  throwError,
  timer,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { HoldingsService } from '../features/holdings/services/holdings.service';
import { toReadableHttpError } from './http-error';
import { ToastService } from './toast.service';

export interface PriceRefreshQueuedResponse {
  message: string;
  queuedTickers: string[];
  queuedAtUtc: string;
}

@Injectable({
  providedIn: 'root',
})
export class PricesService {
  private readonly http = inject(HttpClient);
  private readonly holdingsService = inject(HoldingsService);
  private readonly toastService = inject(ToastService);
  private readonly pricesUrl = `${environment.apiUrl}/api/prices`;
  private readonly refreshingPrices = signal(false);

  readonly isRefreshingPrices = this.refreshingPrices.asReadonly();

  refreshPrices(): Observable<PriceRefreshQueuedResponse> {
    return defer(() => {
      if (this.refreshingPrices()) {
        return EMPTY;
      }

      this.refreshingPrices.set(true);

      return this.http.post<PriceRefreshQueuedResponse>(`${this.pricesUrl}/refresh-prices`, {}).pipe(
        tap((response) => console.info('Price refresh queued.', response)),
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 429) {
            this.toastService.error(
              'You have reached the price refresh limit. You can refresh prices 5 times every 15 minutes.'
            );
          }

          return throwError(() => toReadableHttpError(error, 'Holding prices could not be refreshed.'));
        }),
        switchMap((response) =>
          timer(2_000, 2_000).pipe(
            take(5),
            switchMap(() =>
              this.holdingsService.loadHoldings().pipe(
                catchError((error) => {
                  console.error(this.toPollingErrorMessage(error));
                  return EMPTY;
                })
              )
            ),
            ignoreElements(),
            endWith(response)
          )
        ),
        finalize(() => this.refreshingPrices.set(false))
      );
    });
  }

  private toPollingErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Holdings could not be loaded while polling for refreshed prices.';
  }
}
