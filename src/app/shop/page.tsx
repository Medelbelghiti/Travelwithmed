import { notFound } from "next/navigation";
import { Palette, Truck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { isShopEnabled, getProducts, formatMoney } from "@/lib/fourthwall";
import { ShopCard } from "@/components/shop/shop-card";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Shop — Travel Prints & Merch",
  description:
    "Limited-edition travel prints, posters and merch made by the Riversmag team. Every purchase supports free guides and honest planning tools.",
  canonicalPath: "/shop",
});

export default async function ShopPage() {
  if (!isShopEnabled()) notFound();

  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let failed = false;
  try {
    products = await getProducts();
  } catch {
    failed = true;
  }

  const available = products.filter((p) => !p.soldOut);

  return (
    <main className="container-x section-pad">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-1.5 text-sm font-semibold text-brand-dark">
          <Palette className="h-4 w-4" aria-hidden />
          Small-batch travel prints
        </div>
        <h1 className="text-4xl md:text-5xl">Travel you can hang on a wall</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Limited-edition city posters, tote bags and travel merch — designed in-house, printed on demand. Every
          piece keeps Riversmag free and helps us build smarter guides.
        </p>
      </div>

      <div className="mt-12">
        <Breadcrumbs items={buildCrumbs([{ name: "Shop", href: "/shop" }])} />
      </div>

      {failed ? (
        <div className="mt-6 rounded-2xl border border-line bg-sand p-8 text-center text-sm text-ink-soft">
          Our shop is taking a break. Come back soon — new prints drop regularly.
        </div>
      ) : available.length > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {available.map((product) => (
            <ShopCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-line bg-sand p-8 text-center text-sm text-ink-soft">
          New prints are on their way. Check back soon.
        </div>
      )}

      <div className="mt-12 grid gap-4 rounded-2xl border border-line bg-white p-6 sm:grid-cols-2">
        <p className="flex items-start gap-3 text-sm text-ink-soft">
          <Palette className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <span>
            <strong className="font-semibold text-ink">Printed on demand</strong> — every order is made only when
            you order it, so nothing sits in a warehouse.
          </span>
        </p>
        <p className="flex items-start gap-3 text-sm text-ink-soft">
          <Truck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <span>
            <strong className="font-semibold text-ink">Made to order</strong> — fulfilment, packaging and shipping
            are handled for us, worldwide.
          </span>
        </p>
      </div>
    </main>
  );
}