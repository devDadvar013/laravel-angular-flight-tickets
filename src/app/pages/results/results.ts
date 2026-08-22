import { Component, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, debounceTime, filter, finalize, map, shareReplay, switchMap, tap } from 'rxjs';
import { FlightCard } from '../../components/flight-card/flight-card';
import { Flight, SearchQuery } from '../../models/flight';
import { AIRPORTS, FlightService } from '../../services/flight.service';
import { SearchStateService } from '../../services/search-state.service';
import { BookingService } from '../../services/booking.service';
import { Filters, SortKey, TIME_BUCKETS, applyFilters } from '../../utils/flight-filters';
import { formatPrice, formatShortDate, formatTime } from '../../utils/format';

type Step = 'outbound' | 'return';

@Component({
  selector: 'app-results',
  imports: [AsyncPipe, NgIf, NgFor, FlightCard, RouterLink],
  templateUrl: './results.html',
})
export class ResultsPage {
  private readonly router = inject(Router);
  private readonly flightService = inject(FlightService);
  private readonly searchState = inject(SearchStateService);
  private readonly bookingService = inject(BookingService);

  readonly query: SearchQuery;
  readonly formatPrice = formatPrice;
  readonly formatTime = formatTime;
  readonly formatShortDate = formatShortDate;
  readonly timeBuckets = TIME_BUCKETS;

  get fromCity(): string {
    return AIRPORTS.find((a) => a.code === this.query.from)?.city ?? this.query.from;
  }

  get toCity(): string {
    return AIRPORTS.find((a) => a.code === this.query.to)?.city ?? this.query.to;
  }

  readonly step$ = new BehaviorSubject<Step>('outbound');
  readonly loading$ = new BehaviorSubject<boolean>(true);

  private readonly filters$ = new BehaviorSubject<Filters>({
    airlines: [],
    stops: [],
    maxPrice: Number.MAX_SAFE_INTEGER,
    timeOfDay: [],
  });
  readonly filters = this.filters$.asObservable();

  private readonly sort$ = new BehaviorSubject<SortKey>('cheapest');
  readonly sort = this.sort$.asObservable();

  /** Builds the search query for the currently active leg (outbound or return) */
  private readonly legQuery$: Observable<SearchQuery> = combineLatest([
    this.searchState.query$.pipe(filter((q): q is SearchQuery => !!q)),
    this.step$,
  ]).pipe(
    map(([q, step]) =>
      step === 'outbound'
        ? { ...q, from: q.from, to: q.to, date: q.date }
        : { ...q, from: q.to, to: q.from, date: q.returnDate! },
    ),
  );

  /** Raw flights for the active leg, with simulated latency handled inside the service */
  readonly flights$: Observable<Flight[]> = this.legQuery$.pipe(
    switchMap((q) => {
      this.loading$.next(true);
      return this.flightService.search(q).pipe(finalize(() => this.loading$.next(false)));
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  /** Airlines present in the current results, for the filter sidebar */
  readonly airlines$: Observable<string[]> = this.flights$.pipe(
    map((flights) => [...new Set(flights.map((f) => f.airline))].sort((a, b) => a.localeCompare(b, 'fa'))),
  );

  /** Highest price in current results — bounds the price slider (and clamps it) */
  readonly priceCap$: Observable<number> = this.flights$.pipe(
    map((flights) => Math.max(0, ...flights.map((f) => f.price))),
    tap((cap) => {
      const f = this.filters$.getValue();
      if (f.maxPrice > cap) this.filters$.next({ ...f, maxPrice: cap });
    }),
  );

  /** Filtered + sorted list shown in the UI */
  readonly filtered$: Observable<Flight[]> = combineLatest([
    this.flights$,
    this.filters$.pipe(debounceTime(120)),
    this.sort$,
  ]).pipe(map(([flights, f, sort]) => applyFilters(flights, f, sort)));

  /** Selected outbound flight, for the round-trip banner */
  readonly selectedOutbound$: Observable<Flight | undefined> = this.bookingService.selected$.pipe(
    map((flights) => flights[0]),
  );

  constructor() {
    const q = this.searchState.query;
    if (!q) {
      this.router.navigate(['/']);
      this.query = {
        from: 'THR', to: 'MHD', date: '', passengers: 1, cabinClass: 'اکونومی', roundTrip: false,
      };
      return;
    }
    this.query = q;
  }

  // ---------- Filter helpers ----------

  isAirlineChecked(name: string): boolean {
    return this.filters$.getValue().airlines.includes(name);
  }

  toggleAirline(name: string): void {
    const f = this.filters$.getValue();
    const airlines = f.airlines.includes(name)
      ? f.airlines.filter((a) => a !== name)
      : [...f.airlines, name];
    this.filters$.next({ ...f, airlines });
  }

  isStopsChecked(stops: string): boolean {
    return this.filters$.getValue().stops.includes(stops);
  }

  toggleStops(stops: string): void {
    const f = this.filters$.getValue();
    const list = f.stops.includes(stops) ? f.stops.filter((s) => s !== stops) : [...f.stops, stops];
    this.filters$.next({ ...f, stops: list });
  }

  isTimeChecked(key: string): boolean {
    return this.filters$.getValue().timeOfDay.includes(key);
  }

  toggleTime(key: string): void {
    const f = this.filters$.getValue();
    const list = f.timeOfDay.includes(key) ? f.timeOfDay.filter((t) => t !== key) : [...f.timeOfDay, key];
    this.filters$.next({ ...f, timeOfDay: list });
  }

  setMaxPrice(value: number): void {
    this.filters$.next({ ...this.filters$.getValue(), maxPrice: value });
  }

  setSort(key: SortKey): void {
    this.sort$.next(key);
  }

  resetFilters(): void {
    this.filters$.next({ airlines: [], stops: [], maxPrice: Number.MAX_SAFE_INTEGER, timeOfDay: [] });
  }

  // ---------- Selection flow ----------

  onSelect(flight: Flight): void {
    if (this.step$.getValue() === 'return') {
      this.onSelectReturn(flight);
    } else {
      this.onSelectOutbound(flight);
    }
  }

  onSelectOutbound(flight: Flight): void {
    this.bookingService.selectFlight(flight);
    if (this.query.roundTrip && this.query.returnDate) {
      this.step$.next('return');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.router.navigate(['/booking', flight.id]);
    }
  }

  onSelectReturn(flight: Flight): void {
    this.bookingService.selectFlight(flight);
    this.router.navigate(['/booking', flight.id]);
  }

  changeOutbound(): void {
    this.bookingService.resetSelection();
    this.step$.next('outbound');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
