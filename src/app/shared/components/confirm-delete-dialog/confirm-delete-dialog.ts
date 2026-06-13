import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDeleteDialogData {
  title: string;
  message: string;
  errorMessage?: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './confirm-delete-dialog.html',
  styleUrl: './confirm-delete-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialogComponent, boolean>);
  private readonly data = inject<ConfirmDeleteDialogData>(MAT_DIALOG_DATA);

  readonly title = this.data.title;
  readonly message = this.data.message;
  readonly errorMessage = this.data.errorMessage;

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
