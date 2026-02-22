/**
 * toast-23 — React Context & Reducer
 */

import { createContext } from "react";
import type {
  InternalToast,
  ToasterAction,
  ToasterContextValue,
} from "./types";

// ---------------------------------------------------------------------------
// Context — consumed by useToast() and internal components
// ---------------------------------------------------------------------------

export const ToasterContext = createContext<ToasterContextValue | null>(null);

// ---------------------------------------------------------------------------
// Reducer — pure state transitions for the toast queue
// ---------------------------------------------------------------------------

export function toasterReducer(
  state: InternalToast[],
  action: ToasterAction,
): InternalToast[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.toast];

    case "UPSERT": {
      const exists = state.some((t) => t.id === action.toast.id);
      if (exists) {
        return state.map((t) =>
          t.id === action.toast.id
            ? {
                ...t,
                ...action.toast,
                version: t.version + 1,
                isExiting: false,
              }
            : t,
        );
      }
      return [...state, action.toast];
    }

    case "UPDATE":
      return state.map((t) =>
        t.id === action.id
          ? {
              ...t,
              ...action.updates,
              // Bump version so progress bar restarts
              version: t.version + 1,
              // If the toast was exiting, cancel exit on update
              isExiting: false,
            }
          : t,
      );

    case "DISMISS":
      // Omit id → dismiss all
      if (!action.id) {
        return state.map((t) => ({ ...t, isExiting: true }));
      }
      return state.map((t) =>
        t.id === action.id ? { ...t, isExiting: true } : t,
      );

    case "REMOVE":
      // Omit id → remove all instantly
      if (!action.id) return [];
      return state.filter((t) => t.id !== action.id);

    default:
      return state;
  }
}
