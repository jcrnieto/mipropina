import { requireOnboardedUser } from "../lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireOnboardedUser();

  return <>{children}</>;
}
