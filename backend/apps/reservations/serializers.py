from rest_framework import serializers
from .models import Reservation

class ReservationSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    author = serializers.CharField(source='book.author', read_only=True)
    cover_image_url = serializers.CharField(source='book.cover_image_url', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    student_staff_id = serializers.CharField(source='user.student_staff_id', read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id', 'user', 'user_name', 'student_staff_id', 'book', 'book_title',
            'author', 'cover_image_url', 'status', 'queue_position', 'expiry_date', 'created_at'
        ]

class CreateReservationSerializer(serializers.Serializer):
    book_id = serializers.UUIDField(required=True)
