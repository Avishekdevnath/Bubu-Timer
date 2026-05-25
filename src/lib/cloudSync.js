/**
 * cloudSync.js — Firestore mirror of app state for cross-device sync.
 *
 * Strategy: last-write-wins by wall-clock timestamp.
 *
 *   pullCloudState(uid)
 *     -> { state, updatedAtMs } | null
 *     Caller compares to localStorage `savedAt` to decide which to keep.
 *
 *   queueCloudPush(uid, state)
 *     Debounced — coalesces rapid-fire saves into one Firestore write every
 *     PUSH_DEBOUNCE_MS. Most timer ticks call patchState; without throttling
 *     this would burn through Firestore writes for nothing.
 *
 *   flushCloudPushNow()
 *     Fire any pending push immediately. Call from visibilitychange/beforeunload
 *     so we don't drop the latest state when the tab leaves.
 *
 * Doc shape:
 *   users/{uid}
 *     state: { ...stripped state, no logs, no live timer fields... }
 *     stateUpdatedAt: serverTimestamp
 *     stateUpdatedAtMs: Date.now()      // used for client-side LWW compare
 */
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestore } from './firebase.js'

const PUSH_DEBOUNCE_MS = 1500

// Persisted fields. Runtime/timer fields are deliberately excluded — they
// describe device-local state (which tab is ticking right now) and would
// cause cross-device flapping if mirrored.
const SYNCED_FIELDS = [
  'subjects',
  'subjectProgress',
  'chapterProgress',
  'targets',
  'activeTarget',
  'sessionEvents',
  'lastReportShownDate',
  'sessions',
  'bankMin',
  'studyMin',
  'activeSubjectId',
  'activeChapterId',
  'subjectsCompleted',
  'studyDuration',
  'breakDuration',
]

let pushTimer = null
let pending = null

export function buildSyncableState(state) {
  const out = {}
  for (const key of SYNCED_FIELDS) {
    if (state[key] !== undefined) out[key] = state[key]
  }
  return out
}

export async function pullCloudState(uid) {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(firestore, 'users', uid))
    if (!snap.exists()) return null
    const data = snap.data()
    if (!data?.state) return null
    return {
      state: data.state,
      updatedAtMs: data.stateUpdatedAtMs || data.stateUpdatedAt?.toMillis?.() || 0,
    }
  } catch (error) {
    console.warn('pullCloudState failed', error)
    return null
  }
}

export function queueCloudPush(uid, state) {
  if (!uid) return
  pending = { uid, state }
  clearTimeout(pushTimer)
  pushTimer = setTimeout(flushPush, PUSH_DEBOUNCE_MS)
}

async function flushPush() {
  if (!pending) return
  const { uid, state } = pending
  pending = null
  pushTimer = null
  try {
    await setDoc(
      doc(firestore, 'users', uid),
      {
        state: buildSyncableState(state),
        stateUpdatedAt: serverTimestamp(),
        stateUpdatedAtMs: Date.now(),
      },
      { merge: true },
    )
  } catch (error) {
    console.warn('cloud push failed', error)
  }
}

export async function flushCloudPushNow() {
  clearTimeout(pushTimer)
  pushTimer = null
  await flushPush()
}

/**
 * Merge cloud state into an existing local default state object.
 * Only overrides keys present in the cloud payload — leaves device-local
 * fields (mode, timeLeft, endTs, …) untouched.
 */
export function mergeCloudIntoLocal(localState, cloudPayload) {
  if (!cloudPayload?.state) return localState
  const next = { ...localState }
  for (const key of SYNCED_FIELDS) {
    if (cloudPayload.state[key] !== undefined) next[key] = cloudPayload.state[key]
  }
  return next
}
