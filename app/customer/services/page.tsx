import type { Metadata } from "next";
import Link from "next/link";
import RoofLine from "../components/RoofLine";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Roof replacement, repair, inspections, storm damage restoration, gutter installation, and commercial roofing from Markit Roofing.",
};

const services = [
  {
    title: "Roof Replacement",
    body: "Complete tear-off and re-roof in asphalt shingle, standing-seam metal, or tile. Includes new underlayment, flashing, and ventilation review.",
    icon: (
      <>
        <path d="M3 21L12 3L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7 21V13H17V21" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
  {
    title: "Roof Repair & Leak Fixes",
    body: "Targeted repairs for leaks, cracked flashing, damaged shingles, and soft decking — most fixed within a single visit.",
    icon: (
      <>
        <path d="M12 2L3 8V22H21V8L12 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 22V15H15V22" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
  {
    title: "Roof Inspections",
    body: "A full-roof walk with a written, photo-backed report — for pre-sale, insurance claims, or a second opinion.",
    icon: <path d="M4 12L9 17L20 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Storm Damage Restoration",
    body: "Emergency tarping, damage documentation, and insurance-ready estimates so you can file a claim with confidence.",
    icon: <path d="M3 15L8 5L13 13L17 6L21 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Gutter Installation & Guards",
    body: "Seamless gutters sized to your roofline, plus guard systems that cut down on ladder-and-bucket cleaning.",
    icon: <path d="M4 6H20M4 6V16C4 17 5 18 6 18H8M20 6V16C20 17 19 18 18 18H16M8 18V21H16V18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Commercial Roofing",
    body: "Low-slope and flat-roof systems — TPO, EPDM, and modified bitumen — with scheduled maintenance plans available.",
    icon: (
      <>
        <rect x="3" y="8" width="18" height="13" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 8L12 3L21 8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </>
    ),
  },
];

const materials = [
  { title: "Asphalt Shingle", body: "The most common residential choice — wide range of colors, 25 to 30-year manufacturer warranties, and the lowest upfront cost." },
  { title: "Standing-Seam Metal", body: "40+ year lifespan, strong wind and hail resistance, and a clean, modern profile that holds paint color longer than shingle." },
  { title: "Tile & Slate", body: "Built for decades of use with minimal upkeep — a heavier system that needs a structural check before installation." },
  { title: "Flat & Low-Slope Systems", body: "TPO, EPDM, and modified bitumen membranes for commercial buildings, additions, and porch roofs." },
];

export default function Services() {
  return (
    <>
      <section className="bg-navy text-white pt-[72px] pb-14">
        <div className="max-w-[1120px] mx-auto px-7">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-copper block mb-3">Services</span>
          <h1 className="text-white text-[2rem] sm:text-[2.9rem] max-w-[20ch]">Every roofing job, one accountable crew</h1>
          <p className="text-navy-soft max-w-[50ch] mt-4 mb-0">
            From a single leak to a full commercial re-roof, we scope the job honestly and put it in writing before we start.
          </p>
        </div>
      </section>

      <RoofLine />

      <section className="py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-white border border-line rounded-[3px] p-8 hover:border-copper hover:-translate-y-0.5 transition-all">
                <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 mb-[18px] text-copper">{s.icon}</svg>
                <h3 className="text-[1.15rem] mb-2">{s.title}</h3>
                <p className="text-ink-soft text-[0.96rem] mb-0">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="max-w-[60ch] mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-copper block mb-3">Materials</span>
            <h2 className="text-[1.7rem] sm:text-[2.3rem]">Choose the roofing system that fits your home</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {materials.map((m) => (
              <div key={m.title} className="bg-white border border-line rounded-[3px] p-8">
                <h3 className="text-[1.15rem] mb-2">{m.title}</h3>
                <p className="text-ink-soft text-[0.96rem] mb-0">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy text-white text-center py-20">
        <div className="max-w-[1120px] mx-auto px-7">
          <h2 className="text-white text-[1.7rem] sm:text-[2.4rem]">Not sure which service you need?</h2>
          <p className="text-navy-soft max-w-[50ch] mx-auto mt-4 mb-8">
            Tell us what&apos;s going on and we&apos;ll point you toward the right fix — no obligation.
          </p>
          <Link href="/contact" className="inline-flex items-center bg-copper hover:bg-copper-dark text-white font-semibold px-[26px] py-3.5 rounded-[3px] transition-colors">
            Talk to a Roofer
          </Link>
        </div>
      </section>
    </>
  );
}
