import math
import mimetypes
from collections import Counter


MIN_TEXT_LENGTH = 20
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/x-zip-compressed",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
}


def normalize_text(text):
    return " ".join((text or "").strip().split())


def is_repeated_garbage(text):
    t = normalize_text(text).lower()
    compact = t.replace(" ", "")
    if not compact:
        return False
    if len(compact) > 8 and len(set(compact)) == 1:
        return True
    words = [w for w in t.split(" ") if w]
    if len(words) >= 6 and len(set(words)) <= 2:
        return True
    return False


def is_meaningless(text):
    t = normalize_text(text).lower()
    if not t:
        return False
    if len(t) < MIN_TEXT_LENGTH:
        return True
    if t.replace(" ", "").isalnum() and not any(ch in "aeiou" for ch in t):
        return True
    return False


def relevance_score(text, title):
    text_words = {w for w in normalize_text(text).lower().split() if len(w) > 2}
    title_words = {w for w in normalize_text(title).lower().split() if len(w) > 2}
    if not text_words or not title_words:
        return 0.0
    overlap = len(text_words.intersection(title_words))
    return overlap / max(len(title_words), 1)


def file_mime_allowed(upload):
    mime = getattr(upload, "content_type", None)
    if mime and mime in ALLOWED_MIME_TYPES:
        return True
    guessed, _ = mimetypes.guess_type(getattr(upload, "name", ""))
    return guessed in ALLOWED_MIME_TYPES


def entropy_ratio(data: bytes):
    if not data:
        return 0
    freq = Counter(data)
    total = len(data)
    entropy = 0.0
    for count in freq.values():
        p = count / total
        entropy -= p * math.log2(p)
    return entropy


def image_looks_blank(upload):
    if not upload:
        return False
    sample = upload.read(50000)
    upload.seek(0)
    if not sample or len(sample) < 900:
        return True
    diffs = sum(1 for i in range(1, len(sample)) if sample[i] != sample[i - 1])
    variance_ratio = diffs / max(1, len(sample) - 1)
    entropy = entropy_ratio(sample)
    return variance_ratio < 0.04 or entropy < 3.1


def run_ai_validation(text_answer, assignment_title, main_file=None, image_file=None):
    flags = []
    text = normalize_text(text_answer)
    if not text and not main_file and not image_file:
        return {"verdict": "INVALID", "score": 0, "flags": ["EMPTY_SUBMISSION"]}

    if main_file and getattr(main_file, "size", 0) <= 0:
        return {"verdict": "INVALID", "score": 0, "flags": ["ZERO_BYTE_FILE"]}
    if image_file and getattr(image_file, "size", 0) <= 0:
        return {"verdict": "INVALID", "score": 0, "flags": ["ZERO_BYTE_IMAGE"]}
    if main_file and not file_mime_allowed(main_file):
        return {"verdict": "INVALID", "score": 0, "flags": ["UNSUPPORTED_FILE_TYPE"]}
    if image_file and image_looks_blank(image_file):
        return {"verdict": "INVALID", "score": 10, "flags": ["BLANK_IMAGE"]}

    score = 100.0
    if text:
        if len(text) < MIN_TEXT_LENGTH and not main_file and not image_file:
            return {"verdict": "INVALID", "score": 10, "flags": ["TEXT_TOO_SHORT"]}
        if is_repeated_garbage(text):
            flags.append("REPEATED_SPAM_TEXT")
            score -= 45
        if is_meaningless(text):
            flags.append("MEANINGLESS_TEXT")
            score -= 35
        rel = relevance_score(text, assignment_title)
        if rel < 0.12:
            flags.append("LOW_TOPIC_RELEVANCE")
            score -= 20

    if score < 50 or len(flags) >= 2:
        return {"verdict": "SUSPICIOUS", "score": max(score, 0), "flags": flags}
    return {"verdict": "VALID", "score": max(score, 0), "flags": flags}
