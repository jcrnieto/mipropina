"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { MessageSquare, Mail, Phone, X } from "lucide-react";
import { motion } from "framer-motion";

const Contact = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    restaurante: "",
    cantidad: "",
    mensaje: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Error al enviar el formulario");
      }

      setSubmitMessage({
        type: "success",
        text: "¡Gracias! Nos comunicaremos pronto.",
      });
      setFormData({ nombre: "", email: "", restaurante: "", cantidad: "", mensaje: "" });
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: "Hubo un error. Intentá de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            CONTACTO
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            ¿Tenés dudas antes de activar <span className="gradient-text">Satix</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-8">
            Escribinos y te ayudamos a entender si Satix tiene sentido para tu restaurante, cómo configurarlo y cómo empezar a recibir alertas desde las mesas.
          </p>
        </motion.div>

        <motion.div
          className="rounded-[2rem] border border-border bg-card p-8 shadow-2xl shadow-primary/10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] items-start">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-foreground">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Hablemos de tu restaurante</p>
                  <h3 className="font-display text-2xl font-bold mt-2 text-foreground">
                    Tenés dudas sobre el QR, las alertas o la configuración?
                  </h3>
                </div>
              </div>

              <p className="text-muted-foreground leading-8">
                Podemos ayudarte a definir qué puntos críticos conviene calificar en tu local y cómo colocar el QR para que tus clientes lo usen.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <a
                  href="https://wa.me/5493516468746"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
                >
                  <Phone size={18} />
                  Hablar por WhatsApp
                </a>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted px-5 py-3 text-base font-medium text-foreground transition hover:bg-muted/80"
                >
                  <Mail size={18} />
                  Enviar consulta por email
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-background/80 border border-border p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary mb-4">
                Respondemos lo antes posible por email
              </p>
              <div className="space-y-4 text-muted-foreground">
                <p>Te orientamos sobre:</p>
                <ul className="space-y-3 list-none">
                  {[
                    "Cómo configurar el QR en cada mesa",
                    "Qué alertas son útiles para tu restaurante",
                    "Cómo empezar a recibir avisos en el celular",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            className="rounded-2xl bg-card border border-border w-full max-w-md shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex items-center justify-between border-b border-border p-6">
              <h3 className="font-display text-xl font-bold">Enviar consulta</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 hover:bg-muted transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombre del restaurante
                </label>
                <input
                  type="text"
                  name="restaurante"
                  value={formData.restaurante}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none"
                  placeholder="Tu restaurante"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Cantidad de restaurantes
                </label>
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Mensaje
                </label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none resize-none"
                  placeholder="Contanos qué duda tenés o qué problema querés resolver en tu restaurante."
                />
              </div>

              {submitMessage && (
                <div
                  className={`rounded-lg p-3 text-sm font-medium ${
                    submitMessage.type === "success"
                      ? "bg-secondary/20 text-secondary"
                      : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Enviar consulta"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default Contact;
