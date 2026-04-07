from django.utils import timezone
from rest_framework import serializers

from accounts.models import User
from submissions.models import Submission

from .models import Assignment


class AssignmentSerializer(serializers.ModelSerializer):
    assigned_student_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
    )
    assignMode = serializers.SerializerMethodField()
    isDueSoon = serializers.SerializerMethodField()
    isOverdue = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    lastSubmission = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = (
            "id",
            "title",
            "subject",
            "deadline",
            "priority",
            "assigned_to_all",
            "assigned_to_students",
            "assigned_student_ids",
            "created_by",
            "assignMode",
            "isDueSoon",
            "isOverdue",
            "status",
            "lastSubmission",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_by", "assigned_to_students")

    def to_internal_value(self, data):
        mutable = data.copy()
        if "assignMode" in mutable and "assigned_to_all" not in mutable:
            mutable["assigned_to_all"] = str(mutable.get("assignMode")).lower() == "all"
        if "assignedStudentIds" in mutable and "assigned_student_ids" not in mutable:
            mutable["assigned_student_ids"] = mutable.get("assignedStudentIds")
        return super().to_internal_value(mutable)

    def validate(self, attrs):
        deadline = attrs.get("deadline")
        if deadline and deadline <= timezone.now():
            raise serializers.ValidationError({"deadline": "Deadline must be in the future"})
        return attrs

    def create(self, validated_data):
        student_ids = validated_data.pop("assigned_student_ids", [])
        assignment = Assignment.objects.create(**validated_data)
        if not assignment.assigned_to_all and student_ids:
            students = User.objects.filter(id__in=student_ids, role="student", enabled=True)
            assignment.assigned_to_students.set(students)
        return assignment

    def update(self, instance, validated_data):
        student_ids = validated_data.pop("assigned_student_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if student_ids is not None:
            if instance.assigned_to_all:
                instance.assigned_to_students.clear()
            else:
                students = User.objects.filter(id__in=student_ids, role="student", enabled=True)
                instance.assigned_to_students.set(students)
        return instance

    def get_assignMode(self, obj):
        return "all" if obj.assigned_to_all else "select"

    def get_isDueSoon(self, obj):
        delta = obj.deadline - timezone.now()
        return 0 <= delta.total_seconds() <= 2 * 24 * 60 * 60

    def get_isOverdue(self, obj):
        return obj.deadline < timezone.now()

    def get_status(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated or request.user.role != "student":
            return None
        exists = Submission.objects.filter(student=request.user, assignment=obj).exists()
        return "Completed" if exists else "Pending"

    def get_lastSubmission(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated or request.user.role != "student":
            return None
        submission = Submission.objects.filter(student=request.user, assignment=obj).order_by("-submitted_at").first()
        if not submission:
            return None
        return {
            "fileUrl": submission.file.url if submission.file else "",
            "imageUrl": submission.image.url if submission.image else "",
            "submittedAt": submission.submitted_at.isoformat() if submission.submitted_at else None,
            "validationStatus": submission.validation_status,
            "validationFlags": submission.validation_flags,
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            "id": data["id"],
            "title": data["title"],
            "subject": data["subject"],
            "deadline": data["deadline"],
            "priority": data["priority"],
            "assignMode": data["assignMode"],
            "assignedStudentIds": [str(s.id) for s in instance.assigned_to_students.all()] if not instance.assigned_to_all else [],
            "createdBy": str(instance.created_by_id),
            "isDueSoon": data["isDueSoon"],
            "isOverdue": data["isOverdue"],
            "status": data["status"],
            "lastSubmission": data["lastSubmission"],
        }
