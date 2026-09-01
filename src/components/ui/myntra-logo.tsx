import React from "react";

export function MyntraLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Myntra Logo"
    >
      {/* Left loop (Pink & Coral) */}
      <path
        d="M2.5 28.5L14.2 4.2C14.8 2.9 16.6 2.9 17.2 4.2L24.8 20.2L18.4 28.5H2.5Z"
        fill="url(#myntra-grad-1)"
      />
      {/* Right loop (Sunset Orange & Gold) */}
      <path
        d="M37.5 28.5L25.8 4.2C25.2 2.9 23.4 2.9 22.8 4.2L15.2 20.2L21.6 28.5H37.5Z"
        fill="url(#myntra-grad-2)"
      />
      {/* Center overlap shadow */}
      <path
        d="M20 16.5L16.5 24L20 28.5L23.5 24L20 16.5Z"
        fill="url(#myntra-grad-center)"
        fillOpacity="0.85"
      />
      <defs>
        <linearGradient id="myntra-grad-1" x1="2.5" y1="28.5" x2="20" y2="3.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff3f6c" />
          <stop offset="1" stopColor="#ff527b" />
        </linearGradient>
        <linearGradient id="myntra-grad-2" x1="37.5" y1="28.5" x2="20" y2="3.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f5a623" />
          <stop offset="0.5" stopColor="#ff527b" />
          <stop offset="1" stopColor="#ff3f6c" />
        </linearGradient>
        <linearGradient id="myntra-grad-center" x1="16.5" y1="16.5" x2="23.5" y2="28.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb56c1" />
          <stop offset="1" stopColor="#d81b60" />
        </linearGradient>
      </defs>
    </svg>
  );
}
