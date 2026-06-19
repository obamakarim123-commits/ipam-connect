/**
 * security.js — IPAM Connect RBAC Guardian
 * ==========================================
 * Responsibilities:
 *   • Read the active user's role from chatEngine._currentUser.
 *   • Conditionally inject "Delete" action buttons next to message cards
 *     ONLY for `class_rep` and `admin` roles.
 *   • Expose a renderRoleUI() function that gates admin-only navigation
 *     and the read/write announcement bar.
 *   • Register itself as a chatEngine.onMessage() observer so delete
 *     buttons are injected immediately as new messages render.
 *
 * ──────────────────────────────────────────────────────────────────────
 * CORRESPONDING FIREBASE SECURITY RULES (paste into Firebase Console)
 * ──────────────────────────────────────────────────────────────────────
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *
 *     // ── Helper: is the request from a signed-in user? ──────────────
 *     function isAuth() {
 *       return request.auth != null;
 *     }
 *
 *     // ── Helper: fetch caller's role from /users/{uid} ──────────────
 *     function callerRole() {
 *       return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
 *     }
 *
 *     function isModerator() {
 *       return isAuth() && callerRole() in ['class_rep', 'admin'];
 *     }
 *
 *     function isAdmin() {
 *       return isAuth() && callerRole() == 'admin';
 *     }
 *
 *     // ── /users/{uid} ───────────────────────────────────────────────
 *     match /users/{uid} {
 *       // Any authenticated user can read the directory.
 *       allow read: if isAuth();
 *       // Only the owner may write their own profile (on creation).
 *       // Admin can update any profile.
 *       allow create: if isAuth() && request.auth.uid == uid;
 *       allow update: if isAuth() && (request.auth.uid == uid || isAdmin());
 *       allow delete: if isAdmin();
 *     }
 *
 *     // ── /channels/{channelId} ──────────────────────────────────────
 *     match /channels/{channelId} {
 *       // All authenticated users can read channel metadata.
 *       allow read: if isAuth();
 *       // Only admins can create or modify channels.
 *       allow write: if isAdmin();
 *     }
 *
 *     // ── /messages/{messageId} ─────────────────────────────────────
 *     match /messages/{messageId} {
 *       // Any authenticated user can read messages.
 *       allow read: if isAuth();
 *
 *       // Any authenticated user can create a new message.
 *       // Enforce: senderId must match the caller's UID.
 *       // Enforce: isDeleted must start as false.
 *       allow create: if isAuth()
 *         && request.resource.data.senderId == request.auth.uid
 *         && request.resource.data.isDeleted == false;
 *
 *       // Only moderators (class_rep / admin) may update messages.
 *       // They may ONLY flip the isDeleted field — nothing else.
 *       allow update: if isModerator()
 *         && request.resource.data.diff(resource.data).affectedKeys()
 *              .hasOnly(['isDeleted']);
 *
 *       // Hard deletions are reserved for admins only.
 *       allow delete: if isAdmin();
 *     }
 *
 *     // ── /tokens/{tokenId} ─────────────────────────────────────────
 *     match /tokens/{tokenId} {
 *       // Class reps and admins can read tokens during registration.
 *       allow read: if isAuth();
 *       // Only admins can create and invalidate tokens.
 *       allow write: if isAdmin();
 *     }
 *
 *     // ── /resources/{resourceId} ───────────────────────────────────
 *     match /resources/{resourceId} {
 *       allow read: if isAuth();
 *       // Any authenticated user can upload a resource.
 *       allow create: if isAuth()
 *         && request.resource.data.ownerId == request.auth.uid;
 *       // Only owner or admin may delete.
 *       allow delete: if isAuth()
 *         && (request.auth.uid == resource.data.ownerId || isAdmin());
 *       allow update: if isAdmin();
 *     }
 *   }
 * }
 *
 * ──────────────────────────────────────────────────────────────────────
 */

import * as ChatEngine from './chatEngine.js';

// ─────────────────────────────────────────────
// 1. Role Definitions
// ─────────────────────────────────────────────
const MODERATOR_ROLES = new Set(['class_rep', 'admin']);
const ADMIN_ROLES     = new Set(['admin']);

