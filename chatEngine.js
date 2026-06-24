/**
 * chatEngine.js — IPAM Connect Real-Time Router Engine
 * =====================================================
 * Responsibilities:
 *   • Manage a single Firestore onSnapshot subscription per active channel.
 *   • Unsubscribe from the previous listener before switching channels (no leaks).
 *   • Sanitize all user-supplied text before injecting into the DOM (XSS guard).
 *   • Orchestrate the async file-upload pipeline:
 *       uploadBytesResumable → getDownloadURL → addDoc (message payload).
 *   • Render soft-deleted messages gracefully (shell + italic placeholder).
 *   • Expose a clean public API consumed by index.html and security.js.
 *
 * Dependencies: firebase-config.js, security.js
 */

import { firebaseConfig } from './firebase-config.js';
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js';

// ─────────────────────────────────────────────
// 1. Firebase Singleton (safe re-use across modules)
// ─────────────────────────────────────────────
const _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const _auth = getAuth(_app);
const _db   = getFirestore(_app);
const _st   = getStorage(_app);

// ─────────────────────────────────────────────
// 2. Engine State
// ─────────────────────────────────────────────
/** @type {Function|null} Active Firestore unsubscribe handle */
let _unsubscribe = null;

/** @type {{ channelId: string, channelName: string, channelType: string }} */
let _activeChannel = { channelId: 'general', channelName: 'General Chat', channelType: 'text' };

/** @type {{ uid: string, fullName: string, role: string, department: string, level: string }|null} */
let _currentUser = null;

/**
 * Registered callbacks for external modules (e.g. security.js, index.html).
 * @type {{ onMessage: Function[], onChannelChange: Function[], onUploadProgress: Function[] }}
 */
const _callbacks = {
  onMessage:        [],
  onChannelChange:  [],
  onUploadProgress: [],
};

// ─────────────────────────────────────────────
// 3. XSS Sanitizer
// ─────────────────────────────────────────────
/**
 * Escapes HTML special characters in a string to prevent XSS injection.
 * Always call this before setting innerHTML with user data.
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ─────────────────────────────────────────────
// 4. DOM Renderer
// ─────────────────────────────────────────────
/**
 * Builds a single message DOM node from a Firestore document snapshot.
 * Handles:
 *   • Transient null timestamps (optimistic local writes).
 *   • Soft-deleted messages (isDeleted: true).
 *   • Attachment cards (image preview vs. file link).
 *   • Delete button injection delegated to security.js via data attributes.
 *
 * @param {{ id: string, data: Function }} snapshot — Firestore document snapshot
 * @param {string} currentUserRole
 * @returns {HTMLElement}
 */
