import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, Plugin, TooltipItem } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { HoldingView } from '../../models/holding.model';
import { HoldingsSort } from '../../models/holding-sort.type';

interface AllocationSlice {
  label: string;
  allocationPercent: number;
  marketValue: number;
  holdings: HoldingView[];
  isOther: boolean;
}

interface ArcLabelPosition {
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-holdings-allocation-chart',
  imports: [BaseChartDirective],
  templateUrl: './holdings-allocation-chart.html',
  styleUrl: './holdings-allocation-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingsAllocationChartComponent {
  readonly holdingViews = input.required<HoldingView[]>();

  readonly sortChanged = output<HoldingsSort>();
  readonly sliceSelected = output<HoldingView>();

  readonly activeSort = signal<HoldingsSort>('allocation');

  readonly chartSlices = computed(() => {
    const holdings = this.holdingViews();

    if (holdings.length <= 15) {
      return holdings.map((holding): AllocationSlice => this.toSlice(holding));
    }

    const visibleHoldings = holdings.slice(0, 14);
    const otherHoldings = holdings.slice(14);
    const otherSlice: AllocationSlice = {
      label: 'Other',
      allocationPercent: otherHoldings.reduce(
        (total, holding) => total + holding.allocationPercent,
        0
      ),
      marketValue: otherHoldings.reduce((total, holding) => total + holding.marketValue, 0),
      holdings: otherHoldings,
      isOther: true,
    };

    return [...visibleHoldings.map((holding): AllocationSlice => this.toSlice(holding)), otherSlice];
  });

  readonly chartData = computed<ChartData<'pie', number[], string>>(() => {
    const slices = this.chartSlices();

    return {
      labels: slices.map((slice) => slice.label),
      datasets: [
        {
          data: slices.map((slice) => slice.allocationPercent),
          backgroundColor: this.palette.slice(0, slices.length),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
  });

  readonly chartAriaLabel = computed(() => {
    const labels = this.chartSlices()
      .map((slice) => `${slice.label} ${this.formatPercent(slice.allocationPercent)}`)
      .join(', ');

    return `Portfolio Allocation pie chart. ${labels}`;
  });

  readonly chartPlugins: Plugin<'pie'>[] = [
    {
      id: 'holdings-slice-labels',
      afterDatasetsDraw: (chart) => this.drawSliceLabels(chart),
    },
  ];

  readonly chartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Portfolio Allocation',
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => this.getTooltipLines(context.dataIndex),
        },
      },
    },
  };

  private readonly palette = [
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#ca8a04',
    '#7c3aed',
    '#0891b2',
    '#db2777',
    '#4f46e5',
    '#65a30d',
    '#ea580c',
    '#0284c7',
    '#9333ea',
    '#0f766e',
    '#be123c',
    '#64748b',
  ];
  private readonly minimumSliceLabelPercent = 8;

  onSortChange(sort: HoldingsSort): void {
    this.activeSort.set(sort);
    this.sortChanged.emit(sort);
  }

  onChartClick(event: { active?: readonly unknown[] }): void {
    const activeElement = event.active?.[0];

    if (!this.isChartActiveElement(activeElement)) {
      return;
    }

    const slice = this.chartSlices()[activeElement.index];
    const holding = slice?.holdings[0];

    if (!slice || slice.isOther || !holding) {
      return;
    }

    this.sliceSelected.emit(holding);
  }

  private toSlice(holding: HoldingView): AllocationSlice {
    return {
      label: holding.ticker,
      allocationPercent: holding.allocationPercent,
      marketValue: holding.marketValue,
      holdings: [holding],
      isOther: false,
    };
  }

  private getTooltipLines(dataIndex: number): string[] {
    const slice = this.chartSlices()[dataIndex];

    if (!slice) {
      return [];
    }

    if (slice.isOther) {
      return [
        `${slice.label}: ${this.formatPercent(slice.allocationPercent)}`,
        `Current value: ${this.formatCurrency(slice.marketValue)}`,
        `Includes: ${slice.holdings.map((holding) => holding.ticker).join(', ')}`,
      ];
    }

    const holding = slice.holdings[0];

    if (!holding) {
      return [];
    }

    return [
      `${holding.ticker}: ${this.formatPercent(holding.allocationPercent)}`,
      `Shares: ${this.formatNumber(holding.shareCount)}`,
      `Current value: ${this.formatCurrency(holding.marketValue)}`,
    ];
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 4,
    }).format(value);
  }

  private formatPercent(value: number): string {
    return `${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value)}%`;
  }

  private drawSliceLabels(chart: Chart<'pie'>): void {
    const slices = this.chartSlices();
    const metadata = chart.getDatasetMeta(0);
    const { ctx } = chart;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 4;

    for (const [index, element] of metadata.data.entries()) {
      const slice = slices[index];

      if (!slice || slice.allocationPercent < this.minimumSliceLabelPercent) {
        continue;
      }

      const position = this.getArcLabelPosition(element);

      if (!position) {
        continue;
      }

      const angle = (position.startAngle + position.endAngle) / 2;
      const radius = (position.innerRadius + position.outerRadius) / 2;

      ctx.fillText(
        slice.label,
        position.x + Math.cos(angle) * radius,
        position.y + Math.sin(angle) * radius
      );
    }

    ctx.restore();
  }

  private getArcLabelPosition(value: unknown): ArcLabelPosition | null {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('endAngle' in value) ||
      !('innerRadius' in value) ||
      !('outerRadius' in value) ||
      !('startAngle' in value) ||
      !('x' in value) ||
      !('y' in value)
    ) {
      return null;
    }

    const position = value as Record<keyof ArcLabelPosition, unknown>;

    if (
      typeof position.endAngle !== 'number' ||
      typeof position.innerRadius !== 'number' ||
      typeof position.outerRadius !== 'number' ||
      typeof position.startAngle !== 'number' ||
      typeof position.x !== 'number' ||
      typeof position.y !== 'number'
    ) {
      return null;
    }

    return {
      endAngle: position.endAngle,
      innerRadius: position.innerRadius,
      outerRadius: position.outerRadius,
      startAngle: position.startAngle,
      x: position.x,
      y: position.y,
    };
  }

  private isChartActiveElement(value: unknown): value is { index: number } {
    if (typeof value !== 'object' || value === null || !('index' in value)) {
      return false;
    }

    return typeof value.index === 'number';
  }
}
