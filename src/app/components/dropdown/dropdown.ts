import { Component, ElementRef, HostListener, inject, input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface DropdownOption {
  label: string;
  value: unknown;
}

@Component({
  selector: 'app-dropdown',
  imports: [NgFor, NgIf],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: Dropdown, multi: true }],
})
export class Dropdown implements ControlValueAccessor {
  readonly options = input<DropdownOption[]>([]);
  readonly placeholder = input('انتخاب کنید');

  private readonly el = inject(ElementRef);

  open = false;
  value: unknown = null;
  disabled = false;

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  // ---------- ControlValueAccessor ----------

  writeValue(value: unknown): void {
    this.value = value;
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ---------- UI ----------

  get selectedOption(): DropdownOption | undefined {
    return this.options().find((o) => o.value === this.value);
  }

  toggle(): void {
    if (this.disabled) return;
    this.open = !this.open;
  }

  select(option: DropdownOption): void {
    this.value = option.value;
    this.onChange(option.value);
    this.onTouched();
    this.open = false;
  }

  close(): void {
    this.open = false;
  }

  /** Close when clicking anywhere outside the component */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.open = false;
    }
  }
}
