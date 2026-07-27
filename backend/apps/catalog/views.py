from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from .models import Category, Book, BookCopy
from .serializers import CategorySerializer, BookSerializer, BookCopySerializer, BookCopyScanSerializer
from apps.authentication.permissions import IsLibrarian

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLibrarian()]
        return [permissions.IsAuthenticated()]

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by('-created_at')
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'author', 'isbn', 'department', 'category__name', 'copies__qr_code_id']

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        department = self.request.query_params.get('department')
        available_only = self.request.query_params.get('available_only')

        if category:
            queryset = queryset.filter(category_id=category)
        if department:
            queryset = queryset.filter(department__iexact=department)
        if available_only and available_only.lower() in ('true', '1'):
            queryset = queryset.filter(available_copies__gt=0)

        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLibrarian()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        total_copies = int(self.request.data.get('total_copies', 1))
        available_copies = int(self.request.data.get('available_copies', total_copies))
        cover_image = self.request.FILES.get('cover_image_url')
        description = self.request.data.get('description')
        
        save_kwargs = {
            'total_copies': total_copies,
            'available_copies': available_copies,
        }
        if cover_image:
            save_kwargs['cover_image_url'] = cover_image
        if description:
            save_kwargs['description'] = description
        
        book = serializer.save(**save_kwargs)
        
        qr_code_id = self.request.data.get('qr_code_id') or f"QR-{book.isbn}"
        if not BookCopy.objects.filter(qr_code_id=qr_code_id).exists():
            BookCopy.objects.create(book=book, qr_code_id=qr_code_id, status='AVAILABLE')

    def perform_update(self, serializer):
        cover_image = self.request.FILES.get('cover_image_url')
        save_kwargs = {}
        if cover_image:
            save_kwargs['cover_image_url'] = cover_image
        
        # Parse numeric fields from multipart data
        total_copies = self.request.data.get('total_copies')
        available_copies = self.request.data.get('available_copies')
        description = self.request.data.get('description')
        if total_copies is not None:
            save_kwargs['total_copies'] = int(total_copies)
        if available_copies is not None:
            save_kwargs['available_copies'] = int(available_copies)
        if description is not None:
            save_kwargs['description'] = description
        
        serializer.save(**save_kwargs)

class BookCopyViewSet(viewsets.ModelViewSet):
    queryset = BookCopy.objects.all().order_by('-added_at')
    serializer_class = BookCopySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLibrarian()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='scan')
    def scan(self, request):
        qr_code_id = request.query_params.get('qr_code_id')
        if not qr_code_id:
            return Response({'error': 'qr_code_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        copy = get_object_or_404(BookCopy, qr_code_id=qr_code_id)
        serializer = BookCopyScanSerializer(copy, context={'request': request})
        return Response(serializer.data)
