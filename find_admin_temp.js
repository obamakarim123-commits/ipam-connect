import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findAdmins() {
  console.log('Querying Firestore for admin accounts...');
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log('No admin users found in the database.');
    } else {
      console.log(`Found ${snapshot.size} admin user(s):`);
      snapshot.forEach(doc => {
        const u = doc.data();
        console.log(`- Email: ${u.email} | Name: ${u.fullName} (UID: ${doc.id})`);
      });
    }
  } catch (err) {
    console.error('Error fetching admin users:', err);
  }
  process.exit(0);
}

findAdmins();
