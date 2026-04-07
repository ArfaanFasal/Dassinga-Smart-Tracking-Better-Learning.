from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class AuthTests(APITestCase):
    def test_student_register(self):
        payload = {
            "name": "Student One",
            "email": "student1@example.com",
            "password": "password123",
            "phone": "1234567890",
            "course": "Math",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="student1@example.com", role="student").exists())

    def test_login_disabled_account(self):
        user = User.objects.create_user(
            name="Disabled",
            email="disabled@example.com",
            password="password123",
            role="student",
            enabled=False,
        )
        response = self.client.post("/api/auth/login/", {"email": user.email, "password": "password123"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
