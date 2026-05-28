"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  "QR listo para imprimir por restaurante",
  "Alertas por baja calificación",
  "Notificaciones al celular y por email",
  "Panel con calificaciones, comentarios y horarios",
  "Preguntas configurables por local",
  "Propinas digitales opcionales",
  "Soporte por email"
];

const Pricing = () => {
  return (
    <section id="pricing" className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">
            Precios
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            Un plan, <span className="gradient-text">todo incluido</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Pagás solo por cada restaurante activo. Sin costo de instalación ni planes complicados.
          </p>
        </motion.div>

        <motion.div
          className="mx-auto w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="gradient-primary relative rounded-3xl p-[2px] shadow-2xl shadow-primary/20">
            <div className="rounded-3xl bg-card px-5 py-8 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={20} className="shrink-0 text-accent" />
                <span className="text-sm font-semibold text-accent sm:text-base">
                  Sin costo de instalación
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
                Plan por restaurante
              </h3>

              <div className="mt-4 mb-6">
                <span className="font-display block text-[clamp(3.25rem,14vw,4.5rem)] font-bold leading-none tracking-normal text-foreground">
                  $15.000
                </span>
                <span className="font-display mt-2 block max-w-full text-[clamp(2.25rem,10vw,3.75rem)] font-bold leading-[1.06] tracking-normal text-foreground">
                  por restaurante activo
                </span>
                <span className="mt-2 block text-lg text-muted-foreground sm:text-xl">/mes</span>
              </div>

              <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                Activá el plan mensual para tu restaurante. Podés agregar más locales cuando quieras y el monto se actualiza en la próxima renovación.
              </p>

              <div className="space-y-2">
                <Link href="/sign-up?plan=trial&trialDays=7" className="block">
                  <Button
                    size="lg"
                    className="gradient-primary inline-flex h-12 w-full items-center justify-center gap-2 text-base text-primary-foreground shadow-lg shadow-primary/25"
                  >
                    Activar suscripción
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Button>
                </Link>
                {/* <Link href="/sign-up?plan=trial&trialDays=14">
                  <Button size="lg" className="w-full h-11 text-base border border-border bg-transparent text-foreground hover:bg-muted" variant="ghost">
                    Proba 14 dias
                  </Button>
                </Link> */}
              </div>

              <div className="mt-8 space-y-3">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-secondary/10">
                      <Check size={12} className="text-secondary" />
                    </div>
                    <span className="text-sm leading-snug text-foreground sm:text-base">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
