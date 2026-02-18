"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  const handleRegisterClick = () => {
    localStorage.setItem("signupIntent", "pro");
    setIsOpen(false);
    router.push("/sign-up?plan=pro");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="font-display text-2xl font-bold gradient-text">
          Evalúa
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <button
            onClick={() => scrollTo("como-funciona")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Como funciona
          </button>
          <button
            onClick={() => scrollTo("testimonios")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Testimonios
          </button>
          <button
            onClick={() => scrollTo("pricing")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Precios
          </button>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Iniciar sesion
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleRegisterClick}
            className="gradient-primary text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-primary/40"
          >
            Registrarse
          </Button>
        </div>

        <button className="p-2 md:hidden" onClick={() => setIsOpen((prev) => !prev)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {isOpen && (
        <div className="space-y-3 border-b border-border bg-background px-4 pb-4 md:hidden">
          <button
            onClick={() => scrollTo("como-funciona")}
            className="block w-full py-2 text-left text-sm font-medium text-muted-foreground"
          >
            Como funciona
          </button>
          <button
            onClick={() => scrollTo("testimonios")}
            className="block w-full py-2 text-left text-sm font-medium text-muted-foreground"
          >
            Testimonios
          </button>
          <button
            onClick={() => scrollTo("pricing")}
            className="block w-full py-2 text-left text-sm font-medium text-muted-foreground"
          >
            Precios
          </button>
          <Link href="/sign-in" className="block">
            <Button variant="ghost" className="w-full">
              Iniciar sesion
            </Button>
          </Link>
          <Button onClick={handleRegisterClick} className="w-full gradient-primary text-primary-foreground">
            Registrarse gratis
          </Button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
