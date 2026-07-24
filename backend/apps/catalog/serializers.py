from rest_framework import serializers
from .models import Category, Book, BookCopy

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'code', 'description']

class BookCopySerializer(serializers.ModelSerializer):
    class Meta:
        model = BookCopy
        fields = ['id', 'book', 'qr_code_id', 'status', 'condition_notes', 'added_at']

class BookCopyScanSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_author = serializers.CharField(source='book.author', read_only=True)
    location_shelf = serializers.CharField(source='book.location_shelf', read_only=True)
    cover_image_url = serializers.CharField(source='book.cover_image_url', read_only=True)

    class Meta:
        model = BookCopy
        fields = ['id', 'book', 'qr_code_id', 'status', 'condition_notes', 'added_at', 
                  'book_title', 'book_author', 'location_shelf', 'cover_image_url']

class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    copies = BookCopySerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'isbn', 'title', 'author', 'category', 'category_name',
            'department', 'publisher', 'publication_year', 'description',
            'cover_image_url', 'location_shelf', 'total_copies', 'available_copies',
            'created_at', 'copies'
        ]
