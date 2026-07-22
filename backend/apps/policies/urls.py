from rest_framework.routers import DefaultRouter
from .views import InstitutionPolicyViewSet

router = DefaultRouter()
router.register(r'', InstitutionPolicyViewSet, basename='policy')

urlpatterns = router.urls
