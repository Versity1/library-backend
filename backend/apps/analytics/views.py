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

import os
from django.conf import settings
from django.http import FileResponse

class AdminSystemLogsView(APIView):
    permission_classes = [IsAdmin]
    def get(self, request):
        log_path = os.path.join(settings.BASE_DIR, 'system.log')
        if not os.path.exists(log_path):
            return Response({'logs': []}, status=status.HTTP_200_OK)
        
        with open(log_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            # Return last 100 lines
            return Response({'logs': lines[-100:]}, status=status.HTTP_200_OK)

class AdminBackupView(APIView):
    permission_classes = [IsAdmin]
    def get(self, request):
        db_path = os.path.join(settings.BASE_DIR, 'db.sqlite3')
        if os.path.exists(db_path):
            return FileResponse(open(db_path, 'rb'), as_attachment=True, filename='db_backup.sqlite3')
        return Response({'error': 'Database not found.'}, status=status.HTTP_404_NOT_FOUND)

from rest_framework.parsers import MultiPartParser
class AdminRestoreView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser]
    
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        
        db_path = os.path.join(settings.BASE_DIR, 'db.sqlite3')
        # Overwrite the db.sqlite3 file
        with open(db_path, 'wb+') as f:
            for chunk in file.chunks():
                f.write(chunk)
                
        return Response({'message': 'Database restored successfully. Server restart may be required.'}, status=status.HTTP_200_OK)

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

class AdminReportPDFView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 750, "Library Strategic Report")
        
        p.setFont("Helvetica", 12)
        y = 700
        
        # Gather data
        total_students = User.objects.filter(role=UserRole.STUDENT).count()
        total_staff = User.objects.filter(role=UserRole.LIBRARIAN).count()
        total_titles = Book.objects.count()
        total_copies = BookCopy.objects.count()
        available_copies = BookCopy.objects.filter(status='AVAILABLE').count()
        active_loans = Transaction.objects.filter(status=TransactionStatus.BORROWED).count()
        overdue_loans = Transaction.objects.filter(status=TransactionStatus.OVERDUE).count()
        
        lines = [
            f"Total Students: {total_students}",
            f"Total Librarians: {total_staff}",
            "",
            f"Total Book Titles: {total_titles}",
            f"Total Copies in System: {total_copies}",
            f"Available Copies: {available_copies}",
            "",
            f"Active Loans: {active_loans}",
            f"Overdue Loans: {overdue_loans}",
        ]
        
        for line in lines:
            p.drawString(100, y, line)
            y -= 20
            
        p.showPage()
        p.save()
        buffer.seek(0)
        
        return FileResponse(buffer, as_attachment=True, filename='Library_Report.pdf')
