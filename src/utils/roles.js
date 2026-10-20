export const ROLES = ["ADMIN", "GESTOR", "CLIENTE"];

export function canShop(hasRole) {
  return !hasRole("ADMIN", "GESTOR") || hasRole("CLIENTE");
}
