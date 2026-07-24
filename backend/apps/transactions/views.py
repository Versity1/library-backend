from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Transaction, TransactionStatus
from .serializers import TransactionSerializer, CheckoutRequestSerializer, ReturnRequestSerializer, RenewRequestSerializer
from apps.authentication.models import User
from apps.authentication.permissions import IsLibrarian
from apps.catalog.models import BookCopy, BookCopyStatus
from apps.policies.models import InstitutionPolicy
from apps.fines.models import Fine, FineStatus

class CheckoutView(APIView):
    permission_classes = [IsLibrarian]

    def post(self, request):
        serializer = CheckoutRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        student_staff_id = serializer.validated_data['student_staff_id']
        qr_code_id = serializer.validated_data['qr_code_id']

        try:
            borrower = User.objects.get(student_staff_id=student_staff_id)
        except User.DoesNotExist:
            return Response({'error': 'Student/Staff user not found.'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Check borrowing limits
        active_loans_count = Transaction.objects.filter(
            user=borrower,
            status__in=[TransactionStatus.BORROWED, TransactionStatus.OVERDUE]
        ).count()

        policy = InstitutionPolicy.objects.filter(role=borrower.role).first()
        limit = policy.max_borrow_limit if policy else borrower.borrowing_limit

        if active_loans_count >= limit:
            return Response({
                'error': f'Borrowing limit reached ({active_loans_count}/{limit}). Cannot checkout more books.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check unpaid fines block
        unpaid_fines_exist = Fine.objects.filter(user=borrower, status=FineStatus.UNPAID).exists()
        if unpaid_fines_exist:
            return Response({
                'error': 'User has outstanding unpaid fines. Please settle fines before borrowing.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 3. Check book copy availability
        try:
            copy = BookCopy.objects.select_related('book').get(qr_code_id=qr_code_id)
        except BookCopy.DoesNotExist:
            return Response({'error': 'Book copy not found for provided QR code.'}, status=status.HTTP_404_NOT_FOUND)

        if copy.status != BookCopyStatus.AVAILABLE:
            return Response({'error': f'Book copy is currently {copy.status.lower()}.'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate due date
        loan_days = policy.default_loan_days if policy else 14
        due_date = timezone.now() + timedelta(days=loan_days)

        # Create Transaction
        loan = Transaction.objects.create(
            user=borrower,
            book_copy=copy,
            issued_by=request.user,
            due_date=due_date,
            status=TransactionStatus.BORROWED
        )

        # Update Copy & Catalog stock
        copy.status = BookCopyStatus.BORROWED
        copy.save()

        book = copy.book
        if book.available_copies > 0:
            book.available_copies -= 1
            book.save()

        return Response(TransactionSerializer(loan).data, status=status.HTTP_201_CREATED)

class ReturnView(APIView):
    permission_classes = [IsLibrarian]

    def post(self, request):
        serializer = ReturnRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        qr_code_id = serializer.validated_data['qr_code_id']

        try:
            copy = BookCopy.objects.select_related('book').get(qr_code_id=qr_code_id)
        except BookCopy.DoesNotExist:
            return Response({'error': 'Book copy not found.'}, status=status.HTTP_404_NOT_FOUND)

        loan = Transaction.objects.filter(
            book_copy=copy,
            status__in=[TransactionStatus.BORROWED, TransactionStatus.OVERDUE]
        ).first()

        if not loan:
            return Response({'error': 'No active loan found for this book copy.'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        loan.return_date = now
        loan.status = TransactionStatus.RETURNED
        loan.save()

        # Update copy & catalog availability
        copy.status = BookCopyStatus.AVAILABLE
        copy.save()

        book = copy.book
        book.available_copies += 1
        book.save()

        fine_data = None
        # Check overdue fine
        if now > loan.due_date:
            overdue_delta = now - loan.due_date
            overdue_days = max(1, overdue_delta.days)
            policy = InstitutionPolicy.objects.filter(role=loan.user.role).first()
            rate = policy.fine_rate_per_day if policy else 0.50
            grace_period = policy.grace_period_days if policy else 0

            billable_days = max(0, overdue_days - grace_period)
            if billable_days > 0:
                fine_amount = billable_days * float(rate)
                fine = Fine.objects.create(
                    transaction=loan,
                    user=loan.user,
                    amount=fine_amount,
                    overdue_days=overdue_days,
                    status=FineStatus.UNPAID
                )
                fine_data = {
                    'fine_id': str(fine.id),
                    'amount': fine.amount,
                    'overdue_days': fine.overdue_days
                }

        response_payload = TransactionSerializer(loan).data
        if fine_data:
            response_payload['fine_assessed'] = fine_data

        return Response(response_payload, status=status.HTTP_200_OK)

class MyLoansView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-issue_date')

class OverdueLoansView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsLibrarian]

    def get_queryset(self):
        now = timezone.now()
        return Transaction.objects.filter(
            status__in=[TransactionStatus.BORROWED, TransactionStatus.OVERDUE],
            due_date__lt=now
        ).order_by('due_date')

class RenewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RenewRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        transaction_id = serializer.validated_data['transaction_id']

        try:
            loan = Transaction.objects.get(id=transaction_id, user=request.user)
        except Transaction.DoesNotExist:
            return Response({'error': 'Active loan not found.'}, status=status.HTTP_404_NOT_FOUND)

        if loan.status != TransactionStatus.BORROWED:
            return Response({'error': 'Only currently borrowed items can be renewed.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check max renewals (assume max 2 renewals)
        policy = InstitutionPolicy.objects.filter(role=loan.user.role).first()
        max_renewals = policy.max_borrow_limit if policy else 2  # default 2 for now, ideally we have a specific field
        if loan.renewed_count >= 2:
            return Response({'error': 'Maximum number of renewals reached for this item.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for outstanding fines
        unpaid_fines_exist = Fine.objects.filter(user=request.user, status=FineStatus.UNPAID).exists()
        if unpaid_fines_exist:
            return Response({'error': 'Cannot renew with outstanding unpaid fines.'}, status=status.HTTP_400_BAD_REQUEST)

        # Add days
        loan_days = policy.default_loan_days if policy else 14
        loan.due_date = loan.due_date + timedelta(days=loan_days)
        loan.renewed_count += 1
        loan.save()

        return Response(TransactionSerializer(loan).data, status=status.HTTP_200_OK)
