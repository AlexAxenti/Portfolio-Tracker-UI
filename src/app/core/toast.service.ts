import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly messages = signal<ToastMessage[]>([]);
  private nextId = 1;

  readonly toasts = this.messages.asReadonly();

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  dismiss(id: number): void {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }

  private show(message: string, variant: ToastVariant): void {
    const id = this.nextId++;

    this.messages.update((messages) => [...messages, { id, message, variant }]);
    window.setTimeout(() => this.dismiss(id), 10_000);
  }
}
