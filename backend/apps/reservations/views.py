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
        queryset = Reservation.objects.all().order_by('created_at')
        book_id = self.request.query_params.get('book_id')
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        return queryset

class CancelReservationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            res = Reservation.objects.get(id=pk)
        except Reservation.DoesNotExist:
            return Response({'error': 'Reservation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if res.user != request.user and request.user.role not in ['LIBRARIAN', 'ADMIN']:
            return Response({'error': 'Unauthorized action.'}, status=status.HTTP_403_FORBIDDEN)

        res.status = ReservationStatus.CANCELLED
        res.save()

        return Response({'message': 'Reservation cancelled successfully.'}, status=status.HTTP_200_OK)
