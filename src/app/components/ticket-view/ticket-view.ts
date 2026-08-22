import { Component, Input } from '@angular/core';
import { NgFor } from '@angular/common';
import { AIRPORTS } from '../../services/flight.service';
import { Booking, Flight } from '../../models/flight';
import { formatDate, formatPrice, formatTime } from '../../utils/format';

@Component({
  selector: 'app-ticket-view',
  imports: [NgFor],
  templateUrl: './ticket-view.html',
})
export class TicketView {
  @Input() booking!: Booking;

  readonly formatPrice = formatPrice;
  readonly formatTime = formatTime;
  readonly formatDate = formatDate;

  city(flight: Flight): string {
    return AIRPORTS.find((a) => a.code === flight.from.code)?.city ?? flight.from.city;
  }

  destCity(flight: Flight): string {
    return AIRPORTS.find((a) => a.code === flight.to.code)?.city ?? flight.to.city;
  }
}
