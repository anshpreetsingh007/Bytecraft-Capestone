import Link from "next/link";
import type { Metadata } from "next";
import "../legal/legal.css";

export const metadata: Metadata = {
  title: "Terms of Service | Markit Roofing",
  description: "The terms you agree to when you use the Markit Roofing platform.",
};

/**
 * Terms of service.
 *
 * Written to describe what the platform genuinely does, in particular that
 * estimates are quotes rather than contracts and that no payment is taken
 * through the site. Not legal advice; have it reviewed before real customers
 * rely on it.
 */
export default function TermsPage() {
  return (
    <main className="legal-page">
      <Link href="/" className="legal-back">
        ← Back to Markit Roofing
      </Link>

      <p className="legal-eyebrow">Legal</p>
      <h1>Terms of Service</h1>
      <p className="legal-updated">Last updated 18 August 2026 · Version 2026-08-v1</p>

      <p>
        These terms apply when you create an account on the Markit Roofing platform and use it to
        request inspections, review estimates or track work. By creating an account you agree to
        them.
      </p>

      <h2>Your account</h2>
      <p>
        You are responsible for keeping your sign-in details private and for anything done through
        your account. Tell us straight away if you think someone else has access to it. Give us
        accurate contact and property information — if the address is wrong, a crew turns up at the
        wrong house.
      </p>
      <p>
        We may deactivate an account that is being used to abuse the service or to submit requests
        for properties the person has no connection to. Deactivating an account does not delete the
        record of work already done.
      </p>

      <h2>Requesting an inspection</h2>
      <p>
        Submitting a request asks us to come and look at your roof. It does not commit either of us
        to any work or cost. We will contact you to arrange a time, and we will tell you before the
        appointment if we need to move it.
      </p>

      <h2>Estimates</h2>
      <p>
        An estimate is our best assessment of what a job will cost based on what the inspector saw
        and the measurements taken at the time. It is a <strong>quote, not a fixed-price
        contract</strong>. If we open up the roof and find something that was not visible during the
        inspection — rotten decking, previous repairs done badly, hidden water damage — we will stop,
        tell you, and issue a revised estimate before continuing.
      </p>
      <p>
        Accepting an estimate in the platform means you would like us to go ahead with the work as
        quoted. We will then contact you to schedule it. An estimate stays open for{" "}
        <strong>30 days</strong> from the date we send it; after that, material prices may have moved
        and we may need to requote.
      </p>

      <div className="legal-callout">
        <p>
          <strong>No payment is taken through this platform.</strong> We accept cash on completion,
          and financing can be arranged directly with our office over the phone. Nobody from Markit
          Roofing will ever ask you to enter card or bank details on this website. If you are asked
          to, it is not us — please contact us immediately.
        </p>
      </div>

      <h2>Cancelling</h2>
      <p>
        You can cancel a booked inspection at any time by contacting us. If you cancel accepted work
        after materials have already been ordered for your job specifically, we may ask you to cover
        that cost.
      </p>

      <h2>Our work</h2>
      <p>
        We carry out work to the standard expected of a competent roofing contractor and in line with
        applicable Alberta building requirements. Any warranty on workmanship or materials is set out
        in the paperwork you receive when the job is finished — not on this website.
      </p>

      <h2>The platform itself</h2>
      <p>
        We aim to keep the platform available, but we do not guarantee it will be uninterrupted or
        error-free. The website assistant is there to help with roofing questions and to book
        inspections; it can be wrong, and nothing it says overrides a written estimate or a
        conversation with our staff.
      </p>
      <p>
        Do not attempt to access accounts or records that are not yours, interfere with the service,
        or use it to submit false requests.
      </p>

      <h2>Liability</h2>
      <p>
        Nothing in these terms limits our liability for death or personal injury caused by our
        negligence, or for anything else that cannot be limited by law. Beyond that, our liability
        for any claim connected to the platform is limited to the amount you have paid us for the
        work the claim relates to.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. If a change is significant we will update the version number above
        and ask you to agree again the next time you sign in.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms, or anything else, can go through our{" "}
        <Link href="/customer/contact">contact page</Link>. Our{" "}
        <Link href="/privacy">privacy policy</Link> explains how we handle your information.
      </p>
    </main>
  );
}
