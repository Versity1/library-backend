from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'name', 'role', 'department', 'student_staff_id', 'borrowing_limit', 'is_active', 'created_at']

    def get_name(self, obj):
        return obj.get_full_name() or obj.username

class AdminUserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'student_staff_id', 'role', 'department', 'is_active', 'borrowing_limit']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        validated_data['username'] = validated_data['email']
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email_or_id = attrs.get('email', '').strip()
        if email_or_id:
            from .models import User
            user_obj = User.objects.filter(email__iexact=email_or_id).first() or \
                       User.objects.filter(student_staff_id__iexact=email_or_id).first() or \
                       User.objects.filter(username__iexact=email_or_id).first()
            if user_obj:
                attrs['email'] = user_obj.email

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

class PasswordResetRequestSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True, help_text="Email address or Student/Staff ID")

class PasswordResetConfirmSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True, help_text="Email address or Student/Staff ID")
    otp_code = serializers.CharField(required=True, max_length=6, min_length=6)
    new_password = serializers.CharField(required=True, min_length=6, write_only=True)
