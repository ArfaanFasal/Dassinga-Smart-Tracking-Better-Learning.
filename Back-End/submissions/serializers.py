import io
import mimetypes
import re
import zipfile

from django.utils import timezone
from rest_framework import serializers

from assignments.models import Assignment

from .models import Submission


MAX_UPLOAD_BYTES = 20 * 1024 * 1024
ALLOWED_EXT = {".pdf", ".doc", ".docx", ".zip", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}
DOCUMENT_EXT = {".pdf", ".doc", ".docx", ".zip"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}


def _read_upload_bytes(upload, limit=2 * 1024 * 1024):
    pos = upload.tell() if hasattr(upload, "tell") else None
    try:
        if hasattr(upload, "seek"):
            upload.seek(0)
        data = upload.read(limit)
        return data or b""
    finally:
        if pos is not None and hasattr(upload, "seek"):
            upload.seek(pos)


def _is_blank_pdf(data: bytes) -> bool:
    if not data:
        return True
    text = data.decode("latin1", errors="ignore")
    if re.search(r"\(([^)]{1,500})\)\s*T[Jj]", text):
        return False
    if re.search(r"<([0-9A-Fa-f]{2,})>\s*T[Jj]", text):
        return False
    # Generic text-show operators (covers variants not matched above).
    if re.search(r"\bT[Jj]\b", text):
        return False
    # No image and no text draw operations means effectively blank content.
    return True


def _is_blank_docx(data: bytes) -> bool:
    if not data:
        return True
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            xml = zf.read("word/document.xml").decode("utf-8", errors="ignore")
            words = re.findall(r"<w:t[^>]*>(.*?)</w:t>", xml)
            if any((w or "").strip() for w in words):
                return False
            # Image-only DOCX should be treated as non-blank.
            if "<w:drawing" in xml or "<w:pict" in xml:
                return False
            return True
    except Exception:
        # Unreadable DOCX should not bypass validation.
        return True


def _is_blank_doc(data: bytes) -> bool:
    if not data:
        return True
    latin_words = re.findall(r"[A-Za-z]{3,}", data.decode("latin1", errors="ignore"))
    utf16_words = re.findall(r"[A-Za-z]{3,}", data.decode("utf-16le", errors="ignore"))
    words = [w.lower() for w in (latin_words + utf16_words)]
    boilerplate = {
        "microsoft",
        "word",
        "document",
        "normal",
        "timesnewroman",
        "font",
        "stylesheet",
        "table",
    }
    meaningful = [w for w in words if w not in boilerplate]
    # Require at least a minimal amount of meaningful content in legacy DOC.
    return len(meaningful) < 3


def _validate_non_blank_document(upload):
    name = (upload.name or "").lower()
    ext = "." + name.rsplit(".", 1)[-1] if "." in name else ""
    if ext not in {".pdf", ".docx", ".doc"}:
        return
    data = _read_upload_bytes(upload)
    if ext == ".pdf" and _is_blank_pdf(data):
        raise serializers.ValidationError("Blank PDF is not allowed")
    if ext == ".docx" and _is_blank_docx(data):
        raise serializers.ValidationError("Blank DOCX is not allowed")
    if ext == ".doc" and _is_blank_doc(data):
        raise serializers.ValidationError("Blank DOC is not allowed")


def validate_upload(upload):
    if not upload:
        return
    if upload.size > MAX_UPLOAD_BYTES:
        raise serializers.ValidationError("File exceeds size limit")
    guessed, _ = mimetypes.guess_type(upload.name)
    ext = "." + upload.name.lower().split(".")[-1] if "." in upload.name else ""
    if ext not in ALLOWED_EXT and not guessed:
        raise serializers.ValidationError("Unsupported file type")


def validate_document_upload(upload):
    if not upload:
        return
    validate_upload(upload)
    ext = "." + upload.name.lower().split(".")[-1] if "." in upload.name else ""
    if ext not in DOCUMENT_EXT:
        raise serializers.ValidationError("Document upload only accepts PDF, DOC, DOCX, ZIP")
    _validate_non_blank_document(upload)


def validate_image_upload(upload):
    if not upload:
        return
    validate_upload(upload)
    ext = "." + upload.name.lower().split(".")[-1] if "." in upload.name else ""
    if ext not in IMAGE_EXT:
        raise serializers.ValidationError("Image upload only accepts image files")


