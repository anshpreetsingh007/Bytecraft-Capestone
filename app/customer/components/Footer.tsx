import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-navy text-navy-soft pt-14 pb-7">
      <div className="max-w-[1120px] mx-auto px-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Logo dark />
            <p className="text-navy-faint text-sm max-w-[32ch] mt-3.5">
              Residential and commercial roofing, done right and backed by a
              real warranty.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/services" className="hover:text-white">Services</Link></li>
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white mb-4">
              Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/services" className="hover:text-white">Roof Replacement</Link></li>
              <li><Link href="/services" className="hover:text-white">Roof Repair</Link></li>
              <li><Link href="/services" className="hover:text-white">Inspections</Link></li>
              <li><Link href="/services" className="hover:text-white">Storm Restoration</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="tel:+15551234567" className="hover:text-white">(555) 123-4567</a></li>
              <li><a href="mailto:hello@markitroofing.com" className="hover:text-white">hello@markitroofing.com</a></li>
              <li>Mon–Sat, 7am–6pm</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-[0.82rem] text-navy-faint">
          <span>© 2026 Markit Roofing. All rights reserved.</span>
          <span>License #RC-004821</span>
        </div>
      </div>
    </footer>
  );
}
