"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Printer } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

type RestaurantQRProps = {
  storePath: string;
};

export function RestaurantQR({ storePath }: RestaurantQRProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const publicUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL || "https://satixapp.com";
    return `${base.replace(/\/+$/, "")}${storePath}`;
  }, [storePath]);

  const downloadPng = () => {
    const canvas = (containerRef.current?.querySelector("canvas") as HTMLCanvasElement) || canvasRef.current;
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = pngUrl;
    anchor.download = `qr-${storePath.replace(/\//g, "-")}.png`;
    anchor.click();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1200);
  };

  return (
    <section className="rounded-xl border border-[#ddd6ce] bg-[#fbfbfb] p-6">
      <h2 className="mb-5 font-serif text-4xl font-bold leading-none text-[#1d1d1b]">QR del Restaurante</h2>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        <div ref={containerRef} className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e7cda8] bg-white p-2">
          <QRCodeCanvas value={publicUrl} size={96} level="M" includeMargin />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-[#7a7065]">
            Comparti este QR para que tus clientes entren directo a la pagina publica.
          </p>
          <p className="max-w-full break-all rounded-lg border border-[#e5ded6] bg-[#f6f4f1] px-3 py-2 text-xs text-[#5f574d]">
            {publicUrl}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void copyLink();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm font-medium text-[#1d1d1b] transition-colors hover:bg-[#efece8]"
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {isCopied ? "Copiado" : "Copiar link"}
            </button>
            <button
              type="button"
              onClick={downloadPng}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm font-medium text-[#1d1d1b] transition-colors hover:bg-[#efece8]"
            >
              <Download className="h-4 w-4" />
              Descargar PNG
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d9d2ca] bg-[#f6f4f1] px-4 py-2 text-sm font-medium text-[#1d1d1b] transition-colors hover:bg-[#efece8]"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
