"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { ONBOARDING_FIELD_RULES } from "@/app/validations";

type PersonalDataState = {
  brandName: string;
  branchName: string;
  phone: string;
  address: string;
  instagram: string;
  facebook: string;
  tiktok: string;
};

const INITIAL_STATE: PersonalDataState = {
  brandName: "",
  branchName: "",
  phone: "",
  address: "",
  instagram: "",
  facebook: "",
  tiktok: "",
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
          restaurantData?: PersonalDataState;
          error?: string;
        };

        if (!response.ok || !json.ok || !json.restaurantData) {
          throw new Error(json.error || "No se pudieron cargar los datos del local.");
        }

        if (isMounted) {
          setForm(json.restaurantData);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los datos del local.");
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
          phone: form.phone,
          address: form.address,
          instagram: form.instagram,
          facebook: form.facebook,
          tiktok: form.tiktok,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        restaurantData?: PersonalDataState;
        error?: string;
      };

      if (!response.ok || !json.ok || !json.restaurantData) {
        throw new Error(json.error || "No se pudieron guardar los datos del local.");
      }

      setForm(json.restaurantData);
      setSuccess("Datos del local actualizados correctamente.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudieron guardar los datos del local.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#d8e0ef] bg-white p-6 shadow-[0_10px_25px_rgba(30,48,90,0.08)]">
      <h2 className="mb-1 font-display text-2xl font-bold text-[#122443]">Datos del local</h2>
      <p className="mb-5 text-sm text-[#607193]">
        Edita la informacion publica de este local. La marca no se puede modificar desde aca.
      </p>

      {isLoading ? <p className="text-sm text-[#607193]">Cargando datos del local...</p> : null}

      {!isLoading ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="admin-phone" className="text-sm font-medium text-[#22365f]">
              Telefono
            </label>
            <input
              id="admin-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              required
              minLength={ONBOARDING_FIELD_RULES.phone.minLength}
              maxLength={ONBOARDING_FIELD_RULES.phone.maxLength}
              value={form.phone}
              onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
              className="h-11 w-full rounded-xl border border-[#d6dfef] bg-[#f8fbff] px-3.5 text-sm text-[#1b2c4e] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="admin-address" className="text-sm font-medium text-[#22365f]">
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
              className="h-11 w-full rounded-xl border border-[#d6dfef] bg-[#f8fbff] px-3.5 text-sm text-[#1b2c4e] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="admin-branchName" className="text-sm font-medium text-[#22365f]">
              Local
            </label>
            <input
              id="admin-branchName"
              name="branchName"
              type="text"
              value={form.branchName || "Casa central"}
              readOnly
              disabled
              className="h-11 w-full cursor-not-allowed rounded-xl border border-[#dfe5f2] bg-[#eef3fb] px-3.5 text-sm text-[#66789b]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="admin-brandName" className="text-sm font-medium text-[#22365f]">
              Marca
            </label>
            <input
              id="admin-brandName"
              name="brandName"
              type="text"
              value={form.brandName}
              readOnly
              disabled
              className="h-11 w-full cursor-not-allowed rounded-xl border border-[#dfe5f2] bg-[#eef3fb] px-3.5 text-sm text-[#66789b]"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-[#d6dfef] bg-[#f8fbff] p-4">
            <p className="text-sm font-semibold text-[#1b2c4e]">Redes sociales</p>
            <p className="text-xs text-[#607193]">
              Carga solo las que uses. Si dejas un campo vacio, no se mostrara en el public store.
            </p>

            <div className="space-y-1">
              <label htmlFor="admin-instagram" className="text-sm font-medium text-[#22365f]">
                Instagram
              </label>
              <input
                id="admin-instagram"
                name="instagram"
                type="url"
                inputMode="url"
                placeholder="https://instagram.com/tu-cuenta"
                value={form.instagram}
                onChange={(event) => setForm((previous) => ({ ...previous, instagram: event.target.value }))}
                className="h-11 w-full rounded-xl border border-[#d6dfef] bg-white px-3.5 text-sm text-[#1b2c4e] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="admin-facebook" className="text-sm font-medium text-[#22365f]">
                Facebook
              </label>
              <input
                id="admin-facebook"
                name="facebook"
                type="url"
                inputMode="url"
                placeholder="https://facebook.com/tu-pagina"
                value={form.facebook}
                onChange={(event) => setForm((previous) => ({ ...previous, facebook: event.target.value }))}
                className="h-11 w-full rounded-xl border border-[#d6dfef] bg-white px-3.5 text-sm text-[#1b2c4e] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="admin-tiktok" className="text-sm font-medium text-[#22365f]">
                TikTok
              </label>
              <input
                id="admin-tiktok"
                name="tiktok"
                type="url"
                inputMode="url"
                placeholder="https://www.tiktok.com/@tu-cuenta"
                value={form.tiktok}
                onChange={(event) => setForm((previous) => ({ ...previous, tiktok: event.target.value }))}
                className="h-11 w-full rounded-xl border border-[#d6dfef] bg-white px-3.5 text-sm text-[#1b2c4e] outline-none transition focus:border-[#5f88ea] focus:ring-2 focus:ring-[#5f88ea]/20"
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-[#0f8a61]">{success}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2f66dc] bg-[#2f66dc] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2457c4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
