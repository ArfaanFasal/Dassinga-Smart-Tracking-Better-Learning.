from django.db.models import Avg, Count, F, Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from assignments.models import Assignment
from common.permissions.roles import IsEnabledAccount
from submissions.models import Submission


class StudentAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEnabledAccount]

    def get(self, request):
        if request.user.role != "student":
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        assignments = Assignment.objects.filter(Q(assigned_to_all=True) | Q(assigned_to_students=request.user)).distinct()
        submissions = Submission.objects.filter(student=request.user, assignment__in=assignments)
        total = assignments.count()
        completed = submissions.exclude(status="Rejected").count()
        completion_rate = round((completed / total) * 100, 2) if total else 0
        suspicious = submissions.filter(validation_status="SUSPICIOUS").count()
        late = submissions.filter(status="Late").count()
        avg_marks = submissions.exclude(marks=None).aggregate(value=Avg("marks"))["value"] or 0
        return Response(
            {
                "success": True,
                "message": "Student analytics fetched successfully",
                "data": {
                    "completionRate": completion_rate,
                    "totalAssignments": total,
                    "completedSubmissions": completed,
                    "lateSubmissions": late,
                    "suspiciousSubmissions": suspicious,
                    "averageMarks": float(avg_marks),
                },
            }
        )


class TeacherAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEnabledAccount]

    def get(self, request):
        if request.user.role != "teacher":
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        assignments = Assignment.objects.filter(created_by=request.user)
        submissions = Submission.objects.filter(assignment__in=assignments)
        total_assigned = assignments.count()
        total_submissions = submissions.count()
        late_rate = round((submissions.filter(status="Late").count() / total_submissions) * 100, 2) if total_submissions else 0
        suspicious_rate = round((submissions.filter(validation_status="SUSPICIOUS").count() / total_submissions) * 100, 2) if total_submissions else 0
        subject_stats = (
            submissions.values(subject=F("assignment__subject"))
            .annotate(count=Count("id"), avg_marks=Avg("marks"))
            .order_by("-count")
        )
        return Response(
            {
                "success": True,
                "message": "Teacher analytics fetched successfully",
                "data": {
                    "assignmentCount": total_assigned,
                    "submissionCount": total_submissions,
                    "lateSubmissionRate": late_rate,
                    "suspiciousSubmissionRate": suspicious_rate,
                    "subjectStats": list(subject_stats),
                },
            }
        )


class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEnabledAccount]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"success": False, "message": "Access forbidden", "data": {}}, status=status.HTTP_403_FORBIDDEN)
        submissions = Submission.objects.all()
        total_submissions = submissions.count()
        late_rate = round((submissions.filter(status="Late").count() / total_submissions) * 100, 2) if total_submissions else 0
        suspicious_count = submissions.filter(validation_status="SUSPICIOUS").count()
        teacher_stats = (
            Submission.objects.values(
                teacher_id=F("assignment__created_by_id"),
                teacher_name=F("assignment__created_by__name"),
            )
            .annotate(total=Count("id"), suspicious=Count("id", filter=Q(validation_status="SUSPICIOUS")))
            .order_by("-total")
        )
        student_perf = (
            Submission.objects.values(student_id=F("student_id"), student_name=F("student__name"))
            .annotate(total=Count("id"), avg_marks=Avg("marks"))
            .order_by("-avg_marks")
        )
        return Response(
            {
                "success": True,
                "message": "Admin analytics fetched successfully",
                "data": {
                    "totalSubmissions": total_submissions,
                    "lateSubmissionRate": late_rate,
                    "suspiciousSubmissions": suspicious_count,
                    "teacherWiseStats": list(teacher_stats),
                    "studentPerformance": list(student_perf),
                },
            }
        )
