import Link from "next/link";
import Logo from "./Logo";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.98 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM3.5 8.75h3v11.75h-3zM9.75 8.75h2.88v1.6h.04c.4-.76 1.38-1.6 2.85-1.6 3.05 0 3.61 2 3.61 4.6v6.9h-3v-6.12c0-1.46-.03-3.33-2.03-3.33-2.04 0-2.35 1.59-2.35 3.23v6.22h-3V8.75Z" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.6 21.5v-8.2h2.75l.41-3.2h-3.16V8.05c0-.93.26-1.56 1.59-1.56h1.7V3.63c-.29-.04-1.3-.13-2.47-.13-2.44 0-4.11 1.49-4.11 4.22v2.36H7.55v3.2h2.76v8.2h3.29Z" />
    </svg>
  );
}

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/markitroofingltd/",
    icon: InstagramIcon,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/markit-roofing/",
    icon: LinkedinIcon,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/MarkitRoofingltd",
    icon: FacebookIcon,
  },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white pt-14 pb-7">
      <div className="max-w-[1120px] mx-auto px-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* BRAND */}
          <div className="col-span-2 md:col-span-1">
            <Logo />

            <p className="text-white/80 text-sm max-w-[32ch] mt-3.5 leading-relaxed">
              Residential and commercial roofing, done right and backed by a
              real warranty.
            </p>

            <div className="flex items-center gap-3 mt-5">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Markit Roofing on ${label}`}
                  className="
                    w-9 h-9
                    flex items-center justify-center
                    rounded-full
                    border border-white/25
                    text-white/80
                    hover:text-white
                    hover:border-white/60
                    hover:bg-white/10
                    transition-colors
                  "
                >
                  <Icon width={16} height={16} />
                </a>
              ))}
            </div>
          </div>

          {/* COMPANY - CLICKABLE */}
          <div>
            <h4 className="text-xs uppercase tracking-wider !text-white font-bold mb-4">
              Company
            </h4>

            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link
                  href="/customer"
                  className="hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/customer/services"
                  className="hover:text-white transition-colors"
                >
                  Services
                </Link>
              </li>

              <li>
                <Link
                  href="/customer/about"
                  className="hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>

              <li>
                <Link
                  href="/customer/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>

              <li>
                <Link
                  href="/customer/estimate"
                  className="hover:text-white transition-colors"
                >
                  View Estimate
                </Link>
              </li>

              <li>
                <Link
                  href="/customer/jobs"
                  className="hover:text-white transition-colors"
                >
                  Track My Job
                </Link>
              </li>

              {/* The consent checkbox at signup links to these, so they need
                  to stay reachable from the site itself too. */}
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* SERVICES - NOT CLICKABLE */}
          <div>
            <h4 className="text-xs uppercase tracking-wider !text-white font-bold mb-4">
              Services
            </h4>

            <ul className="space-y-2.5 text-sm text-white/80">
              <li>Roof Replacement</li>
              <li>Roof Repair</li>
              <li>Inspections</li>
              <li>Storm Restoration</li>
            </ul>
          </div>

          {/* CONTACT - NOT CLICKABLE */}
          <div>
            <h4 className="text-xs uppercase tracking-wider !text-white font-bold mb-4">
              Contact
            </h4>

            <ul className="space-y-2.5 text-sm text-white/80">
              <li>Calgary: (403) 633-6300</li>
              <li>Edmonton: (780) 257-5220</li>
              <li>info@markitroofing.ca</li>
              <li>Mon–Fri, 8:00 AM–4:00 PM</li>
            </ul>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="border-t border-white/15 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-[0.82rem] text-white/65">
          <span>© 2026 Markit Roofing. All rights reserved.</span>
          <span>SeCOR Certified · AARA Member</span>
        </div>
      </div>
    </footer>
  );
}