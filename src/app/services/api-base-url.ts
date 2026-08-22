import { InjectionToken } from '@angular/core';

/** Base URL of the Laravel API backend. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => 'https://laravel-flight-tickets.onrender.com/api/v1',
});