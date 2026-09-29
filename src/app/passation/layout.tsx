import type { Metadata } from "next";
import type { ReactNode } from "react";

// Pages du candidat : jamais indexées ; en-têtes de protection dans next.config.ts.
export const metadata: Metadata = {
  title: "Questionnaire — Prometheus People",
  robots: { index: false, follow: false },
};

export default function LayoutPassation({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-5 py-8">
        {children}
      </main>
      <p className="pb-6 text-center text-xs text-gris">Service fourni par Prometheus People</p>
    </div>
  );
}