function _buildMessageEl(snapshot, currentUserRole) {
  const msg  = snapshot.data();
  const msgId = snapshot.id;

  // ── Wrapper ──────────────────────────────────
  const article = document.createElement('article');
  article.className = 'msg-card' + (msg.isDeleted ? ' msg-card--deleted' : '') + (msg.isPinned ? ' msg-card--pinned' : '');
  article.dataset.msgId     = msgId;
  article.dataset.senderId  = msg.senderId || '';
  article.dataset.isDeleted = msg.isDeleted ? 'true' : 'false';
  article.dataset.isPinned  = msg.isPinned ? 'true' : 'false';

  // ── Timestamp — guard against transient null (optimistic write lag) ───
  let timeStr = '…';
  if (msg.timestamp && msg.timestamp.seconds != null) {
    timeStr = new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {
      hour:   '2-digit',
      minute: '2-digit'
    });
  }

  // ── Sender row ───────────────────────────────
  const senderRow = document.createElement('div');
  senderRow.className = 'msg-sender-row';
  const pinBadge = msg.isPinned ? '<span style="font-size:0.7rem;background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:4px;font-weight:600;margin-left:4px;">📌 Pinned</span>' : '';
  senderRow.innerHTML = `
    <span class="msg-avatar" aria-hidden="true">${msg.senderPhotoURL ? `<img src="${sanitize(msg.senderPhotoURL)}" alt="" class="msg-avatar-img">` : sanitize(msg.senderName?.charAt(0) || '?')}</span>
    <span class="msg-sender-name">${sanitize(msg.senderName || 'Unknown')}</span>
    <time class="msg-time" datetime="${timeStr}">${timeStr}</time>
    ${pinBadge}
  `;

  // ── Body ─────────────────────────────────────
  const body = document.createElement('div');
  body.className = 'msg-body';

  if (msg.isDeleted) {
    body.innerHTML = `<em class="msg-deleted-notice">🚫 This message was deleted by a moderator.</em>`;
  } else {
    // Safe text content
    const textEl = document.createElement('p');
    textEl.className = 'msg-text';
    textEl.textContent = msg.text || '';
    body.appendChild(textEl);

    // Attachment card
    if (msg.attachmentUrl) {
      const isImage = msg.attachmentType?.startsWith('image/');
      const attachEl = document.createElement('div');
      attachEl.className = 'msg-attachment';

      if (isImage) {
        attachEl.innerHTML = `
          <img
            src="${sanitize(msg.attachmentUrl)}"
            alt="Attachment"
            class="msg-attachment-img"
            loading="lazy"
          />
        `;
      } else {
        // Determine file icon by MIME type
        const iconMap = {
          'application/pdf':  '📄',
          'application/zip':  '🗜️',
          'application/msword': '📝',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
        };
        const icon = iconMap[msg.attachmentType] || '📎';
        attachEl.innerHTML = `
          <a
            href="${sanitize(msg.attachmentUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="msg-attachment-link"
          >
            <span>${icon}</span>
            <span>Download Attachment</span>
          </a>
        `;
      }
      body.appendChild(attachEl);
    }
  }

  // ── Moderator Action Row (data attributes signal security.js) ────────
  const actions = document.createElement('div');
  actions.className = 'msg-actions';
  actions.dataset.deleteTarget = msgId;
  actions.dataset.senderUid    = msg.senderId || '';
  // Pin/unpin button for moderators (visible via security.js RBAC)
  if (!msg.isDeleted) {
    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.className = 'rbac-pin-btn';
    pinBtn.dataset.msgId = msgId;
    pinBtn.dataset.isPinned = msg.isPinned ? 'true' : 'false';
    pinBtn.setAttribute('aria-label', msg.isPinned ? 'Unpin message' : 'Pin message');
    pinBtn.innerHTML = msg.isPinned ? '📌 Unpin' : '📌 Pin';
    pinBtn.style.cssText = 'display:none;align-items:center;gap:4px;padding:3px 10px;font-size:0.72rem;font-weight:600;color:#92400e;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:6px;cursor:pointer;transition:all 0.2s;';
    pinBtn.addEventListener('click', async () => {
      pinBtn.disabled = true;
      try {
        await togglePinMessage(msgId, !msg.isPinned);
      } catch (err) {
        console.error('[chatEngine] pin toggle failed:', err);
        pinBtn.disabled = false;
      }
    });
    actions.appendChild(pinBtn);
  }
  // Actual delete button injection is handled by security.js::injectDeleteControls()

  article.appendChild(senderRow);
  article.appendChild(body);
  article.appendChild(actions);
  return article;
}

// ─────────────────────────────────────────────
// 5. Channel Subscription Manager
// ─────────────────────────────────────────────
/**
 * Switches the active Firestore listener to `channel`.
 * Safely tears down the previous subscription before opening a new one.
 *
 * @param {{ channelId: string, channelName: string, department: string, level: string }} channel
 * @param {HTMLElement} feedEl — The scrollable message container in the DOM
 */
function subscribeToChannel(channel, feedEl) {
  // ── 1. Unsubscribe from old stream to prevent memory/listener leaks ──
  if (typeof _unsubscribe === 'function') {
    _unsubscribe();
    _unsubscribe = null;
  }

  _activeChannel = channel;

  // Notify registered listeners of channel change
  _callbacks.onChannelChange.forEach(cb => cb(channel));

  // Clear the feed viewport
  if (feedEl) feedEl.innerHTML = '';

  // ── 2. Build Firestore query: messages for this channel, asc by time ─
  const msgsQuery = query(
    collection(_db, 'messages'),
    where('channelId', '==', channel.channelId),
    orderBy('timestamp', 'asc')
  );

  // ── 3. Open new real-time listener ───────────────────────────────────
  _unsubscribe = onSnapshot(msgsQuery, (snapshot) => {
    if (!feedEl) return;

    snapshot.docChanges().forEach(change => {
      const role = _currentUser?.role || 'student';

      if (change.type === 'added') {
        const el = _buildMessageEl(change.doc, role);
        const isPinned = change.doc.data().isPinned === true;
        if (isPinned) {
          // Insert pinned messages at the top of the feed
          feedEl.insertBefore(el, feedEl.firstChild);
        } else {
          feedEl.appendChild(el);
        }

        // Signal security.js to evaluate and inject delete controls
        _callbacks.onMessage.forEach(cb => cb({ change, el, role }));

        // Auto-scroll to bottom on new non-pinned messages
        if (!isPinned) feedEl.scrollTop = feedEl.scrollHeight;

      } else if (change.type === 'modified') {
        // Handle soft-delete update in place — find existing node and re-render
        const existing = feedEl.querySelector(`[data-msg-id="${change.doc.id}"]`);
        if (existing) {
          const updated = _buildMessageEl(change.doc, role);
          feedEl.replaceChild(updated, existing);
          _callbacks.onMessage.forEach(cb => cb({ change, el: updated, role }));
        }

      } else if (change.type === 'removed') {
        // Physical document removal (rare — we prefer soft-deletes)
        const existing = feedEl.querySelector(`[data-msg-id="${change.doc.id}"]`);
        if (existing) existing.remove();
      }
    });
  }, (error) => {
    console.error('[chatEngine] Firestore listener error:', error);
  });
}

