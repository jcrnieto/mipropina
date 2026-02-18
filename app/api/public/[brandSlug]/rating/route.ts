import {
  createRatingSubmissionByBrandSlug,
  getRatingFeaturesByBrandSlug,
} from "@/app/lib/supabase/admin";

type RouteProps = {
  params: Promise<{ brandSlug: string }>;
};

type RatingPayload = {
  stars?: unknown;
  comment?: unknown;
};

function readStars(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "number" ? item : Number(item)))
    .filter((item) => Number.isFinite(item));
}

function readComment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: Request, { params }: RouteProps) {
  try {
    const { brandSlug } = await params;
    if (!brandSlug) {
      return Response.json({ ok: false, error: "brandSlug is required" }, { status: 400 });
    }

    const body = (await req.json()) as RatingPayload;
    const starsInput = readStars(body.stars);
    const configuredFeatures = await getRatingFeaturesByBrandSlug(brandSlug);

    if (configuredFeatures.length === 0) {
      return Response.json(
        { ok: false, error: "Este restaurante no tiene caracteristicas para calificar." },
        { status: 400 },
      );
    }

    if (starsInput.length !== configuredFeatures.length) {
      return Response.json(
        { ok: false, error: "La cantidad de puntajes no coincide con las caracteristicas configuradas." },
        { status: 400 },
      );
    }

    const invalid = starsInput.some((value) => !Number.isInteger(value) || value < 1 || value > 5);
    if (invalid) {
      return Response.json(
        { ok: false, error: "Cada puntaje debe ser un numero entero entre 1 y 5." },
        { status: 400 },
      );
    }

    const normalizedStars: Array<number | null> = [null, null, null, null, null];
    starsInput.forEach((value, index) => {
      if (index < normalizedStars.length) {
        normalizedStars[index] = value;
      }
    });

    await createRatingSubmissionByBrandSlug({
      brandSlug,
      stars: normalizedStars,
      comment: readComment(body.comment),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo guardar la calificacion." },
      { status: 500 },
    );
  }
}
