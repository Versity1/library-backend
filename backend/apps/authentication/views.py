import random
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, PasswordResetOTP
from .permissions import IsAdmin, IsLibrarian
from .serializers import (
    UserSerializer, CustomTokenObtainPairSerializer, RegisterSerializer, 
    AdminUserCreateUpdateSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    permission_classes = [IsLibrarian]
    pagination_class = None

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AdminUserCreateUpdateSerializer
        return UserSerializer

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier'].strip()

        user = User.objects.filter(email__iexact=identifier).first() or \
               User.objects.filter(student_staff_id__iexact=identifier).first() or \
               User.objects.filter(username__iexact=identifier).first()

        if user:
            # Invalidate past active OTPs
            PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)

            otp_code = f"{random.randint(100000, 999999)}"
            expires_at = timezone.now() + timedelta(minutes=15)
            PasswordResetOTP.objects.create(
                user=user,
                otp_code=otp_code,
                expires_at=expires_at
            )

            # Send Email
            subject = "Shelfie Library - Password Reset Verification Code"
            message = (
                f"Hello {user.first_name or user.username},\n\n"
                f"Your 6-digit verification code to reset your Shelfie account password is:\n\n"
                f"  {otp_code}\n\n"
                f"This code will expire in 15 minutes.\n\n"
                f"If you did not request a password reset, please ignore this email or contact library administration.\n\n"
                f"Best regards,\nShelfie Library Team"
            )
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'Shelfie Library <noreply@shelfie.com>'),
                    recipient_list=[user.email],
                    fail_silently=False
                )
            except Exception as e:
                print(f"[Email Sending Failed] {e}")

        return Response({
            'message': 'If an account exists with this email or ID, an OTP verification code has been sent.',
            'email': user.email if user else identifier
        }, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data['identifier'].strip()
        otp_code = serializer.validated_data['otp_code'].strip()
        new_password = serializer.validated_data['new_password']

        user = User.objects.filter(email__iexact=identifier).first() or \
               User.objects.filter(student_staff_id__iexact=identifier).first() or \
               User.objects.filter(username__iexact=identifier).first()

        if not user:
            return Response({'error': 'Invalid user account.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_record = PasswordResetOTP.objects.filter(
            user=user,
            otp_code=otp_code,
            is_used=False
        ).order_by('-created_at').first()

        if not otp_record or not otp_record.is_valid():
            return Response({'error': 'Invalid or expired OTP code.'}, status=status.HTTP_400_BAD_REQUEST)

        # Set new password
        user.set_password(new_password)
        user.save()

        # Mark OTP as used
        otp_record.is_used = True
        otp_record.save()

        return Response({'message': 'Password has been reset successfully. You can now log in.'}, status=status.HTTP_200_OK)
