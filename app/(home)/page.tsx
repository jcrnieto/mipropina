import { Contact, ExtraTools, Faq, Footer, Hero, HowItWorks, Navbar, Pricing, Testimonials } from "@/app/components/home";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        {/* <Testimonials /> */}
        <Pricing />
        <ExtraTools />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

