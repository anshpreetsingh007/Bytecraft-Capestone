import Link from "next/link";
import type { Metadata } from "next";
import "../legal/legal.css";

export const metadata: Metadata = {
  title: "Privacy Policy | Markit Roofing",
  description:
    "How Markit Roofing collects, uses and protects the personal information you give us.",
};

/**
 * Privacy policy.
 *
 * The platform stores names, email addresses, phone numbers and home
 * addresses, which makes it subject to PIPEDA in Alberta. There was no
 * privacy notice, no stated retention period and no way to ask for deletion.
 *
 * This is a plain-language starting point written to match what the software
 * actually does. It is not legal advice, and Markit should have it reviewed
 * before going live with real customers.
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <Link href="/" className="legal-back">
        ← Back to Markit Roofing
      </Link>

      <p className="legal-eyebrow">Legal</p>
      <h1>Privacy Policy</h1>
      <p className="legal-updated">Last updated 18 August 2026 · Version 2026-08-v1</p>

      <p>
        Markit Roofing (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides roof inspection, repair and
        replacement services in Alberta. This policy explains what personal information we collect
        through this platform, why we collect it, and what you can ask us to do with it. We handle
        personal information in line with Canada&rsquo;s <strong>Personal Information Protection and
        Electronic Documents Act (PIPEDA)</strong> and Alberta&rsquo;s Personal Information
        Protection Act.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> — your name and email address, which are needed to create
          and sign in to an account.
        </li>
        <li>
          <strong>Contact and property details</strong> — your phone number, mailing address and the
          address of the property being inspected, so a crew can reach you and get to the right
          place.
        </li>
        <li>
          <strong>Job records</strong> — the inspection requests you submit, the notes and findings
          an inspector records, the estimates we prepare for you, and whether you accepted them.
        </li>
        <li>
          <strong>Chat messages</strong> — if you use the assistant on our site, the messages in that
          conversation are sent to our AI provider to generate a reply.
        </li>
        <li>
          <strong>Technical records</strong> — the IP address and timestamp attached to actions taken
          in the system, kept in an audit log so we can answer questions about who changed what.
        </li>
      </ul>

      <div className="legal-callout">
        <p>
          <strong>We do not process payments through this platform.</strong> Payment is handled in
          person in cash, or arranged directly with our staff over the phone, so we never collect or
          store card or bank details here.
        </p>
      </div>

      <h2>Why we collect it</h2>
      <p>
        We use your information only to quote for and carry out the work you ask us to do: scheduling
        an inspector, preparing an estimate, keeping you updated on your job, and maintaining the
        records a roofing business needs to keep. We do not sell your information, and we do not use
        it for advertising.
      </p>

      <h2>Who can see it</h2>
      <p>
        Access inside Markit Roofing is limited by role. An inspector sees only the jobs assigned to
        them. Administrators see the work queue and business reporting. You see your own requests and
        estimates and nobody else&rsquo;s. Every one of those boundaries is enforced by our servers,
        not just hidden in the interface.
      </p>
      <p>
        We share information with third parties only where it is necessary to run the service:
        Google Firebase handles account sign-in and password resets, and Microsoft Azure OpenAI
        generates replies in the website assistant. We do not share your information with anyone
        else without your consent, unless we are required to by law.
      </p>

      <h2>Consent</h2>
      <p>
        We ask for your consent when you create an account, and we record which version of this
        policy you agreed to. You can withdraw consent at any time by contacting us, though we may be
        unable to continue providing services if you do.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep job records — inspections, estimates and reports — for <strong>seven years</strong>
        , which is the period Canadian businesses are generally expected to retain records supporting
        their tax filings and any warranty claims. Account details are kept while your account is
        open. If you ask us to close your account, we deactivate it and remove your contact details,
        but keep the underlying job records for the retention period above.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li>Ask for a copy of the personal information we hold about you.</li>
        <li>Ask us to correct anything that is wrong or out of date.</li>
        <li>Ask us to delete your account and contact details.</li>
        <li>Withdraw your consent to us using your information.</li>
        <li>Complain to the Office of the Privacy Commissioner of Canada if you are not satisfied.</li>
      </ul>
      <p>
        To make any of these requests, email us at{" "}
        <a href="mailto:privacy@markitroofing.ca">privacy@markitroofing.ca</a>. We will respond within
        30 days.
      </p>

      <h2>How we protect it</h2>
      <p>
        Sign-in is handled by Google Firebase, so we never see or store your password. Every request
        to our systems is checked against your signed-in identity before any data is returned.
        Sensitive actions — approving an estimate, changing someone&rsquo;s access, adjusting stock —
        are written to an audit log.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we make a material change, we will update the version number at the top of this page and
        ask for your consent again the next time you sign in.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can go to{" "}
        <a href="mailto:privacy@markitroofing.ca">privacy@markitroofing.ca</a>, or you can raise them
        through our <Link href="/customer/contact">contact page</Link>.
      </p>
    </main>
  );
}
