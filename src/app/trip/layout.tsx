import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your trip dashboard",
  robots: { index: false, follow: false },
};

export default function TripLayout({ children }: { children: React.ReactNode }) {
  return children;
}
