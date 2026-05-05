export function getHighScore(): number {
  if (typeof window === 'undefined') return 0
  const raw = sessionStorage.getItem('waiting-room-high-score')
  return raw ? parseInt(raw, 10) || 0 : 0
}

export function setHighScore(score: number) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('waiting-room-high-score', String(score))
}

export function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}
