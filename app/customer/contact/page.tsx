import type { Metadata } from "next";
import RoofLine from "../components/RoofLine";
import ContactForm from "../components/ContactForm";
import { ScrollReveal } from "../../../components/ScrollReveal";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a roofing quote from Markit Roofing. Call, email, or fill out our contact form.",
};

const infoBlocks = [
  {
    title: "Phone",
    body: (
      <>
        <a
          href="tel:+14036336300"
          className="block text-ink-soft hover:text-navy dark:hover:text-white transition-colors"
        >
          Calgary: (403) 633-6300
        </a>

        <a
          href="tel:+17802575220"
          className="block text-ink-soft hover:text-navy dark:hover:text-white transition-colors"
        >
          Edmonton: (780) 257-5220
        </a>
      </>
    ),
    icon: (
      <path
        d="M5 4H9L11 9L8.5 10.5C9.5 12.5 11.5 14.5 13.5 15.5L15 13L20 15V19C20 20 19 21 18 21C10 21 3 14 3 6C3 5 4 4 5 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Email",
    body: (
      <a
        href="mailto:info@markitroofing.ca"
        className="text-ink-soft hover:text-navy dark:hover:text-white transition-colors"
      >
        info@markitroofing.ca
      </a>
    ),
    icon: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        <path
          d="M3 6L12 13L21 6"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </>
    ),
  },
  {
    title: "Service Area",
    body:
      "Serving Calgary, Edmonton, and surrounding Alberta communities. Offices at 3923 3A St NE, Calgary and 12607-124 Street NW, Edmonton.",
    icon: (
      <>
        <path
          d="M12 21C12 21 5 14.5 5 9.5C5 5.9 8.1 3 12 3C15.9 3 19 5.9 19 9.5C19 14.5 12 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        <circle
          cx="12"
          cy="9.5"
          r="2.2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </>
    ),
  },
  {
    title: "Hours",
    body: "Monday–Friday, 8:00 AM–4:00 PM.",
    icon: (
      <>
        <circle
          cx="12"
          cy="12"
          r="8.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        <path
          d="M12 7V12L15.5 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
  },
];

export default function Contact() {
  return (
    <>
      {/* =========================
          HERO
      ========================= */}

      <section className="bg-navy text-white pt-[72px] pb-16">
        <div className="max-w-[1120px] mx-auto px-7">
          <ScrollReveal direction="left" duration={700}>
            <span className="text-xs font-bold uppercase tracking-[0.14em] !text-white block mb-3">
              Contact
            </span>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={100} duration={800}>
            <h1 className="!text-white font-bold text-[2.2rem] sm:text-[3rem] max-w-[18ch] leading-[1.08]">
              Let&apos;s talk about your roof.
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={200} duration={800}>
            <p className="!text-white/90 max-w-[50ch] mt-5 mb-0 leading-relaxed">
              Fill out the form and we&apos;ll follow up within one business day,
              or call us directly during business hours.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <RoofLine />

      {/* =========================
          CONTACT CONTENT
      ========================= */}

      <section className="bg-background py-[88px]">
        <div className="max-w-[1120px] mx-auto px-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">

            {/* CONTACT FORM */}
            <ScrollReveal direction="left" duration={700}>
              <div className="bg-background border border-line rounded-xl p-6 sm:p-8 shadow-sm card-hover-glow">
                <ContactForm />
              </div>
            </ScrollReveal>

            {/* CONTACT INFO */}
            <ScrollReveal direction="right" delay={150} duration={700}>
              <div>
                <div className="mb-8">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-navy dark:text-white block mb-3">
                    Contact Details
                  </span>

                  <h2 className="text-foreground font-bold text-[1.6rem] sm:text-[2rem] mb-3">
                    We&apos;re here when you need us.
                  </h2>

                  <p className="text-ink-soft leading-relaxed">
                    Reach our Calgary or Edmonton team by phone or email, or send
                    us your project details through the form.
                  </p>
                </div>

                <div className="border-t border-line">
                  {infoBlocks.map((block, index) => (
                    <ScrollReveal
                      key={block.title}
                      direction="right"
                      delay={300 + index * 120}
                      distance={25}
                      duration={600}
                    >
                      <div
                        className={`flex gap-4 py-6 ${
                          index === infoBlocks.length - 1
                            ? "border-b border-line"
                            : "border-b border-line"
                        } hover:bg-paper-dim/50 transition-colors duration-200 rounded-lg px-2 -mx-2`}
                      >
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-[#dbeafe] dark:bg-[#172554] flex items-center justify-center">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-6 h-6 text-[#1d4ed8] dark:text-[#93c5fd]"
                            aria-hidden="true"
                          >
                            {block.icon}
                          </svg>
                        </div>

                        <div>
                          <h3 className="text-foreground text-[1rem] font-bold mb-1">
                            {block.title}
                          </h3>

                          {typeof block.body === "string" ? (
                            <p className="text-ink-soft text-[0.92rem] leading-relaxed mb-0">
                              {block.body}
                            </p>
                          ) : (
                            <div className="text-[0.92rem] leading-relaxed">
                              {block.body}
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>
    </>
  );
}
