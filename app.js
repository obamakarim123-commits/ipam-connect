import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let _currentUserRole = 'student';

const departments = [
  'BSc Information Technology',
  'BSc Business Administration',
  'BSc Financial Accounting',
  'BSc Public Sector Management',
  'BSc Sustainable Development'
];

const levels = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];

const dom = {
  authScreen: document.getElementById('auth-screen'),
  appScreen: document.getElementById('app-screen'),
  userRoleLabel: document.getElementById('user-role-label'),
  authTabs: document.querySelectorAll('.auth-tabs button'),
  authPanels: document.querySelectorAll('.auth-panel'),
  registerForm: document.getElementById('register-form'),
  loginForm: document.getElementById('login-form'),
  logoutButton: document.getElementById('logout-button'),
  directorySection: document.getElementById('directory'),
  chatSection: document.getElementById('chat'),
  resourcesSection: document.getElementById('resources'),
  adminSection: document.getElementById('admin'),
  adminTab: document.getElementById('admin-tab'),
  navButtons: document.querySelectorAll('.main-nav button'),
  directoryResults: document.getElementById('directory-results'),
  directoryDepartment: document.getElementById('directory-department'),
  directoryLevel: document.getElementById('directory-level'),
  directorySearch: document.getElementById('directory-search'),
  chatMessages: document.getElementById('chat-messages'),
  chatForm: document.getElementById('chat-form'),
  chatText: document.getElementById('chat-text'),
  chatAttachment: document.getElementById('chat-attachment'),
  resourceForm: document.getElementById('resource-form'),
  resourceTitle: document.getElementById('resource-title'),
  resourceCategory: document.getElementById('resource-category'),
  resourceFile: document.getElementById('resource-file'),
  resourceList: document.getElementById('resource-list'),
  adminConsole: document.getElementById('admin-console'),
  tokenForm: document.getElementById('token-form'),
  tokenDepartment: document.getElementById('token-department'),
  tokenLevel: document.getElementById('token-level'),
  refreshAdmin: document.getElementById('refresh-admin'),
  toast: document.getElementById('toast'),
  chatThreadsContainer: document.getElementById('chatThreadsContainer'),
  chatMessageStream: document.getElementById('chatMessageStream'),
  chatMessageStreamActive: document.getElementById('chatMessageStreamActive'),
  msgInputText: document.getElementById('msgInputText'),
  sendMsgAction: document.getElementById('sendMsgAction'),
  msgFileInput: document.getElementById('msgFileInput'),
  dirDeptSelect: document.getElementById('dir-dept-select'),
  dirLevelSelect: document.getElementById('dir-level-select'),
  tokenDeptCompat: document.getElementById('token-dept'),
  tokenLevelCompat: document.getElementById('token-level'),
  tokenDisplayBox: document.getElementById('tokenDisplayBox'),
  tokenTableBody: document.getElementById('tokenTableBody'),
};

function showToast(message) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.remove('hidden');
  setTimeout(() => dom.toast.classList.add('hidden'), 3200);
}

function populateSelectElements() {
  const registerDepartment = document.getElementById('register-department');
  registerDepartment.innerHTML = '<option value="" disabled selected>Select department</option>';
  departments.forEach((dept) => {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    registerDepartment.append(option);
  });

  const registerLevel = document.getElementById('register-level');
  registerLevel.innerHTML = '<option value="" disabled selected>Select level</option>';
  levels.forEach((level) => {
    const option = document.createElement('option');
    option.value = level;
    option.textContent = level;
    registerLevel.append(option);
  });

  dom.directoryDepartment.innerHTML = '<option value="">All departments</option>' +
    departments.map((dept) => `<option value="${dept}">${dept}</option>`).join('');
  dom.directoryLevel.innerHTML = '<option value="">All levels</option>' +
    levels.map((level) => `<option value="${level}">${level}</option>`).join('');

  dom.tokenDepartment.innerHTML = '<option value="" disabled selected>Select department</option>' +
    departments.map((dept) => `<option value="${dept}">${dept}</option>`).join('');
  dom.tokenLevel.innerHTML = '<option value="" disabled selected>Select level</option>' +
    levels.map((level) => `<option value="${level}">${level}</option>`).join('');

  // If redesign compatibility selects exist, mirror values
  if (dom.dirDeptSelect) {
    dom.dirDeptSelect.innerHTML = '<option value="">All</option>' + departments.map(d=>`<option value="${d}">${d}</option>`).join('');
  }
  if (dom.dirLevelSelect) {
    dom.dirLevelSelect.innerHTML = '<option value="">All</option>' + levels.map(l=>`<option value="${l}">${l}</option>`).join('');
  }
  if (dom.tokenDeptCompat) {
    dom.tokenDeptCompat.innerHTML = departments.map(d=>`<option value="${d}">${d}</option>`).join('');
  }
  if (dom.tokenLevelCompat) {
    dom.tokenLevelCompat.innerHTML = levels.map(l=>`<option value="${l}">${l}</option>`).join('');
  }
}

function toggleAuthTab(event) {
  const target = event.currentTarget.dataset.target;
  dom.authTabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.target === target);
  });
  dom.authPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === target);
  });
}

function switchView(viewId) {
  dom.navButtons.forEach((button) => {
    const target = button.dataset.view;
    button.classList.toggle('active', target === viewId);
    const panel = document.getElementById(target);
    if (panel) panel.classList.toggle('active', target === viewId);
  });
}

