import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Riversmag Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-sand">{children}</div>;
}
