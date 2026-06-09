import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { filter, take } from 'rxjs';
import { HoldingsService } from '../../features/holdings/services/holdings.service';
import {
  TradeFormDialogComponent,
  TradeFormDialogData,
} from '../../features/trades/components/trade-form-dialog/trade-form-dialog';
import { TradeInput } from '../../features/trades/models/trade.model';
import { TradeService } from '../../features/trades/services/trade.service';

@Component({
  selector: 'app-header',
  imports: [MatButtonModule, MatDialogModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header implements OnInit {
  private readonly holdingsService = inject(HoldingsService);
  private readonly tradeService = inject(TradeService);
  private readonly dialog = inject(MatDialog);

  readonly tickerOptions = computed(() =>
    this.holdingsService
      .getHoldings()
      .map((holding) => holding.ticker)
  );

  ngOnInit(): void {
    this.holdingsService.loadHoldings().subscribe({
      error: (error) => console.error(this.toErrorMessage(error)),
    });
  }

  onAddTrade(): void {
    this.openCreateTradeDialog();
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

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Trade changes could not be applied.';
  }
}
