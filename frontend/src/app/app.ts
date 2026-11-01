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

import { BarcodeScannerService } from './services/barcode-scanner';
import { ElementRef, ViewChild } from '@angular/core';
interface ProductForm {
  name: string;
  barcode: string;
  hasExpiryDate: boolean;
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

  private readonly barcodeScanner = inject(BarcodeScannerService);

  @ViewChild('videoElement')
  private videoElement?: ElementRef<HTMLVideoElement>;

  protected readonly scanning = signal(false);

  protected readonly title = 'FoodSaver';

  protected readonly activeView =
    signal<'dashboard' | 'inventory'>('dashboard');

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
  protected readonly editingProductId = signal<number | null>(null);

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
  hasExpiryDate: true,
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
        this.error.set('Unable to load products.');
        this.loading.set(false);
      }
    });

    this.productService.getExpiringProducts().subscribe({
      next: (products) => {
        this.expiringProducts.set(products);
      },
      error: (err) => {
        console.error('Error loading expiring products:', err);
      }
    });
  }

  protected showDashboard(): void {
    this.activeView.set('dashboard');
  }

  protected showInventory(): void {
    this.activeView.set('inventory');
  }

  protected openAddForm(): void {
    this.resetForm();
    this.editingProductId.set(null);
    this.showAddForm.set(true);
  }

  protected openEditForm(product: Product): void {
    this.resetForm();

    this.newProduct.name = product.name;
    this.newProduct.barcode = product.barcode ?? '';
    this.newProduct.hasExpiryDate = product.expiry_date !== null;
    this.newProduct.expiry_date = product.expiry_date ?? '';
    this.newProduct.quantity = product.quantity;

    this.editingProductId.set(product.id);
    this.showAddForm.set(true);
  }

  protected closeAddForm(): void {
    this.stopBarcodeScanner();
    this.showAddForm.set(false);
    this.resetForm();
  }

  protected async startBarcodeScanner(): Promise<void> {
    const video = this.videoElement?.nativeElement;

    if (!video) {
      this.error.set('Camera element not found.');
      return;
    }

    this.error.set('');
    this.scanning.set(true);

    await this.barcodeScanner.startScanner(
      video,
      (barcode) => {
        this.newProduct.barcode = barcode;
        this.scanning.set(false);
      },
      (message) => {
        this.error.set(message);
        this.scanning.set(false);
      }
    );
}

protected stopBarcodeScanner(): void {
  this.barcodeScanner.stopScanner();
  this.scanning.set(false);
}

  private resetForm(): void {
    this.newProduct.name = '';
    this.newProduct.barcode = '';
    this.newProduct.hasExpiryDate = true;
    this.newProduct.expiry_date = '';
    this.newProduct.quantity = 1;

    this.error.set('');
  }

  protected saveProduct(): void {
    if (
      !this.newProduct.name.trim() ||
      (this.newProduct.hasExpiryDate && !this.newProduct.expiry_date) ||
      this.newProduct.quantity < 1
    )
    {
      this.error.set('Please fill in all required fields correctly.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const product = {
      name: this.newProduct.name.trim(),
      barcode: this.newProduct.barcode.trim() || null,
      expiry_date: this.newProduct.hasExpiryDate
        ? this.newProduct.expiry_date
        : null,
      quantity: Number(this.newProduct.quantity)
    };

    const productId = this.editingProductId();

    const request = productId !== null
      ? this.productService.updateProduct(productId, product)
      : this.productService.addProduct(product);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeAddForm();
        this.loadProducts();

        this.success.set(
          productId !== null
            ? 'Product updated successfully!'
            : 'Product added successfully!'
        );
      },
      error: (err) => {
        console.error('Error saving product:', err);
        this.saving.set(false);
        this.error.set('Unable to save product. Please try again.');
      }
    });
  }

  protected deleteProduct(product: Product): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.loadProducts();
        this.success.set('Product deleted successfully!');
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        this.error.set('Unable to delete product.');
      }
    });
  }
}