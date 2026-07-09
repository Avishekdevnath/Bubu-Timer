/**
 * cloudSync.js — Firestore as source of truth, localStorage as offline cache.
 *
 * subscribeCloudState(uid, { onData, onEmpty })
 *   Real-time listener via onSnapshot. Fires immediately on mount, then on
 *   every remote change. Returns an unsubscribe function.
 *   - onData(cloud)  called when Firestore doc exists with state
 *   - onEmpty()      called when doc missing — caller should seed it
 *
 * queueCloudPush(uid, state)
 *   Debounced write (500ms). Coalesces rapid saves. All meaningful actions
 *   (plan create/start/pause/done/archive) call this via patchState.
 *
 * flushCloudPushNow()
 *   Flush pending push immediately — call on visibilitychange/beforeunload.
 *
 * Doc shape:  users/{uid}
 *   state: { subjects, planHistory, dailyPlan, futurePlans, ... }
 *   stateUpdatedAt: serverTimestamp
 *   stateUpdatedAtMs: Date.now()
 */
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestore } from './firebase.js'

const PUSH_DEBOUNCE_MS = 500

export const SYNCED_FIELDS = [
  'subjects',
  'subjectProgress',
  'chapterProgress',
  'dailyPlan',
  'planHistory',
  'futurePlans',
  'dayCutoff',
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

export function subscribeCloudState(uid, { onData, onEmpty } = {}) {
  if (!uid) return () => {}
  const docRef = doc(firestore, 'users', uid)
  return onSnapshot(
    docRef,
    { includeMetadataChanges: false },
    (snap) => {
      if (!snap.exists() || !snap.data()?.state) {
        onEmpty?.()
        return
      }
      const data = snap.data()
      onData?.({ state: data.state, updatedAtMs: data.stateUpdatedAtMs || 0 })
    },
    (error) => {
      console.warn('subscribeCloudState error', error)
    },
  )
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

export function mergeCloudIntoLocal(localState, cloudPayload) {
  if (!cloudPayload?.state) return localState
  const next = { ...localState }
  for (const key of SYNCED_FIELDS) {
    if (cloudPayload.state[key] !== undefined) next[key] = cloudPayload.state[key]
  }
  return next
}
