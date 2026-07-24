from django.urls import path
from .views import StrategicOverviewView, AdminSystemLogsView, AdminBackupView, AdminRestoreView, AdminReportPDFView

urlpatterns = [
    path('overview/', StrategicOverviewView.as_view(), name='strategic_overview'),
    path('system/logs/', AdminSystemLogsView.as_view(), name='system_logs'),
    path('system/backup/', AdminBackupView.as_view(), name='system_backup'),
    path('system/restore/', AdminRestoreView.as_view(), name='system_restore'),
    path('report/pdf/', AdminReportPDFView.as_view(), name='report_pdf'),
]
