"use client";

import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Roberto MÃ©ndez",
    role: "DueÃ±o de La Parrilla del Sur",
    quote: "Desde que implementamos MiPropina, mis mozos reciben un 40% mÃ¡s de propinas. Los clientes lo aman porque es rÃ¡pido y fÃ¡cil.",
    initials: "RM",
    gradient: "gradient-primary",
  },
  {
    name: "Camila Torres",
    role: "Moza en CafÃ© Central",
    quote: "Antes muchos clientes no dejaban propina porque no tenÃ­an efectivo. Ahora con el QR es automÃ¡tico, Â¡genial!",
    initials: "CT",
    gradient: "gradient-secondary",
  },
  {
    name: "MartÃ­n SuÃ¡rez",
    role: "Gerente de Restaurante Olivia",
    quote: "La plataforma es sÃºper intuitiva. En 5 minutos carguÃ© a todos mis mozos y ya estÃ¡bamos funcionando. El trial gratis fue clave.",
    initials: "MS",
    gradient: "gradient-accent",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonios" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Testimonios</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            Lo que dicen <span className="gradient-text">nuestros usuarios</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} className="fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <Avatar className="w-11 h-11">
                  <AvatarFallback className={`${t.gradient} text-primary-foreground font-bold text-sm`}>
                    {t.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;


