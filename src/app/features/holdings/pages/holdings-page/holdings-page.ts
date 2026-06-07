import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HoldingsService } from '../../services/holdings.service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Holding, HoldingView } from '../../models/holding.model';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  HoldingFormDialogComponent,
  HoldingFormDialogData,
} from '../../components/holding-form-dialog/holding-form-dialog';
import {
  HoldingDeleteDialogComponent,
  HoldingDeleteDialogData,
} from '../../components/holding-delete-dialog/holding-delete-dialog';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-holdings-page',
  imports: [CurrencyPipe, DecimalPipe, MatButtonModule, MatDialogModule],
  templateUrl: './holdings-page.html',
  styleUrl: './holdings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingsPage {
  private readonly holdingsService = inject(HoldingsService);
  private readonly dialog = inject(MatDialog);

  readonly holdingViews = this.holdingsService.holdingViews;

  onAddHolding(): void {
    this.dialog
      .open<HoldingFormDialogComponent, HoldingFormDialogData, Holding>(
        HoldingFormDialogComponent
      )
      .afterClosed()
      .pipe(
        take(1),
        filter((holding): holding is Holding => Boolean(holding))
      )
      .subscribe((holding) => this.holdingsService.addHolding(holding));
  }

  onUpdateHolding(holding: HoldingView): void {
    this.dialog
      .open<HoldingFormDialogComponent, HoldingFormDialogData, Holding>(
        HoldingFormDialogComponent,
        {
          data: { holding: this.toHolding(holding) },
        }
      )
      .afterClosed()
      .pipe(
        take(1),
        filter((updatedHolding): updatedHolding is Holding => Boolean(updatedHolding))
      )
      .subscribe((updatedHolding) => this.holdingsService.updateHolding(updatedHolding));
  }

  onDeleteHolding(holding: HoldingView): void {
    this.dialog
      .open<HoldingDeleteDialogComponent, HoldingDeleteDialogData, boolean>(
        HoldingDeleteDialogComponent,
        {
          data: { holding: this.toHolding(holding) },
        }
      )
      .afterClosed()
      .pipe(
        take(1),
        filter((confirmed) => confirmed === true)
      )
      .subscribe(() => this.holdingsService.deleteHolding(holding.id));
  }

  private toHolding(holding: HoldingView): Holding {
    return {
      id: holding.id,
      ticker: holding.ticker,
      companyName: holding.companyName,
      shareCount: holding.shareCount,
      averageCost: holding.averageCost,
      currentPrice: holding.currentPrice,
      priceLastUpdatedAt: holding.priceLastUpdatedAt,
      sector: holding.sector,
      categories: holding.categories,
      notes: holding.notes,
      purchaseDate: holding.purchaseDate,
      createdAt: holding.createdAt,
      updatedAt: holding.updatedAt,
    };
  }
}
