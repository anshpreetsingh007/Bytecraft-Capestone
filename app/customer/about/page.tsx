import type { Metadata } from "next";
import Link from "next/link";
import RoofLine from "../components/RoofLine";

export const metadata: Metadata = {
  title: "About",
  description:
    "Markit Roofing is a locally owned roofing contractor with 18+ years of residential and commercial experience.",
};

const values = [
  { title: "Written quotes, no surprises", body: "Every job gets a detailed, itemized estimate before we start — the number we quote is the number you pay." },
  { title: "Our own crews, not subcontractors", body: "The people on your roof are Markit employees, trained on our safety standards and accountable to our warranty." },
  { title: "Real warranties, honored", body: "Workmanship warranties are backed in writing and tracked by job — if something's wrong, we come back and fix it." },
  { title: "Clean job sites", body: "Magnetic nail sweeps, tarped landscaping, and full debris haul-away are standard on every project, not an upsell." },
];

const timeline = [
  { year: "2008", title: "Founded as a repair business", body: "Started with one truck and a focus on fast, honest leak repairs for local homeowners." },
  { year: "2013", title: "First full-replacement crew", body: "Brought on a dedicated installation team to handle complete tear-off and re-roof projects." },
  { year: "2018", title: "Added commercial roofing", body: "Expanded into low-slope and flat-roof systems to serve small businesses and property managers." },
  { year: "2026", title: "3,400+ roofs and counting", body: "Now a 22-person team still run by the same principle: quote it straight, then do the work right." },
];

export default function About() {
  return (
    <>
      <section className="bg-navy text-white pt-[72px] pb-14">
        <div className="max-w-[1120px] mx-auto px-7">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-copper block mb-3">About Us</span>
          <h1 className="text-white text-[2rem] sm:text-[2.9rem] max-w-[20ch]">A roofing crew that answers the phone</h1>
          <p className="text-navy-soft max-w-[50ch] mt-4 mb-0">
            Markit Roofing started as a two-person repair outfit and grew into a full-service roofing contractor — without losing the habit of showing up when we say we will.
          </p>
        </div>
      </section>

      <RoofLine />

      <section className="py-16">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-y border-line py-9">
            {[
              ["18+", "Years in business"],
              ["3,400+", "Roofs completed"],
              ["22", "Full-time crew"],
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

      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="max-w-[60ch] mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-copper block mb-3">Our Approach</span>
            <h2 className="text-[1.7rem] sm:text-[2.3rem]">What we believe about roofing work</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map((v) => (
              <div key={v.title} className="bg-white border border-line rounded-[3px] p-8">
                <h3 className="text-[1.15rem] mb-2">{v.title}</h3>
                <p className="text-ink-soft text-[0.96rem] mb-0">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="max-w-[60ch] mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-copper block mb-3">Our Story</span>
            <h2 className="text-[1.7rem] sm:text-[2.3rem]">How Markit Roofing got here</h2>
          </div>
          <div className="border-l-2 border-line pl-7 ml-1.5">
            {timeline.map((item, i) => (
              <div key={item.year} className={`relative ${i === timeline.length - 1 ? "pb-0" : "pb-9"}`}>
                <span className="absolute -left-[33px] top-1 w-2.5 h-2.5 rounded-full bg-copper" />
                <span className="font-mono text-[0.8rem] text-copper block mb-1.5">{item.year}</span>
                <h3 className="text-[1.1rem] mb-1">{item.title}</h3>
                <p className="text-ink-soft mb-0">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy text-white text-center py-20">
        <div className="max-w-[1120px] mx-auto px-7">
          <h2 className="text-white text-[1.7rem] sm:text-[2.4rem]">Ready to talk about your roof?</h2>
          <p className="text-navy-soft max-w-[50ch] mx-auto mt-4 mb-8">
            Reach out for a free estimate — we&apos;ll walk the roof with you and explain exactly what we find.
          </p>
          <Link href="/contact" className="inline-flex items-center bg-copper hover:bg-copper-dark text-white font-semibold px-[26px] py-3.5 rounded-[3px] transition-colors">
            Request Your Free Quote
          </Link>
        </div>
      </section>
    </>
  );
}
