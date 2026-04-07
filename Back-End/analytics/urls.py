from django.urls import re_path

from .views import AdminAnalyticsView, StudentAnalyticsView, TeacherAnalyticsView


urlpatterns = [
    re_path(r"^student/?$", StudentAnalyticsView.as_view(), name="analytics-student"),
    re_path(r"^teacher/?$", TeacherAnalyticsView.as_view(), name="analytics-teacher"),
    re_path(r"^admin/?$", AdminAnalyticsView.as_view(), name="analytics-admin"),
]
