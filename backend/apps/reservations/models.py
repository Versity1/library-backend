import uuid
from django.db import models
from django.conf import settings
from apps.catalog.models import Book

class ReservationStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending in Queue'
    READY_FOR_PICKUP = 'READY_FOR_PICKUP', 'Ready for Pickup'
    FULFILLED = 'FULFILLED', 'Fulfilled'
    CANCELLED = 'CANCELLED', 'Cancelled'
    EXPIRED = 'EXPIRED', 'Expired'

class Reservation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reservations')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reservations')
    status = models.CharField(max_length=20, choices=ReservationStatus.choices, default=ReservationStatus.PENDING, db_index=True)
    queue_position = models.IntegerField(default=1)
    expiry_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Reservation {self.id}: {self.book.title} for {self.user.get_full_name()} (#{self.queue_position})"
