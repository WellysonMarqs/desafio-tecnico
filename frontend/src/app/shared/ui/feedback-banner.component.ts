import { Component, input } from '@angular/core';

@Component({
  selector: 'app-feedback-banner',
  standalone: true,
  template: `
    @if (message()) {
      <p class="feedback-banner" [class.feedback-banner--error]="tone() === 'error'" [attr.role]="tone() === 'error' ? 'alert' : 'status'">
        {{ message() }}
      </p>
    }
  `
})
export class FeedbackBannerComponent {
  readonly message = input<string>('');
  readonly tone = input<'success' | 'error'>('success');
}
