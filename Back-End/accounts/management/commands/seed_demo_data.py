from django.core.management.base import BaseCommand

from accounts.models import User


DEMO_USERS = [
    {
        "name": "Demo Admin",
        "email": "admin.demo@lms.com",
        "role": "admin",
        "password": "Password@123",
    },
    {
        "name": "Demo Teacher",
        "email": "teacher.demo@lms.com",
        "role": "teacher",
        "password": "Password@123",
    },
    {
        "name": "Demo Student",
        "email": "student.demo@lms.com",
        "role": "student",
        "password": "Password@123",
    },
]


class Command(BaseCommand):
    help = "Create/update demo users with known credentials."

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0
        for item in DEMO_USERS:
            user, created = User.objects.get_or_create(
                email=item["email"],
                defaults={
                    "name": item["name"],
                    "role": item["role"],
                    "enabled": True,
                },
            )

            changed = created
            if user.name != item["name"]:
                user.name = item["name"]
                changed = True
            if user.role != item["role"]:
                user.role = item["role"]
                changed = True
            if not user.enabled:
                user.enabled = True
                changed = True

            user.set_password(item["password"])
            changed = True
            user.save()

            if created:
                created_count += 1
            elif changed:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo users ready. created={created_count} updated={updated_count} password=Password@123"
            )
        )
