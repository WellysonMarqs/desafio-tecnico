import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-state',
  standalone: true,
  template: `
    <section class="page-state" [attr.aria-live]="tone() === 'error' ? 'assertive' : 'polite'">
      <h2>{{ title() }}</h2>
      @if (description()) {
        <p>{{ description() }}</p>
      }
      @if (actionLabel()) {
        <button type="button" class="secondary-button" (click)="onAction()">{{ actionLabel() }}</button>
      }
    </section>
  `
})
export class PageStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly actionLabel = input<string>('');
  readonly tone = input<'neutral' | 'error'>('neutral');
  readonly action = input<(() => void) | undefined>(undefined);

  onAction(): void {
    this.action()?.();
  }
}
