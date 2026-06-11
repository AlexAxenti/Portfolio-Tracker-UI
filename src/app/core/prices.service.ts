import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Holding } from '../features/holdings/models/holding.model';
import { HoldingsService } from '../features/holdings/services/holdings.service';
import { toReadableHttpError } from './http-error';

@Injectable({
  providedIn: 'root',
})
export class PricesService {
  private readonly http = inject(HttpClient);
  private readonly holdingsService = inject(HoldingsService);
  private readonly pricesUrl = `${environment.apiUrl}/api/prices`;

  refreshPrices(): Observable<Holding[]> {
    return this.http.post<Holding[]>(`${this.pricesUrl}/refresh-prices`, {}).pipe(
      tap((holdings) => this.holdingsService.replaceHoldings(holdings)),
      catchError((error) =>
        throwError(() => toReadableHttpError(error, 'Holding prices could not be refreshed.'))
      )
    );
  }
}
