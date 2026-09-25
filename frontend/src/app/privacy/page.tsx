import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy — ViLabs",
};

// Written from the data flow in docs/implementation-plan.md (§1–§3).
// Values marked "to confirm" in docs/frontend-notes.md must match the backend
// (cleanup job / Redis TTL) and be reviewed by VILABS before going live.
const LAST_UPDATED = "25/09/2026";
const RETENTION_HOURS = 24;

const PROCESSORS = [
  { name: "Vercel", role: "Hosting of the web application (user interface)." },
  { name: "Render", role: "Hosting of the processing server (backend)." },
  { name: "Supabase", role: "Temporary storage of the uploaded PDF and the generated files." },
  { name: "Upstash (Redis)", role: "Temporary storage of the processing status of each request." },
  {
    name: "Anthropic",
    role: "AI model (Claude) that analyses the text extracted from the Grant Agreement and returns the structured data used to fill the files.",
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="w-full">
      <h2 className="mb-2 mt-4 text-base font-bold text-slate-800">{title}</h2>
      <div className="mb-4 space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
}

export default function PrivacyPage() {
  return (
    <article className="fade-in mb-12 mt-28 flex w-full max-w-3xl flex-col items-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mb-6 text-xs text-slate-400">Last updated: {LAST_UPDATED}</p>

      <p className="mb-4 text-sm leading-relaxed text-slate-600">
        This policy explains how VILABS OE processes the data you provide when you use the Grant
        Agreement Processing application (the &ldquo;Application&rdquo;), which generates an INFO
        document, a Gantt chart and a KPI monitoring file from a Grant Agreement PDF.
      </p>

      <Section title="1. Data Controller">
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
          <span className="block">
            Email:{" "}
            <a href="mailto:info@vilabs.eu" className="text-sky-600 hover:underline">
              info@vilabs.eu
            </a>
          </span>
        </address>
      </Section>

      <Section title="2. No Accounts, No History">
        <p>
          The Application does not require an account or login, and it does not keep a history of
          your requests. It has no database: data is kept only temporarily, for as long as needed to
          produce your files and let you download them (see section 7).
        </p>
      </Section>

      <Section title="3. What Data We Process">
        <List>
          <li>
            <strong className="font-semibold text-slate-700">The Grant Agreement PDF you upload.</strong>{" "}
            Grant Agreements may contain personal data, such as the names, roles and contact details of
            project staff and partner organisations.
          </li>
          <li>
            <strong className="font-semibold text-slate-700">The generated files</strong> (INFO document,
            Gantt chart, KPI monitoring) and their previews, which contain data extracted from your PDF.
          </li>
          <li>
            <strong className="font-semibold text-slate-700">Processing status</strong> of your request
            (e.g. &ldquo;analysing&rdquo;, &ldquo;done&rdquo;), linked to a random request identifier.
          </li>
          <li>
            <strong className="font-semibold text-slate-700">Technical data</strong> that our hosting
            providers record to operate and secure the service, such as IP address, browser type and
            request logs.
          </li>
        </List>
        <p>
          Please upload only documents that you are authorised to share, and do not upload documents
          containing sensitive data that is not needed to generate the files.
        </p>
      </Section>

      <Section title="4. How Your Data Is Processed">
        <List>
          <li>Your PDF is uploaded over an encrypted (HTTPS) connection and stored temporarily.</li>
          <li>Text and tables are extracted from the PDF automatically on our server.</li>
          <li>
            The extracted text is sent to an AI model (Claude, provided by Anthropic) to identify the
            project information, work packages, deliverables, milestones and KPIs.
          </li>
          <li>The results are used to fill predefined Word and Excel templates.</li>
          <li>You can preview the files and download them individually or as a .zip.</li>
        </List>
        <p>
          The files are generated automatically. They may contain errors, so please review them before
          using them.
        </p>
      </Section>

      <Section title="5. Service Providers (Processors)">
        <p>We use the following providers, only to operate the Application:</p>
        <List>
          {PROCESSORS.map((p) => (
            <li key={p.name}>
              <strong className="font-semibold text-slate-700">{p.name}:</strong> {p.role}
            </li>
          ))}
        </List>
        <p>
          We do not sell your data and we do not use it for marketing. Some of these providers may
          process data outside the European Economic Area; in that case the transfer is covered by
          appropriate safeguards, such as the European Commission&rsquo;s Standard Contractual Clauses.
        </p>
      </Section>

      <Section title="6. Legal Basis">
        <p>
          We process your data to provide the service you request (Article 6(1)(b) GDPR) and, for
          technical and security logs, on the basis of our legitimate interest in operating a secure
          service (Article 6(1)(f) GDPR).
        </p>
      </Section>

      <Section title="7. Data Retention">
        <List>
          <li>
            The uploaded PDF, the generated files and their previews are deleted automatically within{" "}
            {RETENTION_HOURS} hours.
          </li>
          <li>The processing status of each request expires automatically within the same period.</li>
          <li>Technical logs are kept by our hosting providers according to their own retention periods.</li>
        </List>
        <p>
          Once deleted, your files can no longer be downloaded, so please download them when they are
          ready.
        </p>
      </Section>

      <Section title="8. Cookies and Tracking">
        <p>
          The Application does not use cookies, analytics or advertising trackers, and it does not store
          any data in your browser.
        </p>
      </Section>

      <Section title="9. Your Rights">
        <p>
          Under the GDPR you have the right to access, rectify or erase your data, to restrict or object
          to its processing, and to data portability. Because the Application has no accounts and
          deletes data automatically, we may be unable to identify your data after it has been deleted.
          To exercise your rights, contact us at{" "}
          <a href="mailto:info@vilabs.eu" className="text-sky-600 hover:underline">
            info@vilabs.eu
          </a>
          .
        </p>
        <p>
          You also have the right to lodge a complaint with the Hellenic Data Protection Authority (
          <a
            href="https://www.dpa.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:underline"
          >
            www.dpa.gr
          </a>
          ).
        </p>
      </Section>

      <Section title="10. Security">
        <p>
          Data is transmitted over HTTPS, stored only temporarily, accessible only to the systems that
          process your request, and deleted automatically.
        </p>
      </Section>

      <Section title="11. Children">
        <p>The Application is intended for professional use and is not directed at individuals under 16.</p>
      </Section>

      <Section title="12. Changes to This Policy">
        <p>We may update this policy. Changes will be published on this page with a new update date.</p>
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
