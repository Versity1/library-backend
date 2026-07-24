from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
        serializer = BookCopyScanSerializer(copy)
        return Response(serializer.data)
