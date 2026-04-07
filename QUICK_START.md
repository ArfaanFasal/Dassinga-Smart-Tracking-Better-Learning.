# Smart LMS Quick Start

## 1) Start Backend

From project root:

```bat
run-backend.cmd
```

Or from backend folder:

```bat
Back-End\run-backend.cmd
```

Backend runs on `http://127.0.0.1:5000`.

## 2) Start Frontend

From project root:

```bat
run-frontend.cmd
```

Or from frontend folder:

```bat
Front-End\run-frontend.cmd
```

Frontend runs on `http://127.0.0.1:5173`.

## 3) Demo Login Credentials

Password for all demo users:

`Password@123`

Accounts:

- `student.demo@lms.com` (Student)
- `teacher.demo@lms.com` (Teacher)
- `admin.demo@lms.com` (Admin)

## Notes

- If login shows backend offline, make sure backend is running first.
- If frontend fails with `spawn EPERM`, run terminal as Administrator and allow `node.exe`/`esbuild.exe` in Windows Security.
