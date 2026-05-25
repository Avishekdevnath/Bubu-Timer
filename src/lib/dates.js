import { pad } from './format.js'

export function dhakaDate(now = new Date()) {
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
}

export function dateKey(date = dhakaDate()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayStr(now = new Date()) {
  return dateKey(dhakaDate(now))
}

export function yesterdayStr(now = new Date()) {
  const d = dhakaDate(now)
  d.setDate(d.getDate() - 1)
  return dateKey(d)
}

export function daysBetween(a, b) {
  const da = new Date(`${a}T00:00:00`)
  const db = new Date(`${b}T00:00:00`)
  return Math.max(0, Math.round((db - da) / 86400000))
}

export function daysLeft(endDate, today = todayStr()) {
  return daysBetween(today, endDate)
}
