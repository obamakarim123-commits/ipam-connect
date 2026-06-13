# IPAM Connect

A **centralized academic networking and communication platform** built for students, designed to replace fragmented communication channels like WhatsApp and Telegram with a purpose-built system for collaborative learning.

## Features

✅ **User Authentication & Profiles**  
- Email-based registration and login via Firebase Auth
- Student profiles with department, level, and contact info
- Searchable student directory with filtering
- Role-based access control: Student, Class Representative, Admin

✅ **Real-Time Communication**  
- Native Firestore-powered direct messaging
- Group class-specific chat channels
- File attachments up to 50MB via Firebase Storage
- Instant message delivery with live presence

✅ **Academic Resource Repository**  
- Upload and share study materials (notes, slides, assignments)
- Metadata tagging (category, course, timestamp)
- Full-text search and discovery interface
- 50MB per-file limit with optimization warnings

✅ **Role-Based Controls**  
- **Students**: Register, search peers, send DMs, upload resources, participate in chat
- **Class Reps**: Create class channels, pin announcements, moderate messages
- **Admins**: Generate single-use tokens, manage tokens, view all data, moderate system-wide

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Deployment**: Vercel or any static host
- **Package Manager**: npm

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs Firebase and all dependencies needed.

### 2. Run Locally

Start a local development server:

```bash
npm start
```

This runs `npx http-server . -p 8080`. Open your browser to `http://localhost:8080`.

### 3. Configure Firebase

The app is pre-configured with a Firebase project. If you want to use your own:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Enable **Cloud Firestore** (in Native mode)
4. Enable **Storage**
5. Copy your config values from **Project Settings**
6. Open `firebase-config.js` and replace the placeholder values:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Create Initial Admin Account

1. Register a user account normally via the UI
2. In your Firestore console, navigate to the `users` collection
3. Find your user document and manually change the `role` field from `"student"` to `"admin"`
4. Log out and back in to see the Admin panel

### 5. Generate Class Rep Tokens (Admin Feature)

Once logged in as an admin:

1. Go to the **Admin** tab
2. Fill in Department and Level in the "Create Single-Use Token" form
3. Click **Generate Token**
4. Share the token with a student who should be a Class Rep
5. They enter it during registration to become a Class Rep

## Project Structure

```
ipam-connect/
├── index.html              # Main HTML entry point
├── app.js                  # Core application logic & Firebase integration
├── styles.css              # Responsive dark theme styling
├── firebase-config.js      # Firebase configuration (update with your values)
├── package.json            # Dependencies & scripts
├── README.md               # This file
└── .gitignore              # Excludes node_modules and secrets
```

## Key PRD Requirements Implemented

### Epic 1: Identity & Profile Management ✅
- Secure registration with email authentication
- Single-use token validation for Class Representatives
- Pre-defined dropdowns for departments and levels
- Searchable student directory

### Epic 2: Structured Real-Time Communication ✅
- Direct peer-to-peer messaging
- Class-specific group chat channels
- File attachments (up to 50MB)
- Reactive Firestore listeners for instant delivery

### Epic 3: Academic Repository ✅
- High-velocity resource uploads
- Metadata taxonomy (category, course, timestamp)
- Zero-latency client-side search
- 50MB upload limit with optimization warnings

### Epic 4: Distributed Moderation ✅
- Soft-delete messages (mark `isDeleted: true`)
- Role-based moderation capabilities
- Admin token management
- Resource take-down by Class Reps

## Development Notes

### Firebase Firestore Schema

**users** collection
```json
{
  "uid": "STRING_AUTH_ID",
  "fullName": "John Doe",
  "email": "john@example.com",
  "role": "student | class_rep | admin",
  "studentId": "IPAM-2026-0001",
  "department": "BSc Information Technology",
  "level": "Year 2",
  "createdAt": "TIMESTAMP"
}
```

**messages** collection
```json
{
  "senderId": "STRING_AUTH_ID",
  "text": "Message content",
  "attachmentUrl": "https://firebasestorage.googleapis.com/...",
  "attachmentType": "application/pdf",
  "isDeleted": false,
  "timestamp": "TIMESTAMP"
}
```

**resources** collection
```json
{
  "title": "Linear Algebra Notes",
  "category": "notes | slides | assignments | projects",
  "fileUrl": "https://firebasestorage.googleapis.com/...",
  "fileName": "notes.pdf",
  "fileSize": 1048576,
  "ownerId": "STRING_AUTH_ID",
  "ownerName": "Jane Smith",
  "createdAt": "TIMESTAMP"
}
```

**tokens** collection
```json
{
  "tokenId": "TKN-ABC12345",
  "isConsumed": false,
  "assignedDepartment": "BSc Information Technology",
  "assignedLevel": "Year 2",
  "consumedBy": null,
  "invalidatedAt": null
}
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Vercel automatically detects and builds the static site
4. Deploy!

```bash
vercel --prod
```

### Any Static Host

Copy all files to your host's `public/` directory.

## Troubleshooting

**"Firebase not initialized"**  
- Ensure `firebase-config.js` has valid credentials

**"Permission denied" errors in Firestore**  
- Set up Firestore security rules in the Firebase console:

```plaintext
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /messages/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    match /resources/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    match /tokens/{tokenId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

**File upload fails**  
- Ensure Firebase Storage rules allow authenticated users to write

## Future Roadmap

🔄 **Post-MVP Features**
- Real-time typing indicators
- Video/audio conferencing via WebRTC
- Automated university registrar integration
- Push notifications
- Custom desktop client
- Advanced search with Algolia
- Analytics dashboard

## License

MIT License - Free to use and modify.

## Support

For issues, feature requests, or contributions, open an issue or PR on GitHub.

---

**Built for the Hackathon MVP | Powered by Firebase & Vanilla JS**
