import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Holding } from '../../models/holding.model';

export interface HoldingFormDialogData {
  holding?: Holding;
}

type HoldingFormControlName =
  | 'ticker'
  | 'companyName'
  | 'shareCount'
  | 'averageCost';

@Component({
  selector: 'app-holding-form-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './holding-form-dialog.html',
  styleUrl: './holding-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<HoldingFormDialogComponent, Holding>);
  private readonly formBuilder = inject(FormBuilder);
  private readonly data = inject<HoldingFormDialogData>(MAT_DIALOG_DATA, { optional: true });

  private readonly holding = this.data?.holding;

  readonly isEditMode = Boolean(this.holding);
  readonly title = this.isEditMode ? 'Edit Holding' : 'Add Holding';
  readonly submitLabel = this.isEditMode ? 'Save Changes' : 'Add Holding';

  readonly form = this.formBuilder.group({
    ticker: this.formBuilder.nonNullable.control(
      this.holding?.ticker ?? '',
      [Validators.required, Validators.maxLength(10)]
    ),
    companyName: this.formBuilder.nonNullable.control(
      this.holding?.companyName ?? '',
      [Validators.maxLength(120)]
    ),
    shareCount: this.formBuilder.control<number | null>(
      this.holding?.shareCount ?? null,
      [Validators.required, Validators.min(0.01)]
    ),
    averageCost: this.formBuilder.control<number | null>(
      this.holding?.averageCost ? this.roundToThreeDecimals(this.holding.averageCost) : null,
      [Validators.required, Validators.min(0.01)]
    ),
  });

  getErrorMessage(controlName: HoldingFormControlName): string {
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const now = new Date().toISOString();
    const formValue = this.form.getRawValue();

    if (formValue.shareCount === null || formValue.averageCost === null) {
      return;
    }

    const holding: Holding = {
      ...this.holding,
      id: this.holding?.id ?? crypto.randomUUID(),
      ticker: formValue.ticker.trim().toUpperCase(),
      companyName: formValue.companyName.trim() || undefined,
      shareCount: formValue.shareCount,
      averageCost: this.roundToThreeDecimals(formValue.averageCost),
      createdAt: this.holding?.createdAt ?? now,
      updatedAt: now,
    };

    this.dialogRef.close(holding);
  }

  private roundToThreeDecimals(value: number): number {
    return Math.round(value * 1000) / 1000;
  }
}
