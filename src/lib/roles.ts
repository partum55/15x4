export const PROFILE_ROLES = ['user', 'lector', 'admin'] as const

export type ProfileRole = (typeof PROFILE_ROLES)[number]

export function isProfileRole(role: unknown): role is ProfileRole {
  return typeof role === 'string' && PROFILE_ROLES.includes(role as ProfileRole)
}

export function canManageContent(role: unknown): boolean {
  return role === 'lector' || role === 'admin'
}
