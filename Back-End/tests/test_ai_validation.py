from django.test import SimpleTestCase

from submissions.services.ai_validation import run_ai_validation


class AiValidationTests(SimpleTestCase):
    def test_invalid_empty_submission(self):
        result = run_ai_validation("", "Math Homework")
        self.assertEqual(result["verdict"], "INVALID")
        self.assertIn("EMPTY_SUBMISSION", result["flags"])

    def test_suspicious_repeated_text(self):
        text = "spam spam spam spam spam spam spam spam"
        result = run_ai_validation(text, "Complex biology assignment title")
        self.assertIn(result["verdict"], ["SUSPICIOUS", "INVALID"])
