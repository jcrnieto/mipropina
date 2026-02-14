"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { ONBOARDING_FIELD_RULES } from "@/app/validations";

type PersonalDataState = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  brandName: string;
};

const INITIAL_STATE: PersonalDataState = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  brandName: "",
};

export function PersonalDataEditor() {
  const [form, setForm] = useState<PersonalDataState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await fetch("/api/admin/personal-data", { method: "GET", cache: "no-store" });
        const json = (await response.json()) as {
          ok: boolean;
          personalData?: PersonalDataState;
          error?: string;
        };

        if (!response.ok || !json.ok || !json.personalData) {
          throw new Error(json.error || "No se pudieron cargar tus datos.");
        }

        if (isMounted) {
          setForm(json.personalData);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar tus datos.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/personal-data", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          address: form.address,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        personalData?: PersonalDataState;
        error?: string;
      };

      if (!response.ok || !json.ok || !json.personalData) {
        throw new Error(json.error || "No se pudieron guardar tus datos.");
      }

      setForm(json.personalData);
      setSuccess("Datos actualizados correctamente.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudieron guardar tus datos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#ddd6ce] bg-[#fbfbfb] p-6">
      <h2 className="mb-1 font-serif text-4xl font-bold leading-none text-[#1d1d1b]">Datos Personales</h2>
      <p className="mb-5 text-sm text-[#7a7065]">
        Podes editar nombre, apellido, telefono y direccion. La marca no se puede modificar.
      </p>

      {isLoading ? <p className="text-sm text-[#7a7065]">Cargando datos...</p> : null}

      {!isLoading ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="admin-firstName" className="text-sm font-medium text-[#1d1d1b]">
                Nombre
              </label>
              <input
                id="admin-firstName"
                name="firstName"
                type="text"
                required
                minLength={ONBOARDING_FIELD_RULES.firstName.minLength}
                maxLength={ONBOARDING_FIELD_RULES.firstName.maxLength}
                value={form.firstName}
                onChange={(event) => setForm((previous) => ({ ...previous, firstName: event.target.value }))}
                className="h-11 w-full rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-3.5 text-sm text-[#1d1d1b] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="admin-lastName" className="text-sm font-medium text-[#1d1d1b]">
                Apellido
              </label>
              <input
                id="admin-lastName"
                name="lastName"
                type="text"
                required
                minLength={ONBOARDING_FIELD_RULES.lastName.minLength}
                maxLength={ONBOARDING_FIELD_RULES.lastName.maxLength}
                value={form.lastName}
                onChange={(event) => setForm((previous) => ({ ...previous, lastName: event.target.value }))}
                className="h-11 w-full rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-3.5 text-sm text-[#1d1d1b] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="admin-phone" className="text-sm font-medium text-[#1d1d1b]">
              Telefono
            </label>
            <input
              id="admin-phone"
              name="phone"
              type="tel"
              required
              minLength={ONBOARDING_FIELD_RULES.phone.minLength}
              maxLength={ONBOARDING_FIELD_RULES.phone.maxLength}
              pattern={ONBOARDING_FIELD_RULES.phone.pattern}
              value={form.phone}
              onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
              className="h-11 w-full rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-3.5 text-sm text-[#1d1d1b] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="admin-address" className="text-sm font-medium text-[#1d1d1b]">
              Direccion
            </label>
            <input
              id="admin-address"
              name="address"
              type="text"
              required
              minLength={ONBOARDING_FIELD_RULES.address.minLength}
              maxLength={ONBOARDING_FIELD_RULES.address.maxLength}
              value={form.address}
              onChange={(event) => setForm((previous) => ({ ...previous, address: event.target.value }))}
              className="h-11 w-full rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-3.5 text-sm text-[#1d1d1b] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="admin-brandName" className="text-sm font-medium text-[#1d1d1b]">
              Marca
            </label>
            <input
              id="admin-brandName"
              name="brandName"
              type="text"
              value={form.brandName}
              readOnly
              disabled
              className="h-11 w-full cursor-not-allowed rounded-xl border border-[#e0dad2] bg-[#efebe6] px-3.5 text-sm text-[#7a7065]"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-[#0f8a61]">{success}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm font-medium text-[#1d1d1b] transition-colors hover:bg-[#efece8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
