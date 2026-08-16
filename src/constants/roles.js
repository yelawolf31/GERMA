export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SUPERVISOR]: 'Supervisor',
}

export function isAdmin(role) {
  return role === ROLES.ADMIN
}