class SubmissionSerializer(serializers.ModelSerializer):
    assignment_title = serializers.CharField(source="assignment.title", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_email = serializers.CharField(source="student.email", read_only=True)

    class Meta:
        model = Submission
        fields = (
            "id",
            "student",
            "student_name",
            "student_email",
            "assignment",
            "assignment_title",
            "text_answer",
            "file",
            "image",
            "status",
            "validation_status",
            "validation_score",
            "validation_flags",
            "submitted_at",
            "marks",
            "feedback",
            "reviewed_by",
            "reviewed_at",
        )
        read_only_fields = (
            "student",
            "status",
            "validation_status",
            "validation_score",
            "validation_flags",
            "submitted_at",
            "reviewed_by",
            "reviewed_at",
        )

    def to_internal_value(self, data):
        mutable = data.copy()
        if "assignmentId" in mutable and "assignment" not in mutable:
            mutable["assignment"] = mutable.get("assignmentId")
        if "textAnswer" in mutable and "text_answer" not in mutable:
            mutable["text_answer"] = mutable.get("textAnswer")
        if "mainFile" in mutable and "file" not in mutable:
            mutable["file"] = mutable.get("mainFile")
        if "imageFile" in mutable and "image" not in mutable:
            mutable["image"] = mutable.get("imageFile")
        return super().to_internal_value(mutable)

    def validate_file(self, value):
        validate_document_upload(value)
        return value

    def validate_image(self, value):
        validate_image_upload(value)
        return value

    def validate(self, attrs):
        request = self.context["request"]
        assignment = attrs.get("assignment")
        if not assignment:
            raise serializers.ValidationError({"assignment": "assignment is required"})
        if request.user.role != "student":
            raise serializers.ValidationError("Only students can create submissions")
        if assignment.deadline and timezone.now() > assignment.deadline:
            raise serializers.ValidationError("Submission deadline has passed")
        if not assignment.assigned_to_all and not assignment.assigned_to_students.filter(id=request.user.id).exists():
            raise serializers.ValidationError("Assignment not assigned to this student")
        if Submission.objects.filter(student=request.user, assignment=assignment).exists():
            raise serializers.ValidationError("Duplicate submission attempt for this assignment")
        if not attrs.get("text_answer") and not attrs.get("file") and not attrs.get("image"):
            raise serializers.ValidationError("Submission cannot be empty")
        return attrs

    def create(self, validated_data):
        validated_data["student"] = self.context["request"].user
        validated_data.setdefault("status", "Submitted")
        return super().create(validated_data)

    def to_representation(self, instance):
        request = self.context.get("request")
        file_url = instance.file.url if instance.file else ""
        image_url = instance.image.url if instance.image else ""
        if request and file_url:
            file_url = request.build_absolute_uri(file_url)
        if request and image_url:
            image_url = request.build_absolute_uri(image_url)
        return {
            "id": str(instance.id),
            "assignmentId": str(instance.assignment_id),
            "assignmentTitle": instance.assignment.title if instance.assignment_id else None,
            "assignmentSubject": instance.assignment.subject if instance.assignment_id else None,
            "studentId": str(instance.student_id),
            "studentName": instance.student.name if instance.student_id else None,
            "studentEmail": instance.student.email if instance.student_id else None,
            "textAnswer": instance.text_answer or "",
            "fileUrl": file_url,
            "imageUrl": image_url,
            "status": instance.status,
            "validationStatus": instance.validation_status,
            "validationFlags": instance.validation_flags,
            "validationScore": instance.validation_score,
            "submittedAt": instance.submitted_at.isoformat() if instance.submitted_at else None,
            "marks": instance.marks,
            "feedback": instance.feedback,
        }


class GradeSubmissionSerializer(serializers.ModelSerializer):
    marks = serializers.DecimalField(max_digits=6, decimal_places=2)
    feedback = serializers.CharField(allow_blank=True)

    class Meta:
        model = Submission
        fields = ("marks", "feedback")

    def validate(self, attrs):
        if attrs["marks"] < 0:
            raise serializers.ValidationError({"marks": "Marks cannot be negative"})
        return attrs
