// components/NavLink.tsx
"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";

type Href = LinkProps["href"];

export interface NavLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: Href;
  className?: string;
  activeClassName?: string;
  /** En Next no existe "pending" como en react-router; lo dejamos por compatibilidad */
  pendingClassName?: string;
  /**
   * Si querés que también marque activo en subrutas:
   * - exact: false -> /admin también activa en /admin/cars
   * - exact: true  -> solo match exacto
   */
  exact?: boolean;
}

function isActivePath(current: string, target: string, exact: boolean) {
  if (exact) return current === target;
  if (target === "/") return current === "/";
  return current === target || current.startsWith(target + "/");
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  (
    { className, activeClassName, pendingClassName, href, exact = true, ...props },
    ref,
  ) => {
    const pathname = usePathname();

    // Para comparar, si href es string lo usamos directo; si es objeto, tomamos pathname si existe
    const target =
      typeof href === "string"
        ? href
        : (href.pathname ? String(href.pathname) : "");

    const active = target ? isActivePath(pathname, target, exact) : false;

    return (
      <Link
        ref={ref}
        href={href}
        className={[className, active ? activeClassName : undefined].filter(Boolean).join(" ")}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";
