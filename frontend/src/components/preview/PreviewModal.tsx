"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

/**
 * Expanded preview: 90% of the screen, dimmed/frozen background, internal
 * scroll, X (or Esc) closes and returns focus to where the user was.
 * One modal is reused for all three previews.
 */
export function PreviewModal({ open, onOpenChange, title, children }: PreviewModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fade-in fixed left-1/2 top-1/2 z-50 flex h-[90vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <Dialog.Title className="text-xl font-bold text-slate-900">{title}</Dialog.Title>
            <Dialog.Close
              aria-label="Close preview"
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:text-rose-600"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
