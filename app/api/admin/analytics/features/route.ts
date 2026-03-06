import { auth } from "@clerk/nextjs/server";
import { getAnalyticsFeatureRankingByClerkId } from "@/app/lib/server/modules/analytics/analytics.service";
import { resolveAnalyticsDateRange } from "@/app/api/admin/analytics/utils";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = resolveAnalyticsDateRange(searchParams);
    const features = await getAnalyticsFeatureRankingByClerkId({
      clerkUserId: userId,
      range,
    });

    return Response.json({ ok: true, features, range });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo cargar el ranking por criterio." },
      { status: 500 },
    );
  }
}
