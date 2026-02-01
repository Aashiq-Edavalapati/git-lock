"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import DashboardPreview from "@/components/landing/DashboardPreview";
import Integrations from "@/components/landing/Integrations";
import Features from "@/components/landing/Features";
import Workflow from "@/components/landing/Workflow";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import Cta from "@/components/landing/Cta";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/landing/BackToTop";

export default function Home() {
  return (
    <main className="min-h-screen relative flex flex-col items-center">
      <Navbar />
      <Hero />
      <DashboardPreview />
      <Integrations />
      <Features />
      <Workflow />
      <Pricing />
      <Faq />
      <Cta />
      <Footer />
      <BackToTop />
    </main>
  );
}