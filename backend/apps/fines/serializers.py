from rest_framework import serializers
from .models import Fine, PaymentRecord

class FineSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='transaction.book_copy.book.title', read_only=True)
    author = serializers.CharField(source='transaction.book_copy.book.author', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Fine
        fields = [
            'id', 'transaction', 'user', 'user_name', 'book_title', 'author',
            'amount', 'overdue_days', 'status', 'created_at', 'paid_at'
        ]

class PaymentRecordSerializer(serializers.ModelSerializer):
    fine_details = FineSerializer(source='fine', read_only=True)

    class Meta:
        model = PaymentRecord
        fields = [
            'id', 'fine', 'fine_details', 'user', 'amount_paid',
            'payment_method', 'transaction_reference', 'paid_at'
        ]

class PayFineRequestSerializer(serializers.Serializer):
    fine_id = serializers.UUIDField(required=True)
    payment_method = serializers.CharField(default='DIGITAL_WALLET')