async function createUserProfile(user, profileData, tokenCode) {
  const role = tokenCode ? 'class_rep' : 'student';
  const userDoc = {
    uid: user.uid,
    fullName: profileData.fullName,
    email: profileData.email,
    studentId: profileData.studentId,
    department: profileData.department,
    level: profileData.level,
    role,
    createdAt: serverTimestamp()
  };

  await setDoc(doc(db, 'users', user.uid), userDoc);

  if (tokenCode) {
    const tokenDoc = doc(db, 'tokens', tokenCode);
    const tokenSnapshot = await getDoc(tokenDoc);
    if (tokenSnapshot.exists()) {
      const tokenData = tokenSnapshot.data();
      if (tokenData.isConsumed) {
        throw new Error('This token has already been used.');
      }
      if (tokenData.assignedDepartment && tokenData.assignedDepartment !== profileData.department) {
        throw new Error(`This token is for ${tokenData.assignedDepartment}, not ${profileData.department}.`);
      }
      if (tokenData.assignedLevel && tokenData.assignedLevel !== profileData.level) {
        throw new Error(`This token is for ${tokenData.assignedLevel}, not ${profileData.level}.`);
      }
      await updateDoc(tokenDoc, {
        isConsumed: true,
        consumedBy: user.uid,
        invalidatedAt: serverTimestamp()
      });
    }
  }
}

async function registerHandler(event) {
  event.preventDefault();
  const fullName = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const studentId = document.getElementById('register-student-id').value.trim();
  const department = document.getElementById('register-department').value;
  const level = document.getElementById('register-level').value;
  const tokenCode = document.getElementById('register-token').value.trim();

  if (!fullName || !email || !password || !studentId || !department || !level) {
    showToast('Fill all required registration fields.');
    return;
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile(credential.user, { fullName, email, studentId, department, level }, tokenCode);
    showToast('Account created successfully. Redirecting...');
    dom.registerForm.reset();
  } catch (error) {
    showToast(error.message || 'Registration failed.');
  }
}

async function loginHandler(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    showToast(error.message || 'Login failed.');
  }
}

async function logoutHandler() {
  await signOut(auth);
  dom.appScreen.classList.add('hidden');
  dom.authScreen.classList.remove('hidden');
}

async function loadDirectory() {
  dom.directoryResults.innerHTML = '<p>Loading directory...</p>';
  try {
    const deptValue = dom.directoryDepartment.value;
    const levelValue = dom.directoryLevel.value;
    let q = collection(db, 'users');

    if (deptValue) {
      q = query(q, where('department', '==', deptValue));
    }
    if (levelValue) {
      q = query(q, where('level', '==', levelValue));
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      dom.directoryResults.innerHTML = '<p>No students found for the selected filters.</p>';
      return;
    }

    dom.directoryResults.innerHTML = snapshot.docs.map((docSnapshot) => {
      const user = docSnapshot.data();
      return `
        <div class="card">
          <h3>${user.fullName}</h3>
          <p><strong>${user.department}</strong> · ${user.level}</p>
          <p>Role: ${user.role || 'student'}</p>
          <p>${user.email}</p>
        </div>
      `;
    }).join('');
  } catch (error) {
    dom.directoryResults.innerHTML = '<p>Failed to load directory.</p>';
  }
}

let _cachedResources = [];

async function loadResources() {
  dom.resourceList.innerHTML = '<p>Loading shared materials...</p>';
  const staticAboutCard = `
    <div class="card" style="border: 2px solid var(--primary); background: var(--primary-light);">
      <span class="badge" style="background: var(--primary); color: #ffffff; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block; margin-bottom: 8px;">Official Doc</span>
      <h3>About IPAM Connect</h3>
      <p>Category: project_info</p>
      <p>Uploaded by: Platform Administrator</p>
      <p style="font-size: 0.85rem; color: var(--muted); margin-top: 4px;">Learn about features, architecture, and guides for IPAM Connect.</p>
      <a href="ipam_connect_about.txt" download="about_ipam_connect.txt" class="btn btn-primary" style="margin-top: 10px; font-size: 0.85rem; display: inline-flex;">Download Doc</a>
    </div>
  `;
  try {
    const snapshot = await getDocs(query(collection(db, 'resources'), orderBy('createdAt', 'desc')));
    _cachedResources = snapshot.docs.map((docSnapshot) => {
      return { id: docSnapshot.id, ...docSnapshot.data() };
    });
    dom.resourceList.innerHTML = staticAboutCard + renderResourcesHtml(_cachedResources);
  } catch (error) {
    dom.resourceList.innerHTML = staticAboutCard + '<p style="padding: 12px 0; color: var(--danger);">Error loading other resources.</p>';
  }
}

function renderResourcesHtml(items) {
  if (!items.length) return '<p style="padding: 12px 0; color: var(--muted);">No resources match your search.</p>';
  return items.map((item) => {
    const sizeLabel = item.fileSize ? ` (${(item.fileSize / 1024 / 1024).toFixed(1)}MB)` : '';
    const currentRole = _currentUserRole || 'student';
    const canDelete = currentRole === 'class_rep' || currentRole === 'admin';
    const deleteBtn = canDelete
      ? `<button class="resource-delete-btn" data-resource-id="${item.id}" style="margin-top:8px; padding:4px 10px; font-size:0.75rem; font-weight:600; color:#ef4444; background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.2); border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="Delete this resource">🗑️ Delete</button>`
      : '';
    return `
      <div class="card" data-resource-id="${item.id}">
        <h3>${item.title}</h3>
        <p>Category: ${item.category}</p>
        <p>Uploaded by: ${item.ownerName || 'Unknown'}${sizeLabel}</p>
        <a href="${item.fileUrl}" target="_blank" rel="noopener noreferrer">Download</a>
        ${deleteBtn}
      </div>
    `;
  }).join('');
}

