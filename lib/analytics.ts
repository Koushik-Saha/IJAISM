// Analytics shim. Replaces @vercel/analytics with a no-op so the rest of the
// codebase doesn't need to know about provider changes.
//
// If we later self-host Umami or Plausible, wire it up here and every existing
// `track()` call site picks it up automatically.

import type { ReactNode } from "react";

type EventProps = Record<string, string | number | boolean | null | undefined>;

export const track = (_event: string, _data?: EventProps): void => {
  // no-op
};

export const Analytics = (): ReactNode => null;
