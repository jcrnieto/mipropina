"use server";
import React from "react";
import BackfillButton from "./BackfillButton";
import { requireSignedInUser, resolveOnboardingDataForUser } from "@/app/lib/auth";

export default async function DebugOnboardingPage() {
  const user = await requireSignedInUser();
  const onboarding = await resolveOnboardingDataForUser(user);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug: Onboarding metadata</h1>
      <pre className="rounded-md border bg-white p-4 text-sm">{JSON.stringify(onboarding, null, 2)}</pre>

      <div className="mt-4">
        <BackfillButton />
      </div>
    </main>
  );
}
