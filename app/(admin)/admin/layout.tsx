import { requireOnboardedUser } from "@/app/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireOnboardedUser();

  return <>{children}</>;
}

