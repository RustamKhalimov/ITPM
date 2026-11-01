from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=200)
    barcode = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )
    expiry_date = models.DateField()
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name