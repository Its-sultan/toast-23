/**
 * toast-23 — React Context & Reducer
 */

import { createContext } from "react";
import type {
  InternalToast,
  ToasterAction,
  ToasterContextValue,
} from "./types";

export const ToasterContext = createContext<ToasterContextValue | null>(null);

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
              version: t.version + 1,
              isExiting: false,
            }
          : t,
      );

    case "DISMISS":
      if (!action.id) {
        return state.map((t) => (t.isExiting ? t : { ...t, isExiting: true }));
      }
      return state.map((t) =>
        t.id === action.id && !t.isExiting ? { ...t, isExiting: true } : t,
      );

    case "REMOVE":
      if (!action.id) return [];
      return state.filter((t) => t.id !== action.id);

    case "DISMISS_GROUP":
      return state.map((t) =>
        t.group === action.group && !t.isExiting
          ? { ...t, isExiting: true }
          : t,
      );

    case "REMOVE_GROUP":
      return state.filter((t) => t.group !== action.group);

    default:
      return state;
  }
}
