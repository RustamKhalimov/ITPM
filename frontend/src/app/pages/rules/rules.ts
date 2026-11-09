import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiscountRuleService, DiscountRule } from '../../services/discount-rule';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './rules.html',
  styleUrl: './rules.css'
})
export class Rules implements OnInit {
  private readonly discountService = inject(DiscountRuleService);

  rules = signal<DiscountRule | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.loading.set(true);
    this.error.set('');

    this.discountService.getRules().subscribe({
      next: (data) => {
        this.rules.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load discount settings.');
        this.loading.set(false);
      }
    });
  }

  updateField(
    field: 'two_days_discount' | 'one_day_discount' | 'expiry_day_discount',
    value: number
  ): void {
    const current = this.rules();

    if (!current) return;

    const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

    this.rules.set({
      ...current,
      [field]: safeValue
    });

    this.success.set('');
  }

  toggleAutomaticDiscounts(): void {
    const current = this.rules();

    if (!current) return;

    this.rules.set({
      ...current,
      enabled: !current.enabled
    });

    this.success.set('');
  }

  saveRules(): void {
    const current = this.rules();

    if (!current || this.saving()) return;

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    this.discountService.updateRules({
      enabled: current.enabled,
      two_days_discount: current.two_days_discount,
      one_day_discount: current.one_day_discount,
      expiry_day_discount: current.expiry_day_discount
    }).subscribe({
      next: (updatedRules) => {
        this.rules.set(updatedRules);
        this.success.set('Discount settings saved successfully!');
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Failed to save settings. Please try again.');
        this.saving.set(false);
      }
    });
  }

  resetRules(): void {
    const current = this.rules();

    if (!current) return;

    this.rules.set({
      ...current,
      enabled: true,
      two_days_discount: 20,
      one_day_discount: 30,
      expiry_day_discount: 50
    });

    this.success.set('');
  }
}