"use client";

import { House, ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/** Registered by the home page: is there work that leaving would discard? */
export interface WorkGuard {
  hasWork: () => boolean;
  reset: () => void;
}

interface NavigationGuardValue {
  register: (guard: WorkGuard | null) => void;
  /** Logo: go to (or back to the top of) the home page. */
  goHome: () => void;
  /** Footer link: open the Privacy Policy page. */
  openPrivacy: () => void;
}

const NavigationGuardContext = createContext<NavigationGuardValue | null>(null);

type Pending = "home" | "privacy" | null;

/**
 * Asks for confirmation before the logo or the Privacy Policy link would
 * discard an uploaded file / generated files (as in the UI/UX mockup).
 */
export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const guard = useRef<WorkGuard | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const register = useCallback((g: WorkGuard | null) => {
    guard.current = g;
  }, []);

  const value = useMemo<NavigationGuardValue>(() => {
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
    const hasWork = () => guard.current?.hasWork() ?? false;

    return {
      register,
      goHome() {
        if (pathname !== "/") router.push("/");
        else if (hasWork()) setPending("home");
        else scrollToTop();
      },
      openPrivacy() {
        if (pathname === "/privacy") scrollToTop();
        else if (hasWork()) setPending("privacy");
        else router.push("/privacy");
      },
    };
  }, [pathname, register, router]);

  function confirm() {
    if (pending === "home") {
      guard.current?.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (pending === "privacy") {
      router.push("/privacy");
    }
  }

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        onConfirm={confirm}
        icon={
          pending === "privacy" ? (
            <ShieldCheck className="size-5" aria-hidden />
          ) : (
            <House className="size-5" aria-hidden />
          )
        }
        title={pending === "privacy" ? "View Privacy Policy?" : "Return to Home?"}
        description={
          pending === "privacy"
            ? "Your current progress will be lost. Make sure you have downloaded any generated files."
            : "Any unsaved progress will be cleared. Make sure you have downloaded any generated files."
        }
        cancelLabel="No, Stay Here"
        confirmLabel={pending === "privacy" ? "Yes, Proceed" : "Yes, Go Home"}
      />
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard(): NavigationGuardValue {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) throw new Error("useNavigationGuard must be used inside NavigationGuardProvider");
  return ctx;
}

/** Lets a page report its unsaved work; the latest callbacks are used at click time. */
export function useRegisterWorkGuard(guard: WorkGuard) {
  const { register } = useNavigationGuard();
  useEffect(() => {
    register(guard);
  });
  useEffect(() => () => register(null), [register]);
}