/**
 * Tears down the active listener and clears state.
 * Call on logout or component unmount.
 */
function unsubscribeAll() {
  if (typeof _unsubscribe === 'function') {
    _unsubscribe();
    _unsubscribe = null;
  }
  _activeChannel = null;
}

// ─────────────────────────────────────────────
// 6. File Upload Pipeline
// ─────────────────────────────────────────────
/**
 * Validated MIME types accepted by the platform.
 * Rejects anything outside this list before hitting Firebase Storage.
 */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
]);

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Uploads `file` to Firebase Storage, then resolves with { url, mimeType }.
 * Progress events are emitted to `_callbacks.onUploadProgress`.
 *
 * @param {File} file
 * @returns {Promise<{ url: string, mimeType: string }>}
 */
async function uploadAttachment(file) {
  // ── Client-side guards ────────────────────────────────────────────────
  if (!file) throw new Error('No file provided.');
  if (file.size > MAX_FILE_BYTES) throw new Error(`File exceeds 50 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`File type "${file.type}" is not permitted. Allowed: PDF, DOCX, images, ZIP.`);
  }

  const path      = `chat-attachments/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fileRef   = storageRef(_st, path);
  const uploadTask = uploadBytesResumable(fileRef, file, { contentType: file.type });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        _callbacks.onUploadProgress.forEach(cb => cb(pct));
      },
      (err) => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.ref);
          resolve({ url, mimeType: file.type });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

// ─────────────────────────────────────────────
// 7. Message Send Handler
// ─────────────────────────────────────────────
/**
 * Sends a message to the active channel.
 * Runs the full upload pipeline before committing the Firestore document.
 *
 * @param {{ text: string, file?: File|null }} payload
 * @returns {Promise<void>}
 */
async function sendMessage({ text, file }) {
  if (!_currentUser)  throw new Error('Not authenticated.');
  if (!_activeChannel) throw new Error('No channel selected.');
  if (!text?.trim() && !file) throw new Error('Message or attachment required.');

  let attachmentUrl  = null;
  let attachmentType = null;

  // ── File upload pipeline (sequential: upload → getURL → write doc) ───
  if (file) {
    const result = await uploadAttachment(file);
    attachmentUrl  = result.url;
    attachmentType = result.mimeType;
  }

  // ── Write Firestore document ──────────────────────────────────────────
  await addDoc(collection(_db, 'messages'), {
    channelId:      _activeChannel.channelId,
    senderId:       _currentUser.uid,
    senderName:     _currentUser.fullName,
    text:           text?.trim() || '',
    attachmentUrl,
    attachmentType,
    isDeleted:      false,
    timestamp:      serverTimestamp(), // Server-side to avoid client clock skew
  });
}

// ─────────────────────────────────────────────
// 8. Soft-Delete Handler
// ─────────────────────────────────────────────
/**
 * Marks a message as deleted (soft-delete).
 * Only class_rep and admin roles should call this;
 * enforcement is backed by Firestore Security Rules.
 *
 * @param {string} messageId
 * @returns {Promise<void>}
 */
async function softDeleteMessage(messageId) {
  if (!messageId) throw new Error('messageId is required.');
  const ref = doc(_db, 'messages', messageId);
  await updateDoc(ref, { isDeleted: true });
}

/**
 * Toggles the pinned state of a message.
 * Only class_rep and admin roles should call this.
 *
 * @param {string} messageId
 * @param {boolean} isPinned
 * @returns {Promise<void>}
 */
async function togglePinMessage(messageId, isPinned) {
  if (!messageId) throw new Error('messageId is required.');
  const ref = doc(_db, 'messages', messageId);
  await updateDoc(ref, { isPinned });
}

