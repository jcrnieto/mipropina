import { Footer, Hero, HowItWorks, Navbar, Pricing, Testimonials } from "./components/home";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
