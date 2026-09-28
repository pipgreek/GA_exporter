import { ChartNoAxesGantt, FileText, Info, Table } from "lucide-react";

const STEPS = [
  {
    title: "Upload Agreement",
    text: "Drag and drop your official Grant Agreement PDF into the upload box above.",
  },
  {
    title: "Automated Analysis",
    text: "Click Start to let our AI scan, extract metadata, and structure your project data.",
  },
  {
    title: "Export Results",
    text: "Download your ready-to-use files, with an optional quick preview of each one.",
  },
];

const FEATURES = [
  {
    title: "INFO Generation",
    text: "Extracts core project metadata, work packages and roles from your Grant Agreement.",
    icon: FileText,
    tone: "bg-sky-50 text-sky-600",
  },
  {
    title: "Gantt Chart",
    text: "Structures work packages, tasks, deliverables and milestones into a ready-to-use Excel timeline.",
    icon: ChartNoAxesGantt,
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "KPI Monitoring",
    text: "Organizes performance indicators into a structured monthly tracking sheet.",
    icon: Table,
    tone: "bg-indigo-50 text-indigo-600",
  },
];

/** "How to use" guide + feature cards, shown before processing starts. */
export function HomeIntro() {
  return (
    <div className="fade-in w-full">
      <section className="mt-16 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
          <Info className="size-4 text-sky-600" aria-hidden /> How to use the application
        </h2>
        <ol className="grid gap-6 text-left sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white shadow-sm">
                {i + 1}
              </span>
              <div>
                <h3 className="mb-1 text-xs font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 grid gap-6 sm:grid-cols-3" aria-label="Generated files">
        {FEATURES.map(({ title, text, icon: Icon, tone }) => (
          <div
            key={title}
            className="flex flex-col items-start rounded-2xl border border-slate-200/60 bg-white/80 p-6 text-left shadow-sm backdrop-blur-sm"
          >
            <div className={`mb-4 flex size-10 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="size-5" aria-hidden />
            </div>
            <h3 className="mb-1 text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs leading-relaxed text-slate-500">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
