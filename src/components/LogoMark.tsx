/** Inline stand-in for the logo mark (swap in the exact Figma SVG if you like). */
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 44" fill="none" stroke="currentColor" strokeWidth="3.2"
      strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="JR logo">
      <path d="M6 6h28M24 6 9 22l16 16M12 38h22" />
    </svg>
  );
}
