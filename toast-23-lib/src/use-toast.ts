/**
 * toast-23 — useToast Hook
 *
 * Returns a callable `ToastApi` object:
 *
 * ```ts
 * const toast = useToast();
 *
 * toast("Hello!");                       // default variant
 * toast.success("Done!");                // success variant
 * toast.error("Oops");                   // error variant
 * toast.promise(fetchData(), { ... });   // promise tracking
 * toast.dismiss(id);                     // manual dismiss
 * ```
 */

"use client";

import { useContext, useMemo } from "react";
import { ToasterContext } from "./context";
import type { ToastApi, ToastOptions, PromiseOptions } from "./types";
import type { ReactNode } from "react";

export function useToast(): ToastApi {
  const ctx = useContext(ToasterContext);

  if (!ctx) {
    throw new Error(
      "[toast-23] useToast() must be used inside a <Toast23Provider>. " +
        "Wrap your application root with <Toast23Provider> to fix this.",
    );
  }

  return useMemo(() => {
    // Base callable — toast("message", opts?)
    const toast = ((message: string | ReactNode, options?: ToastOptions) =>
      ctx.addToast(message, options)) as ToastApi;

    // Variant shortcuts
    toast.success = (msg, opts) =>
      ctx.addToast(msg, { ...opts, variant: "success" });

    toast.error = (msg, opts) =>
      ctx.addToast(msg, { ...opts, variant: "error" });

    toast.warning = (msg, opts) =>
      ctx.addToast(msg, { ...opts, variant: "warning" });

    toast.info = (msg, opts) => ctx.addToast(msg, { ...opts, variant: "info" });

    // Loading shortcut
    toast.loading = (msg, opts) =>
      ctx.addToast(msg, {
        ...opts,
        variant: "loading" as any,
        duration: opts?.duration ?? 0,
        dismissible: opts?.dismissible ?? false,
      });

    // Custom toast — no default styles
    toast.custom = (content, opts) =>
      ctx.addToast(content, { ...opts, variant: "default", isCustom: true });

    // Dismiss (with optional id — omit to dismiss all)
    toast.dismiss = (id?: string) => ctx.dismissToast(id);

    // Remove instantly (with optional id — omit to remove all)
    toast.remove = (id?: string) => ctx.removeToast(id);

    // Promise tracking (accepts Promise or () => Promise, optional 3rd arg for toast options)
    toast.promise = async <T>(
      promiseOrFn: Promise<T> | (() => Promise<T>),
      opts: PromiseOptions<T>,
      toastOpts?: ToastOptions,
    ): Promise<T> => {
      const id = ctx.addToast(opts.loading, {
        ...toastOpts,
        variant: "loading" as any,
        duration: 0,
        dismissible: false,
      } as ToastOptions);

      const promise =
        typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;

      try {
        const result = await promise;
        const msg =
          typeof opts.success === "function"
            ? opts.success(result)
            : opts.success;
        ctx.updateToast(id, {
          message: msg,
          variant: "success",
          duration: toastOpts?.duration ?? ctx.config.duration,
          dismissible: true,
        });
        return result;
      } catch (error) {
        const msg =
          typeof opts.error === "function" ? opts.error(error) : opts.error;
        ctx.updateToast(id, {
          message: msg,
          variant: "error",
          duration: toastOpts?.duration ?? ctx.config.duration,
          dismissible: true,
        });
        throw error;
      }
    };

    return toast;
  }, [
    ctx.addToast,
    ctx.updateToast,
    ctx.dismissToast,
    ctx.removeToast,
    ctx.config.duration,
  ]);
}