function filterResources() {
  const query = (document.getElementById('resource-search')?.value || '').toLowerCase().trim();
  if (!query) {
    const staticAboutCard = document.querySelector('#resource-list .card:first-child');
    dom.resourceList.innerHTML = (staticAboutCard ? staticAboutCard.outerHTML : '') + renderResourcesHtml(_cachedResources);
    return;
  }
  const filtered = _cachedResources.filter((item) => {
    return (item.title && item.title.toLowerCase().includes(query)) ||
           (item.category && item.category.toLowerCase().includes(query)) ||
           (item.ownerName && item.ownerName.toLowerCase().includes(query));
  });
  dom.resourceList.innerHTML = renderResourcesHtml(filtered);
}

// State and Data for local demo chat channels
let currentChannel = 'general';

const localChats = {
  bot: [
    { sender: 'Study AI Bot', text: 'Hello! I am your Study AI assistant. Ask me anything about study schedules, code compilation, or academic tips!', timestamp: new Date() }
  ],
  'it-group': [
    { sender: 'Fatmata Kamara', text: 'Hey guys, did anyone check out the notes uploaded in the resources tab?', timestamp: new Date(Date.now() - 3600000) },
    { sender: 'Alimamy Sesay', text: 'Yeah, they are really helpful. Let\'s coordinate a group study session tonight in the library.', timestamp: new Date(Date.now() - 1800000) }
  ],
  support: [
    { sender: 'IPAM Support Desk', text: 'Welcome to the Support Desk. Ask any question about verification, Representative tokens, or user roles here.', timestamp: new Date() }
  ]
};

function renderChannelContent() {
  const activeHeader = document.getElementById('active-chat-header');
  if (!activeHeader) return;

  if (currentChannel === 'general') {
    activeHeader.innerHTML = `
      <div class="active-user-meta">
        <div class="active-avatar">🏫</div>
        <div>
          <h3>General Channel</h3>
          <p class="subtitle">Live Firestore-powered conversation</p>
        </div>
      </div>
    `;
    if (dom.chatMessageStreamActive) {
      dom.chatMessageStreamActive.innerHTML = `<div class="messages-wrap">${dom.chatMessages.innerHTML || '<p class="chat-placeholder-graphic">No messages in General Channel yet.</p>'}</div>`;
    }
    if (dom.chatMessageStream) {
      dom.chatMessageStream.innerHTML = `<div class="messages-wrap">${dom.chatMessages.innerHTML}</div>`;
    }
  } else if (currentChannel === 'bot') {
    activeHeader.innerHTML = `
      <div class="active-user-meta">
        <div class="active-avatar">🤖</div>
        <div>
          <h3>Study AI Bot</h3>
          <p class="subtitle">Active AI Assistant</p>
        </div>
      </div>
    `;
    renderLocalMessages('bot');
  } else if (currentChannel === 'it-group') {
    activeHeader.innerHTML = `
      <div class="active-user-meta">
        <div class="active-avatar">💻</div>
        <div>
          <h3>BSc IT Year 2 Group</h3>
          <p class="subtitle">Mock Student Discussion Stream</p>
        </div>
      </div>
    `;
    renderLocalMessages('it-group');
  } else if (currentChannel === 'support') {
    activeHeader.innerHTML = `
      <div class="active-user-meta">
        <div class="active-avatar">🛠️</div>
        <div>
          <h3>Support Desk</h3>
          <p class="subtitle">IPAM Administrative Support</p>
        </div>
      </div>
    `;
    renderLocalMessages('support');
  }
}

function renderLocalMessages(channelKey) {
  const msgs = localChats[channelKey] || [];
  const html = msgs.map(m => {
    const time = m.timestamp.toLocaleTimeString();
    return `
      <div class="message-item">
        <strong>${m.sender}</strong>
        <p>${m.text}</p>
        <small>${time}</small>
      </div>
    `;
  }).join('');
  
  if (dom.chatMessageStreamActive) {
    dom.chatMessageStreamActive.innerHTML = `<div class="messages-wrap">${html}</div>`;
  }
  if (dom.chatMessageStream) {
    dom.chatMessageStream.innerHTML = `<div class="messages-wrap">${html}</div>`;
  }
}

