import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Questions fréquentes du site public (accordéon shadcn/ui).
export function Questions({ questions }: { questions: { q: string; r: ReactNode }[] }) {
  return (
    <Accordion type="multiple" className="border-t border-encre">
      {questions.map(({ q, r }) => (
        <AccordionItem key={q} value={q} className="border-b border-ligne">
          <AccordionTrigger className="min-h-11 items-center py-5 text-lg font-extrabold hover:text-braise hover:no-underline md:text-[20px]">
            {q}
          </AccordionTrigger>
          <AccordionContent className="max-w-[760px] pb-6 text-[17px] leading-relaxed text-gris-fonce">
            {r}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
