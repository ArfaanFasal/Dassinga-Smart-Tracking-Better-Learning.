from django.utils import timezone
from django.http import FileResponse
from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from assignments.models import Assignment
from common.permissions.roles import IsEnabledAccount

from .models import Submission
from .serializers import GradeSubmissionSerializer, SubmissionSerializer


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.select_related("student", "assignment", "reviewed_by")
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsEnabledAccount]
    filterset_fields = ("assignment", "student", "status", "validation_status")
    search_fields = ("student__name", "student__email", "assignment__title")
    ordering_fields = ("submitted_at", "validation_score")
    ordering = ("-submitted_at",)

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == "student":
            return qs.filter(student=user)
        if user.role == "teacher":
            return qs.filter(assignment__created_by=user)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()
        out = self.get_serializer(submission)
        return Response(
            {
                "success": True,
                "message": "Submission created successfully",
                "data": {
                    "submission": out.data,
                    "validation": {
                        "status": submission.validation_status,
                        "score": submission.validation_score,
                        "flags": submission.validation_flags,
                    },
                },
            },
            status=status.HTTP_201_CREATED,
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "message": "Submissions fetched successfully", "data": {"submissions": serializer.data}})

    def retrieve(self, request, *args, **kwargs):
        assignment_id = kwargs.get("pk")
        queryset = self.get_queryset().filter(assignment_id=assignment_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {"success": True, "message": "Assignment submissions fetched successfully", "data": {"submissions": serializer.data}},
            status=status.HTTP_200_OK,
        )

    @action(methods=["get"], detail=False, url_path="stats")
    def stats(self, request):
        if request.user.role not in {"teacher", "admin"}:
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        assignments_qs = Assignment.objects.all()
        submissions_qs = Submission.objects.all()
        if request.user.role == "teacher":
            assignments_qs = assignments_qs.filter(created_by=request.user)
            submissions_qs = submissions_qs.filter(assignment__created_by=request.user)

        total_assignments = assignments_qs.count()
        total_submissions = submissions_qs.count()
        flagged_submissions = submissions_qs.filter(validation_status__in=["SUSPICIOUS", "INVALID"]).count()
        now = timezone.now()
        active_assignment_ids = set(
            assignments_qs.filter(Q(deadline__isnull=True) | Q(deadline__gte=now)).values_list("id", flat=True)
        )
        submitted_assignment_ids = set(submissions_qs.values_list("assignment_id", flat=True).distinct())
        pending_assignments = len(active_assignment_ids - submitted_assignment_ids)
        return Response(
            {
                "success": True,
                "message": "Submission stats fetched successfully",
                "data": {
                    "totalAssignments": total_assignments,
                    "totalSubmissions": total_submissions,
                    "pendingAssignments": pending_assignments,
                    "flaggedSubmissions": flagged_submissions,
                },
            }
        )

    @action(methods=["get"], detail=False, url_path=r"by-assignment/(?P<assignment_id>[^/.]+)")
    def by_assignment(self, request, assignment_id=None):
        queryset = self.get_queryset().filter(assignment_id=assignment_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "message": "Assignment submissions fetched successfully", "data": {"submissions": serializer.data}})

    @action(methods=["patch"], detail=True, url_path="grade")
    def grade(self, request, pk=None):
        submission = self.get_object()
        if request.user.role not in {"teacher", "admin"}:
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == "teacher" and submission.assignment.created_by_id != request.user.id:
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        serializer = GradeSubmissionSerializer(submission, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        graded = serializer.save(reviewed_by=request.user, reviewed_at=timezone.now())
        output = self.get_serializer(graded)
        return Response({"success": True, "message": "Submission graded successfully", "data": {"submission": output.data}})

    @action(methods=["patch"], detail=True, url_path="validation")
    def validation(self, request, pk=None):
        submission = self.get_object()
        if request.user.role not in {"teacher", "admin"}:
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == "teacher" and submission.assignment.created_by_id != request.user.id:
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)

        verdict = str(request.data.get("validationStatus") or request.data.get("verdict") or "").upper().strip()
        if verdict not in {"VALID", "INVALID"}:
            return Response(
                {"success": False, "message": "validationStatus must be VALID or INVALID", "data": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submission.validation_status = verdict
        if verdict == "INVALID":
            submission.status = "Rejected"
        else:
            if submission.assignment.deadline and submission.submitted_at and submission.submitted_at > submission.assignment.deadline:
                submission.status = "Late"
            else:
                submission.status = "Submitted"
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.save(update_fields=["validation_status", "status", "reviewed_by", "reviewed_at", "updated_at"])

        output = self.get_serializer(submission)
        return Response({"success": True, "message": "Validation updated successfully", "data": {"submission": output.data}})

    @action(methods=["get"], detail=True, url_path="file")
    def file_view(self, request, pk=None):
        submission = self.get_object()
        if not submission.file:
            return Response({"success": False, "message": "File not found", "data": {}}, status=status.HTTP_404_NOT_FOUND)
        submission.file.open("rb")
        return FileResponse(submission.file, as_attachment=False, filename=submission.file.name.split("/")[-1])

    @action(methods=["get"], detail=True, url_path="image")
    def image_view(self, request, pk=None):
        submission = self.get_object()
        if not submission.image:
            return Response({"success": False, "message": "Image not found", "data": {}}, status=status.HTTP_404_NOT_FOUND)
        submission.image.open("rb")
        return FileResponse(submission.image, as_attachment=False, filename=submission.image.name.split("/")[-1])
