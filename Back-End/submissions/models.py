from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class Submission(TimeStampedModel):
    STATUS_CHOICES = (
        ("Submitted", "Submitted"),
        ("Late", "Late"),
        ("Rejected", "Rejected"),
    )
    VALIDATION_CHOICES = (
        ("PENDING", "Pending"),
        ("VALID", "VALID"),
        ("INVALID", "INVALID"),
        ("SUSPICIOUS", "SUSPICIOUS"),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submissions",
        limit_choices_to={"role": "student"},
    )
    assignment = models.ForeignKey("assignments.Assignment", on_delete=models.CASCADE, related_name="submissions")
    text_answer = models.TextField(blank=True, default="")
    file = models.FileField(upload_to="uploads/submissions/files/", blank=True, null=True)
    image = models.FileField(upload_to="uploads/submissions/images/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Submitted")
    validation_status = models.CharField(max_length=20, choices=VALIDATION_CHOICES, default="PENDING")
    validation_score = models.FloatField(default=0)
    validation_flags = models.JSONField(default=list, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True, default="")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_submissions",
        limit_choices_to={"role__in": ["teacher", "admin"]},
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "assignment"], name="uniq_student_assignment_submission")
        ]
        ordering = ("-submitted_at",)

    def __str__(self):
        return f"Submission #{self.id} student={self.student_id} assignment={self.assignment_id}"
