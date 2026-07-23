from django.contrib import admin
from .models import Category, Book, BookCopy


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'description', 'book_count')
    search_fields = ('name', 'code')
    list_per_page = 25

    @admin.display(description='Books')
    def book_count(self, obj):
        return obj.books.count()


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'isbn', 'category', 'department', 'publisher', 'publication_year', 'location_shelf', 'total_copies', 'available_copies', 'created_at')
    list_filter = ('category', 'department', 'publication_year')
    search_fields = ('title', 'author', 'isbn', 'publisher')
    ordering = ('title',)
    list_per_page = 25
    readonly_fields = ('created_at',)


@admin.register(BookCopy)
class BookCopyAdmin(admin.ModelAdmin):
    list_display = ('qr_code_id', 'book', 'status', 'condition_notes', 'added_at')
    list_filter = ('status',)
    search_fields = ('qr_code_id', 'book__title', 'book__isbn')
    ordering = ('-added_at',)
    list_per_page = 25
    readonly_fields = ('added_at',)
