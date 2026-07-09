# Notification & Admin Panel — Issue List (2026-07-09)

Audit of gaps around push notifications, in-app notifications, and the admin panel.
Issues 1–4 reported by user; 5–14 found during codebase audit.

---

## User-reported

### 1. Old push notifications disappear from the phone notification bar
Every chat push uses the same `tag: 'bubu-chat'` (and broadcasts use `tag: 'bubu-admin'`), so each new notification **replaces** the previous one in the Android notification shade. Only the latest survives.

- Where: `functions/index.js` (`onChatMessage` webpush config), `functions/admin.js` (`adminBroadcast`), `public/firebase-messaging-sw.js` (`onBackgroundMessage`)
- Fix direction: unique tag per message (e.g. `bubu-chat-<msgId>`) or per-sender grouping; keep collapse only where intended.

### 2. No in-app notification center for users
No bell menu / notifications page in the user home. Users cannot see past notifications, mark them read, or review missed messages/broadcasts inside the app.

- Fix direction: Firestore-backed per-user inbox (`users/{uid}/notifications` or top-level collection), bell icon with unread badge in header, list page with mark-read / mark-all-read.

### 3. No notification CRUD / management
Neither users nor the super admin can manage notifications:

- Users: cannot delete/clear their notifications, no read/unread state.
- Admin: cannot list past broadcasts, edit drafts, delete a sent broadcast record, or resend.

### 4. Admin panel lacks full management UI/UX
Current admin panel is three thin tabs (Users, Rooms, Broadcast) with minimal actions. No comprehensive management for users, rooms, notifications, announcements, or logs. Details split into issues 5–14 below.

---

## Found in audit

### 5. Broadcasts are not persisted anywhere
`adminBroadcast` sends FCM and returns counts — nothing is stored. A user who is offline (or has no push permission) at send time never sees the broadcast. Admin has no broadcast history either (only truncated params inside `adminLogs`).

- Where: `functions/admin.js` → `adminBroadcast`
- Fix direction: write each broadcast to a `broadcasts` collection; notification center (issue 2) reads from it.

### 6. Announcement is a single overwritable doc with no history
Publishing a new announcement overwrites `config/announcement`. No archive of past announcements, no scheduling (start/end time). Dismissal is stored only in `localStorage` (`bubu_ann_dismissed`) — wiped with browser cache and not synced across a user's devices.

- Where: `features/admin/AdminBroadcastTab.jsx`, `features/admin/announcement.js`, `components/AnnouncementBanner.jsx`

### 7. Audit logs are write-only
Every admin action writes to the `adminLogs` Firestore collection, but there is no UI to read it. The admin panel has no Logs tab.

- Where: `functions/admin.js` → `auditLog()`; missing viewer in `pages/AdminPage.jsx`

### 8. Users tab is shallow
- No search or filter.
- `listUsers(1000)` hard cap, no pagination.
- `disabled` flag is fetched and returned but there is **no enable/disable account toggle**.
- No user detail view (subjects, plan history, devices/tokens, active room).
- No "send push to a single user" action.

- Where: `pages/AdminPage.jsx` → `UsersTab`, `functions/admin.js` → `adminListUsers`

### 9. Rooms tab is shallow
- Cannot view chat content of a room.
- Cannot kick a single member — only close (delete) the whole room.
- No search by code or member name.
- No created / last-active timestamps shown.

- Where: `features/admin/AdminRoomsTab.jsx`

### 10. Broadcast never prunes dead FCM tokens
`onChatMessage` removes stale tokens on send failure; `adminBroadcast` does not. Dead tokens accumulate and the failed count grows with every broadcast.

- Where: `functions/admin.js` → `adminBroadcast` (compare with cleanup block in `functions/index.js`)

### 11. Foreground pushes are lost
When the app is open, an incoming push becomes an 80-character toast for a few seconds. If the user misses it, it is gone — no record anywhere. (Same root cause as issue 2: no persistent inbox.)

- Where: `App.jsx` foreground FCM effect (`subscribeForegroundMessages` → `showToast`)

### 12. No admin dashboard / overview
Admin panel opens straight into the user list. No at-a-glance stats: total users, active rooms, messages today, registered device count, recent activity.

- Where: `pages/AdminPage.jsx`

### 13. Broadcast deep link is hardcoded to `/home`
Admin cannot choose which route/screen a broadcast notification opens when tapped.

- Where: `functions/admin.js` → `adminBroadcast` (`url: '/home'`, `fcm_options.link`)

### 14. Denied notification permission is a dead end
If a user denies the permission prompt once, the app never surfaces a recovery path apart from a small text row in Settings ("Blocked — enable in browser site settings"). No banner, no guide, no re-prompt UX on Home.

- Where: `pages/SettingsPage.jsx` Notifications section; no handling elsewhere

---

## Common root

Most issues trace to one missing core: a **persistent, Firestore-backed notification system** (per-user inbox + broadcast/announcement history) plus an **admin panel v2** (dashboard, search/pagination, detail views, logs viewer). Building that core resolves issues 2, 3, 5, 6, 7, 11, 12 together; 1, 8, 9, 10, 13, 14 are targeted fixes on top.
