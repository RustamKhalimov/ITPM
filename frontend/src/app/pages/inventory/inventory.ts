
import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ElementRef,
  ViewChild
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

import { Product, ProductService } from '../../services/product';
import { BarcodeScannerService } from '../../services/barcode-scanner';
import {
  DiscountRule,
  DiscountRuleService
} from '../../services/discount-rule';

interface ProductForm {
  name: string;
  barcode: string;
  image_url: string;
  category: string;
  quantity: number;
  regular_price: number;
  unit_size: string;
  hasExpiryDate: boolean;
  expiry_date: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly barcodeScanner = inject(BarcodeScannerService);
  private readonly discountRuleService = inject(DiscountRuleService);

  @ViewChild('videoElement')
  private videoElement?: ElementRef<HTMLVideoElement>;

  protected readonly products = signal<Product[]>([]);
  protected readonly discountRules = signal<DiscountRule | null>(null);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly saving = signal(false);
  protected readonly scanning = signal(false);

  protected readonly showForm = signal(false);
  protected readonly editingProductId = signal<number | null>(null);

  protected readonly searchQuery = signal('');
  protected readonly activeFilter =
    signal<'all' | 'expiring' | 'fresh'>('all');

  protected readonly sortOrder = signal<'asc' | 'desc'>('asc');

  protected readonly categories = [
    'Bakery',
    'Dairy',
    'Produce',
    'Meat',
    'Other'
  ];

  protected readonly newProduct: ProductForm = {
    name: '',
    barcode: '',
    image_url: '',
    category: 'Other',
    quantity: 1,
    regular_price: 0,
    unit_size: '',
    hasExpiryDate: true,
    expiry_date: ''
  };

  protected readonly filteredProducts = computed(() => {
    let result = [...this.products()];
    const query = this.searchQuery().trim().toLowerCase();

    if (query) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.barcode ?? '').toLowerCase().includes(query)
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    if (this.activeFilter() === 'expiring') {
      result = result.filter(product => {
        if (!product.expiry_date) return false;

        const expiry = new Date(`${product.expiry_date}T00:00:00`);
        return expiry >= today && expiry <= threeDaysLater;
      });
    }

    if (this.activeFilter() === 'fresh') {
      result = result.filter(product => {
        if (!product.expiry_date) return true;

        const expiry = new Date(`${product.expiry_date}T00:00:00`);
        return expiry > threeDaysLater;
      });
    }

    result.sort((a, b) => {
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;

      const comparison = a.expiry_date.localeCompare(b.expiry_date);

      return this.sortOrder() === 'asc'
        ? comparison
        : -comparison;
    });

    return result;
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadDiscountRules();
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set('');

    this.productService.getProducts().subscribe({
      next: products => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: err => {
        console.error(err);
        this.error.set('Unable to load inventory.');
        this.loading.set(false);
      }
    });
  }

  protected loadDiscountRules(): void {
    this.discountRuleService.getRules().subscribe({
      next: rules => {
        this.discountRules.set(rules);
      },
      error: err => {
        console.error('Unable to load discount rules:', err);
      }
    });
  }

  protected setFilter(
    filter: 'all' | 'expiring' | 'fresh'
  ): void {
    this.activeFilter.set(filter);
  }

  protected toggleSort(): void {
    this.sortOrder.update(order =>
      order === 'asc' ? 'desc' : 'asc'
    );
  }

  protected getStatus(product: Product): string {
    if (!product.expiry_date) return 'No expiry date';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(`${product.expiry_date}T00:00:00`);
    const days = Math.round(
      (expiry.getTime() - today.getTime()) / 86400000
    );

    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day left';
    if (days === 2) return '2 days left';

    return `Fresh · ${days} days left`;
  }

  protected getDiscount(product: Product): number {
    const rules = this.discountRules();

    if (!rules || !rules.enabled || !product.expiry_date) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(`${product.expiry_date}T00:00:00`);

    const days = Math.round(
      (expiry.getTime() - today.getTime()) / 86400000
    );

    if (days < 0) return 0;
    if (days === 0) return rules.expiry_day_discount;
    if (days === 1) return rules.one_day_discount;
    if (days === 2) return rules.two_days_discount;

    return 0;
  }

  protected openAddForm(): void {
    this.resetForm();
    this.editingProductId.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(product: Product): void {
    this.resetForm();

    this.newProduct.name = product.name;
    this.newProduct.barcode = product.barcode ?? '';
    this.newProduct.image_url = product.image_url ?? '';
    this.newProduct.category = product.category;
    this.newProduct.quantity = product.quantity;
    this.newProduct.regular_price = product.regular_price;
    this.newProduct.unit_size = product.unit_size ?? '';
    this.newProduct.hasExpiryDate = product.expiry_date !== null;
    this.newProduct.expiry_date = product.expiry_date ?? '';

    this.editingProductId.set(product.id);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.stopBarcodeScanner();
    this.showForm.set(false);
    this.resetForm();
  }

  private resetForm(): void {
    this.newProduct.name = '';
    this.newProduct.barcode = '';
    this.newProduct.image_url = '';
    this.newProduct.category = 'Other';
    this.newProduct.quantity = 1;
    this.newProduct.regular_price = 0;
    this.newProduct.unit_size = '';
    this.newProduct.hasExpiryDate = true;
    this.newProduct.expiry_date = '';

    this.error.set('');
  }

  protected saveProduct(): void {
    if (
      !this.newProduct.name.trim() ||
      (this.newProduct.hasExpiryDate &&
        !this.newProduct.expiry_date) ||
      this.newProduct.quantity < 1 ||
      this.newProduct.regular_price < 0
    ) {
      this.error.set('Please check all required fields.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const product = {
      name: this.newProduct.name.trim(),
      barcode: this.newProduct.barcode.trim() || null,
      image_url: this.newProduct.image_url.trim() || null,
      category: this.newProduct.category,
      quantity: Number(this.newProduct.quantity),
      regular_price: Number(this.newProduct.regular_price),
      unit_size: this.newProduct.unit_size.trim() || null,
      expiry_date: this.newProduct.hasExpiryDate
        ? this.newProduct.expiry_date
        : null
    };

    const productId = this.editingProductId();

    const request = productId !== null
      ? this.productService.updateProduct(productId, product)
      : this.productService.addProduct(product);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadProducts();

        this.success.set(
          productId !== null
            ? 'Product updated successfully!'
            : 'Product added successfully!'
        );
      },
      error: err => {
        console.error(err);
        this.saving.set(false);
        this.error.set('Unable to save product.');
      }
    });
  }

  protected deleteProduct(product: Product): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.loadProducts();
        this.success.set('Product deleted successfully!');
      },
      error: err => {
        console.error(err);
        this.error.set('Unable to delete product.');
      }
    });
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
      barcode => {
        this.newProduct.barcode = barcode;
        this.scanning.set(false);
      },
      message => {
        this.error.set(message);
        this.scanning.set(false);
      }
    );
  }

  protected stopBarcodeScanner(): void {
    this.barcodeScanner.stopScanner();
    this.scanning.set(false);
  }
}
