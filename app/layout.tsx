import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { clerkSpanishLocalization } from "@/app/lib/clerk-localization";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Satix | Propinas digitales para restaurantes",
    template: "%s | Satix",
  },
  description:
    "Recibi propinas digitales con QR y Mercado Pago para tus mozos, sin efectivo y sin friccion.",
  applicationName: "Satix",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Satix",
  },
  icons: {
    icon: "/icon?size=192",
    apple: "/apple-icon",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={clerkSpanishLocalization}>
      <html lang="es" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
