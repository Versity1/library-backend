import uuid
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Fine, FineStatus, PaymentRecord, PaymentMethod
from .serializers import FineSerializer, PaymentRecordSerializer, PayFineRequestSerializer
from apps.authentication.permissions import IsLibrarian

class MyFinesView(generics.ListAPIView):
    serializer_class = FineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['LIBRARIAN', 'ADMIN']:
            return Fine.objects.all()
        return Fine.objects.filter(user=user)

class PayFineView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PayFineRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        fine_id = serializer.validated_data['fine_id']
        payment_method = serializer.validated_data.get('payment_method', PaymentMethod.DIGITAL_WALLET)

        try:
            fine = Fine.objects.get(id=fine_id, user=request.user)
        except Fine.DoesNotExist:
            return Response({'error': 'Fine record not found.'}, status=status.HTTP_404_NOT_FOUND)

        if fine.status == FineStatus.PAID:
            return Response({'error': 'Fine has already been paid.'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        fine.status = FineStatus.PAID
        fine.paid_at = now
        fine.save()

        # Generate payment reference code
        tx_ref = f"PAY-{uuid.uuid4().hex[:8].upper()}"
        payment = PaymentRecord.objects.create(
            fine=fine,
            user=request.user,
            amount_paid=fine.amount,
            payment_method=payment_method,
            transaction_reference=tx_ref
        )

        return Response(PaymentRecordSerializer(payment).data, status=status.HTTP_201_CREATED)

class ReceiptDetailView(generics.RetrieveAPIView):
    serializer_class = PaymentRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = PaymentRecord.objects.all()
    lookup_field = 'id'
