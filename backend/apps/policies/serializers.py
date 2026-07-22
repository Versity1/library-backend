from rest_framework import serializers
from .models import InstitutionPolicy

class InstitutionPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = InstitutionPolicy
        fields = '__all__'
