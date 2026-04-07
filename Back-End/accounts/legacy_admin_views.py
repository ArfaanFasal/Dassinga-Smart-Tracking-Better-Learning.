from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions.roles import IsAdmin, IsEnabledAccount

from .models import User
from .serializers import AdminUserCreateSerializer, AdminUserUpdateSerializer, UserSerializer


class LegacyAdminBase(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEnabledAccount, IsAdmin]


class LegacyAdminCreateTeacherView(LegacyAdminBase):
    def post(self, request):
        data = request.data.copy()
        data["role"] = "teacher"
        serializer = AdminUserCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"success": True, "message": "Teacher created successfully", "data": {"user": UserSerializer(user).data}}, status=status.HTTP_201_CREATED)


class LegacyAdminUsersView(LegacyAdminBase):
    def get(self, request):
        qs = User.objects.all().order_by("-created_at")
        role = request.query_params.get("role")
        q = request.query_params.get("q")
        enabled = request.query_params.get("enabled")
        if role:
            qs = qs.filter(role=role.lower())
        if q:
            qs = qs.filter(name__icontains=q) | qs.filter(email__icontains=q)
        if enabled is not None:
            qs = qs.filter(enabled=str(enabled).lower() in {"true", "1"})
        return Response({"success": True, "message": "Users fetched successfully", "data": {"users": UserSerializer(qs, many=True).data}})

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"success": True, "message": "User created successfully", "data": {"user": UserSerializer(user).data}}, status=status.HTTP_201_CREATED)


class LegacyAdminUserDetailView(LegacyAdminBase):
    def patch(self, request, user_id):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"success": False, "message": "User not found", "data": {}}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"success": True, "message": "User updated successfully", "data": {"user": UserSerializer(user).data}})


class LegacyAdminDeleteUserView(LegacyAdminBase):
    def delete(self, request):
        user_id = request.data.get("userId")
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"success": False, "message": "User not found", "data": {}}, status=status.HTTP_404_NOT_FOUND)
        if user.role == "admin":
            return Response({"success": False, "message": "Cannot delete admin user", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        user.delete()
        return Response({"success": True, "message": "User deleted successfully", "data": {}})


class LegacyAdminToggleStatusView(LegacyAdminBase):
    def patch(self, request):
        user_id = request.data.get("userId")
        enabled = request.data.get("enabled")
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"success": False, "message": "User not found", "data": {}}, status=status.HTTP_404_NOT_FOUND)
        if not isinstance(enabled, bool):
            return Response({"success": False, "message": "enabled boolean is required", "data": {}}, status=status.HTTP_400_BAD_REQUEST)
        user.enabled = enabled
        user.save(update_fields=["enabled", "updated_at"])
        return Response({"success": True, "message": "User status updated", "data": {"user": UserSerializer(user).data}})
