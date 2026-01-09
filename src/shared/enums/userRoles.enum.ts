export const userRolesEnum = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export const userRolesArr = Object.values(userRolesEnum);
