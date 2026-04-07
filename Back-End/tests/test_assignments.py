from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from assignments.models import Assignment


class AssignmentApiTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            name="Teacher",
            email="teacher@example.com",
            password="password123",
            role="teacher",
        )
        self.student = User.objects.create_user(
            name="Student",
            email="student@example.com",
            password="password123",
            role="student",
        )

    def auth(self, user):
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_teacher_creates_assignment(self):
        self.auth(self.teacher)
        payload = {
            "title": "Essay",
            "subject": "History",
            "deadline": (timezone.now() + timedelta(days=2)).isoformat(),
            "priority": "High",
            "assigned_to_all": True,
        }
        response = self.client.post("/api/assignments/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Assignment.objects.count(), 1)

    def test_student_cannot_create_assignment(self):
        self.auth(self.student)
        payload = {
            "title": "Essay",
            "subject": "History",
            "deadline": (timezone.now() + timedelta(days=2)).isoformat(),
            "priority": "High",
            "assigned_to_all": True,
        }
        response = self.client.post("/api/assignments/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_can_delete_own_assignment(self):
        assignment = Assignment.objects.create(
            title="Delete Me",
            subject="Math",
            deadline=timezone.now() + timedelta(days=2),
            priority="Medium",
            assigned_to_all=True,
            created_by=self.teacher,
        )
        self.auth(self.teacher)
        response = self.client.delete(f"/api/assignments/{assignment.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Assignment.objects.filter(id=assignment.id).exists())

    def test_teacher_cannot_delete_other_teacher_assignment(self):
        other_teacher = User.objects.create_user(
            name="Other Teacher",
            email="teacher3@example.com",
            password="password123",
            role="teacher",
        )
        assignment = Assignment.objects.create(
            title="Protected",
            subject="Physics",
            deadline=timezone.now() + timedelta(days=2),
            priority="Low",
            assigned_to_all=True,
            created_by=other_teacher,
        )
        self.auth(self.teacher)
        response = self.client.delete(f"/api/assignments/{assignment.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Assignment.objects.filter(id=assignment.id).exists())
