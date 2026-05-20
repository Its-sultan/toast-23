/**
 * toast-23 — useToast Hook
 */

"use client";

import { useContext, useMemo } from "react";
import { ToasterContext } from "./context";
import type {
  ConfirmOptions,
  PromiseOptions,
  ToastApi,
  ToastOptions,
} from "./types";
import type { ReactNode } from "react";
import { generateId } from "./utils";

export function useToast(): ToastApi {
  const ctx = useContext(ToasterContext);

  if (!ctx) {
    throw new Error(
      "[toast-23] useToast() must be used inside a <Toast23Provider>. " +
        "Wrap your application root with <Toast23Provider> to fix this.",
    );
  }

  return useMemo(() => {
    const toast = ((message: string | ReactNode, options?: ToastOptions) =>
      ctx.addToast(message, options)) as ToastApi;

    toast.success = (msg, opts) =>
      ctx.addToast(msg, { ...opts, variant: "success" });
    toast.error = (msg, opts) =>
      ctx.addToast(msg, { ...opts, variant: "error" });
    toast.warning = (msg, opts) =>
      ctx.addToast(msg, { ...opts, variant: "warning" });
    toast.info = (msg, opts) =>
      ctx.addToast(msg, { ...opts, variant: "info" });

    toast.loading = (msg, opts) =>
      ctx.addToast(msg, {
        ...opts,
        variant: "loading",
        duration: opts?.duration ?? 0,
        dismissible: opts?.dismissible ?? false,
      });

    toast.custom = (content, opts) =>
      ctx.addToast(content, { ...opts, variant: "default", isCustom: true });

    toast.dismiss = (id?: string) => ctx.dismissToast(id);
    toast.remove = (id?: string) => ctx.removeToast(id);
    toast.dismissGroup = (group: string) => ctx.dismissGroup(group);
    toast.removeGroup = (group: string) => ctx.removeGroup(group);
    toast.pauseAll = () => ctx.pauseAll();
    toast.resumeAll = () => ctx.resumeAll();
    toast.history = () => ctx.history();

    toast.promise = async <T>(
      promiseOrFn: Promise<T> | (() => Promise<T>),
      opts: PromiseOptions<T>,
      toastOpts?: ToastOptions,
    ): Promise<T> => {
      const id = ctx.addToast(opts.loading, {
        ...toastOpts,
        variant: "loading",
        duration: 0,
        dismissible: false,
      });

      // If a progress reporter is supplied, wire it up to updateToast.
      if (opts.progress) {
        try {
          opts.progress((pct) => {
            ctx.updateToast(id, { progress: Math.max(0, Math.min(1, pct)) });
          });
        } catch {
          /* swallow */
        }
      }

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
          progress: undefined,
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
          progress: undefined,
        });
        throw error;
      }
    };

    toast.confirm = (message: string, opts?: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        const id = generateId();
        let settled = false;
        const settle = (answer: boolean) => {
          if (settled) return;
          settled = true;
          resolve(answer);
        };

        ctx.addToast(message, {
          id,
          variant: opts?.variant ?? "warning",
          title: opts?.title,
          position: opts?.position,
          duration: 0, // never auto-dismiss
          dismissible: true,
          action: {
            label: opts?.confirmLabel ?? "Confirm",
            onClick: (dismiss) => {
              settle(true);
              dismiss();
            },
            dismissOnClick: false,
            className: "toast23-action--confirm",
          },
          cancelAction: {
            label: opts?.cancelLabel ?? "Cancel",
            onClick: (dismiss) => {
              settle(false);
              dismiss();
            },
            dismissOnClick: false,
          },
          // If user closes via X button or anything else, treat as cancel.
          onDismiss: () => settle(false),
        });
      });
    };

    return toast;
  }, [
    ctx.addToast,
    ctx.updateToast,
    ctx.dismissToast,
    ctx.removeToast,
    ctx.dismissGroup,
    ctx.removeGroup,
    ctx.pauseAll,
    ctx.resumeAll,
    ctx.history,
    ctx.config.duration,
  ]);
}
