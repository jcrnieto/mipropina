"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "¿Satix es una encuesta?",
    answer:
      "No. Satix funciona como un sistema de alerta temprana. El cliente califica su experiencia desde la mesa en pocos segundos y, si algo sale mal, el dueño o encargado recibe una alerta para poder intervenir a tiempo.",
  },
  {
    question: "¿El cliente tiene que descargar una app?",
    answer:
      "No. El cliente solo escanea el QR desde la mesa y accede a una página web. No necesita descargar nada ni crear una cuenta.",
  },
  {
    question: "¿Cuándo recibo una alerta?",
    answer:
      "Recibís una alerta cuando una calificación indica una mala experiencia, por ejemplo 1 o 2 estrellas. La alerta puede llegar al celular y por email para que puedas actuar antes de que el cliente se vaya.",
  },
  {
    question: "¿Quién recibe las alertas?",
    answer:
      "Podés configurar si las recibe el dueño, el encargado o ambos. La idea es que la persona correcta se entere en el momento correcto.",
  },
  {
    question: "¿Qué puede calificar el cliente?",
    answer:
      "Cada restaurante puede configurar sus propios puntos críticos. Por ejemplo: atención del mozo, tiempo de espera, comida, limpieza o cualquier otro aspecto importante del servicio.",
  },
  {
    question: "¿Qué pasa si los clientes no escanean el QR?",
    answer:
      "Satix está diseñado para que la calificación sea rápida y simple, pero la ubicación del QR y el mensaje en la mesa son claves. Recomendamos colocarlo visible y usar frases como: “¿Algo no estuvo bien? Avisanos antes de irte”.",
  },
  {
    question: "¿Satix evita todas las malas reseñas?",
    answer:
      "No podemos garantizar que no recibas malas reseñas. Lo que sí hace Satix es darte una oportunidad de detectar clientes insatisfechos mientras todavía están en el local, para que puedas resolver el problema antes de que se vayan.",
  },
  {
    question: "¿Cómo funciona el precio?",
    answer:
      "Satix cuesta $15.000 por mes por cada restaurante activo. No hay costo de instalación. Si agregás más restaurantes, el monto se actualiza en la próxima renovación.",
  },
];

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Preguntas frecuentes
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            Resolvemos dudas operativas antes de que te registres
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Esta sección te ayuda a bajar dudas operativas y objeciones antes de que el dueño se registre.
          </p>
        </motion.div>

        <div className="grid gap-4 max-w-3xl mx-auto">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={faq.question}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(index)}
                  className="flex w-full items-center justify-between gap-4 text-left text-lg font-semibold text-foreground"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                  />
                </button>

                {isOpen && (
                  <p className="mt-4 text-muted-foreground leading-7">{faq.answer}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Faq;
