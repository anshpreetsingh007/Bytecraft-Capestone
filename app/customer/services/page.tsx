import type { Metadata } from "next";
import Link from "next/link";
import RoofLine from "../components/RoofLine";
import { ScrollReveal } from "../../../components/ScrollReveal";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Roof replacement, repair, inspections, waterproofing, and commercial roofing services from Markit Roofing.",
};

const services = [
  {
    title: "Roof Replacement",
    body: "Complete tear-off and re-roof in asphalt shingle, standing-seam metal, or tile. Includes new underlayment, flashing, and ventilation review.",
    icon: (
      <>
        <path
          d="M3 21L12 3L21 21"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M7 21V13H17V21"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </>
    ),
  },
  {
    title: "Roof Repair & Leak Fixes",
    body: "Targeted repairs for leaks, cracked flashing, damaged shingles, and soft decking — most fixed within a single visit.",
    icon: (
      <>
        <path
          d="M12 2L3 8V22H21V8L12 2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 22V15H15V22"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </>
    ),
  },
  {
    title: "Roof Inspections",
    body: "A full-roof walk with a written, photo-backed report — for pre-sale, insurance claims, or a second opinion.",
    icon: (
      <path
        d="M4 12L9 17L20 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Storm Damage Repair",
    body: "Repairs for storm damage, sudden leaks, missing shingles, and other urgent roofing problems across Calgary and Edmonton.",
    icon: (
      <path
        d="M3 15L8 5L13 13L17 6L21 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Waterproofing & Coatings",
    body: "Protective coating and waterproofing systems for roofs and building envelopes, extending service life and preventing water intrusion.",
    icon: (
      <path
        d="M4 6H20M4 6V16C4 17 5 18 6 18H8M20 6V16C20 17 19 18 18 18H16M8 18V21H16V18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Commercial Roofing & Insurance Claims",
    body: "Low-slope and flat-roof systems — TPO, SBS, EPDM, BUR, Mod-Bit, and PVC — plus insurance claim assistance for commercial and residential projects.",
    icon: (
      <>
        <rect
          x="3"
          y="8"
          width="18"
          height="13"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M3 8L12 3L21 8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </>
    ),
  },
];

const materials = [
  {
    title: "Asphalt Shingle",
    body: "A popular residential choice with a wide range of colours and a lower upfront cost.",
  },
  {
    title: "Metal Roofing",
    body: "Long-lasting, durable, and resistant to wind and hail, with a clean modern appearance.",
  },
  {
    title: "TPO, EPDM & PVC Membranes",
    body: "Single-ply low-slope systems designed for commercial roofs and long-term waterproofing.",
  },
  {
    title: "SBS, BUR & Modified Bitumen",
    body: "Built-up and modified bitumen systems for flat and low-slope commercial buildings.",
  },
];

export default function Services() {
  return (
    <>
      {/* HERO */}
      <section className="bg-navy text-white pt-[72px] pb-14">
        <div className="max-w-[1120px] mx-auto px-7">
          <ScrollReveal direction="left" duration={700}>
            <span className="text-xs font-bold uppercase tracking-[0.14em] !text-white block mb-3">
              Services
            </span>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={100} duration={800}>
            <h1 className="!text-white font-bold text-[2rem] sm:text-[2.9rem] max-w-[20ch] leading-[1.1]">
              Every roofing job, one accountable crew.
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={200} duration={800}>
            <p className="!text-white/90 max-w-[50ch] mt-4 mb-0 leading-relaxed">
              From a single leak to a full commercial re-roof, we assess the
              problem clearly and explain the work before we start.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <RoofLine />

      {/* SERVICES */}
      <section className="bg-background py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <ScrollReveal
                key={service.title}
                direction="up"
                delay={i * 120}
                duration={700}
              >
                <div
                  className="
                    bg-background
                    border border-line
                    rounded-xl
                    p-8
                    shadow-sm
                    card-hover-glow
                    hover-tilt
                    group
                    h-full
                  "
                >
                  <div className="w-12 h-12 rounded-xl bg-[#dbeafe] dark:bg-[#172554] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-7 h-7 text-[#1d4ed8] dark:text-[#93c5fd]"
                      aria-hidden="true"
                    >
                      {service.icon}
                    </svg>
                  </div>

                  <h3 className="text-foreground text-[1.15rem] font-bold mb-2">
                    {service.title}
                  </h3>

                  <p className="text-ink-soft text-[0.96rem] leading-relaxed mb-0">
                    {service.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* MATERIALS */}
      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <ScrollReveal direction="up" duration={700}>
            <div className="max-w-[60ch] mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-navy dark:text-white block mb-3">
                Materials
              </span>

              <h2 className="text-foreground font-bold text-[1.7rem] sm:text-[2.3rem]">
                Choose the roofing system that fits your property.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {materials.map((material, i) => (
              <ScrollReveal
                key={material.title}
                direction={i % 2 === 0 ? "left" : "right"}
                delay={i * 100}
                duration={700}
              >
                <div className="bg-background border border-line rounded-xl p-8 card-hover-glow h-full">
                  <h3 className="text-foreground text-[1.15rem] font-bold mb-2">
                    {material.title}
                  </h3>

                  <p className="text-ink-soft text-[0.96rem] leading-relaxed mb-0">
                    {material.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <ScrollReveal direction="none" duration={800}>
        <section className="cta-gradient-bg text-white text-center py-20 relative overflow-hidden">
          {/* Decorative floating shapes */}
          <div className="absolute top-8 left-[10%] w-20 h-20 rounded-full bg-white/5 animate-float" style={{ animationDelay: "0s" }} />
          <div className="absolute bottom-12 right-[15%] w-14 h-14 rounded-full bg-white/5 animate-float" style={{ animationDelay: "1.5s" }} />

          <div className="max-w-[1120px] mx-auto px-7 relative z-10">
            <ScrollReveal direction="up" duration={600}>
              <h2 className="!text-white font-bold text-[1.7rem] sm:text-[2.4rem]">
                Not sure which service you need?
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150} duration={600}>
              <p className="!text-white/90 max-w-[50ch] mx-auto mt-4 mb-8">
                Tell us what&apos;s going on and we&apos;ll point you toward the
                right fix — no obligation.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300} duration={600}>
              <Link href="/customer/contact" className="btn-shimmer inline-flex items-center bg-copper-fill hover:bg-copper-fill-hover text-white font-semibold px-[26px] py-3.5 rounded-md transition-all duration-200 hover:scale-105 hover:shadow-lg">
                Talk to a Roofer
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}
