import type { Metadata } from "next";
import Link from "next/link";
import RoofLine from "../components/RoofLine";

export const metadata: Metadata = {
  title: "About",
  description:
    "Markit Roofing is a Calgary and Edmonton-based roofing contractor with 13+ years of residential and commercial experience.",
};

const values = [
  { title: "Written quotes, no surprises", body: "Every job gets a detailed, itemized estimate before we start — the number we quote is the number you pay." },
  { title: "Our own crews, not subcontractors", body: "The people on your roof are Markit employees, trained on our safety standards and accountable to our warranty." },
  { title: "Real warranties, honored", body: "Workmanship warranties are backed in writing and tracked by job — if something's wrong, we come back and fix it." },
  { title: "Clean job sites", body: "Magnetic nail sweeps, tarped landscaping, and full debris haul-away are standard on every project, not an upsell." },
];

const timeline = [
  { year: "2013", title: "Founded in Calgary", body: "Started as a small three-person crew focused on doing roofing and building envelope work right." },
  { year: "2019", title: "AARA member, SeCOR certified", body: "Joined the Alberta Allied Roofing Association and passed SeCOR's independently audited safety program." },
  { year: "2020s", title: "Expanded to Edmonton", body: "Opened a second office to serve as the North Region contractor alongside our South Region base in Calgary." },
  { year: "2026", title: "50+ person team", body: "Grown from three people to a full crew across two Alberta offices, BBB accredited and WCB-compliant." },
];

export default function About() {
  return (
    <>
      <section className="bg-navy text-white pt-[72px] pb-14">
        <div className="max-w-[1120px] mx-auto px-7">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white block mb-3">About Us</span>
          <h1 className="text-white text-[2rem] sm:text-[2.9rem] max-w-[20ch]">A roofing crew that answers the phone</h1>
          <p className="text-navy-soft max-w-[50ch] mt-4 mb-0">
            Markit Roofing started in Calgary as a three-person crew and grew into a 50+ person team serving Calgary, Edmonton, and the surrounding communities — without losing the habit of showing up when we say we will.
          </p>
        </div>
      </section>

      <RoofLine />
      

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 border-y border-line py-10">
            {[
              ["13+", "Years in business"],
              ["50+", "Team members"],
              ["2", "Alberta offices"],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="font-bold text-[2.3rem] text-foreground leading-none">
                  {num}
                </div>
                <p className="text-ink-soft mt-2">{label}</p>
              </div>
            ))}
          </div>

      <section className="bg-paper-dim py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="max-w-[60ch] mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-navy dark:text-copper block mb-3">Our Approach</span>
            <h2 className="text-[1.7rem] sm:text-[2.3rem]">What we believe about roofing work</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map((v) => (
              <div key={v.title} className="bg-background border border-line rounded-[3px] p-8">
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
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-navy dark:text-copper block mb-3">Our Story</span>
            <h2 className="text-[1.7rem] sm:text-[2.3rem]">How Markit Roofing got here</h2>
          </div>
          <div className="border-l-2 border-line pl-7 ml-1.5">
            {timeline.map((item, i) => (
              <div key={item.year} className={`relative ${i === timeline.length - 1 ? "pb-0" : "pb-9"}`}>
                <span className="absolute -left-[33px] top-1 w-2.5 h-2.5 rounded-full bg-navy dark:bg-copper" />
                <span className="text-[0.8rem] font-semibold text-navy dark:text-copper block mb-1.5">{item.year}</span>
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
          <Link href="/customer/contact" className="inline-flex items-center bg-copper hover:bg-copper-dark text-black font-semibold px-[26px] py-3.5 rounded-[3px] transition-colors">
            Request Your Free Quote
          </Link>
        </div>
      </section>
    </>
  );
}
