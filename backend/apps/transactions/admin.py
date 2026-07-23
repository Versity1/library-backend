from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'user', 'book_copy', 'issued_by', 'issue_date', 'due_date', 'return_date', 'status', 'renewed_count')
    list_filter = ('status', 'issue_date', 'due_date')
    search_fields = ('user__first_name', 'user__last_name', 'user__student_staff_id', 'book_copy__qr_code_id', 'book_copy__book__title')
    ordering = ('-issue_date',)
    list_per_page = 25
    readonly_fields = ('issue_date',)
    date_hierarchy = 'issue_date'

    @admin.display(description='ID')
    def id_short(self, obj):
        return str(obj.id)[:8]
