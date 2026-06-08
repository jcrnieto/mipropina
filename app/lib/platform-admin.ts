import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

const PLATFORM_ADMIN_ROLE = "platform_admin";

export async function requirePlatformAdmin() {
  const user = await currentUser();

  if (!user) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/panel-control")}`);
  }

  if (user.privateMetadata.role !== PLATFORM_ADMIN_ROLE) {
    if (process.env.NODE_ENV === "development") {
      redirect("/panel-control/access-denied");
    }

    notFound();
  }

  return user;
}
