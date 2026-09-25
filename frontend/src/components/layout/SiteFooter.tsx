export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-20 flex w-full items-center justify-between border-t border-slate-800 bg-slate-900 px-6 py-6 text-sm text-slate-400 sm:px-12">
      <span>© Copyright {new Date().getFullYear()} ViLabs. All Rights Reserved.</span>
    </footer>
  );
}
