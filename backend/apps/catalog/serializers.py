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
