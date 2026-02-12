"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  "Mozos ilimitados",
  "QR personalizado para cada mesa",
  "Dashboard de gestión",
  "Links de Mercado Pago individuales",
  "Soporte por email",
  "Sin comisiones sobre las propinas",
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
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Precios</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            Un plan, <span className="gradient-text">todo incluido</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Empezá gratis durante 7 días. Sin tarjeta de crédito.
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
                <span className="text-sm font-semibold text-accent">Más popular</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">Plan Restaurante</h3>
              <div className="mt-4 mb-6">
                <span className="font-display text-5xl font-bold text-foreground">$4.999</span>
                <span className="text-muted-foreground ml-2">/mes</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                7 días de prueba gratis. Cancelá cuando quieras.
              </p>
              <Link href="/sign-up?plan=pro">
                <Button size="lg" className="w-full gradient-primary text-primary-foreground shadow-lg shadow-primary/25 h-12 text-base">
                  Empezá gratis
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
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
