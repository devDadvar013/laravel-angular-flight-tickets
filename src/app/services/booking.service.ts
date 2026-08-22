import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Booking, Flight, Passenger } from '../models/flight';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api/v1';

  /** Flights selected so far for the current booking (outbound + optional return) */
  private readonly _selected = new BehaviorSubject<Flight[]>([]);
  readonly selected$: Observable<Flight[]> = this._selected.asObservable();

  private readonly _booking = new BehaviorSubject<Booking | null>(null);
  readonly booking$: Observable<Booking | null> = this._booking.asObservable();

  get selected(): Flight[] {
    return this._selected.getValue();
  }

  get booking(): Booking | null {
    return this._booking.getValue();
  }

  selectFlight(flight: Flight): void {
    const current = this._selected.getValue();
    // Ignore duplicate selections (e.g. double-clicks)
    if (current.some((f) => f.id === flight.id)) return;
    this._selected.next([...current, flight]);
  }

  resetSelection(): void {
    this._selected.next([]);
  }

  /**
   * Persist the booking on the Laravel backend. The response's reference and
   * total are used, while the full flight objects are kept from the local
   * selection so the ticket page can render them.
   */
  confirm(flights: Flight[], passengers: Passenger[]): Observable<Booking> {
    const body = {
      flights: flights.map((f) => ({ id: f.id, price: f.price })),
      passengers: passengers.map((p) => ({ ...p })),
    };
    return this.http.post<{ data: Booking }>(`${this.api}/bookings`, body).pipe(
      map((res) => {
        const booking: Booking = {
          ref: res.data.ref,
          flights,
          passengers,
          total: res.data.total,
          createdAt: res.data.createdAt ?? new Date().toISOString(),
        };
        this._booking.next(booking);
        this._selected.next([]);
        return booking;
      }),
    );
  }

  /** Fetch a previously stored booking by its reference code. */
  getBooking(ref: string): Observable<Booking> {
    return this.http
      .get<{ data: Booking & { created_at?: string } }>(`${this.api}/bookings/${ref}`)
      .pipe(
        map((res) => ({
          ...res.data,
          createdAt: res.data.createdAt ?? res.data.created_at ?? new Date().toISOString(),
        })),
      );
  }
}
