"use client";

import { CloudUpload } from "lucide-react";
import { ErrorCode, useDropzone, type FileRejection } from "react-dropzone";

interface UploadDropzoneProps {
  /** Locked while a file is uploaded (only one Grant Agreement at a time). */
  disabled: boolean;
  onFileAccepted: (file: File) => void;
  onFileRejected: (message: string) => void;
}

function rejectionMessage(rejections: FileRejection[]): string {
  const codes = rejections.flatMap((r) => r.errors.map((e) => e.code));
  if (codes.includes(ErrorCode.TooManyFiles)) return "Please upload a single PDF file.";
  return "Please select a valid PDF file.";
}

export function UploadDropzone({ disabled, onFileAccepted, onFileRejected }: UploadDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    maxFiles: 1,
    disabled,
    onDropAccepted: (files) => onFileAccepted(files[0]),
    onDropRejected: (rejections) => onFileRejected(rejectionMessage(rejections)),
  });

  const stateClasses = disabled
    ? "cursor-not-allowed opacity-50 border-slate-300 bg-white"
    : isDragActive
      ? "cursor-pointer border-sky-500 bg-sky-50"
      : "cursor-pointer border-slate-300 bg-white hover:border-sky-500 hover:bg-sky-50/50";

  return (
    <div className="flex flex-col items-center">
      <span id="upload-label" className="mb-2 text-sm font-semibold text-slate-600">
        Add Grant Agreement
      </span>
      <div
        {...getRootProps({
          "aria-labelledby": "upload-label",
          "aria-disabled": disabled,
        })}
        className={`flex size-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${stateClasses}`}
      >
        <input {...getInputProps()} />
        <CloudUpload className="mb-2 size-8 text-sky-500" aria-hidden />
        <span className="px-3 text-center text-xs text-slate-500">
          {isDragActive ? "Drop the PDF here" : "Drag & drop or click"}
        </span>
      </div>
    </div>
  );
}
