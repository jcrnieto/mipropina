"use client";

import { CreditCard, BookOpen, QrCode } from "lucide-react";
import { motion } from "framer-motion";

const tools = [
  {
    icon: CreditCard,
    title: "Propinas digitales",
    subtitle: "Propinas sin efectivo",
    description:
      "Tus clientes pueden dejar propina desde el QR, sin depender de tener efectivo en la mesa.",
    color: "gradient-primary",
    shadow: "shadow-primary/20",
  },
  {
    icon: BookOpen,
    title: "Carta digital",
    subtitle: "Carta digital siempre disponible",
    description:
      "Mostrá tu menú desde el mismo QR para que tus clientes puedan consultarlo sin esperar una carta física.",
    color: "gradient-secondary",
    shadow: "shadow-secondary/20",
  },
  {
    icon: QrCode,
    title: "Todo desde un mismo QR",
    subtitle: "Un QR, varias acciones",
    description:
      "El cliente puede calificar su experiencia, ver la carta o dejar propina desde una misma experiencia simple.",
    color: "gradient-accent",
    shadow: "shadow-accent/20",
  },
];

const ExtraTools = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Sección extra recomendada
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            Más herramientas para mejorar la <span className="gradient-text">experiencia en mesa</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Además de detectar problemas a tiempo, Satix puede ayudarte a reducir fricción en otros momentos del servicio.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div
                className={`p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-xl ${tool.shadow} group-hover:-translate-y-1 duration-300`}
              >
                <div
                  className={`w-14 h-14 rounded-xl ${tool.color} flex items-center justify-center mb-6 shadow-lg`}
                >
                  <tool.icon size={24} className="text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold mt-2 mb-2 text-foreground">
                  {tool.title}
                </h3>
                <span className="text-sm font-semibold text-primary uppercase tracking-widest mb-3 block">
                  {tool.subtitle}
                </span>
                <p className="text-muted-foreground leading-relaxed">{tool.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExtraTools;