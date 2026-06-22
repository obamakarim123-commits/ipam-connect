import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createRequire } from 'module';

// Safely load the local JSON key file in an ES Module environment
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin using modular imports
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedDatabase() {
  console.log('Starting Firestore seeding...');

  // 1. Seed Class Rep Tokens
  const mockTokens = [
    { id: 'TKN-IT-YEAR2-01', data: { tokenId: 'TKN-IT-YEAR2-01', isConsumed: false, assignedDepartment: 'BSc Information Technology', assignedLevel: 'Year 2', consumedBy: null, invalidatedAt: null } },
    { id: 'TKN-BA-YEAR1-01', data: { tokenId: 'TKN-BA-YEAR1-01', isConsumed: false, assignedDepartment: 'BSc Business Administration', assignedLevel: 'Year 1', consumedBy: null, invalidatedAt: null } }
  ];
  for (const token of mockTokens) {
    await db.collection('tokens').doc(token.id).set(token.data);
    console.log(`Seeded Token: ${token.id}`);
  }

  // 2. Seed Channels
  const mockChannels = [
    { id: 'gen-it-y2', data: { channelId: 'gen-it-y2', channelName: 'general-chat', channelType: 'text', department: 'BSc Information Technology', level: 'Year 2' } },
    { id: 'ann-it-y2', data: { channelId: 'ann-it-y2', channelName: 'announcements', channelType: 'text', department: 'BSc Information Technology', level: 'Year 2' } }
  ];
  for (const channel of mockChannels) {
    await db.collection('channels').doc(channel.id).set(channel.data);
    console.log(`Seeded Channel: ${channel.data.channelName}`);
  }

  // 3. Seed Messages
  const mockMessages = [
    {
      senderId: 'SYSTEM',
      senderName: 'System Bot',
      text: 'Welcome to the general chat channel for BSc Information Technology Year 2!',
      channelId: 'gen-it-y2',
      isDeleted: false,
      timestamp: FieldValue.serverTimestamp()
    },
    {
      senderId: 'SYSTEM',
      senderName: 'System Bot',
      text: 'Important slides and assignments will be pinned here by Class Representatives.',
      channelId: 'ann-it-y2',
      isDeleted: false,
      timestamp: FieldValue.serverTimestamp()
    }
  ];
  for (const message of mockMessages) {
    await db.collection('messages').add(message);
  }
  console.log('Seeded initial welcome messages.');

  // 4. Seed Academic Resources
  const mockResources = [
    {
      title: 'Database Systems - Lecture 1 Introduction',
      category: 'slides',
      fileUrl: 'placeholder-file-url-db-1',
      fileName: 'lecture1_intro.pdf',
      fileSize: 4500000,
      ownerId: 'SYSTEM',
      ownerName: 'Academic System',
      createdAt: FieldValue.serverTimestamp()
    },
    {
      title: 'Discrete Mathematics Assignment 1',
      category: 'assignments',
      fileUrl: 'placeholder-file-url-math-1',
      fileName: 'assignment_1_discrete_math.pdf',
      fileSize: 1200000,
      ownerId: 'SYSTEM',
      ownerName: 'Academic System',
      createdAt: FieldValue.serverTimestamp()
    }
  ];
  for (const resource of mockResources) {
    await db.collection('resources').add(resource);
  }
  console.log('Seeded academic resources.');

  console.log('Firestore Database successfully seeded!');
}

seedDatabase().catch(console.error);
