from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from common.permissions.roles import IsEnabledAccount

from .models import Assignment
from .serializers import AssignmentSerializer


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsEnabledAccount]
    filterset_fields = ("subject", "priority", "assigned_to_all")
    search_fields = ("title", "subject")
    ordering_fields = ("deadline", "created_at")
    ordering = ("deadline", "priority")

    def get_queryset(self):
        user = self.request.user
        base = Assignment.objects.select_related("created_by").prefetch_related("assigned_to_students")
        if user.role == "teacher":
            return base.filter(created_by=user)
        if user.role == "student":
            return base.filter(Q(assigned_to_all=True) | Q(assigned_to_students=user)).distinct()
        return base.all()

    def create(self, request, *args, **kwargs):
        if request.user.role not in {"teacher", "admin"}:
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(
            {"success": True, "message": "Assignment created successfully", "data": {"assignment": serializer.data}},
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        if request.user.role not in {"teacher", "admin"}:
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        assignment = self.get_object()
        if request.user.role == "teacher" and assignment.created_by_id != request.user.id:
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(
            {"success": True, "message": "Assignment updated successfully", "data": {"assignment": serializer.data}},
            status=status.HTTP_200_OK,
        )

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in {"teacher", "admin"}:
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        assignment = self.get_object()
        if request.user.role == "teacher" and assignment.created_by_id != request.user.id:
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        assignment.delete()
        return Response(
            {"success": True, "message": "Assignment deleted successfully", "data": {}},
            status=status.HTTP_200_OK,
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "message": "Assignments fetched successfully", "data": {"assignments": serializer.data}})

    def retrieve(self, request, *args, **kwargs):
        assignment = self.get_object()
        serializer = self.get_serializer(assignment)
        return Response({"success": True, "message": "Assignment fetched successfully", "data": {"assignment": serializer.data}})
