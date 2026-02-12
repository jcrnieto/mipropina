"use client";

import { Users, QrCode, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Users,
    step: "01",
    title: "Cargá tus mozos",
    description: "El dueño del restaurante registra a cada mozo con su nombre y link de Mercado Pago desde el dashboard.",
    color: "gradient-primary",
    shadow: "shadow-primary/20",
  },
  {
    icon: QrCode,
    step: "02",
    title: "Generá el QR",
    description: "Se genera un QR único para cada mesa que apunta a mipropina.app/tu-restaurante. Imprimilo y listo.",
    color: "gradient-secondary",
    shadow: "shadow-secondary/20",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Recibí propinas",
    description: "El cliente escanea, elige al mozo y le transfiere la propina directo por Mercado Pago. ¡Sin efectivo!",
    color: "gradient-accent",
    shadow: "shadow-accent/20",
  },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Simple y rápido</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            ¿Cómo <span className="gradient-text">funciona</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            En 3 simples pasos, tus mozos empiezan a recibir propinas digitales
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className={`p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-xl ${step.shadow} group-hover:-translate-y-1 duration-300`}>
                <div className={`w-14 h-14 rounded-xl ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <step.icon size={24} className="text-primary-foreground" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Paso {step.step}</span>
                <h3 className="font-display text-xl font-bold mt-2 mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;