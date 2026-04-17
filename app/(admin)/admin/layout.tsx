import { requireOnboardedUser } from "@/app/lib/auth";
import { OneSignalInit } from "@/app/components/admin/OneSignalInit";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await requireOnboardedUser();

  return (
    <>
      <OneSignalInit externalId={user.id} />
      {children}
    </>
  );
}

