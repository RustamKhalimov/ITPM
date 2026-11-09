import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DiscountRule {
  id: number;
  enabled: boolean;
  two_days_discount: number;
  one_day_discount: number;
  expiry_day_discount: number;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiscountRuleService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://127.0.0.1:8000/api/discount-rules/';

  getRules(): Observable<DiscountRule> {
    return this.http.get<DiscountRule>(this.apiUrl);
  }

  updateRules(rules: Partial<DiscountRule>): Observable<DiscountRule> {
    return this.http.patch<DiscountRule>(this.apiUrl, rules);
  }
}