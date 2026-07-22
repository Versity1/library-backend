from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, BookViewSet, BookCopyViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'books', BookViewSet, basename='book')
router.register(r'copies', BookCopyViewSet, basename='bookcopy')

urlpatterns = router.urls
