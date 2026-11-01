
from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'barcode',
        'expiry_date',
        'quantity',
        'created_at',
    )
    search_fields = ('name', 'barcode')
    list_filter = ('expiry_date',)
