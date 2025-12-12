export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  SUPERADMIN: 'SUPERADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
