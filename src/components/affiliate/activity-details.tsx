import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Star,
  Ticket,
  Clock3,
  Users,
  Check,
  X,
  Info,
  ThumbsUp,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/card";
import { AffiliateCTA } from "@/components/affiliate/affiliate-cta";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { ActivityCard } from "@/components/affiliate/activity-card";
import { HotelCard } from "@/components/affiliate/hotel-card";
import { ArticleCard } from "@/components/article-card";
import { ReviewsSection, type DbReview } from "@/components/reviews/reviews-section";
import { AddToTrip } from "@/components/trip/add-to-trip";
import type { TripItem } from "@/lib/use-trip";
import type { ArticleType } from "@prisma/client";

export interface ActivityDetailHotel {
  id: string;
  name: string;
  image?: string | null;
  city?: string | null;
  country?: string | null;
  guestRating?: number | null;
  priceRange?: string | null;
  bestFor?: string | null;
  affiliateLinkId?: string | null;
}

export interface ActivityDetailItinerary {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  days: number;
}

export interface ActivityDetailGuide {
  id: string;
  title: string;
  slug: string;
  type: ArticleType;
  excerpt?: string | null;
  coverImage?: string | null;
  publishedAt?: Date | string | null;
  authorName?: string | null;
}

export interface ActivityDetailsActivity {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  duration?: string | null;
  priceRange?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  category?: string | null;
  bestFor?: string | null;
  location?: string | null;
  image?: string | null;
  included?: string[] | null;
  notIncluded?: string[] | null;
  importantInfo?: string[] | null;
  affiliateLinkId?: string | null;
  destination?: { id: string; name: string; slug: string } | null;
}

export interface ActivityDetailsProps {
  activity: ActivityDetailsActivity;
  alternatives: ActivityDetailsActivity[];
  hotels: ActivityDetailHotel[];
  itineraries: ActivityDetailItinerary[];
  destinationGuides: ActivityDetailGuide[];
  reviews?: DbReview[];
  showHero?: boolean;
}

