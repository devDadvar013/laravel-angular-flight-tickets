import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, skip } from 'rxjs';
import { FlightService } from './flight.service';
import { Flight, SearchQuery } from '../models/flight';
import { API_BASE_URL } from './api-base-url';

const BASE = 'https://laravel-flight-tickets.onrender.com/api/v1';

function query(overrides: Partial<SearchQuery> = {}): SearchQuery {
  return {
    from: 'THR',
    to: 'MHD',
    date: '2026-09-01',
    passengers: 2,
    cabinClass: 'اکونومی',
    roundTrip: false,
    ...overrides,
  };
}

function flightFixture(id: string): Flight {
  return {
    id,
    airline: 'ایران‌ایر',
    flightNumber: 'IR-1000',
    from: { code: 'THR', city: 'تهران', name: 'مهرآباد' },
    to: { code: 'MHD', city: 'مشهد', name: 'شهید هاشمی نژاد' },
    departure: '2026-09-01T06:30:00+03:30',
    arrival: '2026-09-01T07:40:00+03:30',
    price: 1_850_000,
    cabinClass: 'اکونومی',
    stops: 0,
    baggage: 23,
    capacity: 160,
    booked: 40,
    airlineColor: '#0e6ba8',
  };
}

describe('FlightService', () => {
  let service: FlightService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(FlightService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('starts with the bundled airports and merges server additions', async () => {
    // The initial emission is the bundled list (12 airports).
    const initial = await firstValueFrom(service.airports$);
    expect(initial.length).toBeGreaterThanOrEqual(12);

    // After a server response with a partial / empty list, all bundled
    // airports remain — the list is never replaced, only appended to.
    const promise = firstValueFrom(service.airports$.pipe(skip(1)));
    const req = http.expectOne(`${BASE}/airports`);
    req.flush({ data: [{ code: 'ZZZ', city: 'تست', name: 'فرودگاه تست' }] });
    const merged = await promise;
    // Should still have all original airports plus the new one.
    expect(merged.length).toBeGreaterThanOrEqual(12 + 1);
    expect(merged.some((a) => a.code === 'ZZZ')).toBe(true);
  });

  it('searches flights through the API with the query as params', async () => {
    const promise = firstValueFrom(service.search(query()));
    // The service constructor fetches airports first
    http.expectOne(`${BASE}/airports`).flush({ data: [] });
    const req = http.expectOne((r) => r.url === `${BASE}/flights/search` && r.method === 'GET');
    expect(req.request.params.get('from')).toBe('THR');
    expect(req.request.params.get('to')).toBe('MHD');
    expect(req.request.params.get('date')).toBe('2026-09-01');
    expect(req.request.params.get('cabinClass')).toBe('اکونومی');

    const fixture = flightFixture('THR|MHD|2026-09-01|0|اکونومی');
    req.flush({ data: { outbound: [fixture], return: null } });

    const flights = await promise;
    expect(flights).toEqual([fixture]);
  });

  it('finds a flight by its id', async () => {
    const id = 'THR|MHD|2026-09-01|3|اکونومی';
    const promise = firstValueFrom(service.getFlightById(id));
    // The service constructor fetches airports first
    http.expectOne(`${BASE}/airports`).flush({ data: [] });
    const req = http.expectOne((r) => r.url === `${BASE}/flights/search`);
    req.flush({ data: { outbound: [flightFixture(id)], return: null } });
    const found = await promise;
    expect(found?.id).toBe(id);
  });
});
