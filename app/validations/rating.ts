export const RATING_MAX_FEATURES = 5;
export const RATING_FEATURE_MAX_LENGTH = 80;

export type RatingConfigValues = {
  features: string[];
};

export type RatingConfigValidationResult = {
  isValid: boolean;
  errors: string[];
  values: RatingConfigValues;
};

export function validateRatingConfig(values: RatingConfigValues): RatingConfigValidationResult {
  const normalized = values.features
    .map((feature) => feature.trim())
    .filter((feature) => feature.length > 0);

  const errors: string[] = [];

  if (normalized.length > RATING_MAX_FEATURES) {
    errors.push(`No podes guardar mas de ${RATING_MAX_FEATURES} caracteristicas.`);
  }

  if (normalized.some((feature) => feature.length > RATING_FEATURE_MAX_LENGTH)) {
    errors.push(`Cada caracteristica puede tener hasta ${RATING_FEATURE_MAX_LENGTH} caracteres.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    values: {
      features: normalized.slice(0, RATING_MAX_FEATURES),
    },
  };
}
