from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('student_staff_id', 'email', 'first_name', 'last_name', 'role', 'department', 'borrowing_limit', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'department', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name', 'student_staff_id', 'username')
    ordering = ('-created_at',)
    list_per_page = 25

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Library Profile', {
            'fields': ('role', 'department', 'student_staff_id', 'borrowing_limit'),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Library Profile', {
            'fields': ('email', 'first_name', 'last_name', 'role', 'department', 'student_staff_id', 'borrowing_limit'),
        }),
    )