export function ActivityDetails({
  activity,
  alternatives,
  hotels,
  itineraries,
  destinationGuides,
  reviews = [],
  showHero = false,
}: ActivityDetailsProps) {
  const totalReviews = activity.reviewCount;
  const destinationRef = activity.destination;
  const affLinkId = activity.affiliateLinkId;

  const tripItem: TripItem = {
    id: activity.id,
    name: activity.name,
    slug: activity.slug ?? "",
    image: activity.image ?? null,
    priceRange: activity.priceRange ?? null,
    duration: activity.duration ?? null,
    rating: activity.rating ?? null,
    category: activity.category ?? null,
    destinationName: destinationRef?.name ?? null,
  };

  const quickFacts = [
    { icon: Clock3, label: "Duration", value: activity.duration ?? "Flexible" },
    { icon: MapPin, label: "Location", value: activity.location ?? destinationRef?.name ?? "Various locations" },
    { icon: Ticket, label: "From", value: activity.priceRange ?? "Price on request" },
    { icon: Star, label: "Rating", value: activity.rating != null ? `${activity.rating.toFixed(1)} / 5` : "Not yet rated" },
    { icon: Users, label: "Reviews", value: totalReviews != null ? `${totalReviews} reviews` : "Awaiting reviews" },
  ];

  return (
    <section className="container-x py-12">
      <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="min-w-0">
          {activity.image && (
            <div className="relative aspect-video overflow-hidden rounded-3xl">
              <Image
                src={activity.image}
                alt={activity.name}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                priority={showHero ? false : true}
                className="object-cover"
              />
            </div>
          )}

          {/* Overview */}
          {activity.description && (
            <section className="mt-10">
              <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-brand">Overview</span>
              <h2 className="text-3xl">What to expect</h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">{activity.description}</p>
              <div className="mt-6">
                <AffiliateDisclosure short />
              </div>
            </section>
          )}

          {/* Quick reference cards */}
          <section className="mt-10">
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-brand">At a glance</span>
            <h2 className="mb-6 text-3xl">Good to know</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickFacts.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-ink">{f.label}</p>
                      <p className="mt-0.5 text-sm text-ink-soft">{f.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Best for */}
          {activity.bestFor && (
            <section className="mt-10">
              <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-6 shadow-sm">
                <ThumbsUp className="mt-0.5 h-6 w-6 shrink-0 text-brand" aria-hidden />
                <div>
                  <h2 className="text-xl">Best for</h2>
                  <p className="mt-1 text-ink-soft">{activity.bestFor}</p>
                </div>
              </div>
            </section>
          )}

          {/* Included / Not included */}
          {(activity.included || activity.notIncluded) && (
            <section className="mt-10">
              <h2 className="mb-6 text-3xl">What&apos;s included</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {activity.included && activity.included.length > 0 && (
                  <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 font-semibold text-ink">
                      <Check className="h-5 w-5 text-success" aria-hidden /> Included
                    </h3>
                    <ul className="mt-4 space-y-2.5">
                      {activity.included.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {activity.notIncluded && activity.notIncluded.length > 0 && (
                  <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 font-semibold text-ink">
                      <X className="h-5 w-5 text-ink-muted" aria-hidden /> Not included
                    </h3>
                    <ul className="mt-4 space-y-2.5">
                      {activity.notIncluded.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Important information */}
          {activity.importantInfo && activity.importantInfo.length > 0 && (
            <section className="mt-10">
              <div className="rounded-2xl border border-line bg-sand/50 p-6">
                <h2 className="flex items-center gap-2 text-xl">
                  <Info className="h-5 w-5 text-brand" aria-hidden />
                  Important information
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {activity.importantInfo.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="mt-14">
            <SectionHeading
              eyebrow="Traveller feedback"
              title={totalReviews != null && totalReviews > 0 ? "What travellers say" : "Reviews"}
            />
            <div className="mt-6">
              <ReviewsSection activityId={activity.id} seed={reviews} />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="sticky top-24 space-y-6">
            <AffiliateCTA
              linkId={affLinkId}
              label={`Book ${activity.name}`}
              placement={`activity-${activity.slug}`}
              priceRange={activity.priceRange}
            />
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <AddToTrip item={tripItem} />
              <p className="mt-3 text-xs text-ink-muted">Saved to your trip dashboard on this device.</p>
            </div>
            {destinationRef && (
              <Link
                href={`/destinations/${destinationRef.slug}`}
                className="group flex items-center justify-between rounded-2xl border border-line bg-white p-5 shadow-sm transition-colors hover:border-brand"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted">Explore</p>
                  <p className="font-serif text-lg font-semibold text-ink group-hover:text-brand">{destinationRef.name}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-brand" aria-hidden />
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <section className="mt-16">
          <SectionHeading
            eyebrow="More to do"
            title={`Alternative experiences${destinationRef ? ` in ${destinationRef.name}` : ""}`}
            description="Compare similar tours and choose the one that best fits your style, budget and schedule."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((a) => (
              <ActivityCard
                key={a.id}
                activity={{
                  id: a.id,
                  name: a.name,
                  image: a.image,
                  description: a.description,
                  duration: a.duration,
                  priceRange: a.priceRange,
                  rating: a.rating,
                  category: a.category,
                  destinationName: a.destination?.name ?? null,
                  affiliateLinkId: a.affiliateLinkId,
                }}
                linked
              />
            ))}
          </div>
        </section>
      )}

      {/* Hotels (relation: activity → hotel) */}
      {hotels.length > 0 && (
        <section className="mt-16">
          <SectionHeading
            eyebrow="Where to stay"
            title={`Hotels near this ${activity.category?.toLowerCase() ?? "experience"}`}
            description={`Recommended stays${destinationRef ? ` in ${destinationRef.name}` : ""} for planning your trip around this tour.`}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={{
                  id: hotel.id,
                  name: hotel.name,
                  image: hotel.image,
                  location: hotel.city ? `${hotel.city}${hotel.country ? `, ${hotel.country}` : ""}` : null,
                  rating: hotel.guestRating,
                  priceRange: hotel.priceRange,
                  bestFor: hotel.bestFor,
                  affiliateLinkId: hotel.affiliateLinkId,
                  ctaLabel: "Check availability",
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Itineraries (relation: activity → itinerary) */}
      {itineraries.length > 0 && (
        <section className="mt-16">
          <SectionHeading eyebrow="Day by day" title="Suggested itineraries" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {itineraries.map((it) => (
              <Link
                key={it.id}
                href={`/itineraries/${it.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand"
              >
                <div>
                  <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-brand">{it.title}</h3>
                  {it.summary && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{it.summary}</p>}
                </div>
                <p className="mt-4 text-sm font-semibold text-brand">{it.days} days</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related destination guides (relation: activity → destination → articles) */}
      {destinationGuides.length > 0 && (
        <section className="mt-16">
          <SectionHeading
            eyebrow="Keep exploring"
            title={`Guides for ${destinationRef?.name ?? "your destination"}`}
            description="Plan the rest of your trip with our destination guides, hotels and practical tips."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinationGuides.map((a) => (
              <ArticleCard
                key={a.id}
                article={{
                  id: a.id,
                  title: a.title,
                  slug: a.slug,
                  type: a.type,
                  excerpt: a.excerpt,
                  coverImage: a.coverImage,
                  publishedAt: a.publishedAt,
                  authorName: a.authorName,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
