import uuid
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name

class Book(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    isbn = models.CharField(max_length=20, unique=True, db_index=True)
    title = models.CharField(max_length=255, db_index=True)
    author = models.CharField(max_length=255, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='books')
    department = models.CharField(max_length=100, db_index=True, blank=True, null=True)
    publisher = models.CharField(max_length=255, blank=True, null=True)
    publication_year = models.IntegerField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    cover_image_url = models.ImageField(upload_to='book_covers/', max_length=500, blank=True, null=True)
    location_shelf = models.CharField(max_length=50, help_text="e.g. Shelf 4B, Row 2")
    total_copies = models.PositiveIntegerField(default=0)
    available_copies = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.author} (ISBN: {self.isbn})"

class BookCopyStatus(models.TextChoices):
    AVAILABLE = 'AVAILABLE', 'Available'
    BORROWED = 'BORROWED', 'Borrowed'
    RESERVED = 'RESERVED', 'Reserved'
    MAINTENANCE = 'MAINTENANCE', 'Under Maintenance'
    LOST = 'LOST', 'Lost'

class BookCopy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='copies')
    qr_code_id = models.CharField(max_length=100, unique=True, db_index=True, help_text="Scannable Barcode/QR payload")
    status = models.CharField(max_length=20, choices=BookCopyStatus.choices, default=BookCopyStatus.AVAILABLE)
    condition_notes = models.CharField(max_length=255, blank=True, null=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Book Copies'

    def __str__(self):
        return f"Copy {self.qr_code_id} of {self.book.title} ({self.status})"
