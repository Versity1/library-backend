from django.contrib import admin
from .models import Fine, PaymentRecord


@admin.register(Fine)
class FineAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'user', 'transaction', 'amount', 'overdue_days', 'status', 'created_at', 'paid_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'user__student_staff_id', 'transaction__book_copy__book__title')
    ordering = ('-created_at',)
    list_per_page = 25
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

    @admin.display(description='ID')
    def id_short(self, obj):
        return str(obj.id)[:8]


@admin.register(PaymentRecord)
class PaymentRecordAdmin(admin.ModelAdmin):
    list_display = ('transaction_reference', 'user', 'fine', 'amount_paid', 'payment_method', 'paid_at')
    list_filter = ('payment_method', 'paid_at')
    search_fields = ('transaction_reference', 'user__first_name', 'user__last_name', 'user__student_staff_id')
    ordering = ('-paid_at',)
    list_per_page = 25
    readonly_fields = ('paid_at',)
    date_hierarchy = 'paid_at'
