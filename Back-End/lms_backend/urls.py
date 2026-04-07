from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.db import connection
from rest_framework.routers import DefaultRouter
from rest_framework.response import Response
from rest_framework.views import APIView

from assignments.views import AssignmentViewSet
from submissions.views import SubmissionViewSet


class HealthCheckView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        db_ok = True
        try:
            connection.ensure_connection()
        except Exception:
            db_ok = False
        status_code = 200 if db_ok else 503
        return Response({"success": db_ok, "message": "ok" if db_ok else "database unavailable"}, status=status_code)


router = DefaultRouter(trailing_slash=False)
router.register("assignments", AssignmentViewSet, basename="assignment")
router.register("submissions", SubmissionViewSet, basename="submission")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", HealthCheckView.as_view(), name="api-health"),
    path("api/health/", HealthCheckView.as_view(), name="api-health-slash"),
    path("api/auth/", include("accounts.urls")),
    path("api/users/", include("accounts.user_urls")),
    path("api/admin/", include("accounts.admin_urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/", include(router.urls)),
    path(
        "api/assignments/",
        AssignmentViewSet.as_view({"get": "list", "post": "create"}),
        name="assignments-slash-list",
    ),
    path(
        "api/assignments/<int:pk>/",
        AssignmentViewSet.as_view({"get": "retrieve", "patch": "partial_update", "put": "update", "delete": "destroy"}),
        name="assignments-slash-detail",
    ),
    path(
        "api/submissions/",
        SubmissionViewSet.as_view({"get": "list", "post": "create"}),
        name="submissions-slash-list",
    ),
    path(
        "api/submissions/stats/",
        SubmissionViewSet.as_view({"get": "stats"}),
        name="submissions-slash-stats",
    ),
    path(
        "api/submissions/<int:pk>/",
        SubmissionViewSet.as_view({"get": "retrieve"}),
        name="submissions-slash-detail",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
