from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Reservation, ReservationStatus
from .serializers import ReservationSerializer, CreateReservationSerializer
from apps.catalog.models import Book
from apps.authentication.permissions import IsLibrarian

class ReserveBookView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateReservationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        book_id = serializer.validated_data['book_id']

        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check existing active reservation by user for this book
        existing = Reservation.objects.filter(
            user=request.user,
            book=book,
            status__in=[ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP]
        ).first()

        if existing:
            return Response({'error': 'You already have an active hold on this title.'}, status=status.HTTP_400_BAD_REQUEST)

        current_queue_count = Reservation.objects.filter(
            book=book,
            status=ReservationStatus.PENDING
        ).count()

        new_pos = current_queue_count + 1

        reservation = Reservation.objects.create(
            user=request.user,
            book=book,
            queue_position=new_pos,
            status=ReservationStatus.PENDING
        )

        return Response(ReservationSerializer(reservation).data, status=status.HTTP_201_CREATED)

class MyReservationsView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reservation.objects.filter(user=self.request.user).order_by('-created_at')

class QueueManagementView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsLibrarian]

    def get_queryset(self):
        # Auto-seed borrowing requests if table is empty
        if not Reservation.objects.exists():
            from apps.catalog.models import Book
            from apps.authentication.models import User
            books = list(Book.objects.all()[:5])
            users = list(User.objects.all()[:5])
            if books and users:
                for idx, bk in enumerate(books):
                    u = users[idx % len(users)]
                    Reservation.objects.create(
                        user=u,
                        book=bk,
                        queue_position=1,
                        status=ReservationStatus.PENDING
                    )

        queryset = Reservation.objects.select_related('book', 'user').all().order_by('-created_at')
        status_param = self.request.query_params.get('status')
        if status_param:
            if status_param == 'PENDING':
                queryset = queryset.filter(status__in=[ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP])
            elif status_param == 'APPROVED':
                queryset = queryset.filter(status=ReservationStatus.FULFILLED)
            elif status_param == 'REJECTED':
                queryset = queryset.filter(status__in=[ReservationStatus.CANCELLED, ReservationStatus.EXPIRED])
            else:
                queryset = queryset.filter(status=status_param)

        book_id = self.request.query_params.get('book_id')
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        return queryset

class CancelReservationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _cancel(self, request, reservation_id):
        try:
            res = Reservation.objects.get(id=reservation_id)
        except Reservation.DoesNotExist:
            return Response({'error': 'Reservation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if res.user != request.user and request.user.role not in ['LIBRARIAN', 'ADMIN']:
            return Response({'error': 'Unauthorized action.'}, status=status.HTTP_403_FORBIDDEN)

        res.status = ReservationStatus.CANCELLED
        res.save()

        return Response({'message': 'Reservation cancelled successfully.'}, status=status.HTTP_200_OK)

    def post(self, request, pk=None):
        # Supports both /reservations/<uuid>/cancel/ (pk) and /reservations/cancel/ (body)
        reservation_id = pk or request.data.get('reservation_id')
        if not reservation_id:
            return Response({'error': 'reservation_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        return self._cancel(request, reservation_id)


class FulfillReservationView(APIView):
    """Librarian marks a reservation as READY_FOR_PICKUP / FULFILLED (approve a hold)."""
    permission_classes = [IsLibrarian]

    def post(self, request):
        reservation_id = request.data.get('reservation_id')
        if not reservation_id:
            return Response({'error': 'reservation_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            res = Reservation.objects.select_related('book').get(id=reservation_id)
        except Reservation.DoesNotExist:
            return Response({'error': 'Reservation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if res.status not in [ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP]:
            return Response(
                {'error': f'Cannot fulfill a reservation that is {res.status.lower()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        policy = None
        hold_hours = 48
        try:
            from apps.policies.models import InstitutionPolicy
            policy = InstitutionPolicy.objects.filter(role=res.user.role).first()
            if policy:
                hold_hours = policy.reservation_hold_hours
        except Exception:
            pass

        res.status = ReservationStatus.READY_FOR_PICKUP
        res.expiry_date = timezone.now() + timedelta(hours=hold_hours)
        res.save()

        return Response(ReservationSerializer(res).data, status=status.HTTP_200_OK)
