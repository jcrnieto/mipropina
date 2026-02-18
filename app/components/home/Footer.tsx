"use client";

import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="font-display text-xl font-bold gradient-text">
            Evalúa
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Contacto</a>
            <a href="#" className="hover:text-foreground transition-colors">Términos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Evalúa. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;