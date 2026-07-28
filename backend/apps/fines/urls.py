from django.urls import path
from .views import (
    MyFinesView, PayFineView, ReceiptDetailView, ApplyManualFineView,
    LibrarianPendingPaymentsView, VerifyPaymentView
)

urlpatterns = [
    path('my-fines/', MyFinesView.as_view(), name='my_fines'),
    path('pay/', PayFineView.as_view(), name='pay_fine'),
    path('apply/', ApplyManualFineView.as_view(), name='apply_manual_fine'),
    path('receipt/<uuid:id>/', ReceiptDetailView.as_view(), name='receipt_detail'),
    path('pending-payments/', LibrarianPendingPaymentsView.as_view(), name='pending_payments'),
    path('verify-payment/<uuid:id>/', VerifyPaymentView.as_view(), name='verify_payment'),
]
