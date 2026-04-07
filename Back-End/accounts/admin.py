from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    list_display = ("id", "email", "name", "role", "enabled", "is_staff", "created_at")
    list_filter = ("role", "enabled", "is_staff")
    ordering = ("-created_at",)
    search_fields = ("name", "email")
    fieldsets = (
        ("Auth", {"fields": ("email", "password")}),
        ("Personal", {"fields": ("name", "phone", "course", "profile_image")}),
        ("Access", {"fields": ("role", "enabled", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    readonly_fields = ("created_at", "updated_at", "last_login")
