import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { filter, finalize, forkJoin, take } from 'rxjs';
import { PricesService } from '../../../../core/prices.service';
import { HoldingsAllocationChartComponent } from '../../../holdings/components/holdings-allocation-chart/holdings-allocation-chart';
import { HoldingsTableComponent } from '../../../holdings/components/holdings-table/holdings-table';
import { HoldingView } from '../../../holdings/models/holding.model';
import { HoldingsService } from '../../../holdings/services/holdings.service';
import {
  TradeFormDialogComponent,
  TradeFormDialogData,
} from '../../../trades/components/trade-form-dialog/trade-form-dialog';
import { TradesListComponent } from '../../../trades/components/trades-list/trades-list';
import { TradeInput } from '../../../trades/models/trade.model';
import { TradeService } from '../../../trades/services/trade.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    HoldingsAllocationChartComponent,
    HoldingsTableComponent,
    MatButtonModule,
    MatDialogModule,
    RouterLink,
    TradesListComponent,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private readonly holdingsService = inject(HoldingsService);
  private readonly pricesService = inject(PricesService);
  private readonly tradeService = inject(TradeService);
  private readonly dialog = inject(MatDialog);

  readonly isLoadingDashboard = signal(true);
  readonly selectedHoldingId = signal<string | null>(null);
  readonly isRefreshingPrices = signal(false);
  readonly sortedHoldingViews = computed(() =>
    [...this.holdingsService.holdingViews()].sort(
      (first, second) =>
        second.allocationPercent - first.allocationPercent ||
        first.ticker.localeCompare(second.ticker)
    )
  );
  readonly trades = computed(() =>
    [...this.tradeService.trades()].sort((first, second) =>
      second.tradeDate.localeCompare(first.tradeDate) || first.ticker.localeCompare(second.ticker)
    )
  );
  readonly tickerOptions = computed(() =>
    this.holdingsService
      .getHoldings()
      .map((holding) => holding.ticker)
  );

  ngOnInit(): void {
    forkJoin([
      this.holdingsService.loadHoldings(),
      this.tradeService.loadTrades(),
    ])
      .pipe(finalize(() => this.isLoadingDashboard.set(false)))
      .subscribe({
        error: (error) => console.error(this.toErrorMessage(error)),
      });
  }

  onAddTrade(): void {
    this.openCreateTradeDialog();
  }

  onRefreshPrices(): void {
    if (this.isRefreshingPrices()) {
      return;
    }

    this.isRefreshingPrices.set(true);
    this.pricesService
      .refreshPrices()
      .pipe(finalize(() => this.isRefreshingPrices.set(false)))
      .subscribe({
        error: (error) => console.error(this.toErrorMessage(error, 'Holding prices could not be refreshed.')),
      });
  }

  onChartSliceSelected(holding: HoldingView): void {
    this.selectedHoldingId.set(holding.id);
  }

  private openCreateTradeDialog(trade?: TradeInput, errorMessage?: string): void {
    this.dialog
      .open<TradeFormDialogComponent, TradeFormDialogData, TradeInput>(
        TradeFormDialogComponent,
        {
          data: {
            trade,
            errorMessage,
            tickerOptions: this.tickerOptions(),
          },
        }
      )
      .afterClosed()
      .pipe(
        take(1),
        filter((result): result is TradeInput => Boolean(result))
      )
      .subscribe((result) =>
        this.tradeService.createTrade(result).subscribe({
          error: (error) => this.openCreateTradeDialog(result, this.toErrorMessage(error)),
        })
      );
  }

  private toErrorMessage(error: unknown, fallbackMessage = 'Trade changes could not be applied.'): string {
    return error instanceof Error ? error.message : fallbackMessage;
  }
}
