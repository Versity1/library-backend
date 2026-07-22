from django.urls import path
from .views import CheckoutView, ReturnView, MyLoansView, OverdueLoansView

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('return/', ReturnView.as_view(), name='return'),
    path('my-loans/', MyLoansView.as_view(), name='my_loans'),
    path('overdue/', OverdueLoansView.as_view(), name='overdue_loans'),
]
