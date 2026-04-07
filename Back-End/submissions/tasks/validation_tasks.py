from celery import shared_task
from django.utils import timezone

from submissions.models import Submission
from submissions.services.ai_validation import run_ai_validation


@shared_task
def validate_submission_task(submission_id: int):
    submission = (
        Submission.objects.select_related("assignment")
        .filter(id=submission_id)
        .first()
    )
    if not submission:
        return {"ok": False, "reason": "not_found"}

    result = run_ai_validation(
        text_answer=submission.text_answer,
        assignment_title=f"{submission.assignment.title} {submission.assignment.subject}",
        main_file=submission.file,
        image_file=submission.image,
    )
    submission.validation_status = result["verdict"]
    submission.validation_score = float(result["score"])
    submission.validation_flags = result["flags"]
    if result["verdict"] == "INVALID":
        submission.status = "Rejected"
    if submission.assignment.deadline and submission.submitted_at > submission.assignment.deadline:
        submission.status = "Late" if result["verdict"] != "INVALID" else "Rejected"
    submission.updated_at = timezone.now()
    submission.save(
        update_fields=[
            "validation_status",
            "validation_score",
            "validation_flags",
            "status",
            "updated_at",
        ]
    )
    return {"ok": True, "submission_id": submission_id, "result": result}
