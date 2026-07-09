# Admin Panel — Enhancement Report (2026-07-09)

Ideas for the admin panel beyond what's shipped (Dashboard/Users/Rooms/Broadcast/Logs).
All items use only what's already in the stack (React, Firebase client SDK, native
browser APIs) — no new npm dependency for any of them.

---

## A. Quick UI/UX wins

### 1. Search on Users tab
Rooms tab has a search box (`filterRooms`); Users tab doesn't. Same pattern —
filter the already-fetched list by name/email, client-side, zero backend change.

### 2. Sortable Users columns
Click a column label (last sign-in / subjects / devices) to sort ascending/descending.
Pure client-side array sort on data already in memory.

### 3. Loading skeletons instead of "Loading…" text
Replace the plain text with a pulsing skeleton card (CSS `animate-pulse`, already
available via Tailwind, no new dependency) for Dashboard stats, Users, Rooms, Logs.

### 4. `aria-label` on icon-only buttons
`Eraser`, `DoorClosed`, `Trash2`, `RotateCcw`, `ShieldOff`, `UserX`, `Send`, `Pencil`,
`Plus` buttons currently rely on `title` (hover tooltip) only — not reliably read by
screen readers. Add explicit `aria-label` matching the tooltip text.

### 5. Copy-to-clipboard for uid / room code
Small copy icon next to uid (Users expand) and room code (Rooms row) using
`navigator.clipboard.writeText` — native API, speeds up manual single-user push
or support debugging.

### 6. Show online/offline status per room member
`room.A.online` / `room.B.online` already exist in the RTDB schema and are populated
by the app, but the admin Rooms tab never displays them. Add a small green/gray dot
next to each member name in the expanded room view.

### 7. Logs tab filters
Client-side filter dropdown by action type (derived from the loaded log list) and a
"by me only" toggle. No new query needed — same 100 already-fetched docs.

### 8. CSV export for Users list
"Export CSV" button on Users tab header. Build the CSV string client-side, download
via `Blob` + `URL.createObjectURL` — both native, no dependency.

### 9. Dashboard: stale-data callouts
Add a 5th stat or a warning row: "3 users disabled", "2 rooms inactive 30+ days"
(computed from data the Dashboard and Rooms tabs already load, via `roomStats.js`
style pure helpers).

---

## B. More control (real functional gaps)

### 10. Revoke sessions on disable — closes a real gap
`adminSetUserDisabled` currently only calls `getAuth().updateUser(uid, { disabled })`.
This blocks new sign-ins but an already-signed-in device keeps working until its ID
token naturally refreshes (up to ~1 hour) — the confirm-modal copy already admits
this ("Existing sessions may still work until token refresh"). Fix: also call
`getAuth().revokeRefreshTokens(uid)` when disabling. Makes "Disable account" actually
immediate.

### 11. Bulk actions on Users tab
Checkbox per row + a toolbar ("Disable selected", "Delete selected") once more than
a handful of users exist. Skip for now (only ~3 users today) — listed for when it
becomes worth the UI cost.

### 12. "Send test push to self" button
On the Broadcast tab, a one-click "send this to me only" before mass-sending —
just calls the existing `broadcast(title, body, url, myUid)` with the admin's own
uid. Cheap safety net against typo'd broadcasts.

### 13. Type-to-confirm on Close Room
Delete User already requires typing the email to confirm. Close Room is equally
destructive (wipes chat/pins/checklists permanently) but only needs a click. Bring
it to the same safety bar for consistency.

### 14. Guard against accidental double-broadcast
`sending` state already prevents a literal double-click, but nothing stops sending
the same broadcast twice in quick succession on purpose-by-accident. Add a soft
warning if the same title was sent within the last 60 seconds.

---

## C. Flagged for later (not recommended now — YAGNI)

- **Real pagination** — only worth it past ~50 users; `adminListUsers` cap is 1000
  and client-side search already covers today's scale.
- **Scheduled/delayed broadcasts** — no current need, adds a queuing concept with
  no user asking for it yet.
- **Admin role tiers (super-admin vs moderator)** — only matters once there's more
  than one admin account. Revisit if that happens.

---

## Recommendation

If picking a next batch: **1, 4, 6, 10** are the highest value-to-effort — one closes
a real security gap (10), the rest are small, contained UI fixes that make existing
data actually visible/usable. Say which ones and I'll implement directly.
