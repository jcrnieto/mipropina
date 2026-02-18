"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight, QrCode, Smartphone, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden pt-16">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold gradient-primary text-primary-foreground mb-6">
            🚀 7 días gratis · Sin tarjeta
          </span>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Medí y mejorá la{" "}
            <span className="gradient-text">experiencia</span>
            {" "}en tu local
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed">
            Tus clientes escanean un QR y califican limpieza, atención, tiempos de espera,
            relación costo-calidad y más. Vos recibís feedback en tiempo real y, si quieren,
            también pueden dejar{" "}
            <strong className="text-foreground">propina por Mercado Pago</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/sign-up?plan=pro">
              <Button
                size="lg"
                className="gradient-primary text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all text-base px-8 h-12"
              >
                Probá gratis 7 días
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>

            <Button
              size="lg"
              className="h-12 text-base"
              onClick={() =>
                document
                  .getElementById("como-funciona")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Ver cómo funciona
            </Button>
          </div>
        </motion.div>

        {/* Phone mockup */}
        <motion.div
          className="flex justify-center lg:justify-end"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="relative">
            <div className="w-72 h-[520px] rounded-[2.5rem] border-4 border-foreground/10 bg-card shadow-2xl p-4 animate-float">
              <div className="w-full h-full rounded-[2rem] bg-muted overflow-hidden flex flex-col">
                {/* Status bar */}
                <div className="px-4 pt-3 pb-2 flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">
                    mipropina.app
                  </span>
                  <QrCode size={14} className="text-muted-foreground" />
                </div>

                {/* Content */}
                <div className="flex-1 px-4 py-3 space-y-3">
                  <div className="text-center">
                    <p className="font-display font-bold text-sm text-foreground">
                      🍽️ La Parrilla de Juan
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Calificá tu experiencia
                    </p>
                  </div>

                  {["Limpieza", "Tiempo de espera", "Amabilidad"].map((label, i) => (
                    <div
                      key={label}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        i === 0
                          ? "gradient-primary text-primary-foreground"
                          : "bg-card border border-border"
                      } cursor-pointer transition-all`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                          i === 0
                            ? "bg-primary-foreground/20"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {label[0]}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${i === 0 ? "" : "text-foreground"}`}>
                          {label}
                        </p>
                        <p
                          className={`text-xs ${
                            i === 0 ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          Tocá para puntuar
                        </p>
                      </div>
                      <ArrowRight size={14} />
                    </div>
                  ))}

                  <div className="mt-2 p-3 rounded-xl bg-secondary/10 border border-secondary/20 text-center">
                    <CreditCard size={16} className="mx-auto text-secondary mb-1" />
                    <p className="text-xs font-medium text-secondary">
                      También podés dejar propina por Mercado Pago
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div
              className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl gradient-accent shadow-lg flex items-center justify-center animate-float"
              style={{ animationDelay: "0.5s" }}
            >
              <Smartphone size={24} className="text-accent-foreground" />
            </div>

            <div
              className="absolute -bottom-4 -left-4 w-14 h-14 rounded-2xl gradient-secondary shadow-lg flex items-center justify-center animate-float"
              style={{ animationDelay: "1s" }}
            >
              <QrCode size={20} className="text-secondary-foreground" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;




// "use client";

// import Link from "next/link";
// import { Button } from "../ui/button";
// import { ArrowRight, QrCode, Smartphone, CreditCard } from "lucide-react";
// import { motion } from "framer-motion";

// const Hero = () => {
//   return (
//     <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden pt-16">
//       {/* Decorative blobs */}
//       <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
//       <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />
//       <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />

//       <div className="container mx-auto px-4 py-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
//         {/* Text */}
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.7 }}
//         >
//           <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold gradient-primary text-primary-foreground mb-6">
//             🚀 7 días gratis · Sin tarjeta
//           </span>
//           <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
//             Propinas{" "}
//             <span className="gradient-text">digitales</span>
//             {" "}para tu restaurante
//           </h1>
//           <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed">
//             Tus clientes escanean un QR, eligen al mozo y le transfieren la propina directo por{" "}
//             <strong className="text-foreground">Mercado Pago</strong>. Así de simple.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4">
//             <Link href="/sign-up?plan=pro">
//               <Button size="lg" className="gradient-primary text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all text-base px-8 h-12">
//                 Probá gratis 7 días
//                 <ArrowRight className="ml-2" size={18} />
//               </Button>
//             </Link>
//             <Button
//               size="lg"
//             //   variant="outline"
//               className="h-12 text-base"
//               onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
//             >
//               Ver cómo funciona
//             </Button>
//           </div>
//         </motion.div>

//         {/* Phone mockup */}
//         <motion.div
//           className="flex justify-center lg:justify-end"
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.7, delay: 0.3 }}
//         >
//           <div className="relative">
//             <div className="w-72 h-[520px] rounded-[2.5rem] border-4 border-foreground/10 bg-card shadow-2xl p-4 animate-float">
//               <div className="w-full h-full rounded-[2rem] bg-muted overflow-hidden flex flex-col">
//                 {/* Status bar */}
//                 <div className="px-4 pt-3 pb-2 flex justify-between items-center">
//                   <span className="text-xs font-semibold text-muted-foreground">mipropina.app</span>
//                   <QrCode size={14} className="text-muted-foreground" />
//                 </div>
//                 {/* Content */}
//                 <div className="flex-1 px-4 py-3 space-y-3">
//                   <div className="text-center">
//                     <p className="font-display font-bold text-sm text-foreground">🍽️ La Parrilla de Juan</p>
//                     <p className="text-xs text-muted-foreground mt-1">Elegí a tu mozo</p>
//                   </div>
//                   {["Carlos M.", "María G.", "Lucas R."].map((name, i) => (
//                     <div
//                       key={name}
//                       className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? "gradient-primary text-primary-foreground" : "bg-card border border-border"} cursor-pointer transition-all`}
//                     >
//                       <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}>
//                         {name[0]}
//                       </div>
//                       <div className="flex-1">
//                         <p className={`text-sm font-semibold ${i === 0 ? "" : "text-foreground"}`}>{name}</p>
//                         <p className={`text-xs ${i === 0 ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Mozo</p>
//                       </div>
//                       <ArrowRight size={14} />
//                     </div>
//                   ))}
//                   <div className="mt-2 p-3 rounded-xl bg-secondary/10 border border-secondary/20 text-center">
//                     <CreditCard size={16} className="mx-auto text-secondary mb-1" />
//                     <p className="text-xs font-medium text-secondary">Transferí por Mercado Pago</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             {/* Floating elements */}
//             <div className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl gradient-accent shadow-lg flex items-center justify-center animate-float" style={{ animationDelay: "0.5s" }}>
//               <Smartphone size={24} className="text-accent-foreground" />
//             </div>
//             <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-2xl gradient-secondary shadow-lg flex items-center justify-center animate-float" style={{ animationDelay: "1s" }}>
//               <QrCode size={20} className="text-secondary-foreground" />
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// };

// export default Hero;
