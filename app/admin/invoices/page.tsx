import { redirect } from "next/navigation";

/**
 * Invoicing was removed from the product.
 *
 * Markit takes payment in cash or arranges financing over the phone, so the
 * app never invoiced anyone -- this page rendered a hard-coded "John Smith,
 * $2,500" card that was not connected to anything. The close-out step that
 * does matter is the inspector's job report and the admin signing it off, so
 * anyone who still has this URL bookmarked lands there instead.
 */
export default function InvoicesPage() {
  redirect("/admin/job-reports");
}
