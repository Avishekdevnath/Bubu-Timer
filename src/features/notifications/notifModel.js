export function visibleNotifs(notifs, state, myUid) {
  const deleted = state?.deleted || {}
  return (notifs || []).filter(
    (n) => (n.toUid == null || n.toUid === myUid) && !deleted[n.id],
  )
}

export function unreadCount(notifs, state, myUid) {
  const read = state?.read || {}
  return visibleNotifs(notifs, state, myUid).filter((n) => !read[n.id]).length
}
