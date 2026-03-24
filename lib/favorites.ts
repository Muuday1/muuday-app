// NOTE: Favorites are currently stored in localStorage keyed by professional ID.
// TODO: Migrate to a Supabase `favorites` table (user_id, professional_id, created_at)
// with RLS policy: users can manage their own favorites.

const FAVORITES_KEY = 'muuday_favorites'

export function getFavoriteIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function toggleFavorite(professionalId: string): boolean {
  const ids = getFavoriteIds()
  const index = ids.indexOf(professionalId)
  if (index === -1) {
    ids.push(professionalId)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
    return true // now favorited
  } else {
    ids.splice(index, 1)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
    return false // removed
  }
}

export function isFavorited(professionalId: string): boolean {
  return getFavoriteIds().includes(professionalId)
}
