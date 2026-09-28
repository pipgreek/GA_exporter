"use client";

import { CircleAlert } from "lucide-react";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/** Shows an error message instead of a blank/broken container if a viewer crashes. */
export class PreviewErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert" className="flex h-full items-center justify-center gap-2 p-4 text-sm text-rose-700">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          This preview could not be displayed.
        </div>
      );
    }
    return this.props.children;
  }
}
