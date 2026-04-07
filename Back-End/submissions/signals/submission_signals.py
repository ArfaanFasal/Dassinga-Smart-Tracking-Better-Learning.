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
            # If broker is unavailable, do not block submission creation.
            # This keeps submit API responsive; validation can be retried later.
            pass
