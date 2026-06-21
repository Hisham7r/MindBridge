// Adapters map the backend (Prisma) shape onto the shape the UI components
// were originally built against, so pages/components need minimal changes.
//
// Backend therapist: { id(uuid), feePkr, reviewCount, track:'MENTAL_HEALTH', ... }
// UI therapist:      { id, fee, feeDisplay, reviews, track:'mental-health', image, ... }

const TRACK_TO_UI = {
  MENTAL_HEALTH: 'mental-health',
  CAREER: 'career',
}

const TRACK_TO_API = {
  'mental-health': 'MENTAL_HEALTH',
  career: 'CAREER',
}

export function uiTrackToApi(track) {
  if (!track) return undefined
  return TRACK_TO_API[track] || String(track).toUpperCase()
}

export function mapTherapist(t) {
  if (!t) return null
  const fee = Number(t.feePkr ?? 0)
  return {
    ...t,
    id: t.id,
    fee,
    feeDisplay: `PKR ${fee.toLocaleString()}/hr`,
    reviews: t.reviewCount ?? 0,
    track: TRACK_TO_UI[t.track] || (t.track ? String(t.track).toLowerCase() : t.track),
    image: t.avatarUrl || null,
    specializations: t.specializations || [],
    languages: t.languages || [],
  }
}

// Maps a backend User into the UI's currentUser shape used by RoleContext/Navbar.
export function mapUser(u) {
  if (!u) return null
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    initials: u.initials,
    avatar: u.avatarUrl || null,
    phone: u.phone || null,
    language: u.language || null,
    role: u.role, // UPPERCASE backend role; context exposes lowercase separately
  }
}
