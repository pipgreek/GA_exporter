import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy — ViLabs",
};

// Content from the UI/UX mockup (docs/frontend UI UX/index.html).
// Keep "Data Retention" in sync with the backend cleanup job / Redis TTL.
const LAST_UPDATED = "23/09/2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 mt-4 text-base font-bold text-slate-800">{title}</h2>
      <div className="mb-4 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <article className="fade-in mb-12 mt-28 flex w-full max-w-3xl flex-col items-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mb-6 text-xs text-slate-400">Last updated: {LAST_UPDATED}</p>

      <p className="mb-4 text-sm leading-relaxed text-slate-600">
        At ViLabs, we respect your privacy and are committed to protecting the personal and
        organizational data you share with our Grant Agreement application. This policy explains what
        data we collect, how it is processed, who it may be shared with, and what rights you have.
      </p>

      <Section title="1. Data Controller">
        <p className="mb-4">The data controller responsible for the processing described in this policy is:</p>
        <address className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 not-italic shadow-sm">
          <strong className="mb-1 block font-bold text-slate-900">VILABS OE</strong>
          <a
            href="https://www.google.com/maps/place/ViLabs/@40.5744384,22.9928996,17z/data=!3m1!4b1!4m6!3m5!1s0x14a83f598b0a24f7:0x85600b0eaf0efa16!8m2!3d40.5744344!4d22.9954745!16s%2Fg%2F1hm3wg4z0?entry=tts&shorturl=1"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1 block text-sky-600 hover:underline"
          >
            Thermokoitida Technopolis VEPE Technopoli, Pylaia, Building Γ2, Office 3.1
          </a>
          <span className="block font-medium text-slate-700">Thessaloniki, GREECE</span>
          <span className="mt-1 block">Tel: +30 2310 365 185</span>
        </address>
      </Section>

      <Section title="2. What Data We Process">
        <p>When you use the Application, we process:</p>
        <ul className="mt-1 list-disc pl-5">
          <li>The Grant Agreement PDF file you upload.</li>
          <li>The generated outputs.</li>
          <li>Basic technical data necessary to operate the service.</li>
        </ul>
      </Section>

      <Section title="3. How Your Data Is Processed">
        <p>Your uploaded file is processed through text extraction and analyzed securely.</p>
      </Section>

      <Section title="4. Third-Party Processors">
        <p>We use third-party service providers solely for generation purposes adhering to GDPR.</p>
      </Section>

      <Section title="5. Data Retention">
        <p>Uploaded files and previews are retained temporarily and deleted automatically within 24 hours.</p>
      </Section>

      <Section title="6. Legal Basis">
        <p>We process data based on the performance of a requested service in accordance with GDPR.</p>
      </Section>

      <Section title="7. Your Rights">
        <p>You retain full ownership and have rights to access, correct, or delete your data.</p>
      </Section>

      <Section title="8. Data Security">
        <p>We apply technical and organizational measures including HTTPS encryption.</p>
      </Section>

      <Section title="9. Children's Data">
        <p>Not directed at individuals under 16.</p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>Updates will be posted with a revised update date.</p>
      </Section>

      <Section title="11. Contact">
        <p>
          Contact us at{" "}
          <a href="mailto:info@vilabs.eu" className="text-sky-600 hover:underline">
            info@vilabs.eu
          </a>
          .
        </p>
      </Section>

      <Link
        href="/"
        className="mt-2 flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-sky-700"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to Application
      </Link>
    </article>
  );
}
