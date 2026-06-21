import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "spline-viewer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          url?: string;
          "loading-anim"?: string | boolean;
          "events-target"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
