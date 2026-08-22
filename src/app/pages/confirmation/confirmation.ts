import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/flight';
import { TicketView } from '../../components/ticket-view/ticket-view';

@Component({
  selector: 'app-confirmation',
  imports: [NgIf, RouterLink, TicketView],
  templateUrl: './confirmation.html',
})
export class ConfirmationPage {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  readonly booking: Booking | null;

  constructor() {
    this.booking = this.bookingService.booking;
    if (!this.booking) {
      this.router.navigate(['/']);
    }
  }

  print(): void {
    window.print();
  }
}
