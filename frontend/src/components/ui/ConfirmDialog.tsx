"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  icon: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
}

/** Yes/No confirmation modal (delete file, leave page…), styled like the mockup. */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  icon,
  confirmLabel,
  cancelLabel = "No, Cancel",
  tone = "primary",
}: ConfirmDialogProps) {
  const iconTone = tone === "danger" ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600";
  const confirmTone =
    tone === "danger"
      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
      : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm" />
        <Dialog.Content className="fade-in fixed left-1/2 top-1/2 z-50 flex w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-2xl">
          <div className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${iconTone}`}>
            {icon}
          </div>
          <Dialog.Title className="mb-2 text-lg font-bold text-slate-900">{title}</Dialog.Title>
          <Dialog.Description className="mb-6 text-sm text-slate-600">{description}</Dialog.Description>
          <div className="flex justify-center gap-3">
            <Dialog.Close className="flex-1 cursor-pointer rounded-xl bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 transition-all hover:bg-slate-200">
              {cancelLabel}
            </Dialog.Close>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onConfirm();
              }}
              className={`flex-1 cursor-pointer rounded-xl px-4 py-2.5 font-semibold text-white shadow-md transition-all ${confirmTone}`}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
