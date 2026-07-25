from django.urls import path
from .views import CheckoutView, ReturnView, MyLoansView, OverdueLoansView, RenewView, GateAccessLogView, GateAccessScanView, GateAccessManualCheckoutView

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('return/', ReturnView.as_view(), name='return'),
    path('my-loans/', MyLoansView.as_view(), name='my_loans'),
    path('overdue/', OverdueLoansView.as_view(), name='overdue_loans'),
    path('renew/', RenewView.as_view(), name='renew_loan'),
    path('access-logs/', GateAccessLogView.as_view(), name='access_logs'),
    path('access-logs/scan/', GateAccessScanView.as_view(), name='access_logs_scan'),
    path('access-logs/manual-checkout/', GateAccessManualCheckoutView.as_view(), name='access_logs_checkout'),
]
