export const ANN_DISMISS_KEY = 'bubu_ann_dismissed'

export function shouldShowAnnouncement(ann, readMap) {
  if (!ann?.active) return false
  if (!ann.text || !ann.text.trim()) return false
  if (!ann.notifId) return false
  return !(readMap || {})[ann.notifId]
}
