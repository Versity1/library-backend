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
        fine_id = request.data.get('fine_id')
        payment_method = request.data.get('payment_method', PaymentMethod.DIGITAL_WALLET)
        payment_slip = request.FILES.get('payment_slip')

        if not fine_id:
            return Response({'error': 'fine_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            fine = Fine.objects.get(id=fine_id, user=request.user)
        except Fine.DoesNotExist:
            return Response({'error': 'Fine record not found.'}, status=status.HTTP_404_NOT_FOUND)

        if fine.status == FineStatus.PAID:
            return Response({'error': 'Fine has already been paid.'}, status=status.HTTP_400_BAD_REQUEST)
        if fine.status == FineStatus.PENDING_VERIFICATION:
            return Response({'error': 'Fine is already pending verification.'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        
        # If manual bank transfer, mark as pending verification
        if payment_method == PaymentMethod.MANUAL_BANK_TRANSFER:
            fine.status = FineStatus.PENDING_VERIFICATION
            is_verified = False
        else:
            fine.status = FineStatus.PAID
            fine.paid_at = now
            is_verified = True
            
        fine.save()

        # Generate payment reference code
        tx_ref = f"PAY-{uuid.uuid4().hex[:8].upper()}"
        payment = PaymentRecord.objects.create(
            fine=fine,
            user=request.user,
            amount_paid=fine.amount,
            payment_method=payment_method,
            transaction_reference=tx_ref,
            payment_slip=payment_slip,
            is_verified=is_verified
        )

        return Response(PaymentRecordSerializer(payment).data, status=status.HTTP_201_CREATED)

class ReceiptDetailView(generics.RetrieveAPIView):
    serializer_class = PaymentRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = PaymentRecord.objects.all()
    lookup_field = 'id'

class ApplyManualFineView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsLibrarian]

    def post(self, request):
        user_id = request.data.get('user_id')
        amount = request.data.get('amount')
        reason = request.data.get('reason', 'Manual Fine')

        if not user_id or amount is None:
            return Response({'error': 'user_id and amount are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = float(amount)
        except ValueError:
            return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.authentication.models import User
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        fine = Fine.objects.create(
            user=user,
            amount=amount,
            reason=reason,
            status=FineStatus.UNPAID
        )

        return Response(FineSerializer(fine).data, status=status.HTTP_201_CREATED)

class LibrarianPendingPaymentsView(generics.ListAPIView):
    serializer_class = PaymentRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsLibrarian]

    def get_queryset(self):
        return PaymentRecord.objects.filter(is_verified=False, fine__status=FineStatus.PENDING_VERIFICATION).order_by('paid_at')

class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsLibrarian]

    def post(self, request, id):
        action = request.data.get('action') # 'APPROVE' or 'REJECT'
        
        try:
            payment = PaymentRecord.objects.get(id=id, is_verified=False)
        except PaymentRecord.DoesNotExist:
            return Response({'error': 'Pending payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        fine = payment.fine

        if action == 'APPROVE':
            payment.is_verified = True
            payment.save()
            fine.status = FineStatus.PAID
            fine.paid_at = timezone.now()
            fine.save()
            return Response({'message': 'Payment verified and fine cleared.'})
        elif action == 'REJECT':
            # Delete the invalid payment record and set fine back to UNPAID
            payment.delete()
            fine.status = FineStatus.UNPAID
            fine.save()
            return Response({'message': 'Payment rejected and fine reset to unpaid.'})
        else:
            return Response({'error': 'Invalid action. Must be APPROVE or REJECT.'}, status=status.HTTP_400_BAD_REQUEST)
