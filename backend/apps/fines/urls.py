from django.urls import path
from .views import MyFinesView, PayFineView, ReceiptDetailView

urlpatterns = [
    path('my-fines/', MyFinesView.as_view(), name='my_fines'),
    path('pay/', PayFineView.as_view(), name='pay_fine'),
    path('receipt/<uuid:id>/', ReceiptDetailView.as_view(), name='receipt_detail'),
]
