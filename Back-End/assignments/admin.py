from django.contrib import admin

from .models import Assignment


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "subject", "priority", "deadline", "assigned_to_all", "created_by")
    list_filter = ("priority", "assigned_to_all", "subject")
    search_fields = ("title", "subject")
