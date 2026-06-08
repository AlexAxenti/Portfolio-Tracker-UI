import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Trade } from '../../models/trade.model';

@Component({
  selector: 'app-trades-list',
  imports: [CurrencyPipe, MatButtonModule, MatIconModule],
  templateUrl: './trades-list.html',
  styleUrl: './trades-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradesListComponent {
  readonly trades = input.required<Trade[]>();
  readonly dashboardMode = input(false);

  readonly editRequested = output<Trade>();
  readonly deleteRequested = output<Trade>();

  formatTradeDate(tradeDate: string): string {
    return tradeDate.replace('T', ' ');
  }
}
