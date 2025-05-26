import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sphere of Control Logo"
      {...props}
    >
      <circle cx="16" cy="16" r="14" className="stroke-primary" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="8" className="fill-primary/30 stroke-primary" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="3" className="fill-primary" />
    </svg>
  );
}
