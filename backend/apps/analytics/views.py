from django.db.models import Sum, Count
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.models import User, UserRole
from apps.authentication.permissions import IsAdmin
from apps.catalog.models import Book, BookCopy
from apps.transactions.models import Transaction, TransactionStatus
from apps.reservations.models import Reservation, ReservationStatus
from apps.fines.models import Fine, FineStatus, PaymentRecord

class StrategicOverviewView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_students = User.objects.filter(role=UserRole.STUDENT).count()
        total_staff = User.objects.filter(role=UserRole.LIBRARIAN).count()
        
        catalog_stats = Book.objects.aggregate(
            total_titles=Count('id'),
            total_copies=Sum('total_copies'),
            available_copies=Sum('available_copies')
        )
        
        active_loans = Transaction.objects.filter(status=TransactionStatus.BORROWED).count()
        overdue_loans = Transaction.objects.filter(
            status__in=[TransactionStatus.BORROWED, TransactionStatus.OVERDUE],
            due_date__lt=timezone.now()
        ).count()
        
        pending_reservations = Reservation.objects.filter(status=ReservationStatus.PENDING).count()
        
        revenue_collected = PaymentRecord.objects.aggregate(total=Sum('amount_paid'))['total'] or 0.00
        unpaid_fines_total = Fine.objects.filter(status=FineStatus.UNPAID).aggregate(total=Sum('amount'))['total'] or 0.00

        data = {
            'users': {
                'total_students': total_students,
                'total_staff': total_staff,
            },
            'catalog': {
                'total_titles': catalog_stats['total_titles'] or 0,
                'total_copies': catalog_stats['total_copies'] or 0,
                'available_copies': catalog_stats['available_copies'] or 0,
                'utilization_rate_pct': round(
                    ((catalog_stats['total_copies'] - catalog_stats['available_copies']) / catalog_stats['total_copies'] * 100)
                    if catalog_stats['total_copies'] else 0, 1
                )
            },
            'operations': {
                'active_loans': active_loans,
                'overdue_loans': overdue_loans,
                'pending_reservations': pending_reservations,
            },
            'financials': {
                'total_fines_collected': float(revenue_collected),
                'outstanding_unpaid_fines': float(unpaid_fines_total),
            }
        }

        return Response(data, status=status.HTTP_200_OK)
