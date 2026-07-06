import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type PublicStoreHeaderProps = {
  backUrl: string;
};

export function PublicStoreHeader({ backUrl }: PublicStoreHeaderProps) {
  return (
    <header className="grid h-14 grid-cols-[3.5rem_1fr_3.5rem] items-center">
      <Link
        href={backUrl}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/78 text-[#14264d] shadow-[0_10px_25px_rgba(32,54,88,0.12)] transition hover:bg-white"
        aria-label="Volver"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      <div className="flex items-center justify-center gap-3">
        <Image src="/logo-satix.png" alt="Satix" width={118} height={42} className="h-9 w-auto" priority />
        <div className="hidden h-8 w-px bg-[#c7d2e6] min-[380px]:block" />
        <p className="hidden text-xs font-medium leading-4 text-[#66748f] min-[380px]:block">
          Tu negocio,
          <br />
          mas simple.
        </p>
      </div>
    </header>
  );
}
