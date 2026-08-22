import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgPersianDatepickerModule, IActiveDate } from 'ng-persian-datepicker';
import { Jalali } from 'jalali-ts';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchStateService } from '../../services/search-state.service';
import { AIRPORTS, FlightService } from '../../services/flight.service';
import { Airport, CabinClass, SearchQuery } from '../../models/flight';
import { Dropdown, DropdownOption } from '../dropdown/dropdown';

@Component({
  selector: 'app-search-form',
  imports: [ReactiveFormsModule, NgIf, NgPersianDatepickerModule, Dropdown],
  templateUrl: './search-form.html',
})
export class SearchForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly searchState = inject(SearchStateService);
  private readonly destroyRef = inject(DestroyRef);
  readonly flightService = inject(FlightService);

  readonly today = new Date();
  readonly todayTs = Jalali.now().valueOf();
  readonly maxPassengers = 9;

  /** Airport options — bundled list first, replaced with the server list when it loads */
  airportOptions: DropdownOption[] = SearchForm.airportOptionsFor(AIRPORTS);
  readonly passengerOptions: DropdownOption[] = Array.from({ length: 9 }, (_, i) => ({
    label: `${i + 1} نفر`,
    value: i + 1,
  }));
  readonly cabinOptions: DropdownOption[] = [
    { label: 'اکونومی', value: 'اکونومی' },
    { label: 'بیزینس', value: 'بیزینس' },
  ];

  form: FormGroup;

  /** True after the user tries to submit with an invalid form — shows the error banner */
  submitted = false;

  /** One day from now, formatted yyyy-MM-dd */
  readonly tomorrow = SearchForm.iso(this.today.getTime() + 86_400_000);

  /** FormControls holding the shamsi (Jalali) date strings shown by the picker */
  readonly departureControl = new FormControl<string>('');
  readonly returnDateControl = new FormControl<string>('');

  private static iso(ms: number): string {
    const d = new Date(ms);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  private static airportOptionsFor(airports: Airport[]): DropdownOption[] {
    return airports.map((a) => ({
      label: `${a.city} — ${a.name}`,
      value: a.code,
    }));
  }

  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.flightService.airports$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((airports) => {
        this.airportOptions = SearchForm.airportOptionsFor(airports);
        this.cdr.markForCheck();
      });

    const prev = this.searchState.query;
    this.form = this.fb.group(
      {
        tripType: ['roundtrip', Validators.required],
        from: [prev?.from ?? 'THR', Validators.required],
        to: [prev?.to ?? 'MHD', Validators.required],
        date: [prev?.date ?? this.tomorrow, Validators.required],
        returnDate: [prev?.returnDate ?? SearchForm.iso(this.today.getTime() + 2 * 86_400_000)],
        passengers: [prev?.passengers ?? 1, [Validators.required, Validators.min(1), Validators.max(9)]],
        cabinClass: [prev?.cabinClass ?? 'اکونومی', Validators.required],
      },
      { validators: [SearchForm.differentCities, SearchForm.returnDateRequired] },
    );

    this.departureControl.setValue(this.toShamsi(this.form.get('date')!.value));
    this.returnDateControl.setValue(this.toShamsi(this.form.get('returnDate')!.value ?? ''));
  }

  /** Convert a gregorian yyyy-MM-dd string into a shamsi YYYY/MM/DD string */
  private toShamsi(gregorian: string): string {
    if (!gregorian) return Jalali.now().format('YYYY/MM/DD');
    return new Jalali(new Date(gregorian)).format('YYYY/MM/DD');
  }

  /**
   * When a date picker opens, make sure its container is scrolled into view,
   * otherwise the calendar popup can be cut off near the bottom of the page.
   */
  scrollPickerIntoView(visible: boolean, box: HTMLElement): void {
    if (visible && box?.scrollIntoView) {
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  /** The picker reports the selected date back; store the gregorian date in the form */
  onDateSelect(event: IActiveDate, field: 'date' | 'returnDate'): void {
    // Legacy formats (numbers) are ignored; we only trust a real timestamp
    const ts = Number(event?.timestamp);
    if (!Number.isFinite(ts)) return;
    this.form.get(field)!.setValue(SearchForm.iso(ts));
  }

  private static differentCities(group: FormGroup) {
    const { from, to } = group.value;
    return from && to && from === to ? { sameCities: true } : null;
  }

  private static returnDateRequired(group: FormGroup) {
    const { tripType, returnDate } = group.value;
    return tripType === 'roundtrip' && !returnDate ? { returnDateRequired: true } : null;
  }

  get tripType() {
    return this.form.get('tripType')!;
  }

  swapCities(): void {
    const from = this.form.get('from')!.value;
    const to = this.form.get('to')!.value;
    this.form.patchValue({ from: to, to: from });
    this.submitted = false;
  }

  quickDestination(code: string): void {
    this.form.patchValue({ to: code, tripType: 'oneway' });
    this.submitted = false;
  }

  submit(): void {
    if (this.form.invalid) {
      this.submitted = true;
      this.form.markAllAsTouched();
      this.form.get('from')?.parent?.markAllAsTouched?.();
      return;
    }
    this.submitted = false;
    const v = this.form.value;
    const query: SearchQuery = {
      from: v.from,
      to: v.to,
      date: v.date,
      returnDate: v.tripType === 'roundtrip' ? v.returnDate : undefined,
      passengers: Number(v.passengers),
      cabinClass: v.cabinClass as CabinClass,
      roundTrip: v.tripType === 'roundtrip',
    };
    this.searchState.setQuery(query);
    this.router.navigate(['/results']);
  }
}
