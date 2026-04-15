import { auth } from "@clerk/nextjs/server";
import { getAnalyticsWaiterRankingByClerkId } from "@/app/lib/server/modules/analytics/analytics.service";
import { readPositiveInt, resolveAnalyticsDateRange } from "@/app/api/admin/analytics/utils";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = resolveAnalyticsDateRange(searchParams);
    const minSamples = readPositiveInt(searchParams, "minSamples", 1, 100);
    const brandSlug = searchParams.get("brandSlug");

    const waiters = await getAnalyticsWaiterRankingByClerkId({
      clerkUserId: userId,
      range,
      minSamples,
      brandSlug,
    });

    return Response.json({ ok: true, waiters, minSamples, range });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo cargar el ranking de mozos." },
      { status: 500 },
    );
  }
}
