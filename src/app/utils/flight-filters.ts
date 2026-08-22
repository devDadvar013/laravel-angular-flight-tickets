import { Flight } from '../models/flight';

export interface Filters {
  airlines: string[];
  stops: string[]; // '0' | '1'
  maxPrice: number;
  timeOfDay: string[];
}

export type SortKey = 'cheapest' | 'fastest' | 'earliest';

export const TIME_BUCKETS: { key: string; label: string; range: [number, number] }[] = [
  { key: 'morning', label: 'صبح', range: [5, 10] },
  { key: 'noon', label: 'ظهر', range: [10, 15] },
  { key: 'afternoon', label: 'عصر', range: [15, 20] },
  { key: 'night', label: 'شب', range: [20, 24] },
];

/** Pure filter + sort pipeline used by the results page */
export function applyFilters(flights: Flight[], f: Filters, sort: SortKey): Flight[] {
  const out = flights.filter((fl) => {
    if (f.airlines.length && !f.airlines.includes(fl.airline)) return false;
    if (f.stops.length && !f.stops.includes(String(fl.stops))) return false;
    if (fl.price > f.maxPrice) return false;
    if (f.timeOfDay.length) {
      const hour = new Date(fl.departure).getHours();
      const inBucket = TIME_BUCKETS.some(
        (b) => f.timeOfDay.includes(b.key) && hour >= b.range[0] && hour < b.range[1],
      );
      if (!inBucket) return false;
    }
    return true;
  });

  return [...out].sort((a, b) => {
    if (sort === 'cheapest') return a.price - b.price;
    if (sort === 'fastest') {
      return (
        new Date(a.arrival).getTime() - new Date(a.departure).getTime() -
        (new Date(b.arrival).getTime() - new Date(b.departure).getTime())
      );
    }
    return new Date(a.departure).getTime() - new Date(b.departure).getTime();
  });
}
