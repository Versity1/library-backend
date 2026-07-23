from django.contrib import admin
from .models import InstitutionPolicy


@admin.register(InstitutionPolicy)
class InstitutionPolicyAdmin(admin.ModelAdmin):
    list_display = ('role', 'max_borrow_limit', 'default_loan_days', 'fine_rate_per_day', 'grace_period_days', 'reservation_hold_hours', 'updated_at')
    list_filter = ('role',)
    search_fields = ('role',)
    list_per_page = 25
    readonly_fields = ('updated_at',)
