from django.contrib import admin

from .models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student",
        "assignment",
        "status",
        "validation_status",
        "validation_score",
        "submitted_at",
    )
    list_filter = ("status", "validation_status")
    search_fields = ("student__email", "assignment__title")
