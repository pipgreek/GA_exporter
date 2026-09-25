import Link from "next/link";

// Result page: /result?requestId=... — download cards, "Download all (.zip)", return home.
// Built in a later step (see docs/frontend-notes.md); this is the setup placeholder.
export default async function ResultPage({ searchParams }: PageProps<"/result">) {
  const { requestId } = await searchParams;

  return (
    <div className="fade-in mt-28 flex w-full max-w-4xl flex-col items-center">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Your files</h1>
      <p className="mb-8 text-sm text-slate-500">
        Request: <code>{typeof requestId === "string" ? requestId : "—"}</code>
      </p>
      <Link href="/" className="font-semibold text-sky-600 hover:text-sky-800">
        ← Return to Home Page
      </Link>
    </div>
  );
}
