"use client";

import { createContext, useContext } from "react";

/** `true` quando a sidebar está recolhida (desktop). */
export const SidebarCollapsedContext = createContext(false);

export function useSidebarCollapsed(): boolean {
  return useContext(SidebarCollapsedContext);
}
