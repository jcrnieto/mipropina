import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/app/lib/auth";

export default async function AdminIndexPage() {
  const { onboarding } = await requireOnboardedUser();
  redirect(onboarding.adminPath ?? "/admin");
}

