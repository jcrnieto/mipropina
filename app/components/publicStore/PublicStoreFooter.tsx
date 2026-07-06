import Link from "next/link";

export function PublicStoreFooter() {
  return (
    <footer className="mx-auto w-full px-2 pb-1 pt-2 text-center">
      <p className="text-xs font-medium text-[#6f7d99] sm:text-sm">
        Queres una experiencia digital para tu local?
        <Link href="/" className="ml-1 font-semibold text-[#2f66dc] transition-colors hover:text-[#244fb1]">
          satix.app
        </Link>
      </p>
    </footer>
  );
}
