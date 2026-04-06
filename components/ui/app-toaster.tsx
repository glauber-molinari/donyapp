"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-ds-xl !border !border-app-border !bg-app-sidebar !text-ds-ink !shadow-ds-md",
          title: "!text-ds-ink !font-semibold",
          description: "!text-ds-muted",
          success: "!border-l-[3px] !border-l-app-primary",
          error: "!border-l-[3px] !border-l-red-500 !bg-red-50/90",
          closeButton: "!text-ds-subtle hover:!text-ds-ink",
        },
      }}
    />
  );
}
