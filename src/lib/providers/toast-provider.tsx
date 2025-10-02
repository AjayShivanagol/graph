import * as React from "react";
import { Toaster } from "sonner";
import { useAppSelector } from "~/store/hooks";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppSelector((state) => state.ui);
  return (
    <>
      {children}
      <Toaster
        richColors
        position="top-center"
        theme={theme as "light" | "dark" | "system" | undefined}
        toastOptions={{
          duration: 3000,
        }}
      />
    </>
  );
}
