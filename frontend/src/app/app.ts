import {
  Component,
  signal,
  computed,
  inject,
  OnInit
} from '@angular/core';

import {
  Product,
  ProductService
} from './services/product';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly productService = inject(ProductService);

  protected readonly title = 'FoodSaver';

  protected readonly products = signal<Product[]>([]);
  protected readonly expiringProducts = signal<Product[]>([]);

  protected readonly showAddForm = signal(false);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly totalProducts = computed(
    () => this.products().length
  );

  ngOnInit(): void {
    this.loadProducts();
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set('');

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.error.set('Unable to load products. Check the backend server.');
        this.loading.set(false);
      }
    });

    this.productService.getExpiringProducts().subscribe({
      next: (products) => {
        this.expiringProducts.set(products);
      },
      error: (err) => {
        console.error('Error loading expiring products:', err);
        this.error.set('Unable to load expiring products.');
      }
    });
  }

  protected openAddForm(): void {
    this.showAddForm.set(true);
  }

  protected closeAddForm(): void {
    this.showAddForm.set(false);
  }
}