import { LogoutButton } from "@/components/auth/LogoutButton";
import { AssistantView } from "@/components/assistant/AssistantView";
import { BackendGate } from "@/components/home/BackendGate";

// Separate page (behind the login, see src/proxy.ts): upload a Grant Agreement and get a
// code to hand to the AI assistant. The main page (/) is unchanged.
export default function AssistantPage() {
  return (
    <>
      <LogoutButton />
      <BackendGate>
        <AssistantView />
      </BackendGate>
    </>
  );
}
