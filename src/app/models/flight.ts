/** Airport with Persian labels */
export interface Airport {
  /** IATA-like code, e.g. THR */
  code: string;
  city: string;
  name: string;
}

export type CabinClass = 'اکونومی' | 'بیزینس';

/** A single flight leg */
export interface Flight {
  id: string;
  airline: string;
  /** e.g. W5-1254 */
  flightNumber: string;
  from: Airport;
  to: Airport;
  /** ISO date-time */
  departure: string;
  /** ISO date-time */
  arrival: string;
  /** Price in Toman for one passenger */
  price: number;
  cabinClass: CabinClass;
  stops: number;
  baggage: number;
  capacity: number;
  booked: number;
  /** Logo color for the airline badge */
  airlineColor: string;
}

/** Search criteria from the home form */
export interface SearchQuery {
  from: string;
  to: string;
  /** yyyy-MM-dd */
  date: string;
  /** yyyy-MM-dd, only for round trips */
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
  roundTrip: boolean;
}

export interface Passenger {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
}

export interface Booking {
  ref: string;
  flights: Flight[];
  passengers: Passenger[];
  total: number;
  createdAt: string;
}
