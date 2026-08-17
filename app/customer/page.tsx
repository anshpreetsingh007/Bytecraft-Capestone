"use client";

import Link from "next/link";
import Image from "next/image";
import RoofLine from "./components/RoofLine";
import {
  ScrollReveal,
  StaggerReveal,
  Parallax,
} from "../../components/ScrollReveal";

const services = [
  {
    title: "Roof Replacement",
    body: "Full tear-off and re-roof with asphalt shingle, metal, or tile — sized and priced before any work starts.",
    image: "/images/home/service-replacement.jpg",
  },
  {
    title: "Roof Repair & Leaks",
    body: "Fast diagnosis and repair for leaks, missing shingles, flashing failures, and storm damage.",
    image: "/images/home/service-repair.jpg",
  },
  {
    title: "Roof Inspections",
    body: "A written, photo-backed report on your roof's condition — useful for sales, insurance, or peace of mind.",
    image: "/images/home/service-inspection.jpg",
  },
];

const steps = [
  {
    num: "01",
    title: "Free on-site estimate",
    body: "We inspect the roof in person and give you a written quote — no surprise add-ons later.",
  },
  {
    num: "02",
    title: "Materials & scheduling",
    body: "Pick your materials and colors, and we lock in a start date that works around your schedule.",
  },
  {
    num: "03",
    title: "The install",
    body: "Most residential roofs are completed in one to two days. We protect your landscaping and haul away all debris.",
  },
  {
    num: "04",
    title: "Final walkthrough",
    body: "We inspect the finished roof with you and hand over your warranty paperwork on the spot.",
  },
];

const testimonials = [
  {
    quote:
      "Our roof was replaced in a day and a half, and the crew left the yard cleaner than they found it. The quote matched the final bill exactly.",
    who: "Dana R. — Maple Ridge",
  },
  {
    quote:
      "We had a leak during a bad storm and Markit had someone out the next morning. Fixed it right the first time, no upsell pressure.",
    who: "Marcus T. — Fairview Heights",
  },
  {
    quote:
      "Clear communication from the estimate through the final inspection. They explained every line item and answered every question.",
    who: "Priya S. — Oakdale",
  },
];

const faqs = [
  {
    q: "Do you work on both residential and commercial roofs?",
    a: "Yes. We handle single-family homes as well as commercial and industrial buildings, from asphalt shingles on a Calgary bungalow to a full membrane replacement on a warehouse. Our crews are trained on every system we install, so the same standards apply regardless of job size.",
  },
  {
    q: "How do I know whether my roof needs a repair or a full replacement?",
    a: "It depends on the roof's age, the extent of the damage, and whether the underlying structure is still sound. Isolated leaks or a few missing shingles usually mean a repair. Widespread deterioration or a roof near the end of its rated life often makes replacement the better value. We inspect first and give you an honest recommendation either way.",
  },
  {
    q: "Do you help with insurance claims after hail or storm damage?",
    a: "We do. We document our findings with photographs and written assessments so your insurer has a clear basis for your claim. We don't decide your coverage, but an accurate record of storm damage versus age-related wear supports a fair assessment.",
  },
  {
    q: "Are you certified and insured?",
    a: "Yes. Markit Roofing is SeCOR certified, meaning our safety program has been independently audited, and we've been a member of the Alberta Allied Roofing Association since 2019. We carry full liability insurance and WCB coverage on every project.",
  },
  {
    q: "How do I get a quote?",
    a: "Call our Calgary or Edmonton office, or send us a message through the site. We arrange an inspection, properly assess the roof, and provide a detailed written quote — no obligation, no pressure.",
  },
];

