import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { ResultsPage } from './pages/results/results';
import { BookingPage } from './pages/booking/booking';
import { ConfirmationPage } from './pages/confirmation/confirmation';
import { TrackingPage } from './pages/tracking/tracking';

export const routes: Routes = [
  { path: '', component: HomePage, pathMatch: 'full' },
  { path: 'results', component: ResultsPage },
  { path: 'booking/:id', component: BookingPage },
  { path: 'confirmation', component: ConfirmationPage },
  { path: 'tracking', component: TrackingPage },
  { path: '**', redirectTo: '' },
];
