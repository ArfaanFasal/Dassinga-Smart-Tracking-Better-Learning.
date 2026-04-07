from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class Assignment(TimeStampedModel):
    PRIORITY_CHOICES = (
        ("High", "High"),
        ("Medium", "Medium"),
        ("Low", "Low"),
    )

    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    deadline = models.DateTimeField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES)
    assigned_to_all = models.BooleanField(default=True)
    assigned_to_students = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="explicit_assignments",
        limit_choices_to={"role": "student"},
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_assignments",
    )

    class Meta:
        ordering = ("deadline", "priority", "-created_at")

    def __str__(self):
        return f"{self.title} ({self.subject})"
