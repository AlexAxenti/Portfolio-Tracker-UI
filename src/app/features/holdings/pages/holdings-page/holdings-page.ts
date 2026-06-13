import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { PricesService } from '../../../../core/prices.service';
import { HoldingsService } from '../../services/holdings.service';
import { Holding, HoldingView } from '../../models/holding.model';
import { HoldingsSort } from '../../models/holding-sort.type';
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
import { HoldingsAllocationChartComponent } from '../../components/holdings-allocation-chart/holdings-allocation-chart';
import { HoldingsTableComponent } from '../../components/holdings-table/holdings-table';
import { filter, finalize, take } from 'rxjs';

@Component({
  selector: 'app-holdings-page',
  imports: [
    HoldingsAllocationChartComponent,
    HoldingsTableComponent,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './holdings-page.html',
  styleUrl: './holdings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingsPage implements OnInit {
  private readonly holdingsService = inject(HoldingsService);
  private readonly pricesService = inject(PricesService);
  private readonly dialog = inject(MatDialog);

  readonly holdingViews = this.holdingsService.holdingViews;
  readonly isRefreshingPrices = signal(false);
  readonly selectedHoldingId = signal<string | null>(null);
  readonly sortMode = signal<HoldingsSort>('allocation');
  readonly sortedHoldingViews = computed(() => {
    const holdings = [...this.holdingViews()];

    if (this.sortMode() === 'ticker') {
      return holdings.sort((first, second) => first.ticker.localeCompare(second.ticker));
    }

    return holdings.sort(
      (first, second) =>
        second.allocationPercent - first.allocationPercent ||
        first.ticker.localeCompare(second.ticker)
    );
  });

  ngOnInit(): void {
    this.holdingsService.loadHoldings().subscribe({
      error: (error) => console.error(this.toErrorMessage(error)),
    });
  }

  onSortChanged(sort: HoldingsSort): void {
    this.sortMode.set(sort);
  }

  onChartSliceSelected(holding: HoldingView): void {
    this.selectedHoldingId.set(holding.id);
  }

  onAddHolding(): void {
    this.openAddHoldingDialog();
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

  onUpdateHolding(holding: HoldingView): void {
    this.openUpdateHoldingDialog(this.toHolding(holding));
  }

  onDeleteHolding(holding: HoldingView): void {
    this.openDeleteHoldingDialog(this.toHolding(holding));
  }

  private openDeleteHoldingDialog(holding: Holding, errorMessage?: string): void {
    this.dialog
      .open<HoldingDeleteDialogComponent, HoldingDeleteDialogData, boolean>(
        HoldingDeleteDialogComponent,
        {
          data: { holding, errorMessage },
        }
      )
      .afterClosed()
      .pipe(
        take(1),
        filter((confirmed) => confirmed === true)
      )
      .subscribe(() =>
        this.holdingsService.deleteHolding(holding.id).subscribe({
          error: (error) => this.openDeleteHoldingDialog(holding, this.toErrorMessage(error)),
        })
      );
  }

  private openAddHoldingDialog(holding?: Holding, errorMessage?: string): void {
    this.dialog
      .open<HoldingFormDialogComponent, HoldingFormDialogData, Holding>(
        HoldingFormDialogComponent,
        {
          data: { holding, errorMessage, mode: 'create' },
        }
      )
      .afterClosed()
      .pipe(
        take(1),
        filter((result): result is Holding => Boolean(result))
      )
      .subscribe((result) =>
        this.holdingsService.addHolding(result).subscribe({
          error: (error) => this.openAddHoldingDialog(result, this.toErrorMessage(error)),
        })
      );
  }

  private openUpdateHoldingDialog(holding: Holding, errorMessage?: string): void {
    this.dialog
      .open<HoldingFormDialogComponent, HoldingFormDialogData, Holding>(
        HoldingFormDialogComponent,
        {
          data: { holding, errorMessage, mode: 'edit' },
        }
      )
      .afterClosed()
      .pipe(
        take(1),
        filter((updatedHolding): updatedHolding is Holding => Boolean(updatedHolding))
      )
      .subscribe((updatedHolding) =>
        this.holdingsService.updateHolding(updatedHolding).subscribe({
          error: (error) =>
            this.openUpdateHoldingDialog(updatedHolding, this.toErrorMessage(error)),
        })
      );
  }

  private toHolding(holding: HoldingView): Holding {
    return {
      id: holding.id,
      userId: holding.userId,
      tickerId: holding.tickerId,
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

  private toErrorMessage(error: unknown, fallbackMessage = 'Holding changes could not be applied.'): string {
    return error instanceof Error ? error.message : fallbackMessage;
  }
}
