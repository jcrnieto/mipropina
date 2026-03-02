import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/app/lib/auth";
import { buildAdminPath } from "@/app/lib/brand";

export default async function AdminIndexPage() {
  const { onboarding } = await requireOnboardedUser();
  redirect(buildAdminPath(onboarding.brandSlug!));
}

