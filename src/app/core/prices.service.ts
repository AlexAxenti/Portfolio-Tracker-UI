import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { toReadableHttpError } from './http-error';

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
  private readonly pricesUrl = `${environment.apiUrl}/api/prices`;

  refreshPrices(): Observable<PriceRefreshQueuedResponse> {
    return this.http.post<PriceRefreshQueuedResponse>(`${this.pricesUrl}/refresh-prices`, {}).pipe(
      tap((response) => console.info('Price refresh queued.', response)),
      catchError((error) =>
        throwError(() => toReadableHttpError(error, 'Holding prices could not be refreshed.'))
      )
    );
  }
}
