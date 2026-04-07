from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from common.permissions.roles import IsAdmin, IsEnabledAccount

from .models import User
from .serializers import (
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer,
    CustomTokenObtainPairSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
    issue_tokens_for_user,
)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        payload = issue_tokens_for_user(user)
        payload["token"] = payload["access"]
        return Response(
            {"success": True, "message": "Registered successfully", "data": {"user": UserSerializer(user, context={"request": request}).data, **payload}},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        payload = issue_tokens_for_user(user)
        payload["token"] = payload["access"]
        return Response(
            {"success": True, "message": "Login successful", "data": {"user": UserSerializer(user, context={"request": request}).data, **payload}},
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEnabledAccount]

    def post(self, request):
        token = request.data.get("refresh")
        if not token:
            return Response({"success": False, "message": "refresh token required", "data": {}}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(token).blacklist()
        except Exception:
            return Response({"success": False, "message": "Invalid refresh token", "data": {}}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"success": True, "message": "Logged out", "data": {}}, status=status.HTTP_200_OK)


class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEnabledAccount]

    def get(self, request):
        return Response(
            {"success": True, "message": "Profile fetched successfully", "data": {"profile": UserSerializer(request.user, context={"request": request}).data}},
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        data = request.data.copy()
        if "photoDataUrl" in data and "profile_image" not in data:
            data["profile_image"] = data.get("photoDataUrl")
        if "profileImage" in data and "profile_image" not in data:
            data["profile_image"] = data.get("profileImage")
        serializer = ProfileUpdateSerializer(request.user, data=data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"success": True, "message": "Profile updated successfully", "data": {"profile": UserSerializer(request.user, context={"request": request}).data}},
            status=status.HTTP_200_OK,
        )


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-created_at")
    permission_classes = [permissions.IsAuthenticated, IsEnabledAccount, IsAdmin]
    serializer_class = UserSerializer
    filterset_fields = ("role", "enabled")
    search_fields = ("name", "email")

    def get_serializer_class(self):
        if self.action == "create":
            return AdminUserCreateSerializer
        if self.action in {"update", "partial_update"}:
            return AdminUserUpdateSerializer
        return UserSerializer

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.role == "admin":
            return Response({"success": False, "message": "Cannot delete admin user", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        user.delete()
        return Response({"success": True, "message": "User deleted successfully", "data": {}}, status=status.HTTP_200_OK)

    @action(methods=["patch"], detail=True, url_path="status")
    def toggle_enabled(self, request, pk=None):
        user = self.get_object()
        enabled = request.data.get("enabled")
        if not isinstance(enabled, bool):
            return Response({"success": False, "message": "enabled must be boolean", "data": {}}, status=status.HTTP_400_BAD_REQUEST)
        if user.role == "admin" and enabled is False:
            return Response({"success": False, "message": "Cannot disable admin user", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        user.enabled = enabled
        user.save(update_fields=["enabled", "updated_at"])
        return Response({"success": True, "message": "User status updated", "data": {"user": UserSerializer(user, context={"request": request}).data}})
