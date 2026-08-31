const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;

export function PlausibleAnalytics() {
  if (!domain || !src) return null;

  return (
    <script
      defer
      data-domain={domain}
      src={src}
    />
  );
}
