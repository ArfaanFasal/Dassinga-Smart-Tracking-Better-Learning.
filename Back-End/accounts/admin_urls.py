from django.urls import re_path

from .legacy_admin_views import (
    LegacyAdminCreateTeacherView,
    LegacyAdminDeleteUserView,
    LegacyAdminToggleStatusView,
    LegacyAdminUserDetailView,
    LegacyAdminUsersView,
)


urlpatterns = [
    re_path(r"^create-teacher/?$", LegacyAdminCreateTeacherView.as_view(), name="legacy-admin-create-teacher"),
    re_path(r"^users/?$", LegacyAdminUsersView.as_view(), name="legacy-admin-users"),
    re_path(r"^users/(?P<user_id>\d+)/?$", LegacyAdminUserDetailView.as_view(), name="legacy-admin-user-detail"),
    re_path(r"^delete-user/?$", LegacyAdminDeleteUserView.as_view(), name="legacy-admin-delete-user"),
    re_path(r"^users/status/?$", LegacyAdminToggleStatusView.as_view(), name="legacy-admin-users-status"),
]
