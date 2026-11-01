import {
  Component,
  signal,
  computed,
  inject,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  Product,
  ProductService
} from './services/product';

interface ProductForm {
  name: string;
  barcode: string;
  expiry_date: string;
  quantity: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly productService = inject(ProductService);

  protected readonly title = 'FoodSaver';

  protected readonly activeView = signal<'dashboard' | 'inventory'>('dashboard');

  protected readonly searchQuery = signal('');

  protected readonly filteredProducts = computed(() => {
  const query = this.searchQuery().trim().toLowerCase();

  if (!query) {
    return this.products();
  }

  return this.products().filter(product =>
    product.name.toLowerCase().includes(query) ||
    (product.barcode ?? '').toLowerCase().includes(query)
  );
});

  protected readonly products = signal<Product[]>([]);
  protected readonly expiringProducts = signal<Product[]>([]);

  protected readonly showAddForm = signal(false);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly totalProducts = computed(
    () => this.products().length
  );

  protected readonly newProduct: ProductForm = {
    name: '',
    barcode: '',
    expiry_date: '',
    quantity: 1
  };

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
    this.error.set('');
    this.success.set('');
    this.showAddForm.set(true);
  }

  protected showDashboard(): void {
  this.activeView.set('dashboard');
  }

  protected showInventory(): void {
    this.activeView.set('inventory');
  }

  protected closeAddForm(): void {
    this.showAddForm.set(false);
  }

  protected saveProduct(): void {
    if (
      !this.newProduct.name.trim() ||
      !this.newProduct.expiry_date ||
      this.newProduct.quantity < 1
    ) {
      this.error.set('Please fill in all required fields correctly.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const product = {
      name: this.newProduct.name.trim(),
      barcode: this.newProduct.barcode.trim() || null,
      expiry_date: this.newProduct.expiry_date,
      quantity: Number(this.newProduct.quantity)
    };

    this.productService.addProduct(product).subscribe({
      next: () => {
        this.saving.set(false);
        this.showAddForm.set(false);

        this.newProduct.name = '';
        this.newProduct.barcode = '';
        this.newProduct.expiry_date = '';
        this.newProduct.quantity = 1;

        this.loadProducts();
      },
      error: (err) => {
        console.error('Error saving product:', err);
        this.saving.set(false);
        this.error.set('Unable to save product. Please try again.');
      }
    });
  }
}