async function sendMessageHandler(event) {
  event.preventDefault();
  const text = dom.chatText.value.trim();
  const attachment = dom.chatAttachment.files[0];
  if (!text && !attachment) {
    showToast('Add a message or attachment.');
    return;
  }

  // Handle local channel messages
  if (currentChannel !== 'general') {
    let name = 'You';
    try {
      const userSnapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userSnapshot.exists()) {
        name = userSnapshot.data().fullName || 'You';
      }
    } catch(e) { console.error('[sendMessageHandler] getDoc failed:', e); }

    localChats[currentChannel].push({
      sender: name,
      text: text,
      timestamp: new Date()
    });

    dom.chatText.value = '';
    if (dom.msgInputText) dom.msgInputText.value = '';
    renderLocalMessages(currentChannel);

    // Automated response simulation
    setTimeout(() => {
      let replyText = '';
      let replySender = '';

      if (currentChannel === 'bot') {
        replySender = 'Study AI Bot';
        const lower = text.toLowerCase();
        if (lower.includes('help')) {
          replyText = 'I can assist you with academic queries, project planning, and formatting resources. Let me know what you are studying!';
        } else if (lower.includes('exam') || lower.includes('test') || lower.includes('study')) {
          replyText = 'Exams require good planning! Split your modules into active recall sessions. Have you checked the Resources page?';
        } else if (lower.includes('about') || lower.includes('project')) {
          replyText = 'This project is IPAM Connect, built using Firebase & Vanilla JS. The official documentation can be downloaded from the Resources panel.';
        } else {
          replyText = 'Interesting! As a student at IPAM, you can check files uploaded in the Academic Repository or collaborate with classmates in the BSc IT Group.';
        }
      } else if (currentChannel === 'it-group') {
        replySender = Math.random() > 0.5 ? 'Fatmata Kamara' : 'Alimamy Sesay';
        const replies = [
          'Cool, let\'s catch up in class.',
          'Wait, does anyone have the lecture slides for Cyber Security?',
          'I\'ll upload the worksheet to the resources channel right away.',
          'Let\'s sit together at the computer lab today to finish the database project.'
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      } else if (currentChannel === 'support') {
        replySender = 'Support Agent';
        replyText = 'Thank you. The issue has been registered. If you are an Administrator, you can open the stand-alone Web Console (admin.html) to modify user data directly.';
      }

      localChats[currentChannel].push({
        sender: replySender,
        text: replyText,
        timestamp: new Date()
      });

      renderLocalMessages(currentChannel);
      showToast(`New message from ${replySender}`);
    }, 1200);

    return;
  }

  // Handle Firestore general channel messages
  try {
    let attachmentUrl = '';
    let attachmentType = '';

    if (attachment) {
      const storageRef = ref(storage, `chat-attachments/${Date.now()}-${attachment.name}`);
      attachmentUrl = await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, attachment);
        task.on('state_changed', null, reject, async () => {
          try { resolve(await getDownloadURL(task.ref)); } catch (e) { reject(e); }
        });
      });
      attachmentType = attachment.type;
    }

    const senderSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const senderData = senderSnap.exists() ? senderSnap.data() : {};
    await addDoc(collection(db, 'messages'), {
      channelId: 'general',
      senderId: auth.currentUser.uid,
      senderName: senderData.fullName || 'Unknown',
      text: text || 'Sent an attachment',
      attachmentUrl,
      attachmentType,
      isDeleted: false,
      timestamp: serverTimestamp()
    });
    dom.chatText.value = '';
    if (dom.msgInputText) dom.msgInputText.value = '';
    dom.chatAttachment.value = '';
  } catch (error) {
    showToast('Unable to send message.');
  }
}