/** @returns {string} Current user role or 'student' as safe default */
function _role() {
  return ChatEngine.currentUser?.role || 'student';
}

/** @returns {boolean} */
function isModerator()  { return MODERATOR_ROLES.has(_role()); }

/** @returns {boolean} */
function isAdmin()      { return ADMIN_ROLES.has(_role()); }

// ─────────────────────────────────────────────
// 2. Delete Button Factory
// ─────────────────────────────────────────────
/**
 * Creates a styled "Delete" button wired to chatEngine.softDeleteMessage().
 * The button is NOT injected if the message is already deleted.
 *
 * @param {string} messageId
 * @param {HTMLElement} containerEl — the .msg-actions div to append into
 */
function _injectDeleteBtn(messageId, containerEl) {
  // Guard: don't duplicate
  if (containerEl.querySelector('.rbac-delete-btn')) return;
  // Guard: already deleted — no button needed
  if (containerEl.closest('[data-is-deleted="true"]')) return;

  const btn = document.createElement('button');
  btn.type          = 'button';
  btn.className     = 'rbac-delete-btn';
  btn.dataset.msgId = messageId;
  btn.setAttribute('aria-label', 'Delete message');
  btn.innerHTML     = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <path d="M10 11v6"></path><path d="M14 11v6"></path>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
    </svg>
    Delete
  `;

  btn.addEventListener('click', async () => {
    // Confirm before executing destructive action
    if (!confirm('Permanently delete this message for all users?')) return;

    btn.disabled    = true;
    btn.textContent = 'Deleting…';

    try {
      await ChatEngine.softDeleteMessage(messageId);
      // Firestore onSnapshot will update the DOM automatically.
    } catch (err) {
      console.error('[security] softDelete failed:', err);
      btn.disabled    = false;
      btn.innerHTML   = '⚠ Retry';
      _showSecurityToast('Delete failed: ' + (err.message || 'Unknown error.'));
    }
  });

  containerEl.appendChild(btn);
}

// ─────────────────────────────────────────────
// 3. Message Observer — runs on every chatEngine message event
// ─────────────────────────────────────────────
/**
 * Called by chatEngine.onMessage() whenever a message DOM node is created
 * or replaced. Decides whether to inject the delete control.
 *
 * @param {{ change: object, el: HTMLElement, role: string }} param0
 */
function _onMessageRendered({ el }) {
  if (!isModerator()) return;

  const actionsDiv = el.querySelector('[data-delete-target]');
  if (!actionsDiv) return;

  const msgId    = actionsDiv.dataset.deleteTarget;
  const isDeleted = el.dataset.isDeleted === 'true';

  if (!isDeleted && msgId) {
    _injectDeleteBtn(msgId, actionsDiv);
  }
}

// Register with the engine
ChatEngine.onMessage(_onMessageRendered);

// ─────────────────────────────────────────────
// 4. Announcement Bar RBAC
// ─────────────────────────────────────────────
/**
 * Configures the top administrative announcement bar.
 *
 * Admins → bar is read/write (editable input + save button visible).
 * Everyone else → bar is read-only (static text, input hidden).
 *
 * Expected HTML elements (created by renderRoleUI or existing in index.html):
 *   #announcement-bar        — the outer container
 *   #announcement-text       — read-only display <p>
 *   #announcement-input      — admin <input type="text">
 *   #announcement-save       — admin <button>
 */
function _configureAnnouncementBar() {
  const bar   = document.getElementById('announcement-bar');
  const text  = document.getElementById('announcement-text');
  const input = document.getElementById('announcement-input');
  const save  = document.getElementById('announcement-save');

  if (!bar) return;

  if (isAdmin()) {
    bar.classList.add('announcement-bar--admin');
    if (input) input.classList.remove('hidden');
    if (save)  save.classList.remove('hidden');
    if (text)  text.classList.add('hidden');
  } else {
    bar.classList.remove('announcement-bar--admin');
    if (input) input.classList.add('hidden');
    if (save)  save.classList.add('hidden');
    if (text)  text.classList.remove('hidden');
  }
}

// ─────────────────────────────────────────────
// 5. Navigation Gate
// ─────────────────────────────────────────────
/**
 * Shows or hides navigation items and sections based on role.
 * Reads `data-required-role` attributes from nav buttons.
 *
 * Usage in HTML:
 *   <button data-view="admin" data-required-role="admin">Admin</button>
 */
function _gateNavigation() {
  const navButtons = document.querySelectorAll('.main-nav button[data-required-role]');
  navButtons.forEach(btn => {
    const required = btn.dataset.requiredRole;
    const allowed  = required === 'admin' ? isAdmin() :
                     required === 'moderator' ? isModerator() : true;

    btn.classList.toggle('hidden', !allowed);

    // Also hide the corresponding view panel if user lacks access
    const panelId = btn.dataset.view;
    const panel   = panelId ? document.getElementById(panelId) : null;
    if (panel) panel.classList.toggle('hidden', !allowed);
  });
}

// ─────────────────────────────────────────────
// 6. Role Badge Renderer
// ─────────────────────────────────────────────
/**
 * Injects a stylised role badge into `targetEl`.
 * @param {HTMLElement} targetEl
 */
function _renderRoleBadge(targetEl) {
  if (!targetEl) return;
  const user = ChatEngine.currentUser;
  if (!user) return;

  const roleLabels = {
    admin:     '⚙️ Administrator',
    class_rep: '⭐ Class Representative',
    student:   '🎓 Student',
  };

  const roleColors = {
    admin:     'badge--admin',
    class_rep: 'badge--rep',
    student:   'badge--student',
  };

  const label = roleLabels[user.role] || '🎓 Student';
  const cls   = roleColors[user.role]  || 'badge--student';

  targetEl.innerHTML = `
    <span class="role-badge ${cls}" title="Your platform role">
      ${ChatEngine.sanitize(label)}
    </span>
    <span class="user-display-name">${ChatEngine.sanitize(user.fullName || '')}</span>
  `;
}

// ─────────────────────────────────────────────
// 7. Master RBAC Renderer
// ─────────────────────────────────────────────
/**
 * Entry point — call this after the user profile has loaded (after Auth).
 * Applies all RBAC transformations to the live DOM.
 *
 * @param {HTMLElement} [roleLabelEl] — optional element to render role badge into
 */
function renderRoleUI(roleLabelEl) {
  _gateNavigation();
  _configureAnnouncementBar();
  if (roleLabelEl) _renderRoleBadge(roleLabelEl);
}

// ─────────────────────────────────────────────
// 8. Retroactive Sweep
// ─────────────────────────────────────────────
/**
 * Sweeps all existing message cards in the DOM and injects/removes
 * delete buttons based on current role. Call after role is resolved
 * or after a batch of messages loads without triggering onMessage.
 *
 * @param {HTMLElement} feedEl — the scrollable message container
 */
function sweepMessageFeed(feedEl) {
  if (!feedEl) return;
  const cards = feedEl.querySelectorAll('.msg-card');
  cards.forEach(card => {
    const actionsDiv = card.querySelector('[data-delete-target]');
    if (!actionsDiv) return;

    if (isModerator() && card.dataset.isDeleted !== 'true') {
      _injectDeleteBtn(actionsDiv.dataset.deleteTarget, actionsDiv);
    } else {
      // Remove any stale buttons if role downgraded (e.g. logout → login as student)
      actionsDiv.querySelectorAll('.rbac-delete-btn').forEach(b => b.remove());
    }
  });
}

// ─────────────────────────────────────────────
// 9. Utility: Security Toast (internal)
// ─────────────────────────────────────────────
/**
 * Displays an error toast if the global showToast function is available,
 * falls back to console.error.
 * @param {string} message
 */
function _showSecurityToast(message) {
  if (typeof window.showToast === 'function') {
    window.showToast(message);
  } else {
    console.error('[RBAC]', message);
  }
}

// ─────────────────────────────────────────────
// 10. Public API
// ─────────────────────────────────────────────
export {
  renderRoleUI,
  sweepMessageFeed,
  isModerator,
  isAdmin,
};
