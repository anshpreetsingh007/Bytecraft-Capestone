import Link from "next/link";
import Image from "next/image";
import RoofLine from "./components/RoofLine";

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
          HERO
      ========================= */}

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/home/hero.jpg"
            alt="Close-up of textured asphalt roofing shingles"
            fill
            priority
            className="object-cover"
          />

          <div className="absolute inset-0 bg-navy/90 dark:bg-navy/90" />

          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent dark:to-navy/40" />
        </div>

        <div className="relative max-w-[1120px] mx-auto px-7 pt-40 pb-24">
          <h1 className="font-bold text-white text-[2.4rem] sm:text-5xl lg:text-[4rem] max-w-[14ch] leading-[1.05]">
            Roofing inspections, simplified.
          </h1>

          <p className="text-white/85 text-lg max-w-[46ch] mt-6 mb-8">
            Capture findings, manage inspections, and build estimates with a
            faster, more organized workflow.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/customer/contact"
              className="inline-flex items-center justify-center bg-copper hover:bg-copper-dark text-white font-bold px-[26px] py-3.5 rounded-md transition-colors"
            >
              Get a Free Quote
            </Link>

            <Link
              href="/customer/services"
              className="inline-flex items-center justify-center border border-white/35 hover:border-white hover:bg-white/10 text-white font-semibold px-[26px] py-3.5 rounded-md transition-colors"
            >
              See Our Services
            </Link>
          </div>
        </div>
      </section>

      <RoofLine />

      {/* =========================
          TRUST / STATS
      ========================= */}

      <section className="bg-background py-14">
        <div className="max-w-[1120px] mx-auto px-7">
        
          {/* Certifications */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <div className="flex items-start gap-4 bg-paper-dim border border-line rounded-lg p-6">
              <div className="shrink-0 w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm">
                SC
              </div>

              <div>
                <h3 className="text-[1.05rem] font-bold mb-1">
                  SeCOR Certified
                </h3>

                <p className="text-ink-soft text-[0.92rem] m-0 leading-relaxed">
                  Our safety program has been independently audited — every job
                  site runs to verified standards.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-paper-dim border border-line rounded-lg p-6">
              <div className="shrink-0 w-11 h-11 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                AARA
              </div>

              <div>
                <h3 className="text-[1.05rem] font-bold mb-1">
                  AARA Member Since 2019
                </h3>

                <p className="text-ink-soft text-[0.92rem] m-0 leading-relaxed">
                  Alberta Allied Roofing Association — serving Calgary and
                  Edmonton.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          SERVICES
      ========================= */}

      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="max-w-[60ch] mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-copper block mb-3">
              What We Do
            </span>

            <h2 className="font-bold text-[1.7rem] sm:text-[2.3rem]">
              Everything your roof needs, handled.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-background border border-line rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="relative w-full aspect-[4/3] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-7">
                  <h3 className="text-[1.15rem] font-bold mb-2">
                    {service.title}
                  </h3>

                  <p className="text-ink-soft text-[0.96rem]">
                    {service.body}
                  </p>

                  <Link
                    href="/customer/services"
                    className="inline-block mt-3.5 text-sm font-semibold text-navy dark:text-copper hover:text-copper dark:hover:text-[#ff9d5c]"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          PROCESS
      ========================= */}

      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="max-w-[60ch] mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-copper block mb-3">
              How It Works
            </span>

            <h2 className="font-bold text-[1.7rem] sm:text-[2.3rem]">
              From first call to final walkthrough
            </h2>
          </div>

          <div className="flex flex-col">
            {steps.map((step, index) => (
              <div
                key={step.num}
                className={`grid grid-cols-[60px_1fr] sm:grid-cols-[100px_1fr] gap-6 py-8 border-t border-line ${
                  index === steps.length - 1 ? "border-b" : ""
                }`}
              >
                <span className="font-bold text-navy dark:text-copper text-[2rem] leading-none">
                  {step.num}
                </span>

                <div>
                  <h3 className="text-[1.1rem] font-bold mb-1">
                    {step.title}
                  </h3>

                  <p className="text-ink-soft m-0">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          TESTIMONIALS
      ========================= */}

      <section className="py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="max-w-[60ch] mx-auto text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-copper block mb-3">
              Customer Reviews
            </span>

            <h2 className="font-bold text-[1.7rem] sm:text-[2.3rem]">
              What homeowners say about us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.who}
                className="bg-paper-dim border border-line border-l-[3px] border-l-copper rounded-lg p-7"
              >
                <p className="text-foreground mb-[18px]">
                  &quot;{testimonial.quote}&quot;
                </p>

                <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-ink-soft">
                  {testimonial.who}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          FAQ
      ========================= */}

      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[820px] mx-auto px-7">
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-copper block mb-3">
              Questions
            </span>

            <h2 className="font-bold text-[1.7rem] sm:text-[2.3rem]">
              Frequently asked questions
            </h2>
          </div>

          <div className="flex flex-col">
            {faqs.map((item, index) => (
              <details
                key={item.q}
                className={`group py-5 border-t border-line ${
                  index === faqs.length - 1 ? "border-b" : ""
                }`}
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-[1.02rem] font-semibold text-foreground">
                  {item.q}

                  <span className="shrink-0 text-navy dark:text-copper text-xl leading-none group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>

                <p className="text-ink-soft mt-3 mb-0">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          FINAL CTA
      ========================= */}

      <section className="bg-navy text-white text-center py-20">
        <div className="max-w-[1120px] mx-auto px-7">
          <h2 className="font-bold text-white text-[1.7rem] sm:text-[2.4rem]">
            Get a free, no-pressure roof quote
          </h2>

          <p className="text-white/80 max-w-[50ch] mx-auto mt-4 mb-8">
            Tell us a little about your roof and we&apos;ll get back to you
            within one business day with next steps.
          </p>

          <Link
            href="/customer/contact"
            className="inline-flex items-center justify-center bg-copper hover:bg-copper-dark text-white font-bold px-[26px] py-3.5 rounded-md transition-colors"
          >
            Request Your Free Quote
          </Link>
        </div>
      </section>
    </>
  );
}