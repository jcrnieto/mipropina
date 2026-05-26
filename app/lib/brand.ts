export function slugifyBrand(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildAdminPath(brandSlug: string, restaurantSlug?: string): string {
  if (!restaurantSlug) {
    return `/admin/${brandSlug}`;
  }
  return `/admin/${brandSlug}/${restaurantSlug}`;
}

export function buildStorePath(brandPublicPath: string, restaurantSlug: string): string {
  return `/${brandPublicPath}/${restaurantSlug}`;
}
