from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Product


class ProductAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.today = timezone.localdate()

    def test_create_product_with_and_without_expiry(self):
        res1 = self.client.post(
            '/api/products/',
            {
                'name': 'Milk',
                'barcode': '4870001234567',
                'expiry_date': str(self.today + timedelta(days=2)),
                'quantity': 5,
            },
            format='json',
        )
        self.assertEqual(res1.status_code, 201)

        res2 = self.client.post(
            '/api/products/',
            {
                'name': 'Salt',
                'barcode': None,
                'expiry_date': None,
                'quantity': 3,
            },
            format='json',
        )
        self.assertEqual(res2.status_code, 201)
        self.assertIsNone(res2.data['expiry_date'])

    def test_reject_zero_or_negative_quantity(self):
        res_zero = self.client.post(
            '/api/products/',
            {'name': 'Invalid Zero', 'quantity': 0},
            format='json',
        )
        self.assertEqual(res_zero.status_code, 400)

        res_neg = self.client.post(
            '/api/products/',
            {'name': 'Invalid Negative', 'quantity': -3},
            format='json',
        )
        self.assertEqual(res_neg.status_code, 400)

    def test_null_expiry_dates_sorted_last(self):
        Product.objects.create(name='Salt', expiry_date=None, quantity=2)
        Product.objects.create(
            name='Bread',
            expiry_date=self.today + timedelta(days=1),
            quantity=4,
        )

        res = self.client.get('/api/products/')
        self.assertEqual(res.status_code, 200)
        names = [item['name'] for item in res.data]
        self.assertEqual(names, ['Bread', 'Salt'])

    def test_expiring_endpoint_includes_expired_and_within_3_days(self):
        Product.objects.create(
            name='Expired Yogurt',
            expiry_date=self.today - timedelta(days=1),
            quantity=1,
        )
        Product.objects.create(
            name='Expiring Milk',
            expiry_date=self.today + timedelta(days=2),
            quantity=5,
        )
        Product.objects.create(
            name='Fresh Apples',
            expiry_date=self.today + timedelta(days=10),
            quantity=8,
        )
        Product.objects.create(
            name='Non-perishable Salt',
            expiry_date=None,
            quantity=10,
        )

        res = self.client.get('/api/products/expiring/')
        self.assertEqual(res.status_code, 200)
        names = [item['name'] for item in res.data]
        self.assertEqual(names, ['Expired Yogurt', 'Expiring Milk'])
