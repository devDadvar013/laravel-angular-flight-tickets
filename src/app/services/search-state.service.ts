import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SearchQuery } from '../models/flight';

/**
 * Shared search state so the home page, results page and header all stay in sync.
 */
@Injectable({ providedIn: 'root' })
export class SearchStateService {
  private readonly _query = new BehaviorSubject<SearchQuery | null>(null);
  readonly query$: Observable<SearchQuery | null> = this._query.asObservable();

  get query(): SearchQuery | null {
    return this._query.getValue();
  }

  setQuery(query: SearchQuery): void {
    this._query.next({ ...query });
  }
}
