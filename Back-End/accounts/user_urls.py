from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from common.permissions.roles import IsEnabledAccount, IsTeacherOrAdmin
from accounts.models import User
from accounts.serializers import UserSerializer
from accounts.views import AdminUserViewSet, ProfileView


class StudentListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEnabledAccount, IsTeacherOrAdmin]

    def get(self, request):
        students = User.objects.filter(role="student", enabled=True).order_by("name")
        serializer = UserSerializer(students, many=True, context={"request": request})
        return Response(
            {"success": True, "message": "Students fetched successfully", "data": {"users": serializer.data}},
            status=status.HTTP_200_OK,
        )


router = DefaultRouter()
router.register("admin/users", AdminUserViewSet, basename="admin-users")

urlpatterns = [
    re_path(r"^profile/?$", ProfileView.as_view(), name="user-profile"),
    re_path(r"^students/?$", StudentListView.as_view(), name="student-list"),
    path("", include(router.urls)),
]
