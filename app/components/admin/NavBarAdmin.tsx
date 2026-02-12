import { UtensilsCrossed } from "lucide-react";

function NavBarAdmin() {
  return (
    <header className="w-full border border-[#dfdfdf] bg-[#f7f7f7] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e08a2c] text-white">
          <UtensilsCrossed className="h-5 w-5" />
        </div>

        <div className="leading-tight">
          <p className="font-serif text-4xl font-bold text-[#1f1f1f]">Mi Propina</p>
          <p className="text-sm text-[#7d7d7d]">Panel de Administración</p>
        </div>
      </div>
    </header>
  );
}

export { NavBarAdmin };
