import Link from "next/link";
import { Compass, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-x flex flex-col items-center py-28 text-center">
      <MapPin className="h-14 w-14 text-brand" aria-hidden />
      <h1 className="mt-6 text-5xl font-semibold">Page not found</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
        Looks like this page wandered off the map. Let&apos;s get you back to planning a great trip.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/" variant="primary" size="lg">
          <Compass className="h-4 w-4" aria-hidden />
          Back to home
        </Button>
        <Button href="/destinations" variant="outline" size="lg">
          Explore destinations
        </Button>
      </div>
      <p className="mt-10 text-sm text-ink-muted">
        Or start with something popular:{" "}
        <Link href="/destinations/paris" className="text-brand hover:underline">Paris</Link>,{" "}
        <Link href="/destinations/tokyo" className="text-brand hover:underline">Tokyo</Link>,{" "}
        <Link href="/destinations/marrakech" className="text-brand hover:underline">Marrakech</Link>
      </p>
    </main>
  );
}