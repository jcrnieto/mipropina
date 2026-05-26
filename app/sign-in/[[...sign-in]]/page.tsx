import { auth, currentUser } from "@clerk/nextjs/server";
import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams: Promise<{
    redirect_url?: string;
  }>;
};

function resolveInternalRedirectUrl(value: string | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }

  return value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const query = await searchParams;
  const redirectUrl = resolveInternalRedirectUrl(query.redirect_url ?? "/admin");
  const { userId } = await auth();
  if (userId) {
    redirect(redirectUrl);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
      />
    </main>
  );
}
