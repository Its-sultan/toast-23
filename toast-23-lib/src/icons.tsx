/**
 * toast-23 — Inline SVG Icons (Filled style)
 *
 * Solid colored circles/triangles with white inner symbols, designed to be used with the default styles. Each icon inherits `currentColor` so it can be colored via CSS.
 */

import type { SVGProps, FC } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Green filled circle with white checkmark */
export const CheckCircleIcon: FC<IconProps> = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="1.25em"
    height="1.25em"
    fill="none"
    {...props}
  >
    <circle cx={12} cy={12} r={10} fill="currentColor" />
    <path
      d="M8 12.5l2.5 2.5 5-5"
      stroke="#fff"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

/** Red filled circle with white exclamation */
export const XCircleIcon: FC<IconProps> = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="1.25em"
    height="1.25em"
    fill="none"
    {...props}
  >
    <circle cx={12} cy={12} r={10} fill="currentColor" />
    <line
      x1={12}
      y1={8}
      x2={12}
      y2={13}
      stroke="#fff"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <circle cx={12} cy={16} r={1} fill="#fff" />
  </svg>
);

/** Yellow filled triangle with white exclamation */
export const AlertTriangleIcon: FC<IconProps> = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="1.25em"
    height="1.25em"
    fill="none"
    {...props}
  >
    <path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      fill="currentColor"
    />
    <line
      x1={12}
      y1={9.5}
      x2={12}
      y2={14}
      stroke="#fff"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <circle cx={12} cy={17} r={1} fill="#fff" />
  </svg>
);

/** Blue filled circle with white "i" */
export const InfoIcon: FC<IconProps> = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="1.25em"
    height="1.25em"
    fill="none"
    {...props}
  >
    <circle cx={12} cy={12} r={10} fill="currentColor" />
    <line
      x1={12}
      y1={11}
      x2={12}
      y2={16}
      stroke="#fff"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <circle cx={12} cy={8} r={1} fill="#fff" />
  </svg>
);

/** Thin X icon for dismiss button */
export const XIcon: FC<IconProps> = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    width="0.875em"
    height="0.875em"
    {...props}
  >
    <line x1={18} y1={6} x2={6} y2={18} />
    <line x1={6} y1={6} x2={18} y2={18} />
  </svg>
);

/** CSS-only loading spinner */
export const SpinnerIcon: FC<IconProps> = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    width="1.25em"
    height="1.25em"
    className="toast23-spinner"
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
