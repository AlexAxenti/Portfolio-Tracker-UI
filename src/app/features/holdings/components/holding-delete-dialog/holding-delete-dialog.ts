import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Holding } from '../../models/holding.model';

export interface HoldingDeleteDialogData {
  holding: Holding;
  errorMessage?: string;
}

@Component({
  selector: 'app-holding-delete-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './holding-delete-dialog.html',
  styleUrl: './holding-delete-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingDeleteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<HoldingDeleteDialogComponent, boolean>);
  private readonly data = inject<HoldingDeleteDialogData>(MAT_DIALOG_DATA);

  readonly holding = this.data.holding;
  readonly errorMessage = this.data.errorMessage;

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
