from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/catalog/', include('apps.catalog.urls')),
    path('api/v1/transactions/', include('apps.transactions.urls')),
    path('api/v1/reservations/', include('apps.reservations.urls')),
    path('api/v1/fines/', include('apps.fines.urls')),
    path('api/v1/policies/', include('apps.policies.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
