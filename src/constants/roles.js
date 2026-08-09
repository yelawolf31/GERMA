export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrateur',
  [ROLES.SUPERVISOR]: 'Superviseur',
}

export function isAdmin(role) {
  return role === ROLES.ADMIN
}
