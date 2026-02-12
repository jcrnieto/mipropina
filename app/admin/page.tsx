import { redirect } from "next/navigation";
import { requireOnboardedUser } from "../lib/auth";
import { buildAdminPath } from "../lib/brand";

export default async function AdminIndexPage() {
  const { onboarding } = await requireOnboardedUser();
  redirect(buildAdminPath(onboarding.brandSlug!));
}
