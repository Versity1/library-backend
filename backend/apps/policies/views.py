from rest_framework import viewsets, permissions
from .models import InstitutionPolicy
from .serializers import InstitutionPolicySerializer
from apps.authentication.permissions import IsAdmin

class InstitutionPolicyViewSet(viewsets.ModelViewSet):
    queryset = InstitutionPolicy.objects.all()
    serializer_class = InstitutionPolicySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]
