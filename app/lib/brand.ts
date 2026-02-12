export function slugifyBrand(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildAdminPath(brandSlug: string): string {
  return `/admin/${brandSlug}`;
}

export function buildStorePath(brandSlug: string): string {
  return `/${brandSlug}`;
}
