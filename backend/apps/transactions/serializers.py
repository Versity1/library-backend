from rest_framework import serializers
from .models import Transaction, GateAccessLog
from apps.catalog.serializers import BookCopySerializer
from apps.authentication.serializers import UserSerializer

class TransactionSerializer(serializers.ModelSerializer):
    book_id = serializers.CharField(source='book_copy.book.id', read_only=True)
    book_title = serializers.CharField(source='book_copy.book.title', read_only=True)
    author = serializers.CharField(source='book_copy.book.author', read_only=True)
    isbn = serializers.CharField(source='book_copy.book.isbn', read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    qr_code_id = serializers.CharField(source='book_copy.qr_code_id', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    student_staff_id = serializers.CharField(source='user.student_staff_id', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'user_name', 'student_staff_id', 'book_copy', 'book_id',
            'book_title', 'author', 'isbn', 'cover_image_url', 'qr_code_id',
            'issued_by', 'issue_date', 'due_date', 'return_date', 'status', 'renewed_count',
            'request_status', 'request_message'
        ]

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        if obj.book_copy and obj.book_copy.book.cover_image_url:
            url = obj.book_copy.book.cover_image_url
            if hasattr(url, 'url'):
                if request:
                    return request.build_absolute_uri(url.url)
                return url.url
            return str(url)
        return None

class CheckoutRequestSerializer(serializers.Serializer):
    student_staff_id = serializers.CharField(required=True)
    qr_code_id = serializers.CharField(required=True)

class ReturnRequestSerializer(serializers.Serializer):
    qr_code_id = serializers.CharField(required=False)
    book_id = serializers.UUIDField(required=False)
    user_id = serializers.UUIDField(required=False)

    def validate(self, data):
        if not data.get('qr_code_id') and not (data.get('book_id') and data.get('user_id')):
            raise serializers.ValidationError('Provide either qr_code_id or both book_id and user_id.')
        return data

class RenewRequestSerializer(serializers.Serializer):
    transaction_id = serializers.UUIDField(required=True)

class GateAccessLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='user.student_staff_id', read_only=True)
    department = serializers.CharField(source='user.department', read_only=True)

    class Meta:
        model = GateAccessLog
        fields = ['id', 'user', 'student_name', 'student_id', 'department', 'entry_time', 'exit_time', 'status']
