from django.urls import path
from .views import StrategicOverviewView

urlpatterns = [
    path('overview/', StrategicOverviewView.as_view(), name='strategic_overview'),
]
