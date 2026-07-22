import uuid
from django.db import models
from django.conf import settings
from apps.transactions.models import Transaction

class FineStatus(models.TextChoices):
    UNPAID = 'UNPAID', 'Unpaid'
    PAID = 'PAID', 'Paid'
    WAIVED = 'WAIVED', 'Waived'

class Fine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='fine')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fines')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    overdue_days = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=FineStatus.choices, default=FineStatus.UNPAID, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Fine {self.id}: ${self.amount} for {self.user.get_full_name()} ({self.status})"

class PaymentMethod(models.TextChoices):
    DIGITAL_WALLET = 'DIGITAL_WALLET', 'Digital Wallet'
    CARD = 'CARD', 'Credit/Debit Card'
    CASH = 'CASH', 'Cash at Desk'

class PaymentRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fine = models.ForeignKey(Fine, on_delete=models.PROTECT, related_name='payments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.DIGITAL_WALLET)
    transaction_reference = models.CharField(max_length=100, unique=True)
    paid_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.transaction_reference}: ${self.amount_paid}"