// ─────────────────────────────────────────────
// 9. Auth Binding (set externally by app.js)
// ─────────────────────────────────────────────
/**
 * Sets the current user from Firestore data (called by app.js after
 * it resolves the profile). This avoids race conditions between
 * two independent onAuthStateChanged listeners.
 */
function setCurrentUser(userData) {
  _currentUser = userData;
}
function clearCurrentUser() {
  _currentUser = null;
  unsubscribeAll();
}

// ─────────────────────────────────────────────
// 10. Channel Loader — reads /channels collection
// ─────────────────────────────────────────────
/**
 * Fetches all channels matching a department and level.
 * @param {string} department
 * @param {string} level
 * @returns {Promise<Array<{channelId:string, channelName:string, channelType:string}>>}
 */
async function fetchChannels(department, level) {
  const q = query(
    collection(_db, 'channels'),
    where('department', '==', department),
    where('level',      '==', level)
  );
  const snap = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js')
    .then(m => m.getDocs(q));
  return snap.docs.map(d => ({ channelId: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────
// 11. Callback Registration (Observer pattern)
// ─────────────────────────────────────────────
/**
 * Register a callback to be invoked whenever a message change event fires.
 * Used by security.js to inject/remove delete controls.
 * @param {Function} fn — receives { change, el, role }
 */
function onMessage(fn)       { _callbacks.onMessage.push(fn); }

/**
 * Register a callback invoked when the active channel changes.
 * @param {Function} fn — receives channel object
 */
function onChannelChange(fn) { _callbacks.onChannelChange.push(fn); }

/**
 * Register a callback for upload progress (0-100).
 * @param {Function} fn — receives progress percentage (number)
 */
function onUploadProgress(fn){ _callbacks.onUploadProgress.push(fn); }

// ─────────────────────────────────────────────
// 12. Typing Indicators
// ─────────────────────────────────────────────
let _typingTimeout = null;

/**
 * Emits a typing event for the active channel.
 * Creates/updates a document at /typing/{channelId}/{userId}
 * with a server timestamp. Clears after 3s of inactivity.
 */
async function emitTyping() {
  if (!_currentUser || !_activeChannel) return;
  const typingRef = doc(_db, 'typing', _activeChannel.channelId, 'users', _currentUser.uid);
  try {
    await setDoc(typingRef, {
      displayName: _currentUser.fullName,
      lastTyped: serverTimestamp()
    });
    // Set onDisconnect to clean up if user disconnects
    onDisconnect(typingRef).delete();
  } catch (e) {
    // Silently fail — typing indicator is non-critical
  }

  // Clear after 3s of inactivity
  if (_typingTimeout) clearTimeout(_typingTimeout);
  _typingTimeout = setTimeout(async () => {
    try {
      await deleteDoc(typingRef);
    } catch (e) { /* ignore */ }
  }, 3000);
}

/**
 * Subscribes to typing indicators for the given channel.
 * Calls the callback with an array of display names actively typing.
 *
 * @param {string} channelId
 * @param {Function} callback — receives Array<string>
 * @returns {Function} unsubscribe function
 */
function subscribeTyping(channelId, callback) {
  const typingQuery = query(
    collection(_db, 'typing', channelId, 'users'),
    orderBy('lastTyped', 'desc')
  );
  return onSnapshot(typingQuery, (snapshot) => {
    const now = Date.now();
    const typers = snapshot.docs
      .map(d => d.data())
      .filter(t => t.lastTyped && (now - t.lastTyped.seconds * 1000) < 5000)
      .map(t => t.displayName || 'Someone');
    callback(typers);
  }, () => callback([]));
}

/** Returns the currently subscribed channel or null. */
function getActiveChannel() { return _activeChannel; }

/** Returns the current authenticated user profile or null. */
function getCurrentUser() { return _currentUser; }

// ─────────────────────────────────────────────
// 13. Public API Export
// ─────────────────────────────────────────────
export {
  // Core subscriptions
  subscribeToChannel,
  unsubscribeAll,

  // Messaging
  sendMessage,
  softDeleteMessage,
  togglePinMessage,

  // Data fetching
  fetchChannels,

  // Event hooks
  onMessage,
  onChannelChange,
  onUploadProgress,

  // Utilities
  sanitize,

  // Typing indicators
  emitTyping,
  subscribeTyping,

  // State accessors (read-only intent)
  getActiveChannel,
  getCurrentUser,

  // Auth binding (called by app.js)
  setCurrentUser,
  clearCurrentUser,
};
