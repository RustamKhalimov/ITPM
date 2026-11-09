import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Product, ProductService } from '../../services/product';
import { DecimalPipe } from '@angular/common';
@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview implements OnInit {
  private readonly productService = inject(ProductService);

  protected readonly products = signal<Product[]>([]);
  protected readonly expiringProducts = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly totalProducts = computed(
    () => this.products().length
  );

  protected readonly totalQuantity = computed(
    () => this.products().reduce(
      (total, product) => total + product.quantity,
      0
    )
  );

  protected readonly expiringCount = computed(
    () => this.expiringProducts().length
  );

  protected readonly totalValue = computed(
    () => this.products().reduce(
      (total, product) =>
        total + product.regular_price * product.quantity,
      0
    )
  );

  ngOnInit(): void {
    this.loadData();
  }

  protected loadData(): void {
    this.loading.set(true);
    this.error.set('');

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Products loading error:', err);
        this.error.set('Unable to load products.');
        this.loading.set(false);
      }
    });

    this.productService.getExpiringProducts().subscribe({
      next: (products) => {
        this.expiringProducts.set(products);
      },
      error: (err) => {
        console.error('Expiring products loading error:', err);
      }
    });
  }
}