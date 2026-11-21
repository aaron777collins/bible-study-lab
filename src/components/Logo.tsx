export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <rect width="512" height="512" rx="112" fill="var(--lapis)" />
      <path d="M96 232a160 160 0 0 1 320 0" fill="none" stroke="var(--gilt-on-lapis, #E2B94A)" strokeWidth="22" strokeLinecap="round" />
      <path d="M256 424V292c-36-30-96-38-160-30v132c64-8 124 0 160 30Zm0 0V292c36-30 96-38 160-30v132c-64-8-124 0-160 30Z" fill="var(--on-lapis)" />
    </svg>
  );
}
