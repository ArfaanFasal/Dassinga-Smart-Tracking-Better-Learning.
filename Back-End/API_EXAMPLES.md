# LMS API Examples

## Register Student
`POST /api/auth/register/`

Request:
```json
{
  "name": "John Student",
  "email": "john@student.com",
  "password": "StrongPass123",
  "phone": "9999999999",
  "course": "BSc CS"
}
```

Response:
```json
{
  "success": true,
  "message": "Registered successfully",
  "data": {
    "user": {
      "id": 12,
      "name": "John Student",
      "email": "john@student.com",
      "role": "student",
      "enabled": true
    },
    "access": "<jwt-access>",
    "refresh": "<jwt-refresh>"
  }
}
```

## Login
`POST /api/auth/login/`

Request:
```json
{
  "email": "john@student.com",
  "password": "StrongPass123"
}
```

## Create Assignment (Teacher/Admin)
`POST /api/assignments/`

Request:
```json
{
  "title": "Neural Networks Report",
  "subject": "AI",
  "deadline": "2026-04-20T12:00:00Z",
  "priority": "High",
  "assigned_to_all": false,
  "assigned_student_ids": [12, 13, 14]
}
```

## Submit Assignment (Student)
`POST /api/submissions/` (multipart/form-data)

Fields:
- `assignment`: `5`
- `text_answer`: `My answer...`
- `file`: uploaded document/pdf
- `image`: optional screenshot/image

Response:
```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {
    "submission": {
      "id": 77,
      "status": "Submitted",
      "validation_status": "PENDING"
    }
  }
}
```

## Grade Submission (Teacher/Admin)
`PATCH /api/submissions/77/grade/`

Request:
```json
{
  "marks": 88.5,
  "feedback": "Good structure. Add more references."
}
```

## Analytics
- Student: `GET /api/analytics/student/`
- Teacher: `GET /api/analytics/teacher/`
- Admin: `GET /api/analytics/admin/`
