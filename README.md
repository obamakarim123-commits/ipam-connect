# IPAM Connect - Student Networking Platform

A secure, modern web application for student networking, collaboration, and communication at IPAM.

## Stack Overview

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Pusher Channels
- **Storage**: AWS S3 with presigned URLs
- **Authentication**: NextAuth.js with OAuth 2.0 (Google, GitHub)
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and routes
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── channels/      # Course channel endpoints
│   │   ├── messages/      # Messaging endpoints
│   │   └── resources/     # File upload/download endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Library utilities
│   ├── db.ts             # MongoDB connection
│   ├── auth.ts           # NextAuth configuration
│   ├── s3.ts             # AWS S3 integration
│   └── pusher.ts         # Pusher Channels setup
├── models/               # MongoDB schemas
│   ├── User.ts
│   ├── Course.ts
│   ├── Message.ts
│   ├── File.ts
│   └── Announcement.ts
├── utils/                # Utility functions
│   ├── api.ts            # API helpers
│   ├── errors.ts         # Error classes
│   ├── validators.ts     # Input validation
│   └── constants.ts      # App constants
└── middleware.ts         # Next.js middleware for route protection
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and configure all variables:

```bash
cp .env.example .env.local
```

Required environment variables:
- `MONGODB_URI` - MongoDB Atlas connection string
- `NEXTAUTH_URL` - Application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - From Google OAuth Console
- `GITHUB_ID` & `GITHUB_SECRET` - From GitHub OAuth Settings
- `PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_APP_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` - From Pusher Dashboard
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` - AWS S3 credentials

### 3. Database Setup

1. Create a MongoDB Atlas cluster
2. Add IP whitelist for your development machine
3. Create a database user
4. Update `MONGODB_URI` in `.env.local`

### 4. OAuth Provider Setup

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Credentials (Web application)
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`

**GitHub OAuth:**
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 5. AWS S3 Setup

1. Create S3 bucket for file uploads
2. Configure CORS policy
3. Create IAM user with S3 permissions
4. Store credentials in `.env.local`

### 6. Pusher Setup

1. Create account at [Pusher.com](https://pusher.com)
2. Create a Channels app
3. Copy credentials to `.env.local`

## Development

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Type Checking

```bash
npm run type-check
```

### Build for Production

```bash
npm run build
```

## Core Features

### Authentication & Onboarding
- Google and GitHub OAuth sign-in
- Mandatory profile onboarding on first login
- Required fields: Full name, student ID, department, academic year

### User Directory
- Search students by department and year
- Granular privacy controls for profile visibility

### Course Channels
- Pre-generated course groups by admins
- Read/write messaging and file sharing within courses
- Class Rep moderation capabilities

### Direct Messaging
- 1-on-1 peer-to-peer messaging
- Real-time message delivery via Pusher

### File Sharing
- AWS S3 presigned URL upload flow
- Per-user 500 MB storage limit
- Supported formats: PDF, DOCX, PNG, JPG, ZIP

### Real-time Notifications
- Toast alerts and red badges for:
  - New direct messages
  - Course group messages
  - Global announcements

### Global Announcements
- Admin-only posting privileges
- Read-only access for students
- Class Reps can contribute

## API Endpoints (to be implemented)

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth handler

### Users
- `GET /api/users/directory` - Search directory
- `POST /api/users/onboarding` - Complete onboarding
- `GET/PATCH /api/users/profile` - User profile

### Courses
- `GET /api/channels` - List courses
- `GET /api/channels/:courseId` - Get course details

### Messages
- `GET /api/messages` - List messages
- `POST /api/messages` - Send message
- `DELETE /api/messages/:messageId` - Delete message (admin/class rep)

### Files
- `POST /api/resources/create-upload-url` - Get presigned S3 URL
- `GET /api/resources/:fileId` - Download file
- `DELETE /api/resources/:fileId` - Delete file

### Announcements
- `GET /api/announcements` - List announcements
- `POST /api/announcements` - Create announcement (admin only)

## Security Considerations

- Schema validation via Zod
- Input sanitization for XSS prevention
- BSON schema constraints at DB level
- Optimistic concurrency control via `__v` versioning
- JWT-based session management
- Role-based access control (RBAC)
- Presigned URLs prevent direct binary uploads through Next.js

## Performance Targets

- UI component switch latency: < 150ms
- Message render response: < 150ms
- Presigned URL generation: < 150ms
- Network resilience with automatic retry on upload failures

## Deployment on Vercel

1. Push repository to GitHub
2. Connect repository in Vercel dashboard
3. Add environment variables in Vercel settings
4. Deploy

Vercel handles serverless function timeouts, making Pusher essential for long-lived connections.

## Contributing

Follow the established folder structure and naming conventions. Run type checking and linting before committing.

## License

Proprietary - IPAM Institution

## Support

For issues or questions, contact the development team.
