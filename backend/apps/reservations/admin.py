from django.contrib import admin
from .models import Reservation


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'user', 'book', 'status', 'queue_position', 'expiry_date', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'user__student_staff_id', 'book__title', 'book__isbn')
    ordering = ('-created_at',)
    list_per_page = 25
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

    @admin.display(description='ID')
    def id_short(self, obj):
        return str(obj.id)[:8]
