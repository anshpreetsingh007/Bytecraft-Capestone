import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-navy dark:bg-background text-navy-soft pt-14 pb-7">
      <div className="max-w-[1120px] mx-auto px-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Logo />
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
              <li><Link href="/customer" className="hover:text-white">Home</Link></li>
              <li><Link href="/customer/services" className="hover:text-white">Services</Link></li>
              <li><Link href="/customer/about" className="hover:text-white">About</Link></li>
              <li><Link href="/customer/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/customer/estimate" className="hover:text-white">View Estimate</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white mb-4">
              Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/customer/services" className="hover:text-white">Roof Replacement</Link></li>
              <li><Link href="/customer/services" className="hover:text-white">Roof Repair</Link></li>
              <li><Link href="/customer/services" className="hover:text-white">Inspections</Link></li>
              <li><Link href="/customer/services" className="hover:text-white">Storm Restoration</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="tel:+14036336300" className="hover:text-white">Calgary: (403) 633-6300</a></li>
              <li><a href="tel:+17802575220" className="hover:text-white">Edmonton: (780) 257-5220</a></li>
              <li><a href="mailto:info@markitroofing.ca" className="hover:text-white">info@markitroofing.ca</a></li>
              <li>Mon–Fri, 8am–4pm · 24/7 emergency service</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-[0.82rem] text-navy-faint">
          <span>© 2026 Markit Roofing. All rights reserved.</span>
          <span>SeCOR Certified · AARA Member</span>
        </div>
      </div>
    </footer>
  );
}