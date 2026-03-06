import { auth } from "@clerk/nextjs/server";
import { getAnalyticsExperiencesByClerkId } from "@/app/lib/server/modules/analytics/analytics.service";
import { readPositiveInt, resolveAnalyticsDateRange } from "@/app/api/admin/analytics/utils";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = resolveAnalyticsDateRange(searchParams);
    const limit = readPositiveInt(searchParams, "limit", 20, 200);
    const offset = readPositiveInt(searchParams, "offset", 0, 10000);

    const experiences = await getAnalyticsExperiencesByClerkId({
      clerkUserId: userId,
      range,
      limit,
      offset,
    });

    return Response.json({ ok: true, ...experiences, range });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo cargar el detalle de experiencias." },
      { status: 500 },
    );
  }
}
