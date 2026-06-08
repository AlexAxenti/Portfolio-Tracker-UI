import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { filter, take } from 'rxjs';
import { HoldingsService } from '../../../holdings/services/holdings.service';
import {
  TradeFormDialogComponent,
  TradeFormDialogData,
} from '../../components/trade-form-dialog/trade-form-dialog';
import { TradesListComponent } from '../../components/trades-list/trades-list';
import { Trade, TradeInput } from '../../models/trade.model';
import { TradeService } from '../../services/trade.service';

@Component({
  selector: 'app-trades-page',
  imports: [MatButtonModule, MatDialogModule, TradesListComponent],
  templateUrl: './trades-page.html',
  styleUrl: './trades-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradesPage {
  private readonly tradeService = inject(TradeService);
  private readonly holdingsService = inject(HoldingsService);
  private readonly dialog = inject(MatDialog);

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

  onAddTrade(): void {
    this.openCreateTradeDialog();
  }

  onEditTrade(trade: Trade): void {
    this.openEditTradeDialog(trade);
  }

  onDeleteTrade(trade: Trade): void {
    try {
      this.tradeService.deleteTrade(trade.id);
    } catch (error) {
      this.openEditTradeDialog(trade, this.toErrorMessage(error));
    }
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
      .subscribe((result) => {
        try {
          this.tradeService.createTrade(result);
        } catch (error) {
          this.openCreateTradeDialog(result, this.toErrorMessage(error));
        }
      });
  }

  private openEditTradeDialog(trade: Trade, errorMessage?: string): void {
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
      .subscribe((result) => {
        try {
          this.tradeService.updateTrade(trade.id, result);
        } catch (error) {
          this.openEditTradeDialog({ ...trade, ...result }, this.toErrorMessage(error));
        }
      });
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Trade changes could not be applied.';
  }
}
