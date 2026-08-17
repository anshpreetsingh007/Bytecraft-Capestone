import type { Metadata } from "next";
import Link from "next/link";
import RoofLine from "../components/RoofLine";
import { ScrollReveal, CountUp } from "../../../components/ScrollReveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Markit Roofing is a Calgary and Edmonton-based roofing contractor with 13+ years of residential and commercial experience.",
};

const values = [
  {
    title: "Written quotes, no surprises",
    body: "Every job gets a detailed, itemized estimate before we start — the number we quote is the number you pay.",
  },
  {
    title: "Our own crews, not subcontractors",
    body: "The people on your roof are Markit employees, trained on our safety standards and accountable to our warranty.",
  },
  {
    title: "Real warranties, honored",
    body: "Workmanship warranties are backed in writing and tracked by job — if something's wrong, we come back and fix it.",
  },
  {
    title: "Clean job sites",
    body: "Magnetic nail sweeps, tarped landscaping, and full debris haul-away are standard on every project, not an upsell.",
  },
];

const timeline = [
  {
    year: "2013",
    title: "Founded in Calgary",
    body: "Started as a small three-person crew focused on doing roofing and building envelope work right.",
  },
  {
    year: "2019",
    title: "AARA member, SeCOR certified",
    body: "Joined the Alberta Allied Roofing Association and passed SeCOR's independently audited safety program.",
  },
  {
    year: "2020s",
    title: "Expanded to Edmonton",
    body: "Opened a second office to serve as the North Region contractor alongside our South Region base in Calgary.",
  },
  {
    year: "2026",
    title: "50+ person team",
    body: "Grown from three people to a full crew across two Alberta offices, BBB accredited and WCB-compliant.",
  },
];

export default function About() {
  return (
    <>
      {/* =========================
          HERO
      ========================= */}
      <section className="bg-navy text-white pt-[72px] pb-16">
        <div className="max-w-[1120px] mx-auto px-7">
          <ScrollReveal direction="left" duration={700}>
            <span className="text-xs font-bold uppercase tracking-[0.14em] !text-white block mb-3">
              About Us
            </span>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={100} duration={800}>
            <h1 className="!text-white font-bold text-[2.2rem] sm:text-[3rem] max-w-[18ch] leading-[1.08]">
              A roofing crew that answers the phone.
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={200} duration={800}>
            <p className="!text-white/90 max-w-[52ch] mt-5 mb-0 leading-relaxed">
              Markit Roofing started in Calgary as a three-person crew and grew
              into a 50+ person team serving Calgary, Edmonton, and surrounding
              communities — without losing the habit of showing up when we say
              we will.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <RoofLine />

      {/* =========================
          STATS — with animated counters
      ========================= */}
      <section className="bg-background py-12">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 border-y border-line py-10">
            {[
              { end: 13, suffix: "+", label: "Years in business" },
              { end: 50, suffix: "+", label: "Team members" },
              { end: 2, suffix: "", label: "Alberta offices" },
            ].map((stat, i) => (
              <ScrollReveal
                key={stat.label}
                direction="up"
                delay={i * 150}
                duration={700}
              >
                <div className="text-center">
                  <div className="font-bold text-[2.3rem] text-foreground leading-none">
                    <CountUp
                      end={stat.end}
                      suffix={stat.suffix}
                      duration={2000}
                    />
                  </div>

                  <p className="text-ink-soft mt-2 mb-0 text-sm">
                    {stat.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          OUR APPROACH
      ========================= */}
      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <ScrollReveal direction="up" duration={700}>
            <div className="max-w-[60ch] mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-navy dark:text-white block mb-3">
                Our Approach
              </span>

              <h2 className="text-foreground font-bold text-[1.7rem] sm:text-[2.3rem]">
                What we believe about roofing work.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <ScrollReveal
                key={value.title}
                direction={i % 2 === 0 ? "left" : "right"}
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
                    h-full
                  "
                >
                  <h3 className="text-foreground text-[1.15rem] font-bold mb-2">
                    {value.title}
                  </h3>

                  <p className="text-ink-soft text-[0.96rem] leading-relaxed mb-0">
                    {value.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          OUR STORY — animated timeline
      ========================= */}
      <section className="bg-background py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <ScrollReveal direction="up" duration={700}>
            <div className="max-w-[60ch] mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-navy dark:text-white block mb-3">
                Our Story
              </span>

              <h2 className="text-foreground font-bold text-[1.7rem] sm:text-[2.3rem]">
                How Markit Roofing got here.
              </h2>
            </div>
          </ScrollReveal>

          <div className="border-l-2 border-line pl-8 ml-2">
            {timeline.map((item, index) => (
              <ScrollReveal
                key={item.year}
                direction="left"
                delay={index * 150}
                distance={30}
                duration={650}
              >
                <div
                  className={`relative ${
                    index === timeline.length - 1 ? "pb-0" : "pb-10"
                  }`}
                >
                  <span className="absolute -left-[39px] top-1.5 w-3 h-3 rounded-full bg-navy dark:bg-white border-2 border-background" />

                  <span className="text-[0.8rem] font-bold text-navy dark:text-white block mb-1.5">
                    {item.year}
                  </span>

                  <h3 className="text-foreground text-[1.1rem] font-bold mb-1">
                    {item.title}
                  </h3>

                  <p className="text-ink-soft mb-0 leading-relaxed max-w-[65ch]">
                    {item.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          CTA — gradient animation
      ========================= */}
      <ScrollReveal direction="none" duration={800}>
        <section className="cta-gradient-bg text-white text-center py-20 relative overflow-hidden">
          <div className="absolute top-8 left-[10%] w-20 h-20 rounded-full bg-white/5 animate-float" style={{ animationDelay: "0s" }} />
          <div className="absolute bottom-12 right-[15%] w-14 h-14 rounded-full bg-white/5 animate-float" style={{ animationDelay: "1.5s" }} />

          <div className="max-w-[1120px] mx-auto px-7 relative z-10">
            <ScrollReveal direction="up" duration={600}>
              <h2 className="!text-white font-bold text-[1.7rem] sm:text-[2.4rem]">
                Ready to talk about your roof?
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150} duration={600}>
              <p className="!text-white/90 max-w-[50ch] mx-auto mt-4 mb-8 leading-relaxed">
                Reach out for a free estimate — we&apos;ll walk the roof with you
                and explain exactly what we find.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300} duration={600}>
              <Link href="/customer/contact" className="btn-shimmer inline-flex items-center bg-copper-fill hover:bg-copper-fill-hover text-white font-semibold px-[26px] py-3.5 rounded-md transition-all duration-200 hover:scale-105 hover:shadow-lg">
                Request Your Free Quote
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}
