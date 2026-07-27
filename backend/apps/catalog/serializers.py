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
    book_isbn = serializers.CharField(source='book.isbn', read_only=True)
    location_shelf = serializers.CharField(source='book.location_shelf', read_only=True)
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = BookCopy
        fields = ['id', 'book', 'qr_code_id', 'status', 'condition_notes', 'added_at', 
                  'book_title', 'book_author', 'book_isbn', 'location_shelf', 'cover_image_url']

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        if obj.book.cover_image_url:
            url = obj.book.cover_image_url
            if hasattr(url, 'url'):
                # ImageField — return absolute URL
                if request:
                    return request.build_absolute_uri(url.url)
                return url.url
            # Plain string (legacy URL or path)
            return str(url)
        return None

class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    copies = BookCopySerializer(many=True, read_only=True)
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            'id', 'isbn', 'title', 'author', 'category', 'category_name',
            'department', 'publisher', 'publication_year', 'description',
            'cover_image_url', 'location_shelf', 'total_copies', 'available_copies',
            'created_at', 'copies'
        ]

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        if obj.cover_image_url:
            if hasattr(obj.cover_image_url, 'url'):
                if request:
                    return request.build_absolute_uri(obj.cover_image_url.url)
                return obj.cover_image_url.url
            return str(obj.cover_image_url)
        return None
