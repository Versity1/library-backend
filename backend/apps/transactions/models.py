import uuid
from django.db import models
from django.conf import settings
from apps.catalog.models import BookCopy

class TransactionStatus(models.TextChoices):
    BORROWED = 'BORROWED', 'Borrowed'
    RETURNED = 'RETURNED', 'Returned'
    OVERDUE = 'OVERDUE', 'Overdue'

class Transaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='loans')
    book_copy = models.ForeignKey(BookCopy, on_delete=models.PROTECT, related_name='loans')
    issued_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='issued_loans')
    issue_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(db_index=True)
    return_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=TransactionStatus.choices, default=TransactionStatus.BORROWED, db_index=True)
    renewed_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-issue_date']

    def __str__(self):
        return f"Loan {self.id}: {self.book_copy.book.title} to {self.user.get_full_name()} ({self.status})"

class GateAccessStatus(models.TextChoices):
    INSIDE = 'INSIDE', 'Inside Library'
    CHECKED_OUT = 'CHECKED_OUT', 'Checked Out'

class GateAccessLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='access_logs')
    entry_time = models.DateTimeField(auto_now_add=True)
    exit_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=GateAccessStatus.choices, default=GateAccessStatus.INSIDE, db_index=True)

    class Meta:
        ordering = ['-entry_time']

    def __str__(self):
        return f"AccessLog {self.user.get_full_name() or self.user.username} ({self.status})"
