import Link from "next/link";

export function PublicStoreFooter() {
  return (
    <footer className="mx-auto w-full max-w-sm rounded-2xl border border-white/65 bg-white/75 px-4 py-3 text-center shadow-[0_14px_30px_rgba(17,24,39,0.1)] backdrop-blur md:max-w-5xl md:px-6 md:py-4">
      <p className="text-sm text-[#415170] md:text-base">
        Vos tambien queres tu app de propinas?
        <Link href="/" className="ml-1 font-semibold text-[#2f66dc] transition-colors hover:text-[#244fb1]">
          mipropina.app
        </Link>
      </p>
    </footer>
  );
}
