/**
 * Firebase Diagnostic Script
 * Run this in the browser console to check your Firebase setup
 * 
 * Usage:
 * 1. Open your app in the browser
 * 2. Open DevTools Console (F12)
 * 3. Copy and paste this entire script
 * 4. Review the diagnostic output
 */

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('%c🔥 IPAM Connect Firebase Diagnostics', 'font-size: 20px; font-weight: bold; color: #FF6B35;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #94A3B8;');

async function runDiagnostics() {
  const results = {
    auth: '❌ Not checked',
    userProfile: '❌ Not checked',
    channels: '❌ Not checked',
    messages: '❌ Not checked',
    indexes: '❌ Not checked',
    rules: '❌ Not checked'
  };

  // ── 1. Check Authentication ────────────────────────────────────────
  console.log('\n%c1️⃣ Authentication Status', 'font-size: 16px; font-weight: bold; color: #3B82F6;');
  console.log('─────────────────────────────────────────────────────────────');
  
  const currentUser = auth.currentUser;
  if (currentUser) {
    console.log('✅ User is authenticated');
    console.log('   UID:', currentUser.uid);
    console.log('   Email:', currentUser.email);
    results.auth = '✅ Authenticated';
  } else {
    console.log('❌ No user is currently signed in');
    console.log('   → Please log in first');
    results.auth = '❌ Not signed in';
    printSummary(results);
    return;
  }

  // ── 2. Check User Profile ──────────────────────────────────────────
  console.log('\n%c2️⃣ User Profile Check', 'font-size: 16px; font-weight: bold; color: #3B82F6;');
  console.log('─────────────────────────────────────────────────────────────');
  
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ User profile found');
      console.log('   Full Name:', userData.fullName);
      console.log('   Department:', userData.department);
      console.log('   Level:', userData.level);
      console.log('   Role:', userData.role);
      results.userProfile = '✅ Profile exists';
      
      // Store for later checks
      window._diagnosticUserData = userData;
    } else {
      console.log('❌ User profile document does not exist');
      console.log('   → Path: /users/' + currentUser.uid);
      console.log('   → You may need to re-register or create the profile manually');
      results.userProfile = '❌ Profile missing';
    }
  } catch (error) {
    console.log('❌ Error reading user profile:', error.message);
    console.log('   → This usually means Firestore rules are blocking read access');
    console.log('   → Deploy firestore.rules to Firebase Console');
    results.userProfile = '❌ Read permission denied';
  }

  // ── 3. Check Channels ──────────────────────────────────────────────
  console.log('\n%c3️⃣ Channels Check', 'font-size: 16px; font-weight: bold; color: #3B82F6;');
  console.log('─────────────────────────────────────────────────────────────');
  
  if (!window._diagnosticUserData) {
    console.log('⚠️  Skipping (user profile not loaded)');
    results.channels = '⚠️ Skipped';
  } else {
    try {
      const userData = window._diagnosticUserData;
      const channelsQuery = query(
        collection(db, 'channels'),
        where('department', '==', userData.department),
        where('level', '==', userData.level)
      );
      const snapshot = await getDocs(channelsQuery);
      
      if (snapshot.empty) {
        console.log('⚠️  No channels found for your department/level');
        console.log('   Department:', userData.department);
        console.log('   Level:', userData.level);
        console.log('   → Channels will be auto-created on first login');
        results.channels = '⚠️ No channels (will auto-create)';
      } else {
        console.log('✅ Found', snapshot.size, 'channel(s)');
        snapshot.forEach(doc => {
          console.log('   •', doc.data().channelName || doc.id);
        });
        results.channels = `✅ ${snapshot.size} channel(s) found`;
      }
    } catch (error) {
      console.log('❌ Error querying channels:', error.message);
      if (error.message.includes('index')) {
        console.log('   → MISSING COMPOSITE INDEX');
        console.log('   → Run: firebase deploy --only firestore:indexes');
        console.log('   → Or click the link in this error to auto-create:');
        console.log('   ', error.message.match(/https:\/\/[^\s]+/)?.[0] || 'No link found');
        results.indexes = '❌ Missing composite index';
      }
      results.channels = '❌ Query failed';
    }
  }

  // ── 4. Check Messages ──────────────────────────────────────────────
  console.log('\n%c4️⃣ Messages Check', 'font-size: 16px; font-weight: bold; color: #3B82F6;');
  console.log('─────────────────────────────────────────────────────────────');
  
  try {
    const messagesSnapshot = await getDocs(collection(db, 'messages'));
    console.log('✅ Messages collection accessible');
    console.log('   Total messages:', messagesSnapshot.size);
    results.messages = `✅ ${messagesSnapshot.size} message(s)`;
  } catch (error) {
    console.log('❌ Error reading messages:', error.message);
    console.log('   → Check Firestore rules are deployed');
    results.messages = '❌ Read permission denied';
  }

  // ── 5. Rules Deployment Check ──────────────────────────────────────
  console.log('\n%c5️⃣ Security Rules Check', 'font-size: 16px; font-weight: bold; color: #3B82F6;');
  console.log('─────────────────────────────────────────────────────────────');
  
  if (results.userProfile.includes('denied') || results.channels.includes('failed')) {
    console.log('❌ Rules appear to be blocking access');
    console.log('   → Deploy firestore.rules to Firebase Console');
    console.log('   → Run: firebase deploy --only firestore:rules');
    results.rules = '❌ Not deployed or blocking';
  } else {
    console.log('✅ Rules appear to be working');
    results.rules = '✅ Working';
  }

  printSummary(results);
}

function printSummary(results) {
  console.log('\n%c📊 DIAGNOSTIC SUMMARY', 'font-size: 18px; font-weight: bold; color: #10B981;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #94A3B8;');
  
  Object.entries(results).forEach(([key, value]) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    console.log(`${label.padEnd(20)} ${value}`);
  });

  console.log('\n%c🔧 RECOMMENDED ACTIONS', 'font-size: 16px; font-weight: bold; color: #F59E0B;');
  console.log('─────────────────────────────────────────────────────────────');
  
  const actions = [];
  
  if (results.auth.includes('❌')) {
    actions.push('1. Sign in to your account');
  }
  
  if (results.userProfile.includes('denied') || results.rules.includes('❌')) {
    actions.push('2. Deploy Firestore rules: firebase deploy --only firestore:rules');
  }
  
  if (results.userProfile.includes('missing')) {
    actions.push('3. Re-register your account or manually create user profile in Firestore');
  }
  
  if (results.indexes.includes('❌')) {
    actions.push('4. Deploy indexes: firebase deploy --only firestore:indexes');
  }
  
  if (results.channels.includes('⚠️')) {
    actions.push('5. Channels will auto-create on next login (after rules are deployed)');
  }
  
  if (actions.length === 0) {
    console.log('✅ No critical issues detected!');
    console.log('   If you still have problems, check the browser console for errors.');
  } else {
    actions.forEach(action => console.log(action));
  }
  
  console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #94A3B8;');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('Diagnostic script failed:', error);
});
