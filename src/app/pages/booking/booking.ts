import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, combineLatest, map, of, startWith } from 'rxjs';
import { Flight, Passenger, SearchQuery } from '../../models/flight';
import { BookingService } from '../../services/booking.service';
import { SearchStateService } from '../../services/search-state.service';
import { AIRPORTS } from '../../services/flight.service';
import { formatPassengers, formatPrice, formatTime } from '../../utils/format';

@Component({
  selector: 'app-booking',
  imports: [AsyncPipe, NgIf, NgFor, ReactiveFormsModule, RouterLink],
  templateUrl: './booking.html',
})
export class BookingPage {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly searchState = inject(SearchStateService);

  readonly query: SearchQuery;
  readonly flights: Flight[];
  readonly formatPrice = formatPrice;
  readonly formatTime = formatTime;
  readonly formatPassengers = formatPassengers;

  form: FormGroup;

  /** True while the booking is being persisted to the backend */
  submitting = false;

  /** Set when the backend rejects the booking */
  submitError = false;

  /** Price of one passenger for all selected legs */
  readonly unitPrice$: Observable<number>;

  /** Live total that reacts to the passenger form via RxJS */
  readonly total$: Observable<number>;

  constructor() {
    this.flights = this.bookingService.selected;
    this.query = this.searchState.query ?? {
      from: 'THR', to: 'MHD', date: '', passengers: 1, cabinClass: 'اکونومی', roundTrip: false,
    };

    if (this.flights.length === 0) {
      this.router.navigate(['/']);
    }

    const passengerForms: FormGroup[] = Array.from({ length: this.query.passengers }, () =>
      this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        nationalId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        phone: ['', [Validators.required, Validators.pattern(/^09\d{9}$/)]],
      }),
    );

    this.form = this.fb.group({
      passengers: this.fb.array(passengerForms),
    });

    const unitPrice = this.flights.reduce((sum, f) => sum + f.price, 0);
    this.unitPrice$ = of(unitPrice);

    // Live total: recomputes on every keystroke in the passenger form
    this.total$ = combineLatest([
      this.unitPrice$,
      this.form.valueChanges.pipe(startWith(this.form.value)),
    ]).pipe(map(([unit, value]) => unit * (value.passengers?.length ?? 0)));
  }

  get passengers(): FormArray {
    return this.form.get('passengers') as FormArray;
  }

  get passengerGroups(): FormGroup[] {
    return this.passengers.controls as FormGroup[];
  }

  legLabel(flight: Flight): string {
    const from = AIRPORTS.find((a) => a.code === flight.from.code)?.city ?? flight.from.city;
    const to = AIRPORTS.find((a) => a.code === flight.to.code)?.city ?? flight.to.city;
    return `${from} ← ${to}`;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting) return;

    this.submitting = true;
    this.submitError = false;
    const passengers: Passenger[] = this.passengerGroups.map((g) => g.value);
    this.bookingService.confirm(this.flights, passengers).subscribe({
      next: () => this.router.navigate(['/confirmation']),
      error: () => {
        this.submitting = false;
        this.submitError = true;
        this.cdr.markForCheck();
      },
    });
  }
}
