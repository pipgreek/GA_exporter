import { BackendGate } from "@/components/home/BackendGate";
import { HomeView } from "@/components/home/HomeView";

// Home page: backend check → upload → progress → files (download + optional preview).
export default function HomePage() {
  return (
    <BackendGate>
      <HomeView />
    </BackendGate>
  );
}
