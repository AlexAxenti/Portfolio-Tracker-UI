import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HoldingView } from '../../models/holding.model';

@Component({
  selector: 'app-holdings-table',
  imports: [CurrencyPipe, DecimalPipe, MatButtonModule, MatIconModule],
  templateUrl: './holdings-table.html',
  styleUrl: './holdings-table.scss',
  host: {
    '[class.dashboard-table]': 'dashboardMode()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingsTableComponent {
  readonly holdingViews = input.required<HoldingView[]>();
  readonly selectedHoldingId = input<string | null>(null);
  readonly dashboardMode = input(false);

  readonly editRequested = output<HoldingView>();
  readonly deleteRequested = output<HoldingView>();
}
