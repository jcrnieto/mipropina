import { redirect } from "next/navigation";

type AuthLegacyPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AuthLegacyPage({ searchParams }: AuthLegacyPageProps) {
  const { tab } = await searchParams;

  if (tab === "register") {
    redirect("/sign-up?plan=pro");
  }

  redirect("/sign-in");
}
