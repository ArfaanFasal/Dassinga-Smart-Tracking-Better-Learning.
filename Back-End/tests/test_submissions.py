import io
import zipfile
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.uploadedfile import SimpleUploadedFile

from accounts.models import User
from assignments.models import Assignment
from submissions.models import Submission


class SubmissionApiTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            name="Teacher",
            email="teacher2@example.com",
            password="password123",
            role="teacher",
        )
        self.student = User.objects.create_user(
            name="Student",
            email="student2@example.com",
            password="password123",
            role="student",
        )
        self.assignment = Assignment.objects.create(
            title="Lab",
            subject="Science",
            deadline=timezone.now() + timedelta(days=1),
            priority="Medium",
            assigned_to_all=True,
            created_by=self.teacher,
        )

    def auth(self, user):
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_student_submission_create(self):
        self.auth(self.student)
        payload = {
            "assignment": self.assignment.id,
            "text_answer": "This is my complete answer with enough detail and context.",
        }
        response = self.client.post("/api/submissions/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Submission.objects.count(), 1)

    def test_duplicate_submission_rejected(self):
        Submission.objects.create(student=self.student, assignment=self.assignment, text_answer="First")
        self.auth(self.student)
        response = self.client.post(
            "/api/submissions/",
            {"assignment": self.assignment.id, "text_answer": "Second attempt"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_blank_pdf_rejected(self):
        self.auth(self.student)
        blank_pdf = SimpleUploadedFile(
            "blank.pdf",
            b"%PDF-1.4\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF",
            content_type="application/pdf",
        )
        response = self.client.post(
            "/api/submissions/",
            {"assignment": self.assignment.id, "text_answer": "", "mainFile": blank_pdf},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_blank_pdf_with_image_marker_rejected(self):
        self.auth(self.student)
        # Some blank PDFs still contain /Image metadata without real answer content.
        blank_pdf = SimpleUploadedFile(
            "blank_with_image_marker.pdf",
            b"%PDF-1.4\n1 0 obj << /Resources << /XObject << /Im0 2 0 R >> >> >> endobj\n2 0 obj << /Subtype /Image >> endobj\ntrailer <<>>\n%%EOF",
            content_type="application/pdf",
        )
        response = self.client.post(
            "/api/submissions/",
            {"assignment": self.assignment.id, "text_answer": "", "mainFile": blank_pdf},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_blank_docx_rejected(self):
        self.auth(self.student)
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(
                "word/document.xml",
                '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>   </w:t></w:r></w:p></w:body></w:document>',
            )
            zf.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types></Types>')
        blank_docx = SimpleUploadedFile(
            "blank.docx",
            buf.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        response = self.client.post(
            "/api/submissions/",
            {"assignment": self.assignment.id, "text_answer": "", "mainFile": blank_docx},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_large_blank_docx_rejected(self):
        self.auth(self.student)
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(
                "word/document.xml",
                '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>   </w:t></w:r></w:p></w:body></w:document>',
            )
            zf.writestr("word/filler.bin", b"\x00" * 50000)
            zf.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types></Types>')
        blank_docx = SimpleUploadedFile(
            "large_blank.docx",
            buf.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        response = self.client.post(
            "/api/submissions/",
            {"assignment": self.assignment.id, "text_answer": "", "mainFile": blank_docx},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_blank_pdf_accepted(self):
        self.auth(self.student)
        # Contains simple PDF text drawing command.
        pdf_bytes = (
            b"%PDF-1.4\n"
            b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
            b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
            b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >> endobj\n"
            b"4 0 obj << /Length 45 >> stream\nBT /F1 12 Tf 50 100 Td (Hello Answer) Tj ET\nendstream endobj\n"
            b"trailer << /Root 1 0 R >>\n%%EOF"
        )
        file_obj = SimpleUploadedFile("answer.pdf", pdf_bytes, content_type="application/pdf")
        response = self.client.post(
            "/api/submissions/",
            {"assignment": self.assignment.id, "text_answer": "", "mainFile": file_obj},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_non_blank_docx_accepted(self):
        self.auth(self.student)
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(
                "word/document.xml",
                '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>This is the answer content</w:t></w:r></w:p></w:body></w:document>',
            )
            zf.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types></Types>')
        file_obj = SimpleUploadedFile(
            "answer.docx",
            buf.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        response = self.client.post(
            "/api/submissions/",
            {"assignment": self.assignment.id, "text_answer": "", "mainFile": file_obj},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_teacher_can_open_submission_file_endpoint(self):
        file_obj = SimpleUploadedFile("answer.txt", b"submission content", content_type="text/plain")
        submission = Submission.objects.create(
            student=self.student,
            assignment=self.assignment,
            text_answer="answer",
            file=file_obj,
        )
        self.auth(self.teacher)
        response = self.client.get(f"/api/submissions/{submission.id}/file")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_teacher_can_update_validation_to_invalid(self):
        submission = Submission.objects.create(
            student=self.student,
            assignment=self.assignment,
            text_answer="answer",
            validation_status="PENDING",
            status="Submitted",
        )
        self.auth(self.teacher)
        response = self.client.patch(
            f"/api/submissions/{submission.id}/validation",
            {"validationStatus": "INVALID"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        submission.refresh_from_db()
        self.assertEqual(submission.validation_status, "INVALID")
        self.assertEqual(submission.status, "Rejected")

    def test_image_file_in_document_field_rejected(self):
        self.auth(self.student)
        png_bytes = b"\x89PNG\r\n\x1a\n" + (b"\x00" * 128)
        image_as_doc = SimpleUploadedFile("blank.png", png_bytes, content_type="image/png")
        response = self.client.post(
            "/api/submissions/",
            {"assignment": self.assignment.id, "text_answer": "", "mainFile": image_as_doc},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
