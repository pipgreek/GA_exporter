import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy — ViLabs",
};

// Written from the actual backend implementation (backend/src/processing,
// backend/src/llm, backend/src/pdf-parsing) and docs/api-contract.md, 2026-09-30.
// Items that must be confirmed or implemented before publishing are listed in
// docs/frontend-notes.md ("Privacy Policy — προς επιβεβαίωση").
const LAST_UPDATED = "30/09/2026";
const RETENTION_HOURS = 24;

const PROCESSORS = [
  {
    name: "Vercel",
    role: "Hosts the web pages of the Application. Your documents are not sent through Vercel: your browser sends them directly to our processing server.",
  },
  {
    name: "Render",
    role: "Runs our processing server, which receives your PDF, extracts its text and generates the files.",
  },
  {
    name: "Supabase",
    role: "Stores your uploaded PDF, the extracted text and the generated files temporarily.",
  },
  {
    name: "Upstash (Redis)",
    role: "Holds the processing queue and the status of each request. It does not contain the content of your documents.",
  },
  {
    name: "Anthropic",
    role: "Provides the AI model (Claude) that receives the extracted text and returns the structured data used to fill the files.",
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

function Term({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-slate-700">{children}</strong>;
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
          your requests. Your data is kept only temporarily, for as long as needed to produce your
          files and let you download them (see section 7).
        </p>
      </Section>

      <Section title="3. What Data We Process">
        <p>For each request, we process and temporarily store:</p>
        <List>
          <li>
            <Term>The Grant Agreement PDF you upload.</Term> It is stored as received, under a random
            request identifier. Your file name is not stored. Grant Agreements may contain personal
            data, such as the names, roles and contact details of project staff and partner
            organisations.
          </li>
          <li>
            <Term>Text extracted from the PDF.</Term> We keep the parts needed to generate the files
            (such as the project data sheet and the description of the action); standard legal terms
            and budget annexes are left out.
          </li>
          <li>
            <Term>The generated files</Term> (INFO document, Gantt chart, KPI monitoring) and a preview
            file used to show you the previews.
          </li>
          <li>
            <Term>Request records:</Term> the random request identifier, the processing status and
            progress messages, and technical counts such as the number of pages. These records do not
            contain the content of your documents.
          </li>
          <li>
            <Term>Technical data</Term> recorded by our hosting providers to operate and secure the
            service, such as IP address, browser type and request logs. Our server logs contain
            technical messages about processing errors and are not intended to include the content of
            your documents.
          </li>
        </List>
        <p>
          Please upload only documents that you are authorised to share, and do not upload documents
          containing sensitive data that is not needed to generate the files.
        </p>
      </Section>

      <Section title="4. How Your Data Is Processed">
        <List>
          <li>Your PDF is uploaded over an encrypted (HTTPS) connection to our processing server and stored temporarily.</li>
          <li>Text and tables are extracted from the PDF automatically on our server.</li>
          <li>
            The extracted text (not the PDF file itself) is sent to an AI model (Claude, provided by
            Anthropic) through its API, in three requests: one for the INFO document, one for the Gantt
            chart and one for the KPI file. The model returns structured data.
          </li>
          <li>The structured data is checked and used to fill predefined Word and Excel templates.</li>
          <li>You can preview the files and download them individually or as a .zip. Previews and downloads are served through our server.</li>
        </List>
        <p>
          The files are generated automatically and are not reviewed by a person. They may contain
          errors, so please review them before using them.
        </p>
      </Section>

      <Section title="5. Service Providers (Processors)">
        <p>We use the following providers, only to operate the Application:</p>
        <List>
          {PROCESSORS.map((p) => (
            <li key={p.name}>
              <Term>{p.name}:</Term> {p.role}
            </li>
          ))}
        </List>
        <p>
          We do not sell your data and we do not use it for marketing. Some of these providers may
          process data outside the European Economic Area; in that case the transfer is covered by
          appropriate safeguards, such as the European Commission&rsquo;s Standard Contractual Clauses.
          The AI provider processes the text we send under the terms of its API service, which may
          include keeping it for a limited period.
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
            The uploaded PDF, the extracted text, the generated files and the preview file are deleted
            automatically within {RETENTION_HOURS} hours.
          </li>
          <li>
            The request records expire within the same period. After that, your request can no longer
            be found and your files can no longer be downloaded.
          </li>
          <li>Technical logs are kept by our hosting providers according to their own retention periods.</li>
        </List>
        <p>Please download your files as soon as they are ready.</p>
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
        <List>
          <li>Data is transmitted over HTTPS.</li>
          <li>
            Files are kept in a storage service that only our server can access, using a secret key that
            is never exposed to your browser.
          </li>
          <li>Data is stored only temporarily and deleted automatically.</li>
          <li>
            There is no login. The download links of a request contain a random, hard-to-guess
            identifier, and anyone who obtains a link can download that request&rsquo;s files until
            they are deleted. Please do not share your download links.
          </li>
        </List>
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
