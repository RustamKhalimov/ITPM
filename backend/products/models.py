
from django.db import models


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('Bakery', 'Bakery'),
        ('Dairy', 'Dairy'),
        ('Produce', 'Produce'),
        ('Meat', 'Meat'),
        ('Other', 'Other'),
    ]

    name = models.CharField(max_length=200)

    barcode = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    image_url = models.URLField(
        max_length=500,
        blank=True,
        null=True
    )

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='Other'
    )

    quantity = models.PositiveIntegerField(default=1)

    regular_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    unit_size = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    expiry_date = models.DateField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class DiscountRule(models.Model):
    enabled = models.BooleanField(default=True)

    two_days_discount = models.PositiveSmallIntegerField(default=20)
    one_day_discount = models.PositiveSmallIntegerField(default=30)
    expiry_day_discount = models.PositiveSmallIntegerField(default=50)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "FoodSaver Discount Rules"
