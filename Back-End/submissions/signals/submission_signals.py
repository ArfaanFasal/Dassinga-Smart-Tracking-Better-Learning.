from django.db.models.signals import post_save
from django.dispatch import receiver

from submissions.models import Submission
from submissions.tasks.validation_tasks import validate_submission_task


@receiver(post_save, sender=Submission)
def trigger_validation(sender, instance, created, **kwargs):
    if created:
        try:
            validate_submission_task.delay(instance.id)
        except Exception:
            # Dev fallback when broker is unavailable.
            validate_submission_task(instance.id)
