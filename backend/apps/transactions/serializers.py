from rest_framework import serializers
from .models import Transaction, GateAccessLog
from apps.catalog.serializers import BookCopySerializer
from apps.authentication.serializers import UserSerializer

class TransactionSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book_copy.book.title', read_only=True)
    author = serializers.CharField(source='book_copy.book.author', read_only=True)
    isbn = serializers.CharField(source='book_copy.book.isbn', read_only=True)
    cover_image_url = serializers.CharField(source='book_copy.book.cover_image_url', read_only=True)
    qr_code_id = serializers.CharField(source='book_copy.qr_code_id', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    student_staff_id = serializers.CharField(source='user.student_staff_id', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'user_name', 'student_staff_id', 'book_copy',
            'book_title', 'author', 'isbn', 'cover_image_url', 'qr_code_id',
            'issued_by', 'issue_date', 'due_date', 'return_date', 'status', 'renewed_count',
            'request_status', 'request_message'
        ]

class CheckoutRequestSerializer(serializers.Serializer):
    student_staff_id = serializers.CharField(required=True)
    qr_code_id = serializers.CharField(required=True)

class ReturnRequestSerializer(serializers.Serializer):
    qr_code_id = serializers.CharField(required=True)

class RenewRequestSerializer(serializers.Serializer):
    transaction_id = serializers.UUIDField(required=True)

class GateAccessLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='user.student_staff_id', read_only=True)
    department = serializers.CharField(source='user.department', read_only=True)

    class Meta:
        model = GateAccessLog
        fields = ['id', 'user', 'student_name', 'student_id', 'department', 'entry_time', 'exit_time', 'status']
