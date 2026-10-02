"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// Notifications passagères (ADR-0020) : confirmation d'une action lancée depuis une
// liste (relance, annulation). Pas de mode sombre en v1 : thème clair imposé. Chaque
// message dit ce qui s'est passé ; l'icône et la couleur ne font que le souligner.
const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-vert" />,
        info: <InfoIcon className="size-4 text-encre" />,
        warning: <TriangleAlertIcon className="size-4 text-ambre-texte" />,
        error: <OctagonXIcon className="size-4 text-rouge" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-bloc)",
        } as React.CSSProperties
      }
      toastOptions={{ classNames: { toast: "cn-toast font-sans text-[15px]" } }}
      {...props}
    />
  );
};

export { Toaster };
