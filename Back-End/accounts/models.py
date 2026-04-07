from django.contrib.auth.models import AbstractUser
from django.db import models

from common.models import TimeStampedModel

from .managers import UserManager


class User(AbstractUser, TimeStampedModel):
    ROLE_CHOICES = (
        ("student", "Student"),
        ("teacher", "Teacher"),
        ("admin", "Admin"),
    )

    username = None
    first_name = None
    last_name = None

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student", db_index=True)
    enabled = models.BooleanField(default=True, db_index=True)
    phone = models.CharField(max_length=30, blank=True, default="")
    course = models.CharField(max_length=120, blank=True, default="")
    profile_image = models.TextField(blank=True, default="")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    objects = UserManager()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.email} ({self.role})"
