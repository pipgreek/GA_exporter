import { LogoutButton } from "@/components/auth/LogoutButton";
import { BackendGate } from "@/components/home/BackendGate";
import { HomeView } from "@/components/home/HomeView";

// Home page (behind the login, see src/proxy.ts):
// backend check → upload → progress → files (download + optional preview).
export default function HomePage() {
  return (
    <>
      <LogoutButton />
      <BackendGate>
        <HomeView />
      </BackendGate>
    </>
  );
}
