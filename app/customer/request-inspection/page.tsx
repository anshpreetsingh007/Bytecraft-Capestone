import { redirect } from "next/navigation";

/**
 * Retired: this page was a dead form.
 *
 * It rendered seven inputs and a "Submit Inspection Request" button with no
 * onSubmit handler, no state and no API call -- so clicking submit did a native
 * form GET, reloaded the page, and silently threw away everything the customer
 * had typed. Nothing was ever saved, and no request ever reached the office.
 *
 * The free-quote form on the contact page does the same job properly: it posts
 * to /api/inspection-requests under the signed-in customer's account. Anyone
 * who still has this URL lands there instead.
 */
export default function RequestInspectionPage() {
  redirect("/customer/contact");
}
