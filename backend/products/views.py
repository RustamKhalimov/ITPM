from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('expiry_date')
    serializer_class = ProductSerializer

    @action(detail=False, methods=['get'])
    def expiring(self, request):
        today = timezone.localdate()
        last_day = today + timedelta(days=3)

        products = Product.objects.filter(
            expiry_date__gte=today,
            expiry_date__lte=last_day
        ).order_by('expiry_date')

        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
