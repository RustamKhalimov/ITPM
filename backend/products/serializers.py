from rest_framework import serializers
from .models import Product, DiscountRule


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class DiscountRuleSerializer(serializers.ModelSerializer):
    two_days_discount = serializers.IntegerField(min_value=0, max_value=100)
    one_day_discount = serializers.IntegerField(min_value=0, max_value=100)
    expiry_day_discount = serializers.IntegerField(min_value=0, max_value=100)

    class Meta:
        model = DiscountRule
        fields = [
            'id',
            'enabled',
            'two_days_discount',
            'one_day_discount',
            'expiry_day_discount',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']