"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-ds-lg !border-0 !bg-ds-ink !text-white !shadow-ds-pop",
          title:
            "!text-white !font-medium",
          description:
            "!text-white/70 !text-sm",
          closeButton:
            "!border !border-white/20 !bg-ds-ink !text-white/60 hover:!text-white",
          error:
            "!bg-ds-danger",
          success:
            "!bg-ds-ink",
        },
      }}
    />
  );
}
