export const ANN_DISMISS_KEY = 'bubu_ann_dismissed'

export function shouldShowAnnouncement(ann, dismissedAt) {
  if (!ann?.active) return false
  if (!ann.text || !ann.text.trim()) return false
  return (ann.updatedAt || 0) > (dismissedAt || 0)
}
