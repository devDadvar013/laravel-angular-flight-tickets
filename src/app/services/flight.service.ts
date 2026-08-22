import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Airport, CabinClass, Flight, SearchQuery } from '../models/flight';
import { API_BASE_URL } from './api-base-url';

/**
 * Bundled fallback airport list. Shown instantly while the server list loads,
 * and used by pages that only need the city names for labels.
 */
export const AIRPORTS: Airport[] = [
  { code: 'THR', city: 'تهران', name: 'مهرآباد' },
  { code: 'IKA', city: 'تهران', name: 'امام خمینی' },
  { code: 'MHD', city: 'مشهد', name: 'شهید هاشمی نژاد' },
  { code: 'SYZ', city: 'شیراز', name: 'شهید دستغیب' },
  { code: 'TBZ', city: 'تبریز', name: 'شهید مدنی' },
  { code: 'IFN', city: 'اصفهان', name: 'شهید بهشتی' },
  { code: 'AWZ', city: 'اهواز', name: 'بین‌المللی اهواز' },
  { code: 'KIH', city: 'کیش', name: 'بین‌المللی کیش' },
  { code: 'BND', city: 'بندرعباس', name: 'بین‌المللی بندرعباس' },
  { code: 'RAS', city: 'رشت', name: 'سردار جنگل' },
  { code: 'KER', city: 'کرمان', name: 'بین‌المللی کرمان' },
  { code: 'GBT', city: 'گرگان', name: 'علی‌آباد کتول' },
];

@Injectable({ providedIn: 'root' })
export class FlightService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);

  /** Server-provided airports; starts with the bundled list until fetched. */
  private readonly airportsSubject = new BehaviorSubject<Airport[]>(AIRPORTS);
  readonly airports$: Observable<Airport[]> = this.airportsSubject.asObservable();

  constructor() {
    this.http
      .get<{ data: Airport[] }>(`${this.api}/airports`)
      .subscribe({
        next: (res) => {
          // Merge server airports into the bundled list so we never lose
          // any local airport (the server may return an empty / partial list).
          const merged = [...AIRPORTS];
          for (const a of res.data) {
            if (!merged.some((m) => m.code === a.code)) {
              merged.push(a);
            }
          }
          this.airportsSubject.next(merged);
        },
        // Keep the bundled fallback list on failure.
        error: () => undefined,
      });
  }

  /** Search flights for a single leg via the Laravel API. */
  search(query: SearchQuery): Observable<Flight[]> {
    const params = new HttpParams({
      fromObject: {
        from: query.from,
        to: query.to,
        date: query.date,
        cabinClass: query.cabinClass,
      },
    });
    return this.http
      .get<{ data: { outbound: Flight[]; return: Flight[] | null } }>(
        `${this.api}/flights/search`,
        { params },
      )
      .pipe(map((res) => res.data.outbound));
  }

  getFlightById(id: string): Observable<Flight | undefined> {
    const [from, to, date, , cabin] = id.split('|');
    return this.search({
      from,
      to,
      date,
      passengers: 1,
      cabinClass: cabin as CabinClass,
      roundTrip: false,
    }).pipe(map((flights) => flights.find((f) => f.id === id)));
  }
}
