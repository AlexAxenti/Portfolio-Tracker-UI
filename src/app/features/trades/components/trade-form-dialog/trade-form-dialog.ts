import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Trade, TradeInput, TradeType } from '../../models/trade.model';

export interface TradeFormDialogData {
  trade?: Trade | TradeInput;
  errorMessage?: string;
  tickerOptions?: string[];
}

type TradeFormControlName = 'ticker' | 'type' | 'quantity' | 'price' | 'tradeDate';

@Component({
  selector: 'app-trade-form-dialog',
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './trade-form-dialog.html',
  styleUrl: './trade-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TradeFormDialogComponent, TradeInput>);
  private readonly formBuilder = inject(FormBuilder);
  private readonly data = inject<TradeFormDialogData>(MAT_DIALOG_DATA, { optional: true });

  private readonly trade = this.data?.trade;
  private readonly tickerSearch = signal('');
  private readonly hasTypedTicker = signal(false);

  readonly isEditMode = Boolean(this.trade && 'id' in this.trade);
  readonly title = this.isEditMode ? 'Edit Trade' : 'Add Trade';
  readonly submitLabel = this.isEditMode ? 'Save Changes' : 'Add Trade';
  readonly errorMessage = this.data?.errorMessage;
  readonly tickerOptions = [...new Set(this.data?.tickerOptions ?? [])].sort();
  readonly matchingTickers = computed(() => {
    const query = this.tickerSearch().trim().toUpperCase();

    if (!this.hasTypedTicker() || !query) {
      return [];
    }

    return this.tickerOptions
      .filter((ticker) => ticker.includes(query))
      .slice(0, 6);
  });

  readonly form = this.formBuilder.group({
    ticker: this.formBuilder.nonNullable.control(
      this.trade?.ticker ?? '',
      [Validators.required, Validators.maxLength(10)]
    ),
    type: this.formBuilder.nonNullable.control<TradeType>(
      this.trade?.type ?? 'buy',
      [Validators.required]
    ),
    quantity: this.formBuilder.control<number | null>(
      this.trade?.quantity ?? null,
      [Validators.required, Validators.min(0.01)]
    ),
    price: this.formBuilder.control<number | null>(
      this.trade?.price ?? null,
      [Validators.required, Validators.min(0.01)]
    ),
    tradeDate: this.formBuilder.nonNullable.control(
      this.trade?.tradeDate ?? this.getCurrentDateTimeValue(),
      [Validators.required]
    ),
    notes: this.formBuilder.nonNullable.control(this.trade?.notes ?? ''),
  });

  getErrorMessage(controlName: TradeFormControlName): string {
    const control = this.form.controls[controlName];

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    if (control.hasError('min')) {
      return 'Enter a value greater than 0.';
    }

    if (control.hasError('maxlength')) {
      return 'This value is too long.';
    }

    return '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onTickerInput(value: string): void {
    const ticker = value.toUpperCase();
    this.hasTypedTicker.set(true);
    this.tickerSearch.set(ticker);

    if (value !== ticker) {
      this.form.controls.ticker.setValue(ticker, { emitEvent: false });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (formValue.quantity === null || formValue.price === null) {
      return;
    }

    this.dialogRef.close({
      ticker: formValue.ticker.trim().toUpperCase(),
      type: formValue.type,
      quantity: formValue.quantity,
      price: formValue.price,
      tradeDate: formValue.tradeDate,
      notes: formValue.notes.trim() || undefined,
    });
  }

  private getCurrentDateTimeValue(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
}
