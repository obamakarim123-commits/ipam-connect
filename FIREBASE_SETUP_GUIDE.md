# 🔥 Firebase Console Configuration Guide
## IPAM Connect - Manual Setup Steps

This guide walks you through the remaining Firebase Console configuration tasks that need to be completed manually.

---

## 📋 Prerequisites

- Firebase project already created
- Firebase CLI installed and authenticated
- Project files: `firestore.rules`, `storage.rules`, and `firestore.indexes.json` are ready

---

## 🔐 Step 1: Deploy Firestore Security Rules

### Option A: Manual Copy/Paste (Immediate)

1. **Open Firebase Console**: https://console.firebase.google.com/
2. Navigate to your **IPAM Connect** project
3. Go to **Firestore Database** → **Rules** tab
4. **Copy the entire contents** of `firestore.rules` file
5. **Paste** into the Firebase Console rules editor
6. Click **Publish** button

### Option B: Deploy via CLI (Recommended for future updates)

```bash
firebase deploy --only firestore:rules
```

### ✅ Key Rules Highlights

- **`/channels/` write access**: Only moderators (class_reps + admins) can create/modify channels
- **`/tokens/` update access**: Students can consume tokens assigned to their department
- **`/messages/` update access**: Only moderators can soft-delete messages (flip `isDeleted` field)
- **`/resources/` access**: Authenticated users can upload; owners/admins can delete

---

## 📊 Step 2: Deploy Firestore Indexes

The composite index for messages is already defined in `firestore.indexes.json`:
- **Collection**: `messages`
- **Fields**: `channelId` (ASCENDING) + `timestamp` (ASCENDING)

### Option A: Deploy via CLI (Recommended)

```bash
firebase deploy --only firestore:indexes
```

This will create the composite index automatically.

### Option B: Auto-create from Console Error

1. Run your app and navigate to a channel with messages
2. Open **Browser Console** (F12)
3. Look for a Firestore index error with a clickable link
4. Click the link to auto-create the index in Firebase Console

### ⏱️ Note
Index creation can take **5-15 minutes**. You'll receive an email when it's ready.

---

## 📦 Step 3: Configure Storage Security Rules

### Option A: Manual Copy/Paste (Immediate)

1. **Open Firebase Console**: https://console.firebase.google.com/
2. Navigate to your **IPAM Connect** project
3. Go to **Storage** → **Rules** tab
4. **Copy the entire contents** of `storage.rules` file
5. **Paste** into the Firebase Console rules editor
6. Click **Publish** button

### Option B: Deploy via CLI (Recommended for future updates)

```bash
firebase deploy --only storage
```

### ✅ Storage Rules Highlights

- **`/resources/{userId}/{fileName}`**: 
  - Authenticated users can upload files (max 10MB)
  - Supports images, PDFs, documents, text files
  - Users can delete their own files; admins can delete any
  
- **`/profile-pictures/{userId}`**: 
  - Users can upload their own profile picture (max 5MB, images only)
  
- **`/announcements/{fileName}`**: 
  - Only admins can upload announcement attachments
  - All authenticated users can read

---

## 🚀 Step 4: Deploy Everything at Once (Future Updates)

Once you've manually configured everything in the console, you can use this single command for future deployments:

```bash
firebase deploy
```

This will deploy:
- ✅ Firestore rules
- ✅ Firestore indexes
- ✅ Storage rules
- ✅ Cloud Functions

---

## 🧪 Step 5: Test Your Configuration

### Test Firestore Rules

1. **As a student**:
   - ✅ Can read channels and messages
   - ✅ Can create messages
   - ❌ Cannot create/modify channels
   - ❌ Cannot delete messages

2. **As a class_rep**:
   - ✅ Can create/modify channels
   - ✅ Can soft-delete messages (set `isDeleted: true`)
   - ❌ Cannot hard-delete messages

3. **As an admin**:
   - ✅ Full access to all collections
   - ✅ Can create tokens
   - ✅ Can hard-delete messages

### Test Storage Rules

1. **Upload a file** as an authenticated user
2. **Verify file size limits** (should reject files > 10MB)
3. **Try uploading invalid file types** (should reject)
4. **Test deletion** (users can delete own files, admins can delete any)

---

## 📝 Verification Checklist

- [ ] Firestore rules deployed and published
- [ ] Firestore indexes deployed (check Firebase Console → Firestore → Indexes)
- [ ] Storage rules deployed and published
- [ ] Tested authentication flow
- [ ] Tested role-based access (student, class_rep, admin)
- [ ] Tested file uploads and deletions
- [ ] Verified composite index is active (no console errors)

---

## 🆘 Troubleshooting

### "Missing or insufficient permissions" error
- Check that Firestore rules are published
- Verify user is authenticated
- Confirm user's role in `/users/{uid}` document

### "Index not found" error in console
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Wait 5-15 minutes for index creation
- Or click the auto-create link in the error message

### Storage upload fails
- Check file size (max 10MB for resources, 5MB for profile pictures)
- Verify file type is allowed
- Ensure Storage rules are published

### Rules deployment fails
- Run `firebase login` to re-authenticate
- Check `firebase.json` has correct paths
- Verify `.firebaserc` has correct project ID

---

## 📚 Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Documentation](https://firebase.google.com/docs/storage/security)
- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)

---

## ✨ Quick Reference Commands

```bash
# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes

# Deploy only Storage rules
firebase deploy --only storage

# Deploy everything
firebase deploy

# Check current Firebase project
firebase projects:list

# Switch Firebase project
firebase use <project-id>
```

---

**Last Updated**: June 22, 2026  
**Project**: IPAM Connect  
**Version**: 1.0
