import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/flight';
import { TicketView } from '../../components/ticket-view/ticket-view';

@Component({
  selector: 'app-tracking',
  imports: [ReactiveFormsModule, NgIf, TicketView],
  templateUrl: './tracking.html',
})
export class TrackingPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly form = this.fb.nonNullable.group({
    ref: ['', [Validators.required, Validators.minLength(6)]],
  });

  booking: Booking | null = null;
  loading = false;
  error: string | null = null;
  /** Whether a lookup has been attempted at least once. */
  searched = false;

  ngOnInit(): void {
    // Support direct links like /tracking?ref=47ZJWE
    const ref = this.route.snapshot.queryParamMap.get('ref');
    if (ref) {
      this.form.patchValue({ ref });
      this.lookup();
    }
  }

  lookup(): void {
    if (this.form.invalid || this.loading) return;
    const ref = this.form.value.ref!.trim().toUpperCase();
    if (!ref) return;

    this.loading = true;
    this.error = null;
    this.booking = null;
    this.searched = true;

    this.bookingService
      .getBooking(ref)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (b) => {
          this.booking = b;
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.error =
            e.status === 404
              ? 'رزرو با این کد پیدا نشد. کد را دوباره بررسی کنید.'
              : 'خطا در ارتباط با سرور. کمی بعد دوباره تلاش کنید.';
          this.cdr.markForCheck();
        },
      });
  }
}
