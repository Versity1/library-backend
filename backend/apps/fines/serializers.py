from rest_framework import serializers
from .models import Fine, PaymentRecord

class FineSerializer(serializers.ModelSerializer):
    book_title = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Fine
        fields = [
            'id', 'transaction', 'user', 'user_name', 'book_title', 'author',
            'amount', 'overdue_days', 'status', 'created_at', 'paid_at'
        ]

    def get_book_title(self, obj):
        if obj.transaction:
            return obj.transaction.book_copy.book.title
        return obj.reason or "Manual Fine"

    def get_author(self, obj):
        if obj.transaction:
            return obj.transaction.book_copy.book.author
        return "Library Admin"

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
