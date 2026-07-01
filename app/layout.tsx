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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://www.satixapp.com"),
  title: {
    default: "Satix | Detectá clientes insatisfechos antes de que dejen una mala reseña",
    template: "%s | Satix",
  },
  description:
    "Detectá malas experiencias en tu restaurante en tiempo real y actuá antes de que afecten tu reputación.",
  applicationName: "Satix",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Satix | Detectá clientes insatisfechos antes de que dejen una mala reseña",
    description:
      "Detectá malas experiencias en tu restaurante en tiempo real y actuá antes de que afecten tu reputación.",
    url: "/",
    siteName: "Satix",
    images: [
      {
        url: "/isologo-satix.png",
        width: 512,
        height: 512,
        alt: "Satix",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Satix | Detectá clientes insatisfechos antes de que dejen una mala reseña",
    description:
      "Detectá malas experiencias en tu restaurante en tiempo real y actuá antes de que afecten tu reputación.",
    images: ["/isologo-satix.png"],
  },
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
