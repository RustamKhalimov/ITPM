import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  barcode: string | null;
  image_url: string | null;
  category: string;
  expiry_date: string | null;
  quantity: number;
  regular_price: number;
  unit_size: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ProductPayload = Omit<
  Product,
  'id' | 'created_at' | 'updated_at'
>;

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://127.0.0.1:8000/api/products/';

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getExpiringProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${this.apiUrl}expiring/`
    );
  }

  addProduct(product: ProductPayload): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(
    id: number,
    product: Partial<ProductPayload>
  ): Observable<Product> {
    return this.http.patch<Product>(
      `${this.apiUrl}${id}/`,
      product
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}${id}/`
    );
  }
}