from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'name', 'role', 'department', 'student_staff_id', 'borrowing_limit', 'created_at']

    def get_name(self, obj):
        return obj.get_full_name() or obj.username

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        data = super().validate(attrs)
        user_serializer = UserSerializer(self.user)
        data['user'] = user_serializer.data
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'student_staff_id', 'role', 'department']

    def create(self, validated_data):
        # We use email as the username since USERNAME_FIELD is 'email', but Django's AbstractUser requires username.
        # Let's set username to email.
        validated_data['username'] = validated_data['email']
        user = User.objects.create_user(**validated_data)
        return user
