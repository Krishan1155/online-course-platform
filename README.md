# Online Course Platform

A full-stack MERN application for online learning with JWT authentication, Razorpay payments, email verification, and admin dashboard.

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios, Context API, Tailwind CSS
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Auth:** JWT with role-based access (Admin/Student)
- **Payments:** Razorpay Test Mode
- **Email:** Nodemailer

## Project Structure

```
c2/
├── backend/
│   ├── config/           # Database configuration
│   ├── controllers/      # Route controllers (MVC)
│   ├── middleware/       # Auth, error handling, file upload
│   ├── models/           # Mongoose schemas
│   ├── routes/           # REST API routes
│   ├── scripts/          # Seed scripts
│   ├── uploads/          # Course thumbnails
│   ├── utils/            # Email, JWT helpers
│   ├── server.js         # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios instance
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Auth Context API
│   │   ├── layouts/      # Main & Admin layouts
│   │   ├── pages/        # Route pages
│   │   └── utils/        # Helpers
│   ├── .env.example
│   └── package.json
├── API_DOCUMENTATION.md
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017/project3`
- Razorpay test account ([dashboard.razorpay.com](https://dashboard.razorpay.com))
- SMTP credentials for Nodemailer (Gmail App Password recommended)

## Setup Instructions

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Frontend
cd ../frontend
npm install
cp .env.example .env
# Edit .env with Razorpay key
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```env
MONGODB_URI=mongodb://localhost:27017/project3
JWT_SECRET=your_secret_key
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Course Platform <your@gmail.com>
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5001/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### 3. Seed Admin User

```bash
cd backend
node scripts/seedAdmin.js
```

Default admin credentials:
- Email: `admin@courseplatform.com`
- Password: `admin123456`

### 4. Start MongoDB

Ensure MongoDB is running:
```bash
mongod
# Or if using MongoDB as a service, ensure it's started
```

### 5. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5001/api
- Health check: http://localhost:5001/api/health

## Features

### Student
- Register, login, email verification, forgot/reset password
- Browse, search, and filter courses
- Enroll in free courses or pay via Razorpay
- Video playback (YouTube embed or direct URL)
- Mark lessons complete with progress tracking
- My Courses dashboard

### Admin
- Admin dashboard with stats
- Create, edit, delete courses
- Upload course thumbnails
- Manage modules and lessons
- View users and enrollments
- Revenue dashboard

## Database Collections

Mongoose automatically creates these collections in `project3`:
- `users`
- `courses`
- `modules`
- `lessons`
- `enrollments`
- `progresses`
- `payments`

## Razorpay Test Mode

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Switch to **Test Mode**
3. Copy Key ID and Key Secret to both `.env` files
4. Use test card: `4111 1111 1111 1111`, any future expiry, any CVV

## Email Setup (Gmail)

1. Enable 2FA on your Google account
2. Generate an App Password: Google Account → Security → App Passwords
3. Set `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM` in backend `.env`
4. Use the app password, not your normal Gmail password

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete REST API reference.

## Production Notes

- Change `JWT_SECRET` to a strong random string
- Use production MongoDB URI
- Switch Razorpay to Live Mode with live keys
- Set `NODE_ENV=production`
- Build frontend: `cd frontend && npm run build`
- Serve frontend static files or deploy separately
- Configure CORS for your production domain

## License

MIT
