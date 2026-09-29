# Course Platform API Documentation

Base URL: `http://localhost:5001/api`

All protected routes require header: `Authorization: Bearer <token>`

---

## Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new student account |
| POST | `/auth/login` | Public | Login and receive JWT |
| POST | `/auth/logout` | Private | Logout (client-side token removal) |
| GET | `/auth/me` | Private | Get current user profile |
| GET | `/auth/verify-email/:token` | Public | Verify email address |
| POST | `/auth/resend-verification` | Private | Resend verification email |
| POST | `/auth/forgot-password` | Public | Send password reset email |
| PUT | `/auth/reset-password/:token` | Public | Reset password with token |
| PUT | `/auth/profile` | Private | Update profile/password |

### Register
```json
POST /auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login
```json
POST /auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

## Courses

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/courses` | Public | List published courses (search/filter) |
| GET | `/courses/categories` | Public | Get all categories |
| GET | `/courses/:id` | Public* | Get course details with modules/lessons |
| GET | `/courses/admin/all` | Admin | List all courses |
| GET | `/courses/admin/:id` | Admin | Get course for editing |
| POST | `/courses` | Admin | Create course (multipart/form-data) |
| PUT | `/courses/:id` | Admin | Update course (multipart/form-data) |
| DELETE | `/courses/:id` | Admin | Delete course |

### Query Parameters (GET /courses)
- `search` - Text search
- `category` - Filter by category
- `level` - beginner | intermediate | advanced
- `minPrice`, `maxPrice` - Price range
- `sort` - title | price-asc | price-desc

---

## Modules

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/modules/course/:courseId` | Private | Get modules with lessons |
| POST | `/modules/course/:courseId` | Admin | Create module |
| PUT | `/modules/:id` | Admin | Update module |
| DELETE | `/modules/:id` | Admin | Delete module |

---

## Lessons

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/lessons/:id` | Private | Get lesson by ID |
| POST | `/lessons/module/:moduleId` | Admin | Create lesson |
| PUT | `/lessons/:id` | Admin | Update lesson |
| DELETE | `/lessons/:id` | Admin | Delete lesson |

---

## Enrollments

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/enrollments/my` | Student | Get my enrollments with progress |
| GET | `/enrollments/check/:courseId` | Student | Check enrollment status |
| GET | `/enrollments/content/:courseId` | Student | Get enrolled course content |
| POST | `/enrollments/free/:courseId` | Student | Enroll in free course |
| GET | `/enrollments/admin/all` | Admin | View all enrollments |

---

## Progress

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/progress/:courseId` | Student | Get course progress |
| POST | `/progress/:courseId/lesson/:lessonId/complete` | Student | Mark lesson complete |
| PUT | `/progress/:courseId/lesson/:lessonId/access` | Student | Update last accessed lesson |

---

## Payments (Manual UPI Verification)

The platform uses a **manual UPI payment verification flow** rather than an automated payment gateway. The student pays using the displayed UPI ID or QR code, uploads the payment screenshot, and optionally provides the transaction ID. The payment request is stored with a `pending` status until an admin verifies it.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/payment-requests/config` | Public/Student | Get UPI payment configuration such as UPI ID and QR code path |
| GET | `/payment-requests/status/:courseId` | Student | Check the current user's payment request status for a course |
| POST | `/payment-requests` | Student | Submit a manual payment request with payment screenshot and optional transaction ID |

### Payment Flow

```text
Student
   ↓
Selects paid course
   ↓
Payment Page
   ↓
Gets UPI ID + QR Code
   ↓
Pays using UPI
   ↓
Uploads payment screenshot
   ↓
POST /payment-requests
   ↓
Backend validates request
   ↓
Payment request stored in MongoDB
   ↓
status = "pending"
   ↓
Admin manually verifies payment
   ↓
 ┌───────────────┐
 │               │
Approve        Reject
 │               │
 ↓               ↓
Enroll user     Payment rejected
 │
 ↓
Course access granted
```

### Get Payment Configuration

```text
GET /payment-requests/config
```

Example response:

```json
{
  "upiId": "example@upi",
  "qrCodePath": "/uploads/payment/qr.jpeg"
}
```

The frontend uses the QR code path to display the payment QR image.

### Check Payment Status

```text
GET /payment-requests/status/:courseId
```

This checks whether the current user already has a payment request for the selected course and returns its current status.

Typical status flow:

```text
pending → approved
pending → rejected
```

### Submit Payment Request

```text
POST /payment-requests
Content-Type: multipart/form-data
```

The request contains:

```text
courseId
studentName
studentEmail
transactionId (optional)
paymentScreenshot (image file)
```

`multipart/form-data` is used because the request contains both normal form fields and a binary image file.

Frontend validation includes:
- Payment screenshot must be an image file.
- Image size must be less than 5 MB.

Example stored payment request:

```json
{
  "user": "user_id",
  "course": "course_id",
  "studentName": "Krishan",
  "studentEmail": "user@gmail.com",
  "transactionId": "123456789",
  "paymentScreenshot": "/uploads/payment/abc.jpg",
  "status": "pending"
}
```

### Manual Verification

Uploading a screenshot does not automatically confirm a successful payment. The request remains `pending` until an administrator verifies the payment.

If approved:

```text
PaymentRequest
      ↓
status = approved
      ↓
User enrolled in course
      ↓
User can access course
```

If rejected, the payment request remains unsuccessful and the user is not enrolled through that request.

Course access should be checked on the backend using the user's enrollment status; frontend checks alone should not be treated as sufficient authorization.

---

## Admin

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/dashboard` | Admin | Dashboard statistics |
| GET | `/admin/users` | Admin | List all users |
| GET | `/admin/users/:id` | Admin | User details |
| PUT | `/admin/users/:id/role` | Admin | Update user role |
| DELETE | `/admin/users/:id` | Admin | Delete user |
| POST | `/admin/create-admin` | Admin | Create admin user |

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { },
  "message": "Optional message"
}
```

### Error
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Health Check

`GET /api/health` - Returns API status