async function uploadResourceHandler(event) {
  event.preventDefault();
  const title = dom.resourceTitle.value.trim();
  const category = dom.resourceCategory.value;
  const file = dom.resourceFile.files[0];

  if (!title || !category || !file) {
    showToast('Complete all resource fields first.');
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    showToast('File exceeds the 50MB upload limit.');
    return;
  }
  if (file.size > 40 * 1024 * 1024) {
    const proceed = confirm(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB — close to the 50MB limit. Large files may fail or take long. Upload anyway?`);
    if (!proceed) return;
  }

  try {
    const storageRef = ref(storage, `resources/${Date.now()}-${file.name}`);
    const downloadUrl = await new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file);
      task.on('state_changed', null, reject, async () => {
        try { resolve(await getDownloadURL(task.ref)); } catch (e) { reject(e); }
      });
    });
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};

    await addDoc(collection(db, 'resources'), {
      title,
      category,
      fileUrl: downloadUrl,
      fileName: file.name,
      fileSize: file.size,
      ownerId: auth.currentUser.uid,
      ownerName: userData.fullName || 'Anonymous',
      createdAt: serverTimestamp()
    });

    showToast('Resource uploaded successfully.');
    dom.resourceForm.reset();
    loadResources();
  } catch (error) {
    console.error('[UploadResource]', error);
    showToast('Upload failed: ' + (error.message || 'unknown error'));
  }
}

async function createTokenHandler(event) {
  event.preventDefault();
  const department = dom.tokenDepartment.value;
  const level = dom.tokenLevel.value;

  if (!department || !level) {
    showToast('Select both department and level.');
    return;
  }

  const tokenId = `TKN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  try {
    await setDoc(doc(db, 'tokens', tokenId), {
      tokenId,
      isConsumed: false,
      assignedDepartment: department,
      assignedLevel: level,
      consumedBy: null,
      invalidatedAt: null
    });
    showToast(`Created token ${tokenId}`);
    dom.tokenForm.reset();
    loadAdminConsole();
  } catch (error) {
    showToast('Failed to create token.');
  }
}

function subscribeToMessages() {
  const messagesQuery = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
  onSnapshot(messagesQuery, (snapshot) => {
    dom.chatMessages.innerHTML = snapshot.docs.map((docSnapshot) => {
      const message = docSnapshot.data();
      // Guard: transient null timestamp during optimistic local write
      const time = (message.timestamp && message.timestamp.seconds != null)
        ? new Date(message.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '…';
      const attachmentLink = message.attachmentUrl
        ? `<a href="${message.attachmentUrl}" target="_blank" rel="noopener noreferrer">📎 Download attachment</a>`
        : '';
      if (message.isDeleted) {
        return `
          <div class="message-item deleted">
            <small>${message.senderName || 'Unknown'} · ${time}</small>
            <em style="font-style:italic;color:#94a3b8;">🚫 This message was deleted by a moderator.</em>
          </div>
        `;
      }
      return `
        <div class="message-item">
          <strong style="font-size:0.82rem;">${message.senderName || 'Unknown'}</strong>
          <p>${message.text}</p>
          ${attachmentLink}
          <small>${time}</small>
        </div>
      `;
    }).join('');
    
    // Only update workspace feeds if active channel is general
    if (currentChannel === 'general') {
      if (dom.chatMessageStreamActive) {
        dom.chatMessageStreamActive.innerHTML = `<div class="messages-wrap">${dom.chatMessages.innerHTML}</div>`;
      }
      if (dom.chatMessageStream) {
        dom.chatMessageStream.innerHTML = `<div class="messages-wrap">${dom.chatMessages.innerHTML}</div>`;
      }
    }
  }, (error) => {
    console.error('[subscribeToMessages] onSnapshot error:', error);
  });
}

// Mirror inputs and wire new send button to existing handler
if (dom.msgInputText) {
  dom.msgInputText.addEventListener('input', () => {
    const val = dom.msgInputText.value;
    const chatEl = document.getElementById('chat-text');
    if (chatEl) chatEl.value = val;
  });
}

if (dom.sendMsgAction) {
  dom.sendMsgAction.addEventListener('click', (e) => {
    // ensure chat-text contains msgInputText value
    const msgIn = document.getElementById('chat-text');
    if (dom.msgInputText && msgIn) msgIn.value = dom.msgInputText.value || msgIn.value;
    // submit via existing handler
    const evt = new Event('submit', { bubbles: true, cancelable: true });
    const form = document.getElementById('chat-form');
    if (form) form.dispatchEvent(evt);
  });
}

if (dom.msgFileInput) {
  dom.msgFileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    const chatAttach = document.getElementById('chat-attachment');
    if (chatAttach && files && files.length) {
      // copy files into the hidden chat attachment using DataTransfer
      const data = new DataTransfer();
      for (const f of files) data.items.add(f);
      chatAttach.files = data.files;
    }
  });
}

// Mirror redesign directory selects to existing filters
if (dom.dirDeptSelect) {
  dom.dirDeptSelect.addEventListener('change', () => {
    if (dom.directoryDepartment) dom.directoryDepartment.value = dom.dirDeptSelect.value;
    loadDirectory();
  });
}
if (dom.dirLevelSelect) {
  dom.dirLevelSelect.addEventListener('change', () => {
    if (dom.directoryLevel) dom.directoryLevel.value = dom.dirLevelSelect.value;
    loadDirectory();
  });
}

// Compatibility token generator for redesign: exposes global function
window.generateOneTimeToken = async function() {
  const dept = document.getElementById('token-dept')?.value || dom.tokenDepartment?.value;
  const level = document.getElementById('token-level')?.value || dom.tokenLevel?.value;
  if (!dept || !level) {
    showToast('Select both department and level.');
    return;
  }
  const tokenId = `TKN-${Math.random().toString(36).slice(2,10).toUpperCase()}`;
  try {
    await setDoc(doc(db, 'tokens', tokenId), {
      tokenId,
      isConsumed: false,
      assignedDepartment: dept,
      assignedLevel: level,
      consumedBy: null,
      invalidatedAt: null
    });
    const display = document.getElementById('tokenDisplayBox');
    if (display) display.value = tokenId;
    // append to token table body if present
    const table = document.getElementById('tokenTableBody');
    if (table) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="padding:6px 8px; border-bottom:1px solid #E2E8F0;">${tokenId}</td><td style="padding:6px 8px; border-bottom:1px solid #E2E8F0;">${dept}</td><td style="padding:6px 8px; border-bottom:1px solid #E2E8F0;">${level}</td>`;
      table.prepend(tr);
    }
    showToast(`Created token ${tokenId}`);
  } catch (err) {
    showToast('Failed to create token.');
  }
};

// Ensure admin console load populates compatibility token table (new Tailwind layout)
async function _patchedLoadAdminConsole() {
  await loadAdminConsole();
  try {
    const tokensSnapshot = await getDocs(collection(db, 'tokens'));
    const table = document.getElementById('tokenTableBody');
    if (table) {
      table.innerHTML = tokensSnapshot.docs.map(docSnapshot => {
        const t = docSnapshot.data();
        const statusClass = t.isConsumed ? 'color:#10b981;font-weight:600;' : 'color:#f59e0b;font-weight:600;';
        const statusText  = t.isConsumed ? '✓ Consumed' : '○ Available';
        return `
          <tr class="hover:bg-slate-50">
            <td class="px-4 py-3 font-mono text-xs text-pro-blue-600 font-bold">${docSnapshot.id}</td>
            <td class="px-4 py-3 text-sm text-slate-600">${t.assignedDepartment||'—'}</td>
            <td class="px-4 py-3 text-sm text-slate-600">${t.assignedLevel||'—'}</td>
            <td class="px-4 py-3 text-xs" style="${statusClass}">${statusText}</td>
          </tr>
        `;
      }).join('');
    }
    } catch (e) {
      console.error('[AdminDashboard] token table load failed:', e);
    }
}
// Replace the reference used by event listeners
const _origLoadAdminConsole = loadAdminConsole;
loadAdminConsole = _patchedLoadAdminConsole;

async function renderUserEnvironment(user) {
  try {
    const userSnapshot = await getDoc(doc(db, 'users', user.uid));
    const userData = userSnapshot.exists() ? userSnapshot.data() : null;
    _currentUserRole = userData?.role || 'student';
    dom.userRoleLabel.textContent = userData ? `${userData.fullName} • ${_currentUserRole}` : 'Loading profile...';

    // ── New Discord-layout bridges ───────────────────────────────
    if (typeof window.updateNavFooter === 'function' && userData) {
      window.updateNavFooter(userData);
    }

    // Sync user to chatEngine (avoids dual-onAuthStateChanged race)
    if (window._chatEngine?.setCurrentUser && userData) {
      window._chatEngine.setCurrentUser({ uid: user.uid, ...userData });
    }

    if (userData?.role === 'admin') {
      dom.adminTab.classList.remove('hidden');
      dom.adminSection.classList.remove('hidden');
      // Also reveal the admin rail icon in new layout
      const adminRailBtn = document.getElementById('admin-tab');
      if (adminRailBtn) adminRailBtn.classList.remove('hidden');
      loadAdminConsole();
      subscribeAdminModeration();
    } else {
      dom.adminTab.classList.add('hidden');
      dom.adminSection.classList.add('hidden');
    }
    loadDirectory();
    loadResources();
    initDynamicChannels(userData);
    ensureStandardChannels(userData);

    // Populate the members pane with directory snapshot
    try {
      const dirSnap = await getDocs(collection(db, 'users'));
      const allUsers = dirSnap.docs.map(d => d.data());
      if (typeof window.updateMembersPane === 'function') {
        window.updateMembersPane(allUsers);
      }
    } catch (_) { console.error('[renderUserEnvironment] members pane failed:', _); }

  } catch (error) {
    console.error('[renderUserEnvironment] profile load failed:', error);
    showToast('Unable to load user profile.');
  }
}

// ── Push Notifications (FCM) ───────────────────────────────────
async function setupPushNotifications(user) {
  try {
    // Dynamically import messaging SDK
    const { getMessaging, getToken, onMessage } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging.js');
    const messaging = getMessaging(app);

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Get FCM token (add your VAPID key from Firebase Console > Cloud Messaging)
    const currentToken = await getToken(messaging);

    if (currentToken) {
      // Store token in user document
      await updateDoc(doc(db, 'users', user.uid), {
        fcmToken: currentToken,
        fcmTokenUpdatedAt: serverTimestamp()
      });
    }

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      if (payload.notification) {
        showToast(`${payload.notification.title}: ${payload.notification.body}`);
      }
    });
  } catch (e) {
    // FCM setup failed — non-critical
  }
}

// ── Presence Tracking ──────────────────────────────────────────
let _presenceUnsub = null;

async function setupPresence(user) {
  // Set online status
  const presenceRef = doc(db, 'presence', user.uid);
  await setDoc(presenceRef, { status: 'online', lastSeen: serverTimestamp(), displayName: '' });

  // Set offline on tab close
  const handleUnload = () => {
    setDoc(presenceRef, { status: 'offline', lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});
  };
  window.addEventListener('beforeunload', handleUnload);

  // Get display name for presence
  const userSnap = await getDoc(doc(db, 'users', user.uid));
  if (userSnap.exists()) {
    await setDoc(presenceRef, {
      displayName: userSnap.data().fullName || ''
    }, { merge: true });
  }

  // Subscribe to presence changes to update members pane
  if (_presenceUnsub) _presenceUnsub();
  _presenceUnsub = onSnapshot(collection(db, 'presence'), (snapshot) => {
    const onlineUsers = snapshot.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => u.status === 'online');
    const memberList = document.getElementById('members-list');
    if (memberList) {
      memberList.innerHTML = onlineUsers.map(u => {
        const avatarHtml = (u.displayName || '?').charAt(0).toUpperCase();
        return `
          <div class="member-item">
            <div class="member-avatar">
              ${avatarHtml}
              <span class="member-status-dot online"></span>
            </div>
            <div class="member-info">
              <div class="member-name">${u.displayName || 'Unknown'}</div>
              <div class="member-role">🟢 Online</div>
            </div>
          </div>
        `;
      }).join('') || '<div class="p-4 text-sm text-slate-400 text-center">No users online</div>';
    }
  }, (error) => {
    console.error('[Presence] onSnapshot error:', error);
  });
}

async function loadAdminConsole() {
  dom.adminConsole.innerHTML = '<p>Loading admin data...</p>';
  try {
    const tokensSnapshot = await getDocs(collection(db, 'tokens'));
    dom.adminConsole.innerHTML = tokensSnapshot.docs.map((docSnapshot) => {
      const token = docSnapshot.data();
      return `
        <div class="card">
          <h3>Token ${docSnapshot.id}</h3>
          <p>Department: ${token.assignedDepartment || 'N/A'}</p>
          <p>Level: ${token.assignedLevel || 'N/A'}</p>
          <p>Status: ${token.isConsumed ? 'Consumed' : 'Available'}</p>
        </div>
      `;
    }).join('');
  } catch (error) {
    dom.adminConsole.innerHTML = '<p>Unable to load admin data.</p>';
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    dom.authScreen.classList.add('hidden');
    dom.appScreen.classList.remove('hidden');
    await renderUserEnvironment(user);
    subscribeToMessages();
    renderChannelContent();
    setupPresence(user);
    setupPushNotifications(user);
  } else {
    dom.appScreen.classList.add('hidden');
    dom.authScreen.classList.remove('hidden');
    if (_presenceUnsub) _presenceUnsub();
    if (window._chatEngine?.clearCurrentUser) window._chatEngine.clearCurrentUser();
  }
});

dom.authTabs.forEach((button) => button.addEventListener('click', toggleAuthTab));
dom.registerForm.addEventListener('submit', registerHandler);
dom.loginForm.addEventListener('submit', loginHandler);
if (dom.logoutButton) dom.logoutButton.addEventListener('click', logoutHandler);
dom.directorySearch.addEventListener('click', loadDirectory);
if (dom.chatForm) dom.chatForm.addEventListener('submit', sendMessageHandler);
dom.resourceForm.addEventListener('submit', uploadResourceHandler);
const resourceSearchInput = document.getElementById('resource-search');
if (resourceSearchInput) {
  resourceSearchInput.addEventListener('input', filterResources);
}
dom.tokenForm.addEventListener('submit', createTokenHandler);
dom.refreshAdmin.addEventListener('click', loadAdminConsole);
dom.navButtons.forEach((button) => {
  button.addEventListener('click', () => switchView(button.dataset.view));
});

// Event delegation for thread selection in chat view
if (dom.chatThreadsContainer) {
  dom.chatThreadsContainer.addEventListener('click', (e) => {
    const item = e.target.closest('.thread-item');
    if (!item) return;
    
    dom.chatThreadsContainer.querySelectorAll('.thread-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    
    currentChannel = item.dataset.channel || 'general';
    renderChannelContent();
  });
}

// Dynamic channel initialization based on user department/level
async function initDynamicChannels(userData) {
  if (!userData || !userData.department) return;
  const channelListContainer = document.getElementById('channel-list-container');
  if (!channelListContainer) return;

  // Define standard channels for this department/level
  const standardChannels = [
    { id: 'general', name: 'General Chat', type: 'text', icon: '#' },
    { id: 'announcements', name: 'Announcements', type: 'text', icon: '📣' },
    { id: 'resource-sharing', name: 'Resource Sharing', type: 'forum', icon: '📂' },
    { id: 'study-groups', name: 'Study Groups', type: 'text', icon: '#' },
  ];

  // Add department-specific channel
  const deptKey = userData.department.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const deptChannelId = `dept-${deptKey}`;
  const deptChannel = { id: deptChannelId, name: `${userData.department}`, type: 'text', icon: '🏛️' };

  // Add level-specific channel
  const levelKey = userData.level.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const levelChannelId = `level-${levelKey}`;
  const levelChannel = { id: levelChannelId, name: `${userData.level} Hub`, type: 'text', icon: '🎓' };

  const allChannels = [...standardChannels, deptChannel, levelChannel];

  // Fetch channels from Firestore (seeded + class rep created)
  try {
    // Level-specific channels
    const levelQuery = query(
      collection(db, 'channels'),
      where('department', '==', userData.department),
      where('level', '==', userData.level)
    );
    const levelSnap = await getDocs(levelQuery);
    // Dept-wide channels (level is empty)
    const deptQuery = query(
      collection(db, 'channels'),
      where('department', '==', userData.department),
      where('level', '==', '')
    );
    const deptSnap = await getDocs(deptQuery);
    const snapshots = [levelSnap, deptSnap];
    for (const snapshot of snapshots) {
      snapshot.forEach(docSnapshot => {
        const ch = docSnapshot.data();
        allChannels.push({
          id: docSnapshot.id,
          name: ch.channelName || docSnapshot.id,
          type: ch.channelType || 'text',
          icon: ch.icon || '#',
        });
      });
    }
  } catch (e) {
    console.error('[initDynamicChannels] channels query failed:', e);
  }

  // Rebuild the channel list HTML
  let html = `<div class="nav-section-label">📢 Text Channels</div>`;
  allChannels.forEach(ch => {
    const isActive = ch.id === 'general' ? 'active' : '';
    html += `
      <button class="channel-item ${isActive}" data-channel-id="${ch.id}" onclick="selectChannel(this, '${ch.id}', '${ch.name.replace(/'/g, "\\'")}', '${ch.type}')">
        <span class="ch-hash">${ch.icon}</span>
        ${ch.name.toLowerCase().replace(/\s+/g, '-')}
      </button>
    `;
  });

  channelListContainer.innerHTML = html;
}

// Auto-create standard channels in Firestore for a department/level (called on first visit)
async function ensureStandardChannels(userData) {
  if (!userData || !userData.department) return;
  try {
    const q = query(
      collection(db, 'channels'),
      where('department', '==', userData.department)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      // Create standard department channels (level-specific)
      const stdChannels = [
        { channelName: 'General', channelType: 'text', icon: '#' },
        { channelName: 'Announcements', channelType: 'text', icon: '📣' },
        { channelName: 'Resource Sharing', channelType: 'forum', icon: '📂' },
        { channelName: 'Study Groups', channelType: 'text', icon: '#' },
      ];
      for (const ch of stdChannels) {
        const chId = `${userData.department.replace(/[^a-zA-Z0-9]/g,'-')}-${ch.channelName.replace(/\s+/g,'-').toLowerCase()}-${userData.level.replace(/\s+/g,'-').toLowerCase()}`;
        const existingDoc = await getDoc(doc(db, 'channels', chId));
        if (!existingDoc.exists()) {
          await setDoc(doc(db, 'channels', chId), {
            channelName: ch.channelName,
            channelType: ch.channelType,
            icon: ch.icon,
            department: userData.department,
            level: userData.level,
            createdBy: 'system',
            createdAt: serverTimestamp()
          });
        }
      }
    }
  } catch (e) {
    console.error('[ensureStandardChannels] failed:', e);
  }
}

// Admin moderation dashboard (real-time)
let _adminModUnsub = null;
function subscribeAdminModeration() {
  const msgContainer = document.getElementById('admin-mod-messages');
  const resContainer = document.getElementById('admin-mod-resources');
  if (!msgContainer && !resContainer) return;

  // Unsubscribe previous listener
  if (typeof _adminModUnsub === 'function') _adminModUnsub();

  // Subscribe to all messages (moderation view)
  _adminModUnsub = onSnapshot(
    query(collection(db, 'messages'), orderBy('timestamp', 'desc')),
    (snapshot) => {
      if (!msgContainer) return;
      const docs = snapshot.docs.slice(0, 50);
      msgContainer.innerHTML = docs.map(docSnapshot => {
        const m = docSnapshot.data();
        const docId = docSnapshot.id;
        const time = m.timestamp && m.timestamp.seconds != null
          ? new Date(m.timestamp.seconds * 1000).toLocaleString()
          : '...';
        const statusLabel = m.isDeleted
          ? '<span style="color:#ef4444;font-weight:600;">Deleted</span>'
          : '<span style="color:#10b981;font-weight:600;">Active</span>';
        const actions = m.isDeleted ? '' : `
          <button class="admin-mod-softdel" data-id="${docId}" style="padding:2px 8px;font-size:0.7rem;border-radius:4px;border:1px solid #f59e0b;background:rgba(245,158,11,0.06);color:#92400e;cursor:pointer;font-weight:600;">Soft Delete</button>
        `;
        const hardDel = `
          <button class="admin-mod-harddel" data-id="${docId}" style="padding:2px 8px;font-size:0.7rem;border-radius:4px;border:1px solid #ef4444;background:rgba(239,68,68,0.06);color:#dc2626;cursor:pointer;font-weight:600;">🗑️</button>
        `;
        return `
          <div style="padding:8px 12px;display:flex;align-items:center;gap:8px;">
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem;" title="${m.text || '(attachment)'}">
              <strong>${m.senderName || m.senderId?.slice(0,8) || 'System'}:</strong> ${m.text || '(attachment)'}
            </span>
            <span style="font-size:0.7rem;color:#94a3b8;flex-shrink:0;">${time}</span>
            <span style="flex-shrink:0;">${statusLabel}</span>
            <span style="flex-shrink:0;display:flex;gap:4px;">${actions}${hardDel}</span>
          </div>
        `;
      }).join('') || '<p class="p-4 text-slate-400 text-center">No messages yet.</p>';
    }
  );

  // Subscribe to resources
  onSnapshot(
    query(collection(db, 'resources'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      if (!resContainer) return;
      const docs = snapshot.docs.slice(0, 50);
      resContainer.innerHTML = docs.map(docSnapshot => {
        const r = docSnapshot.data();
        const docId = docSnapshot.id;
        return `
          <div style="padding:8px 12px;display:flex;align-items:center;gap:8px;">
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem;">
              <strong>${r.title}</strong> <span style="color:#94a3b8;">(${r.category})</span> — ${r.ownerName || 'Unknown'}
            </span>
            <button class="admin-mod-resdel" data-id="${docId}" style="padding:2px 8px;font-size:0.7rem;border-radius:4px;border:1px solid #ef4444;background:rgba(239,68,68,0.06);color:#dc2626;cursor:pointer;font-weight:600;flex-shrink:0;">🗑️</button>
          </div>
        `;
      }).join('') || '<p class="p-4 text-slate-400 text-center">No resources yet.</p>';
    }
  );
}

// Event delegation for admin moderation
document.addEventListener('click', async (e) => {
  const softDelBtn = e.target.closest('.admin-mod-softdel');
  if (softDelBtn) {
    const id = softDelBtn.dataset.id;
    try {
      await updateDoc(doc(db, 'messages', id), { isDeleted: true });
      showToast('Message soft-deleted.');
    } catch (err) { showToast('Soft delete failed.'); }
    return;
  }
  const hardDelBtn = e.target.closest('.admin-mod-harddel');
  if (hardDelBtn) {
    const id = hardDelBtn.dataset.id;
    if (!confirm('Permanently delete this message from Firestore?')) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
      showToast('Message permanently deleted.');
    } catch (err) { showToast('Delete failed.'); }
    return;
  }
  const resDelBtn = e.target.closest('.admin-mod-resdel');
  if (resDelBtn) {
    const id = resDelBtn.dataset.id;
    if (!confirm('Permanently delete this resource?')) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
      showToast('Resource deleted.');
    } catch (err) { showToast('Delete failed.'); }
  }
});

// Listen for channel refresh events (from class rep channel creation)
window.addEventListener('refresh-channels', (e) => {
  const userData = e.detail;
  if (userData) initDynamicChannels(userData);
});

// Event delegation for resource delete buttons
document.addEventListener('click', async (e) => {
  const deleteBtn = e.target.closest('.resource-delete-btn');
  if (!deleteBtn) return;
  const resourceId = deleteBtn.dataset.resourceId;
  if (!resourceId) return;
  if (!confirm('Permanently delete this resource for all users?')) return;
  try {
    await deleteDoc(doc(db, 'resources', resourceId));
    showToast('Resource deleted.');
    loadResources();
  } catch (err) {
    showToast('Failed to delete resource.');
  }
});

// Initialize dropdowns with error handling
function initDropdowns() {
  console.log('[initDropdowns] Running...');
  const deptEl = document.getElementById('register-department');
  const levelEl = document.getElementById('register-level');
  console.log('[initDropdowns] Department element:', deptEl);
  console.log('[initDropdowns] Level element:', levelEl);
  try {
    populateSelectElements();
    console.log('[initDropdowns] Success');
  } catch (err) {
    console.error('[initDropdowns] Failed:', err);
  }
}

// Call on DOMContentLoaded as backup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDropdowns);
  console.log('[app.js] Waiting for DOMContentLoaded');
} else {
  console.log('[app.js] DOM already ready, calling initDropdowns');
  initDropdowns();
}
