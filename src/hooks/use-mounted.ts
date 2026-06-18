"use client";

import { useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

/** True only after client hydration — avoids SSR/client UI mismatch. */
export function useMounted() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}
