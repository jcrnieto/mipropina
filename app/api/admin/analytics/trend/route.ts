import { auth } from "@clerk/nextjs/server";
import { getAnalyticsTrendByClerkId } from "@/app/lib/server/modules/analytics/analytics.service";
import { resolveAnalyticsDateRange } from "@/app/api/admin/analytics/utils";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = resolveAnalyticsDateRange(searchParams);
    const trend = await getAnalyticsTrendByClerkId({
      clerkUserId: userId,
      range,
    });

    return Response.json({ ok: true, trend, range });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo cargar la tendencia." },
      { status: 500 },
    );
  }
}
