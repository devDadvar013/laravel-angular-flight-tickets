import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { SearchForm } from '../../components/search-form/search-form';

interface Destination {
  code: string;
  city: string;
  desc: string;
  emoji: string;
}

@Component({
  selector: 'app-home',
  imports: [SearchForm, NgFor],
  templateUrl: './home.html',
})
export class HomePage {
  readonly destinations: Destination[] = [
    { code: 'MHD', city: 'مشهد', desc: 'زیارت و سیاحت', emoji: '🕌' },
    { code: 'KIH', city: 'کیش', desc: 'جزیره‌ی آرامش', emoji: '🏝️' },
    { code: 'SYZ', city: 'شیراز', desc: 'شهر شعر و گل', emoji: '🌸' },
    { code: 'TBZ', city: 'تبریز', desc: 'شهر اولین‌ها', emoji: '🏛️' },
    { code: 'RAS', city: 'رشت', desc: 'بام سبز ایران', emoji: '🌿' },
  ];
}
