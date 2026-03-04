import { SignUp } from "@clerk/nextjs";

type SignUpPageProps = {
  searchParams: Promise<{
    plan?: string;
    trialDays?: string;
  }>;
};

function resolvePlan(plan?: string): "trial" | "subscription" {
  return plan === "trial" ? "trial" : "subscription";
}

function resolveTrialDays(days?: string): "7" | "14" {
  return days === "14" ? "14" : "7";
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const query = await searchParams;
  const plan = resolvePlan(query.plan);
  const trialDays = resolveTrialDays(query.trialDays);
  const onboardingUrl = `/onboarding?plan=${plan}&trialDays=${trialDays}`;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl={onboardingUrl}
        forceRedirectUrl={onboardingUrl}
      />
    </main>
  );
}
