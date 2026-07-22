import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    STUDENT = 'STUDENT', 'Student'
    LIBRARIAN = 'LIBRARIAN', 'Librarian'
    ADMIN = 'ADMIN', 'Administrator'

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.STUDENT)
    department = models.CharField(max_length=100, blank=True, null=True)
    student_staff_id = models.CharField(max_length=50, unique=True, db_index=True)
    borrowing_limit = models.IntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'student_staff_id', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role} - {self.student_staff_id})"
