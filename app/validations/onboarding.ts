import { slugifyBrand } from "../lib/brand";

export type OnboardingFormValues = {
  brandName: string;
  brandSlug: string;
  restaurantName: string;
  restaurantSlug: string;
};

export type PersonalDataEditableValues = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
};

export type OnboardingValidationResult = {
  isValid: boolean;
  errors: Partial<Record<keyof OnboardingFormValues, string>>;
  values: OnboardingFormValues;
};

export type PersonalDataValidationResult = {
  isValid: boolean;
  errors: Partial<Record<keyof PersonalDataEditableValues, string>>;
  values: PersonalDataEditableValues;
};

const NAME_REGEX = /^[A-Za-zÀ-ÿ' -]+$/;
const PHONE_REGEX = /^[0-9+() -]+$/;

export const ONBOARDING_FIELD_RULES = {
  firstName: { minLength: 2, maxLength: 60 },
  lastName: { minLength: 2, maxLength: 60 },
  phone: { minLength: 8, maxLength: 24, pattern: "[-0-9+() ]+" },
  address: { minLength: 5, maxLength: 120 },
  brandName: { minLength: 2, maxLength: 80 },
  brandSlug: { minLength: 2, maxLength: 80 },
  restaurantName: { minLength: 2, maxLength: 80 },
  restaurantSlug: { minLength: 2, maxLength: 80 },
} as const;

function validateEditableFields(values: PersonalDataEditableValues): PersonalDataValidationResult {
  const clean = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: values.phone.trim(),
    address: values.address.trim(),
  };
  const errors: PersonalDataValidationResult["errors"] = {};

  if (
    clean.firstName.length < ONBOARDING_FIELD_RULES.firstName.minLength ||
    clean.firstName.length > ONBOARDING_FIELD_RULES.firstName.maxLength ||
    !NAME_REGEX.test(clean.firstName)
  ) {
    errors.firstName = "Nombre invalido";
  }

  if (
    clean.lastName.length < ONBOARDING_FIELD_RULES.lastName.minLength ||
    clean.lastName.length > ONBOARDING_FIELD_RULES.lastName.maxLength ||
    !NAME_REGEX.test(clean.lastName)
  ) {
    errors.lastName = "Apellido invalido";
  }

  if (
    clean.phone.length < ONBOARDING_FIELD_RULES.phone.minLength ||
    clean.phone.length > ONBOARDING_FIELD_RULES.phone.maxLength ||
    !PHONE_REGEX.test(clean.phone)
  ) {
    errors.phone = "Telefono invalido";
  }

  if (
    clean.address.length < ONBOARDING_FIELD_RULES.address.minLength ||
    clean.address.length > ONBOARDING_FIELD_RULES.address.maxLength
  ) {
    errors.address = "Direccion invalida";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: clean,
  };
}

export function validatePersonalDataEditable(
  values: PersonalDataEditableValues,
): PersonalDataValidationResult {
  return validateEditableFields(values);
}

export function validateOnboardingForm(values: OnboardingFormValues): OnboardingValidationResult {
  const clean = {
    brandName: values.brandName.trim(),
    brandSlug: slugifyBrand(values.brandSlug),
    restaurantName: values.restaurantName.trim(),
    restaurantSlug: slugifyBrand(values.restaurantSlug),
  };
  const errors: OnboardingValidationResult["errors"] = {
  };

  if (
    clean.brandName.length < ONBOARDING_FIELD_RULES.brandName.minLength ||
    clean.brandName.length > ONBOARDING_FIELD_RULES.brandName.maxLength ||
    !slugifyBrand(clean.brandName)
  ) {
    errors.brandName = "Marca invalida";
  }

  if (
    clean.brandSlug.length < ONBOARDING_FIELD_RULES.brandSlug.minLength ||
    clean.brandSlug.length > ONBOARDING_FIELD_RULES.brandSlug.maxLength
  ) {
    errors.brandSlug = "Slug de marca invalido";
  }

  if (
    clean.restaurantName.length < ONBOARDING_FIELD_RULES.restaurantName.minLength ||
    clean.restaurantName.length > ONBOARDING_FIELD_RULES.restaurantName.maxLength
  ) {
    errors.restaurantName = "Nombre de local invalido";
  }

  if (
    clean.restaurantSlug.length < ONBOARDING_FIELD_RULES.restaurantSlug.minLength ||
    clean.restaurantSlug.length > ONBOARDING_FIELD_RULES.restaurantSlug.maxLength
  ) {
    errors.restaurantSlug = "Slug de local invalido";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: clean,
  };
}
