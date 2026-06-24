import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';
const serviceAccount = require(keyPath);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const departments = [
  'BSc Information Technology',
  'BSc Business Administration',
  'BSc Financial Accounting',
  'BSc Public Sector Management',
  'BSc Sustainable Development'
];

const levels = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];

const channelTemplates = [
  { name: 'General Chat', type: 'text', icon: '#', level: '' },
  { name: 'Announcements', type: 'text', icon: '📣', level: '' },
  { name: 'Resource Sharing', type: 'forum', icon: '📂', level: '' },
  { name: 'Study Groups', type: 'text', icon: '#', level: '' },
  { name: 'Year 1 Hub', type: 'text', icon: '🎓', level: 'Year 1' },
  { name: 'Year 2 Hub', type: 'text', icon: '🎓', level: 'Year 2' },
  { name: 'Year 3 Hub', type: 'text', icon: '🎓', level: 'Year 3' },
  { name: 'Year 4 Hub', type: 'text', icon: '🎓', level: 'Year 4' },
  { name: 'Sports & Recreation', type: 'text', icon: '⚽', level: '' },
  { name: 'Tech & Innovation', type: 'text', icon: '💡', level: '' },
];

async function seedChannels() {
  console.log('Starting channel seeding...');

  for (const dept of departments) {
    const deptKey = dept.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    for (const template of channelTemplates) {
      const channelNameSlug = template.name.replace(/\s+/g, '-').toLowerCase();
      const docId = `${deptKey}-${channelNameSlug}`;

      const existing = await db.collection('channels').doc(docId).get();
      if (existing.exists || existing._document) {
        console.log(`Skipping (exists): ${docId}`);
        continue;
      }

      await db.collection('channels').doc(docId).set({
        channelName: template.name,
        channelType: template.type,
        icon: template.icon,
        department: dept,
        level: template.level,
        createdBy: 'system',
        createdAt: FieldValue.serverTimestamp()
      });
      console.log(`Created: ${docId}`);
    }
  }

  console.log('Channel seeding complete!');
}

seedChannels().catch(console.error);
