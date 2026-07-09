function isDueNow(reminder, nowHour, nowMinute) {
  if (reminder.timeHour !== nowHour) return false
  const bucketStart = Math.floor(nowMinute / 15) * 15
  const bucketEnd = bucketStart + 14
  return reminder.timeMinute >= bucketStart && reminder.timeMinute <= bucketEnd
}

function isExpired(reminder, dateStr) {
  if (!reminder.endDate) return false
  return dateStr > reminder.endDate
}

module.exports = { isDueNow, isExpired }
