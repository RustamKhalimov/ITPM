from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ProductViewSet, DiscountRuleView


router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
    path('discount-rules/', DiscountRuleView.as_view(), name='discount-rules'),
]