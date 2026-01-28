/**
 * Roles de usuario en el sistema
 */
export type UserRole = 'host' | 'admin';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  host: 'Host',
  admin: 'Administrador',
};

export const ALL_USER_ROLES: UserRole[] = ['host', 'admin'];