export default function Home() {
  return (
    <>
      {/* =========================
          HERO — animated entrance
      ========================= */}

      <section className="relative overflow-hidden">
        {/* Background with subtle parallax */}
        <Parallax speed={0.08} className="absolute inset-0">
          <Image
            src="/images/home/hero.jpg"
            alt="Residential roofing"
            fill
            priority
            className="object-cover scale-110"
          />
        </Parallax>

        {/* Overall tint */}
        <div className="absolute inset-0 bg-navy/50 dark:bg-navy/65" />

        {/* Stronger contrast behind text */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/60 to-navy/20" />

        {/* Hero content */}
        <div className="relative z-10 max-w-[1120px] mx-auto px-7 py-28 sm:py-32 lg:py-36">
          <div className="max-w-[620px]">
            <h1 className="hero-title-animate font-bold !text-white text-[2.6rem] sm:text-5xl lg:text-[4rem] max-w-[13ch] leading-[1.05] tracking-[-0.02em]">
              Roofing inspections, simplified.
            </h1>

            <p className="hero-subtitle-animate !text-white/90 text-lg max-w-[44ch] mt-6 mb-8 leading-relaxed">
              Capture findings, manage inspections, and build estimates with a
              faster, more organized workflow.
            </p>

            {/* Animated buttons */}
            <div className="hero-buttons-animate flex flex-wrap gap-4">
              <Link
                href="/customer/contact"
                className="
                  btn-shimmer
                  inline-flex items-center justify-center
                  min-h-[46px]
                  bg-accent-solid hover:bg-accent-hover
                  text-white
                  font-bold
                  px-7 py-3
                  rounded-md
                  shadow-sm
                  transition-colors duration-200
                "
              >
                Get a Free Quote
              </Link>

              <Link
                href="/customer/services"
                className="
                  inline-flex items-center justify-center
                  min-h-[46px]
                  hover:bg-white/10
                  border border-white/40
                  text-white
                  font-bold
                  px-7 py-3
                  rounded-md
                  shadow-sm
                  transition-all duration-200
                "
              >
                See Our Services
              </Link>
            </div>
          </div>
        </div>

        {/* Animated scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-breathe">
          <svg
            width="24"
            height="36"
            viewBox="0 0 24 36"
            fill="none"
            className="text-white/50"
          >
            <rect
              x="1"
              y="1"
              width="22"
              height="34"
              rx="11"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle className="animate-float" cx="12" cy="10" r="3" fill="currentColor" />
          </svg>
        </div>
      </section>

      <RoofLine />

      {/* =========================
          TRUST / CERTIFICATIONS
      ========================= */}

      <section className="bg-background py-14">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ScrollReveal direction="left" delay={0} duration={700}>
              <div className="flex items-start gap-4 bg-paper-dim border border-line rounded-lg p-6 card-hover-glow">
                <div className="shrink-0 w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm">
                  SC
                </div>

                <div>
                  <h3 className="text-[1.05rem] font-bold mb-1 text-foreground">
                    SeCOR Certified
                  </h3>

                  <p className="text-ink-soft text-[0.92rem] m-0 leading-relaxed">
                    Our safety program has been independently audited — every job
                    site runs to verified standards.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={150} duration={700}>
              <div className="flex items-start gap-4 bg-paper-dim border border-line rounded-lg p-6 card-hover-glow">
                <div className="shrink-0 w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                  AARA
                </div>

                <div>
                  <h3 className="text-[1.05rem] font-bold mb-1 text-foreground">
                    AARA Member Since 2019
                  </h3>

                  <p className="text-ink-soft text-[0.92rem] m-0 leading-relaxed">
                    Alberta Allied Roofing Association — serving Calgary and
                    Edmonton.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* =========================
          SERVICES — staggered cards
      ========================= */}

      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <ScrollReveal direction="up" duration={700}>
            <div className="max-w-[60ch] mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-navy dark:text-white block mb-3">
                What We Do
              </span>

              <h2 className="font-bold text-foreground text-[1.7rem] sm:text-[2.3rem]">
                Everything your roof needs, handled.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <ScrollReveal
                key={service.title}
                direction="up"
                delay={i * 150}
                duration={700}
              >
                <div className="bg-background border border-line rounded-xl overflow-hidden shadow-sm card-hover-glow hover-tilt group h-full">
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                    {/* Color overlay on hover */}
                    <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/10 transition-colors duration-500" />
                  </div>

                  <div className="p-7">
                    <h3 className="text-foreground text-[1.15rem] font-bold mb-2">
                      {service.title}
                    </h3>

                    <p className="text-ink-soft text-[0.96rem] leading-relaxed">
                      {service.body}
                    </p>

                    <Link
                      href="/customer/services"
                      className="link-underline-reveal inline-block mt-3.5 text-sm font-bold text-navy dark:text-white"
                    >
                      Learn more →
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          PROCESS — animated steps
      ========================= */}

      <section className="bg-background py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <ScrollReveal direction="up" duration={700}>
            <div className="max-w-[60ch] mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-navy dark:text-white block mb-3">
                How It Works
              </span>

              <h2 className="font-bold text-foreground text-[1.7rem] sm:text-[2.3rem]">
                From first call to final walkthrough
              </h2>
            </div>
          </ScrollReveal>

          <div className="flex flex-col">
            {steps.map((step, index) => (
              <ScrollReveal
                key={step.num}
                direction="left"
                delay={index * 120}
                distance={30}
                duration={600}
              >
                <div
                  className={`grid grid-cols-[60px_1fr] sm:grid-cols-[100px_1fr] gap-6 py-8 border-t border-line ${
                    index === steps.length - 1 ? "border-b" : ""
                  } group hover:bg-surface-2/50 transition-colors duration-300 rounded-lg px-2 -mx-2`}
                >
                  <span className="font-bold text-[2rem] leading-none text-gradient-brand group-hover:scale-110 transition-transform duration-300 origin-center">
                    {step.num}
                  </span>

                  <div>
                    <h3 className="text-foreground text-[1.1rem] font-bold mb-1">
                      {step.title}
                    </h3>

                    <p className="text-ink-soft m-0 leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          TESTIMONIALS — staggered
      ========================= */}

      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <ScrollReveal direction="up" duration={700}>
            <div className="max-w-[60ch] mx-auto text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-navy dark:text-white block mb-3">
                Customer Reviews
              </span>

              <h2 className="font-bold text-foreground text-[1.7rem] sm:text-[2.3rem]">
                What homeowners say about us
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <ScrollReveal
                key={testimonial.who}
                direction="up"
                delay={i * 150}
                duration={700}
              >
                <div className="bg-background border border-line border-l-[3px] border-l-navy rounded-lg p-7 card-hover-glow h-full relative">
                  {/* Decorative quote mark */}
                  <span className="quote-mark absolute top-3 right-5 select-none" aria-hidden="true">
                    &ldquo;
                  </span>

                  <p className="text-foreground mb-[18px] leading-relaxed relative z-10">
                    &quot;{testimonial.quote}&quot;
                  </p>

                  <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-ink-soft">
                    {testimonial.who}
                  </span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          FAQ — smooth accordion
      ========================= */}

      <section className="bg-background py-[88px]">
        <div className="max-w-[820px] mx-auto px-7">
          <ScrollReveal direction="up" duration={700}>
            <div className="mb-10">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-navy dark:text-white block mb-3">
                Questions
              </span>

              <h2 className="font-bold text-foreground text-[1.7rem] sm:text-[2.3rem]">
                Frequently asked questions
              </h2>
            </div>
          </ScrollReveal>

          <div className="flex flex-col">
            {faqs.map((item, index) => (
              <ScrollReveal
                key={item.q}
                direction="up"
                delay={index * 80}
                distance={20}
                duration={500}
              >
                <details
                  className={`faq-item group py-5 border-t border-line ${
                    index === faqs.length - 1 ? "border-b" : ""
                  }`}
                >
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-[1.02rem] font-semibold text-foreground hover:text-accent-text transition-colors duration-200">
                    {item.q}

                    <span className="faq-icon shrink-0 text-navy dark:text-white text-xl leading-none">
                      +
                    </span>
                  </summary>

                  <div className="faq-answer">
                    <div>
                      <p className="text-ink-soft mt-3 mb-0 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          FINAL CTA — gradient animation + shimmer
      ========================= */}

      <ScrollReveal direction="none" duration={800}>
        <section className="cta-gradient-bg text-white text-center py-20 relative overflow-hidden">
          {/* Decorative floating shapes */}
          <div className="absolute top-8 left-[10%] w-20 h-20 rounded-full bg-white/5 animate-float" style={{ animationDelay: "0s" }} />
          <div className="absolute bottom-12 right-[15%] w-14 h-14 rounded-full bg-white/5 animate-float" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 right-[8%] w-8 h-8 rounded-full bg-white/5 animate-float" style={{ animationDelay: "0.8s" }} />

          <div className="max-w-[1120px] mx-auto px-7 relative z-10">
            <ScrollReveal direction="up" duration={600}>
              <h2 className="font-bold !text-white text-[1.7rem] sm:text-[2.4rem]">
                Get a free, no-pressure roof quote
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150} duration={600}>
              <p className="!text-white/90 max-w-[50ch] mx-auto mt-4 mb-8">
                Tell us a little about your roof and we&apos;ll get back to you
                within one business day with next steps.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300} duration={600}>
              <Link
                href="/customer/contact"
                className="btn-shimmer inline-flex items-center justify-center bg-copper-fill hover:bg-copper-fill-hover text-white font-bold px-[26px] py-3.5 rounded-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                Request Your Free Quote
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}
