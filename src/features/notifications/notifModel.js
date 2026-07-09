function targetsMe(toUid, myUid) {
  if (toUid == null) return true
  if (Array.isArray(toUid)) return toUid.includes(myUid)
  return toUid === myUid
}

export function visibleNotifs(notifs, state, myUid) {
  const deleted = state?.deleted || {}
  return (notifs || []).filter((n) => targetsMe(n.toUid, myUid) && !deleted[n.id])
}

export function unreadCount(notifs, state, myUid) {
  const read = state?.read || {}
  return visibleNotifs(notifs, state, myUid).filter((n) => !read[n.id]).length
}
