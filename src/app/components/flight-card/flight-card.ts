import { Component, input, output } from '@angular/core';
import { NgIf } from '@angular/common';
import { Flight } from '../../models/flight';
import { formatDuration, formatPrice, formatTime } from '../../utils/format';

@Component({
  selector: 'app-flight-card',
  imports: [NgIf],
  templateUrl: './flight-card.html',
})
export class FlightCard {
  readonly flight = input.required<Flight>();
  /** Persian label for the select button, e.g. «انتخاب رفت» */
  readonly actionLabel = input('انتخاب');
  /** Optional badge shown on the card, e.g. «بلیت رفت انتخاب شد» */
  readonly badge = input<string | null>(null);
  readonly select = output<Flight>();

  readonly formatPrice = formatPrice;
  readonly formatTime = formatTime;
  readonly formatDuration = formatDuration;

  onSelect(): void {
    this.select.emit(this.flight());
  }
}
