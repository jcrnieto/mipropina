"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  "QR personalizado",
  "Dashboard de metricas y feedback",
  "Configuracion de aspectos a evaluar",
  "Integracion con Mercado Pago (propinas)",
  "Soporte por email",
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-background">
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
            Empeza gratis durante 7 o 14 dias. Sin tarjeta de credito.
          </p>
        </motion.div>

        <motion.div
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative rounded-3xl gradient-primary p-[2px] shadow-2xl shadow-primary/20">
            <div className="rounded-3xl bg-card p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-accent" />
                <span className="text-sm font-semibold text-accent">
                  Mas popular
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-foreground">
                Plan Restaurante
              </h3>

              <div className="mt-4 mb-6">
                <span className="font-display text-5xl font-bold text-foreground">
                  $15.000
                </span>
                <span className="text-muted-foreground ml-2">/mes</span>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Elegi prueba de 7 o 14 dias. Luego podes activar suscripcion mensual.
              </p>

              <div className="space-y-2">
                <Link href="/sign-up?plan=trial&trialDays=7">
                  <Button
                    size="lg"
                    className="w-full gradient-primary text-primary-foreground shadow-lg shadow-primary/25 h-12 text-base"
                  >
                    Proba 7 dias
                    <ArrowRight className="ml-2" size={18} />
                  </Button>
                </Link>
                <Link href="/sign-up?plan=trial&trialDays=14">
                  <Button size="lg" className="w-full h-11 text-base border border-border bg-transparent text-foreground hover:bg-muted" variant="ghost">
                    Proba 14 dias
                  </Button>
                </Link>
              </div>

              <div className="mt-8 space-y-3">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-secondary" />
                    </div>
                    <span className="text-sm text-foreground">{f}</span>
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
