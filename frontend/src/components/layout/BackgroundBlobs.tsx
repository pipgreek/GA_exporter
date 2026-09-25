export function BackgroundBlobs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="blob-1 absolute left-10 top-10 h-[30rem] w-[30rem] rounded-full bg-sky-300/70 blur-[80px]" />
      <div className="blob-2 absolute bottom-10 right-10 h-[35rem] w-[35rem] rounded-full bg-cyan-300/60 blur-[90px]" />
      <div className="blob-3 absolute left-1/3 top-1/2 h-[32rem] w-[32rem] rounded-full bg-indigo-200/70 blur-[90px]" />
    </div>
  );
}
