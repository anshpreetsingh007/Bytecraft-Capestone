import type { Metadata } from "next";
import RoofLine from "../components/RoofLine";
import ContactForm from "../components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a free roofing quote from Markit Roofing. Call, email, or fill out our contact form.",
};

const infoBlocks = [
  {
    title: "Phone",
    body: <a href="tel:+15551234567" className="hover:text-copper">(555) 123-4567</a>,
    icon: <path d="M5 4H9L11 9L8.5 10.5C9.5 12.5 11.5 14.5 13.5 15.5L15 13L20 15V19C20 20 19 21 18 21C10 21 3 14 3 6C3 5 4 4 5 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  },
  {
    title: "Email",
    body: <a href="mailto:hello@markitroofing.com" className="hover:text-copper">hello@markitroofing.com</a>,
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 6L12 13L21 6" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
  {
    title: "Service Area",
    body: "Serving the metro area and surrounding counties within a 40-mile radius.",
    icon: (
      <>
        <path d="M12 21C12 21 5 14.5 5 9.5C5 5.9 8.1 3 12 3C15.9 3 19 5.9 19 9.5C19 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
  {
    title: "Hours",
    body: "Monday–Saturday, 7:00 AM–6:00 PM. Emergency storm response available 24/7.",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 7V12L15.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
];

export default function Contact() {
  return (
    <>
      <section className="bg-navy text-white pt-[72px] pb-14">
        <div className="max-w-[1120px] mx-auto px-7">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-copper block mb-3">Contact</span>
          <h1 className="text-white text-[2rem] sm:text-[2.9rem] max-w-[20ch]">Let&apos;s talk about your roof</h1>
          <p className="text-navy-soft max-w-[50ch] mt-4 mb-0">
            Fill out the form and we&apos;ll follow up within one business day, or call us directly during business hours.
          </p>
        </div>
      </section>

      <RoofLine />

      <section className="py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <ContactForm />

            <div>
              {infoBlocks.map((block, i) => (
                <div
                  key={block.title}
                  className={`flex gap-4 py-5 border-t border-line ${
                    i === infoBlocks.length - 1 ? "border-b" : ""
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-[22px] h-[22px] text-copper shrink-0 mt-0.5">
                    {block.icon}
                  </svg>
                  <div>
                    <h4 className="text-[0.95rem] mb-1">{block.title}</h4>
                    <p className="text-ink-soft text-[0.92rem] mb-0">{block.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
