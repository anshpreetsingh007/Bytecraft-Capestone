import Link from "next/link";
import RoofLine from "./components/RoofLine";

const services = [
  {
    title: "Roof Replacement",
    body: "Full tear-off and re-roof with asphalt shingle, metal, or tile — sized and priced before any work starts.",
    icon: (
      <>
        <path d="M3 21L12 3L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7 21V13H17V21" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
  {
    title: "Roof Repair & Leaks",
    body: "Fast diagnosis and repair for leaks, missing shingles, flashing failures, and storm damage.",
    icon: (
      <>
        <path d="M12 2L3 8V22H21V8L12 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 22V15H15V22" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
  {
    title: "Roof Inspections",
    body: "A written, photo-backed report on your roof's condition — useful for sales, insurance, or peace of mind.",
    icon: <path d="M4 12L9 17L20 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

const steps = [
  { num: "01", title: "Free on-site estimate", body: "We inspect the roof in person and give you a written quote — no surprise add-ons later." },
  { num: "02", title: "Materials & scheduling", body: "Pick your materials and colors, and we lock in a start date that works around your schedule." },
  { num: "03", title: "The install", body: "Most residential roofs are completed in one to two days. We protect your landscaping and haul away all debris." },
  { num: "04", title: "Final walkthrough", body: "We inspect the finished roof with you and hand over your warranty paperwork on the spot." },
];

const testimonials = [
  { quote: "Our roof was replaced in a day and a half, and the crew left the yard cleaner than they found it. The quote matched the final bill exactly.", who: "Dana R. — Maple Ridge" },
  { quote: "We had a leak during a bad storm and Markit had someone out the next morning. Fixed it right the first time, no upsell pressure.", who: "Marcus T. — Fairview Heights" },
  { quote: "Clear communication from the estimate through the final inspection. They explained every line item and answered every question.", who: "Priya S. — Oakdale" },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white relative overflow-hidden">
        <div className="max-w-[1120px] mx-auto px-7 pt-28 pb-24 relative">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-copper block mb-3">
            Licensed &amp; Insured — Serving the Metro Area
          </span>
          <h1 className="text-white text-[2.4rem] sm:text-5xl lg:text-[4rem] max-w-[14ch]">
            Roofing built to weather everything.
          </h1>
          <p className="text-navy-soft text-lg max-w-[46ch] mt-6 mb-8">
            Markit Roofing repairs, replaces, and maintains residential and
            commercial roofs with straightforward pricing, real warranties,
            and crews who show up when they say they will.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="inline-flex items-center bg-copper hover:bg-copper-dark text-white font-semibold px-[26px] py-3.5 rounded-[3px] transition-colors">
              Get a Free Quote
            </Link>
            <Link href="/services" className="inline-flex items-center border border-white/35 hover:border-white text-white font-semibold px-[26px] py-3.5 rounded-[3px] transition-colors">
              See Our Services
            </Link>
          </div>
        </div>
        <svg
          viewBox="0 0 480 360"
          className="absolute -right-[6%] -bottom-1 w-[46%] min-w-[340px] opacity-90 pointer-events-none hidden sm:block"
        >
          <polygon points="60,360 240,140 420,360" fill="rgba(234,236,240,0.06)" stroke="rgba(234,236,240,0.28)" strokeWidth="1.5" />
          <polygon points="150,360 300,190 450,360" fill="rgba(234,236,240,0.06)" stroke="rgba(234,236,240,0.28)" strokeWidth="1.5" />
          <polyline points="150,300 240,200 330,300" fill="none" stroke="var(--copper)" strokeWidth="1.5" />
          <circle cx="240" cy="200" r="4" fill="var(--copper)" />
        </svg>
      </section>

      <RoofLine />

      {/* Stat strip */}
      <section className="py-16">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-y border-line py-9">
            {[
              ["18+", "Years in business"],
              ["3,400+", "Roofs completed"],
              ["4.9/5", "Average rating"],
              ["25-yr", "Workmanship warranty"],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="font-display font-bold text-[2.1rem] text-foreground">{num}</div>
                <div className="font-mono text-[0.72rem] uppercase tracking-wider text-ink-soft">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="max-w-[60ch] mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-copper block mb-3">What We Do</span>
            <h2 className="text-[1.7rem] sm:text-[2.3rem]">Roofing services for every kind of problem</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-white border border-line rounded-[3px] p-8 hover:border-copper hover:-translate-y-0.5 transition-all">
                <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 mb-[18px] text-copper">{s.icon}</svg>
                <h3 className="text-[1.15rem] mb-2">{s.title}</h3>
                <p className="text-ink-soft text-[0.96rem]">{s.body}</p>
                <Link href="/services" className="inline-block mt-3.5 text-sm font-semibold text-navy hover:text-copper">
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="max-w-[60ch] mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-copper block mb-3">How It Works</span>
            <h2 className="text-[1.7rem] sm:text-[2.3rem]">From first call to final walkthrough</h2>
          </div>
          <div className="flex flex-col">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`grid grid-cols-[50px_1fr] sm:grid-cols-[90px_1fr] gap-6 py-7 border-t border-line ${
                  i === steps.length - 1 ? "border-b" : ""
                }`}
              >
                <span className="font-mono text-copper text-[0.95rem]">{step.num}</span>
                <div>
                  <h3 className="text-[1.1rem] mb-1">{step.title}</h3>
                  <p className="text-ink-soft m-0">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="max-w-[60ch] mx-auto text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-copper block mb-3">Customer Reviews</span>
            <h2 className="text-[1.7rem] sm:text-[2.3rem]">What homeowners say about us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.who} className="bg-white border border-line border-l-[3px] border-l-copper rounded-[3px] p-7">
                <p className="text-foreground mb-[18px]">&quot;{t.quote}&quot;</p>
                <span className="font-mono text-[0.78rem] uppercase tracking-wide text-ink-soft">{t.who}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-navy text-white text-center py-20">
        <div className="max-w-[1120px] mx-auto px-7">
          <h2 className="text-white text-[1.7rem] sm:text-[2.4rem]">Get a free, no-pressure roof quote</h2>
          <p className="text-navy-soft max-w-[50ch] mx-auto mt-4 mb-8">
            Tell us a little about your roof and we&apos;ll get back to you
            within one business day with next steps.
          </p>
          <Link href="/contact" className="inline-flex items-center bg-copper hover:bg-copper-dark text-white font-semibold px-[26px] py-3.5 rounded-[3px] transition-colors">
            Request Your Free Quote
          </Link>
        </div>
      </section>
    </>
  );
}
