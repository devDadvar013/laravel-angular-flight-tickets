import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { Observable, map } from 'rxjs';
import { SearchStateService } from '../../services/search-state.service';
import { SearchQuery } from '../../models/flight';
import { AIRPORTS } from '../../services/flight.service';
import { formatPassengers, formatShortDate } from '../../utils/format';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  templateUrl: './header.html',
})
export class Header {
  readonly query$: Observable<SearchQuery | null>;
  readonly summary$: Observable<string | null>;

  /** Exposed for use in the template */
  readonly formatPassengers = formatPassengers;
  readonly formatShortDate = formatShortDate;

  constructor(private readonly searchState: SearchStateService) {
    this.query$ = searchState.query$;
    this.summary$ = searchState.query$.pipe(
      map((q) => {
        if (!q) return null;
        const from = AIRPORTS.find((a) => a.code === q.from);
        const to = AIRPORTS.find((a) => a.code === q.to);
        return `${from?.city ?? q.from} ← ${to?.city ?? q.to}`;
      }),
    );
  }
}
