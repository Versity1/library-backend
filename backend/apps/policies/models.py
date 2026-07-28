from django.db import models
from apps.authentication.models import UserRole

class InstitutionPolicy(models.Model):
    role = models.CharField(max_length=20, choices=UserRole.choices, unique=True)
    max_borrow_limit = models.IntegerField(default=3)
    default_loan_days = models.IntegerField(default=14)
    fine_rate_per_day = models.DecimalField(max_digits=6, decimal_places=2, default=0.50)
    grace_period_days = models.IntegerField(default=2)
    reservation_hold_hours = models.IntegerField(default=48)
    max_renewals_allowed = models.IntegerField(default=2)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Policy for {self.role}: {self.max_borrow_limit} books, ₦{self.fine_rate_per_day}/day"
