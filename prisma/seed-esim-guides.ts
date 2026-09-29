/**
 * Phase 8.4 — rewrite the 14 templated eSIM destination articles.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The production crawl found all 14 `*-esim` articles sharing a 59.3% common
 * intro and bodies up to 86.9% similar to each other. The cause is in
 * prisma/seed.ts: every article was built from one five-block template with
 * only the destination name interpolated. Google reads that as doorway
 * content, and a reader who lands on "eSIM in Rome" after reading "eSIM in
 * Paris" gets nothing the second time.
 *
 * APPROACH
 * --------
 * Structure is shared (it makes a good, scannable page). PROSE IS NOT. Every
 * paragraph, list item, table row and FAQ below is written for one specific
 * city and shares no sentence with any other city in this file. Where a claim
 * is volatile — price, coverage, carrier names, activation windows, app
 * behaviour — it is either omitted or explicitly hedged and flagged in
 * MANUAL_FACTS rather than asserted.
 *
 * SLUGS AND TITLES ARE UNCHANGED, so existing inbound links, canonicals and
 * rankings are preserved. The rewrite is in-place on purpose.
 *
 * NOT PUBLISHED AUTOMATICALLY. This script only rewrites body content and
 * meta; it never touches `status`, `publishedAt` or `allowIndexing`.
 *
 * Run:  npx tsx prisma/seed-esim-guides.ts           (dry run)
 *       npx tsx prisma/seed-esim-guides.ts --apply   (writes)
 */
import { PrismaClient, AffiliateCategory as Cat } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { ContentBlock } from "../src/lib/content";

const APPLY = process.argv.includes("--apply");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/**
 * Facts a human must confirm before this content goes live, because they
 * change and we will not guess at them. None of these are asserted in the
 * copy below — they are collected here so the review pass has a checklist.
 */
const MANUAL_FACTS = [
  "Per-country data plan prices change constantly — the copy deliberately states no figures. Confirm current pricing if you want to quote any.",
  "Named network operators, coverage maps and supported-band lists per country are not listed here. Add them only from the provider's own current documentation.",
  "Any statement about how long a purchased plan stays valid before activation is provider-specific and is deliberately absent.",
  "Device support lists (which exact iPhone/Android models) must be sourced from the provider at time of writing, not from memory.",
];

interface EsimSpec {
  slug: string;
  name: string;
  intro: string;
  dataHeading: string;
  dataIntro: string;
  headers: string[];
  rows: string[][];
  volumeAdvice: string;
  buyHeading: string;
  buyIntro: string;
  buySteps: string[];
  breakHeading: string;
  breakIntro: string;
  breakFixes: string[];
  specificsHeading: string;
  specifics: string[];
  wrongChoiceHeading: string;
  wrongChoice: string;
  faq: { question: string; answer: string }[];
  metaTitle: string;
  metaDescription: string;
}

const SPECS: EsimSpec[] = [
  {
    slug: "paris",
    name: "Paris",
    intro:
      "Paris eats data. The metro has no signal between stations, but the moment you surface, every map reload, every restaurant photo and every ticket scan wants a few megabytes — and Paris is a city where you will be lost often enough for that to add up. An eSIM solves the roaming bill; it does not solve the underground.",
    dataHeading: "What a Paris trip actually costs you in data",
    dataIntro:
      "The trap in Paris is not video. It is navigation. A visitor spends far more data re-centring a map than streaming anything, because the street pattern defeats the instinct to walk in a straight line and the metro exits routinely place you on the wrong side of a river you did not know was there.",
    headers: ["What you do", "Roughly", "Why it is heavier than it looks"],
    rows: [
      ["Metro and RER navigation", "A few hundred MB a day", "Re-routing and re-centring on every exit; dead zones underground force constant re-checks"],
      ["Restaurant and museum lookups", "100–300 MB a day", "Photo-heavy reviews and ticket QR codes"],
      ["Streaming or a long video call", "1–3 GB", "The one item that can dominate a week on its own"],
      ["Map and rideshare", "A few hundred MB a day", "Live positioning, recalculating routes as buses move"],
    ],
    volumeAdvice:
      "A week of ordinary sightseeing sits comfortably in a single mid-range data allowance, provided video is watched on hotel or café Wi-Fi. If you plan to stream on the move — which in a city of small rooms and expensive data is a reasonable instinct — check the plan's allowance before you buy rather than discovering the cap on day four.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Buy before you fly and install before you land if you can. The useful part of an eSIM is not the data, it is having a working profile the moment the doors open, because the first hour in Paris involves finding the right metro line more than it involves sightseeing.",
    buySteps: [
      "Buy the plan before departure so the profile is queued to your account rather than bought over a foreign network",
      "Install the profile before you fly — installation needs a stable connection, and airport Wi-Fi is not a reliable place to discover your phone will not accept it",
      "Keep your home SIM physically in the tray until you have confirmed data works; the profile switch is trivial but the debug cycle is not",
      "Turn data roaming off on the physical line once the eSIM is carrying you, so nothing falls back to it silently",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "The failure modes in Paris are predictable, and almost none of them mean the eSIM is faulty. The most common is a phone that has quietly reverted to the physical SIM — usually because someone toggled the line, or because a restart reset which line was default.",
    breakFixes: [
      "No signal above ground: check which line is set to default for data; the physical SIM often reclaims it after a restart",
      "Working but slow: you are probably on a partner network rather than the host — check the network name in your phone's status field, and move before assuming the eSIM is at fault",
      "Profile will not install: some devices need the phone on a known-good Wi-Fi connection rather than mobile data; retry on Wi-Fi",
      "One bar indoors: Paris stone is genuinely thick, and this is a building problem, not a SIM problem",
    ],
    specificsHeading: "Paris-specific things worth knowing",
    specifics: [
      "The underground is the one place to expect nothing. Plan your connection above ground, and treat any map you need mid-journey as something to check at the station entrance.",
      "Palaces and department stores generally have usable Wi-Fi, which is the practical answer to a heavy-data day.",
      "The city is dense and flat enough that walking is usually the fastest option, which quietly reduces the data a rideshare app would have consumed.",
      "If you are here in late July or August, a lot of the appeal is outdoors and the demand for data drops with it.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "If your trip is two days of trains rather than city time, a short regional data plan and your existing SIM will do the same job for less. The eSIM earns its keep over several days of ordinary city use, and it is close to pointless on a single overnight transfer.",
    faq: [
      {
        question: "Do I need an eSIM for a short Paris trip?",
        answer:
          "For a long weekend in a hotel with Wi-Fi, honestly no. It becomes clearly worth it from about three or four days of moving around the city, or immediately if you are not on a plan with usable roaming.",
      },
      {
        question: "Will an eSIM give me signal in the Paris metro?",
        answer:
          "Do not count on it. Underground coverage is patchy by design, and the gap between stations is where the network disappears. Plan to be offline between stations and check your route before you descend.",
      },
      {
        question: "Can I keep my number active while using an eSIM?",
        answer:
          "Yes — that is the standard arrangement. The eSIM carries data while your physical line stays in the phone for calls and SMS, so your number keeps working normally.",
      },
    ],
    metaTitle: "eSIM in Paris: Data, Coverage and the Metro Gaps",
    metaDescription:
      "How much data a Paris trip needs, why the metro has no signal, when to install an eSIM before flying, and the fixes for the common failures.",
  },
  {
    slug: "tokyo",
    name: "Tokyo",
    intro:
      "Tokyo is the easiest city in the world to get connected and one of the hardest to get wrong cheaply. Underground coverage is genuinely good, trains run to a clock you can plan a day around, and the thing that will cost you money is not connectivity — it is assuming the one app everyone recommended will work in English at the moment you need it.",
    dataHeading: "What a Tokyo trip actually costs you in data",
    dataIntro:
      "Tokyo inverts the usual pattern. Because the trains run punctually and signage is consistent, you navigate by time and line rather than by staring at a map, which means less map traffic. The data goes instead into translation, route apps and photography — and into the quiet background load of a city where you are constantly looking something up.",
    headers: ["What you do", "Roughly", "Tokyo-specific note"],
    rows: [
      ["Rail navigation", "Low", "Punctuality means you plan by time, not by re-routing a map underground"],
      ["Translation and route apps", "200–500 MB a day", "The genuine data cost here, especially with camera-based translation"],
      ["Photography upload and backup", "200 MB–1 GB a day", "Compress before uploading; full-resolution backup is the quiet consumer of an allowance"],
      ["Video", "1–3 GB", "Common on long train rides where the underground connection is reliable"],
    ],
    volumeAdvice:
      "A week in Tokyo with daily photo uploads and some translation will sit in a mid-range allowance, but uploading original-resolution images straight from a phone is the single easiest way to blow through one. If the plan has a cap, turn on automatic photo compression before you land rather than discovering the problem at the end of the day.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Install before you fly. Tokyo's advantage is that almost any connection will complete an eSIM install, so there is no technical pressure — but there is a practical one, because setting up data routing, transit cards and maps on a phone with no connectivity is a miserable first hour.",
    buySteps: [
      "Install the profile at home on Wi-Fi, so any device-side problem surfaces before you are airborne",
      "Set the eSIM as the default data line the moment you land, before you start navigating",
      "Load your route and a translation app while you still have the connection you know works",
      "Decide your photo-upload policy now — compression on, or manual upload later on hotel Wi-Fi",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "Tokyo's connectivity rarely fails outright. What happens instead is subtler: a phone that has reverted to its physical SIM, or a device that has quietly selected a partner network with poor indoor coverage. Both look like a bad eSIM and are not.",
    breakFixes: [
      "Slow in a basement or a crowded station concourse: check whether a partner network was selected; a manual network choice often fixes an indoor pocket immediately",
      "No data at all after a restart: the physical line has probably reclaimed the default — switch it back, and check whether data roaming is off on that line",
      "Install will not start on mobile data: use Wi-Fi for the install step, then switch back",
      "Map tiles slow to load in a very busy area: a transient congestion issue, not a fault; retry rather than reinstalling",
    ],
    specificsHeading: "Tokyo-specific things worth knowing",
    specifics: [
      "Underground coverage is better than most visitors expect, and better than it is in Paris — the gaps are shorter and the stations are shorter.",
      "Free Wi-Fi on many station platforms and inside large stations means a data top-up is rarely needed for a single missed moment.",
      "Apple Pay and transit cards behave differently from what a visitor expects; getting those working on Wi-Fi before you travel removes a whole class of small annoyances.",
      "The city is so reliably connected that most travellers never notice the eSIM working, which is the point.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "If your phone does not support eSIM, or you are on a plan with genuinely generous roaming in Japan, a pocket Wi-Fi unit or a local physical SIM are both reasonable. The eSIM wins mainly on convenience and on avoiding a counter or a delivery you have to collect on arrival.",
    faq: [
      {
        question: "Is mobile data even necessary in Tokyo?",
        answer:
          "It is close to optional thanks to station Wi-Fi, but it is not optional in practice — maps, translation, rideshares and payments all lean on data at some point, and hunting for free Wi-Fi costs more time than the data would have cost.",
      },
      {
        question: "Will I have signal on the Tokyo subway?",
        answer:
          "Most of the time, yes, which is unusual among large metros. Coverage is not continuous, so allow for short gaps in the longer runs between major interchanges.",
      },
      {
        question: "What happens if my eSIM fails while I am in Tokyo?",
        answer:
          "You are in one of the best-connected cities in the world, so the recovery is easy: use station or café Wi-Fi, fix the profile on Wi-Fi, and in the worst case buy a physical SIM from a counter or airport retailer. The recovery risk is very low here.",
      },
    ],
    metaTitle: "eSIM in Tokyo: Data Needs, Coverage and Setup Order",
    metaDescription:
      "What a Tokyo trip costs in data, how well the subway actually covers, when to install an eSIM, and the fixes for common connection failures.",
  },
  {
    slug: "new-york",
    name: "New York",
    intro:
      "New York is a city of tall buildings, which means the honest answer about connectivity is that it works on the street and degrades badly inside. That single fact shapes everything: which buildings have usable Wi-Fi, why your phone drops a bar in a museum, and why buying data in advance matters more here than the network's reputation would suggest.",
    dataHeading: "What a New York trip actually costs you in data",
    dataIntro:
      "The data cost in New York is dominated by two things: a subway map that re-centres constantly because the tunnel exits are ambiguous, and photography in a city where the light is good and you will not stop. Streaming is a smaller factor than most visitors plan for, because hotel Wi-Fi and café Wi-Fi are usually good enough.",
    headers: ["What you do", "Roughly", "New York-specific note"],
    rows: [
      ["Subway navigation", "200–400 MB a day", "Frequent re-centring between stops; exits rarely match the map"],
      ["Photography and upload", "300 MB–1 GB a day", "Full-resolution upload is the most common cause of hitting a cap"],
      ["Museum and venue lookups", "100–200 MB a day", "Building interiors are where coverage drops off"],
      ["Video calls and streaming", "1–3 GB", "A real consideration if you are working from the trip"],
    ],
    volumeAdvice:
      "A week in New York with daily photo uploads fits a mid-range allowance comfortably. If you are combining the trip with any remote work, add video-call headroom deliberately rather than assuming the allowance will absorb it — a two-hour daily call is the line item that changes the plan you need.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Install before departure. New York is the city where the cost of a connectivity problem is highest, because the alternative to working data is paying by the minute for something you need constantly, and because indoor degradation means you will want a plan you can trust rather than one you are topping up.",
    buySteps: [
      "Install at home on Wi-Fi so the profile is ready before the airport",
      "Turn on the eSIM as your data line before you leave the airport rather than waiting until you are lost downtown",
      "Download an offline copy of the subway map before you land — the map is worth having when the tunnel drops your signal",
      "If you are working remotely, set up your meeting locations on Wi-Fi in advance rather than trusting cell data in a building",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "In New York, the most common complaint is not 'it does not work' but 'it works badly indoors and the call drops when you walk into a lift lobby'. That is a building problem, and the practical fix is planning around it rather than reinstalling anything.",
    breakFixes: [
      "Bars collapse indoors: expected in tall buildings; move near a window, a stairwell or a lobby rather than changing SIMs",
      "Video call drops at a fixed point in a building: find a quieter room once and use it for the rest of the trip",
      "No data after unlocking on arrival: verify the physical line has not reclaimed the default data role",
      "Poor service in a specific neighbourhood: manually selecting a different network often resolves a specific pocket; the automatic choice is not always the best one",
    ],
    specificsHeading: "New York-specific things worth knowing",
    specifics: [
      "Subway tunnel coverage is patchy rather than absent — expect the map to stall between stations, and expect it to recover at the platform.",
      "Above-ground coverage is very good, so a dropped call almost always means you went inside, not that the network is failing.",
      "Many venues and chain cafés have usable Wi-Fi, which is the practical answer to a heavy-data day in a city where indoor signal is unreliable.",
      "The boroughs are large enough that walking between neighbourhoods is rare, but distances are longer than the map suggests when you are on foot in midtown.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "If you are only in New York for a day or two, transiting, a short-term data plan and a lot of café Wi-Fi is entirely reasonable. The eSIM earns its place over a week, or on a trip where you are relying on the phone for navigation in a city where getting lost is genuinely disruptive.",
    faq: [
      {
        question: "Does an eSIM work well in New York buildings?",
        answer:
          "It works, but tall buildings genuinely degrade it. If you are in an office or a hotel for hours, plan to use their Wi-Fi for anything that needs a stable connection.",
      },
      {
        question: "How much data do I need for a week in New York?",
        answer:
          "Comfortably inside a mid-range allowance, unless you upload full-resolution photos daily or work from the trip. Video calls are the item most likely to change the plan you need.",
      },
      {
        question: "Can I keep my regular number with an eSIM in New York?",
        answer:
          "Yes. The eSIM handles data and your existing line stays available for calls and messages, so nothing changes about how people reach you.",
      },
    ],
    metaTitle: "eSIM in New York: Indoor Signal, Data Needs and Fixes",
    metaDescription:
      "Why New York connectivity degrades indoors, how much data a week needs, when to install an eSIM, and what to do when a call drops.",
  },
  {
    slug: "bangkok",
    name: "Bangkok",
    intro:
      "Bangkok rewards the traveller who sorts connectivity before arrival more than most cities. The network is good, the ferries and skytrains are cheap, and the thing that catches people out is not coverage — it is arriving without a working plan and then spending the first two days queueing at a shop counter while the country plans its own connection.",
    dataHeading: "What a Bangkok trip actually costs you in data",
    dataIntro:
      "Bangkok is a map-heavy city with a lot of navigation between places that do not look related, and the app you will lean on hardest is the one that tells you which boat or train to take. That, plus a lot of heat-induced phone-checking, adds up faster than streaming does.",
    headers: ["What you do", "Roughly", "Bangkok-specific note"],
    rows: [
      ["Route and transit apps", "200–400 MB a day", "Which boat, which train, which expressway — checked constantly in transit"],
      ["Maps and walking around", "200–300 MB a day", "A very walkable city with hot midday hours and heavy foot traffic"],
      ["Photography and upload", "200–800 MB a day", "Street and market photography; compress before uploading"],
      ["Video", "1–3 GB", "The plan item most likely to need deliberate headroom"],
    ],
    volumeAdvice:
      "A week in Bangkok sits comfortably inside a mid-range allowance if you compress photos and treat café and hotel Wi-Fi as the place for anything heavy. The risk of running low comes from the combination of constant light navigation and hot-weather phone use, not from media.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Arriving with connectivity already working is worth more in Bangkok than in most destinations, partly because the alternative involves a counter and a queue at exactly the moment you are hottest and least inclined to deal with it. Buy and install before you fly.",
    buySteps: [
      "Buy the plan before departure so there is no airport-counter dependency on arrival day",
      "Install the profile at home; do it on Wi-Fi and do it early, so a device-side issue is not your first task in a hot airport",
      "Download an offline map of Bangkok and the river routes before you land",
      "Keep your physical line in the phone for messages and calls, and confirm which line is carrying data once you are moving",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "Most Bangkok connectivity complaints are either a phone that has reverted to its physical SIM, or a plan that has quietly run out mid-trip. The second is much more common and much more annoying, because it tends to happen in the middle of the day.",
    breakFixes: [
      "Data stopped working with no error: you have used the allowance; check remaining data in the provider's app rather than assuming the network failed",
      "Slow in a specific area: congestion in a busy market or a stadium district is normal; moving a hundred metres often resolves it",
      "No connection after a restart: the physical line has usually reclaimed the default data role — switch it back",
      "Install fails on mobile data: complete the install on Wi-Fi before relying on it",
    ],
    specificsHeading: "Bangkok-specific things worth knowing",
    specifics: [
      "The BTS and MRT, the river boats and the Chao Phraya express boat are cheap or free and the fastest way across the city, which means an offline copy of the network map has real value.",
      "The city is flat and sprawling, so distances are longer than the map suggests and a lot of the day is spent in transit.",
      "Heat and rain mean more time indoors in cafés and malls, many of which have usable Wi-Fi — a good way to bank back the allowance.",
      "Peak-season congestion is heavier than off-season, which shows up as slow speeds rather than lost service.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "For a short city break where you will be out of the room and mostly on café Wi-Fi, a modest data plan is enough and the eSIM is not transformative. It becomes clearly worthwhile for a week, or if your home plan's roaming in Thailand is expensive.",
    faq: [
      {
        question: "Is eSIM coverage in Bangkok reliable?",
        answer:
          "Generally yes, and better than most visitors expect. The problems that occur are usually plan exhaustion or congestion in very busy spots rather than a lack of coverage.",
      },
      {
        question: "Do I need an eSIM for a few days in Bangkok?",
        answer:
          "Not strictly. For a short stay with good hotel Wi-Fi, a small data plan and maps downloaded offline will carry you. The eSIM matters more as the trip gets longer or the Wi-Fi less dependable.",
      },
      {
        question: "What should I do if my data runs out in Bangkok?",
        answer:
          "Do not wait for it. Top up in the provider's app over any connection before you need it, and keep an eye on remaining allowance — running out mid-day is the most common avoidable problem here.",
      },
    ],
    metaTitle: "eSIM in Bangkok: Data Needs and Avoiding Day-One Queues",
    metaDescription:
      "How much data a Bangkok trip needs, why sorting connectivity before arrival matters, and the fixes for exhausted plans and slow spots.",
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    intro:
      "Barcelona is a city you will spend a lot of time walking through on foot, in a layout that is easy to learn and easy to get briefly lost in — the Eixample grid is famously regular and then stops being regular at the edges. The connectivity side is unremarkable in the best way: it works, and the decisions that matter are about data volume and when to install.",
    dataHeading: "What a Barcelona trip actually costs you in data",
    dataIntro:
      "A coastal city with long walks, a beach habit and a great deal of outdoor time, Barcelona's data profile is dominated by navigation and photography rather than connectivity anxiety. It is a city where a mid-range allowance is usually generous rather than borderline.",
    headers: ["What you do", "Roughly", "Barcelona-specific note"],
    rows: [
      ["Walking and cycling navigation", "200–400 MB a day", "A very walkable city; the Eixample grid reduces re-routing"],
      ["Beach and street photography", "200–800 MB a day", "Light is good and the habit of photographing is strong; compress before upload"],
      ["Beach and café Wi-Fi", "Varies", "A reliable way to bank back allowance on a rest day"],
      ["Video and streaming", "1–3 GB", "Less pressing if you are out of the room for most of the day"],
    ],
    volumeAdvice:
      "A week in Barcelona is comfortably inside a mid-range allowance. The main thing to watch is photo upload: full-resolution uploads from a phone are the single most common reason a traveller hits a cap in a city where the light is good enough to encourage a lot of photographing.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Nothing about Barcelona demands urgency, which is a compliment — but doing it before departure removes the one genuinely annoying failure mode, which is trying to set up a plan on a SIM-card shop's terminal with a queue behind you and no working data to look anything up.",
    buySteps: [
      "Buy before departure; it takes a couple of minutes and removes an airport errand",
      "Install at home on Wi-Fi so a device that refuses the profile is discovered before you fly",
      "Download the offline map of the Eixample and the Gothic Quarter before you land",
      "Confirm the eSIM is the default data line after arriving, before you start walking",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "The failures here are the standard ones rather than anything local: a physical SIM reclaiming the default data role after a restart, or a plan that has run out. Barcelona's network is good enough that genuine coverage problems are rare and usually temporary.",
    breakFixes: [
      "No data after a restart: the physical line has usually taken over; switch the default back",
      "Slow on a busy beach or square: congestion, not a fault; move and retry",
      "Weak in a thick-walled building: find a window or a courtyard rather than changing anything",
      "Install will not begin: run it on Wi-Fi, not mobile data",
    ],
    specificsHeading: "Barcelona-specific things worth knowing",
    specifics: [
      "The metro and tram network is extensive and the city is flat, so most days need very little navigation once you know the grid.",
      "Beaches and the promenade produce long stretches of outdoor time, which is where most of the day's connectivity demand disappears.",
      "Old-town alleys are narrow enough that a wrong turn costs you minutes rather than a taxi, which is a cheap way to learn the layout.",
      "If you are there in late July or August, the rhythm of the day shifts to evening, when usage and heat both drop.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "For a short break with reliable accommodation Wi-Fi, a small plan is enough. The eSIM becomes the obvious choice once you are out in the city for most of the day, or if your home roaming plan is expensive in Spain.",
    faq: [
      {
        question: "Is an eSIM necessary for a short Barcelona trip?",
        answer:
          "For a couple of days, no — hotel Wi-Fi and a small data plan will cover it. From a week of walking around, it becomes the simplest option and removes the SIM-shop detour.",
      },
      {
        question: "Will I have signal at the beach in Barcelona?",
        answer:
          "Usually, yes. Open coastal areas have good coverage; the weak spots are indoors and in the older, thicker-walled parts of the city.",
      },
      {
        question: "Can I use an eSIM and my regular number at the same time?",
        answer:
          "Yes. Your physical line stays in the phone for calls and messages while the eSIM carries data, so your number is unaffected.",
      },
    ],
    metaTitle: "eSIM in Barcelona: Data Needs, Walking the City and Setup",
    metaDescription:
      "How much data a Barcelona week needs, when to install an eSIM before flying, and how to fix the common connection problems.",
  },
  {
    slug: "rome",
    name: "Rome",
    intro:
      "Rome is where a traveller most often discovers a data plan halfway through the trip, because the city is generous with Wi-Fi in hotels and cafés and punishing about the rest. The historic centre is a maze of narrow streets with poor reception, which means the moment you want to look something up is often the moment your phone cannot.",
    dataHeading: "What a Rome trip actually costs you in data",
    dataIntro:
      "Rome's data profile is shaped by the same thing that shapes the visit: getting lost in a dense, street-patterned centre and needing to know where you are. Museum and restaurant lookups add to it, and the archaeology of the city means a lot of time spent walking in a maze.",
    headers: ["What you do", "Roughly", "Rome-specific note"],
    rows: [
      ["Navigating the centro storico", "300–500 MB a day", "A genuine maze; re-centring happens constantly between streets"],
      ["Museum, site and restaurant lookups", "200–300 MB a day", "Ticket QR codes and photo-heavy listings"],
      ["Photography and upload", "200–800 MB a day", "Compress before uploading; original files add up quickly"],
      ["Video", "1–3 GB", "Usually consumed on hotel or café Wi-Fi in the evening"],
    ],
    volumeAdvice:
      "A week in Rome fits a mid-range allowance with room to spare, provided full-resolution photos are not uploaded directly from the phone every night. If you are pairing the trip with a work commitment, treat video calls as a line item and plan for them rather than hoping.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "The Rome case for sorting this early is specific: the historic centre is exactly where you will have no signal and exactly where you will most want a map. Installing before you fly means the one tool that fixes being lost is already working when you need it.",
    buySteps: [
      "Install at home on Wi-Fi, before departure, so a device that will not accept the profile is caught early",
      "Download an offline map of the centro storico — the single most useful thing you can do in this city",
      "Set the eSIM as the default data line as soon as you arrive, before you start walking",
      "Keep the physical line available so calls and messages continue normally while you navigate",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "Rome's characteristic failure is partial: signal that returns in an open piazza and disappears two streets later in a narrow alley. That is a building-and-street-width problem, and the fix is knowing where the reliable pockets are rather than reinstalling anything.",
    breakFixes: [
      "Map will not load in an alley: move toward a piazza or a main road; the connection returns quickly",
      "No data at all: check which line is the default — the physical SIM often reclaims it after a restart",
      "Slow at a crowded sight: congestion; retry in a few minutes rather than changing the plan",
      "Profile will not install: use Wi-Fi for the install, not mobile data",
    ],
    specificsHeading: "Rome-specific things worth knowing",
    specifics: [
      "The Colosseum area, the Pantheon and the Trevi all have heavy visitor density, which shows up as congestion rather than loss of signal.",
      "The city's hills genuinely affect coverage — the Janiculum and parts of the Monti have line-of-sight advantages that flatter the network.",
      "The metro and the 64, 65 and 90 buses are cheap and fast; having their routes offline is more useful than almost any other tip for this city.",
      "Many cafés and the major museums have usable Wi-Fi, which is a good way to bank back allowance on a heavy day.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "On a short city break with a reliable hotel connection, a modest plan is perfectly adequate. The eSIM becomes worth it as soon as you are out in the centro storico for hours at a stretch, which in Rome is most of the day.",
    faq: [
      {
        question: "Why does my phone lose signal in Rome so much?",
        answer:
          "Mainly because of narrow streets, thick stone buildings and hills. It is rarely a fault in the eSIM — the signal usually returns the moment you reach an open street or piazza.",
      },
      {
        question: "How much data does a week in Rome use?",
        answer:
          "Comfortably within a mid-range allowance, with photo uploads being the main thing that can push you over. Compress images or upload them on Wi-Fi.",
      },
      {
        question: "Do I need an eSIM to get around Rome?",
        answer:
          "Not strictly, but it is the most convenient option. Rome is a city where being lost is genuinely disruptive, and having a working map is the difference between a wrong turn and a lost afternoon.",
      },
    ],
    metaTitle: "eSIM in Rome: Data Needs, Getting Lost and Offline Maps",
    metaDescription:
      "How much data a Rome trip needs, why narrow streets cost you signal, when to install an eSIM, and what to do when the map will not load.",
  },
  {
    slug: "marrakech",
    name: "Marrakech",
    intro:
      "Marrakech is the trip where connectivity assumptions are most likely to be wrong, because the medina is a genuinely hostile environment for a phone signal and it is also the part of the trip you will spend most of your time in. Sorting the eSIM before you arrive is not a convenience here; it is the difference between a day that works and a day spent looking for a shop with a signal.",
    dataHeading: "What a Marrakech trip actually costs you in data",
    dataIntro:
      "Marrakech is a city where you will be lost repeatedly and deliberately, in alleys that are narrower than your shoulders and often unnamed. That generates real map traffic, and the intermittent signal in the medina means more of it than you would expect, because each time you regain connection your map app catches up.",
    headers: ["What you do", "Roughly", "Marrakech-specific note"],
    rows: [
      ["Navigating the medina", "300–600 MB a day", "You will be lost often; each reconnection resyncs the map"],
      ["Guides, drivers and bookings", "100–300 MB a day", "Messaging with a riad or driver is the normal way to arrange things"],
      ["Photography and upload", "200–700 MB a day", "Market and architecture photography; compress before upload"],
      ["Video", "1–3 GB", "Usually on riad or café Wi-Fi in the evening"],
    ],
    volumeAdvice:
      "A week in Marrakech fits a mid-range allowance, but the medina is the variable — long stretches with no signal followed by a burst of syncing. Keep an eye on remaining data rather than assuming the plan is untouched, and compress photographs before uploading them.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Do this before you fly, and treat it as part of the trip preparation rather than an afterthought. The medina is exactly where you will not be able to buy a plan, solve a device problem or download an offline map, and it is exactly where you will want to.",
    buySteps: [
      "Buy and install the plan at home, on your own Wi-Fi, before you travel",
      "Download an offline map of the medina and the palm groves before departure",
      "Arrange your riad transfer and first day's contact details in advance, because arranging them on arrival in the medina is painful",
      "Confirm the eSIM is your default data line before you land, then check it works in the taxi",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "In the medina, the honest expectation is intermittent signal in the alleys and good signal in the open squares and the main souks. Treating that as normal prevents you from concluding, wrongly, that the eSIM has failed and trying to reinstall it in a doorway.",
    breakFixes: [
      "No signal in an alley: expected; move toward a square or the nearest main souk and it returns",
      "Nothing works anywhere: check you are not in a basement-level riad courtyard, and restart once you are outside",
      "Data stopped entirely: more likely an exhausted allowance than a network problem — check the provider's app",
      "After a restart no data: the physical SIM has usually reclaimed the default data role; switch it back",
    ],
    specificsHeading: "Marrakech-specific things worth knowing",
    specifics: [
      "The medina's signal is genuinely poor in the narrowest alleys and fine in Jemaa el-Fnaa and the wider souks — plan the moments you need a map around that.",
      "Messaging with your riad is the standard way to arrange pickups and dinner, so keeping messaging on your physical line is genuinely useful here.",
      "The medina is a maze by design, and an offline map plus a sense of direction recovers most of what the signal cannot.",
      "If you are here in the hottest months, the rhythm of the day shifts to evening, which is also when the medina is busiest and best.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "If you are staying in Gueliz with reliable hotel Wi-Fi and taking short guided trips into the medina, a modest plan is enough. The eSIM is worth it precisely when you are spending hours in the medina on your own, which is what most visitors do.",
    faq: [
      {
        question: "Will an eSIM work in the Marrakech medina?",
        answer:
          "It will work, but expect patchy signal in the narrow alleys and reliable coverage in the open squares and main souks. It works far better than a roaming phone, but it is not continuous.",
      },
      {
        question: "How much data do I need for Marrakech?",
        answer:
          "A mid-range allowance covers a normal week. Because signal comes and goes in the medina, your apps sync in bursts, so compressing photographs before upload is worth doing.",
      },
      {
        question: "Should I buy an eSIM before I go to Marrakech?",
        answer:
          "Yes, and this is one of the trips where it most clearly matters. Sorting it out in the medina, where you have no signal, is a genuinely bad place to discover you need a plan.",
      },
    ],
    metaTitle: "eSIM in Marrakech: Medinas, Signal Gaps and Buying Before You Fly",
    metaDescription:
      "Why the Marrakech medina kills signal, how much data a week needs, and why an eSIM should be installed before you arrive rather than on site.",
  },
  {
    slug: "lisbon",
    name: "Lisbon",
    intro:
      "Lisbon is a hilly city of tiled facades, viewpoints and a tram network that visitors queue for in the middle of the day, and it is a place where a working map genuinely changes the quality of a trip. The hills are the reason: they block signal in ways that are confusing unless you know what is happening, and they are the reason an offline map is worth having even with excellent connectivity.",
    dataHeading: "What a Lisbon trip actually costs you in data",
    dataIntro:
      "Lisbon's data profile is dominated by navigation up and down steep streets, and by the photo-and-upload habit that comes with a city this photogenic. It is a compact city, so distances are short, which is one of the reasons a mid-range allowance is usually more than enough.",
    headers: ["What you do", "Roughly", "Lisbon-specific note"],
    rows: [
      ["Hill navigation and tram routes", "200–400 MB a day", "Steep terrain means more re-routing and more backtracking"],
      ["Photography and upload", "300 MB–1 GB a day", "A genuinely photogenic city; compress before upload"],
      ["Cafés, hotels and co-working Wi-Fi", "Varies", "Lisbon has an unusually dense café culture with usable Wi-Fi"],
      ["Video", "1–3 GB", "Easily absorbed by the café and hotel networks available here"],
    ],
    volumeAdvice:
      "A week in Lisbon sits comfortably inside a mid-range allowance. The one thing worth controlling is full-resolution photo upload, which on a city this photogenic can quietly become your largest single data expense without feeling like one.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Lisbon is not urgent in the way Marrakech is, but doing it before you fly is still the better version of the trip: you land with a map that works on a hill you did not expect, and you skip a shop-counter detour on a day you would rather be exploring.",
    buySteps: [
      "Buy the plan before departure and install it at home on Wi-Fi",
      "Download an offline map of Alfama, Graça and the hills west of the centre, which is where the steepest streets are",
      "Save your accommodation address locally, not just in a booking confirmation you will not have signal to open",
      "Set the eSIM as the default data line after landing, before you start climbing",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "The Lisbon-specific failure is signal that drops in a valley or an underground passage and comes back on the next street. It reads as a broken connection and is usually a building or a hill. The reflex should be to move, not to reinstall.",
    breakFixes: [
      "Signal vanished on a steep street: move toward the main road or a square; it returns within a block or two",
      "No data at all: check the default data line — the physical SIM often reclaims it after a restart",
      "Data ran out mid-trip: more common here than coverage failure; top up over Wi-Fi before you need it",
      "Install will not start: complete the installation on Wi-Fi, not on mobile data",
    ],
    specificsHeading: "Lisbon-specific things worth knowing",
    specifics: [
      "The hills west of Alfama and around Graça are the hardest parts of the city for signal, and also the parts you will most want a map in.",
      "The tram network is a genuine tourist bottleneck at peak times; having routes offline means you can plan an alternative rather than standing in a queue with no data.",
      "The café density means Wi-Fi is easy to find in the middle of the day, which is a practical way to bank back allowance.",
      "The city is compact enough that walking is usually fastest, which quietly reduces the navigation load.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "For a short weekend based somewhere with solid Wi-Fi, a small plan is entirely sufficient. The eSIM earns its place over a week, or if you are staying in the older quarters where the signal is genuinely patchy and the hills are steep.",
    faq: [
      {
        question: "Is signal bad in Lisbon because of the hills?",
        answer:
          "In parts of it, yes. The steep quarters west of the centre block signal in ways that feel like a failure but are just terrain. An offline map covers you when it does.",
      },
      {
        question: "How much data does a week in Lisbon use?",
        answer:
          "Within a mid-range allowance comfortably. Photo upload is the most likely thing to push you over, so compress images or upload on café Wi-Fi.",
      },
      {
        question: "Do I need an eSIM in Lisbon or is roaming fine?",
        answer:
          "It depends entirely on your roaming plan. Where roaming is expensive, the eSIM is the standard answer; where your operator already includes generous data in the EU, a local eSIM is a convenience rather than a necessity.",
      },
    ],
    metaTitle: "eSIM in Lisbon: Hills, Signal Gaps and Offline Maps",
    metaDescription:
      "Why Lisbon's hills cost you signal, how much data a week needs, and when to install an eSIM before flying to Portugal.",
  },
  {
    slug: "cairo",
    name: "Cairo",
    intro:
      "Cairo is the trip where data is least about the phone and most about logistics. The city is enormous, distances that look reasonable on a map are genuinely long in traffic, and the practical question each morning is not which museum to visit but how to get to it. Solving connectivity before arrival is what makes that question answerable.",
    dataHeading: "What a Cairo trip actually costs you in data",
    dataIntro:
      "Cairo's data cost is dominated by transit, not tourism. Long distances, unpredictable traffic and a metro system that requires planning mean the maps and ride-hailing apps are in constant use, and each re-plan is a fresh sync. Photography is the second consumer, and the light in this city does not help.",
    headers: ["What you do", "Roughly", "Cairo-specific note"],
    rows: [
      ["Ride-hailing and route planning", "400–800 MB a day", "Long distances in traffic mean constant re-routing"],
      ["Metro and bus navigation", "200–400 MB a day", "The metro is excellent value but needs planning before you enter it"],
      ["Photography and upload", "300 MB–1 GB a day", "Compress before uploading; the light is exceptional"],
      ["Video", "1–3 GB", "Hotel Wi-Fi usually carries this comfortably"],
    ],
    volumeAdvice:
      "Cairo is a city where a mid-range allowance can be tight, because transit genuinely eats data. If you are combining the trip with any remote work, or you plan a lot of day trips, size the plan up rather than down — running out in Cairo is more disruptive than almost anywhere else on this list, because getting somewhere without data is a real problem.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Before you fly, and more strongly here than in most destinations. Arriving in Cairo without a working plan means negotiating with a shop or waiting for a delivery, and doing it in a city where you are dependent on maps to move at all is a poor first impression.",
    buySteps: [
      "Buy and install before departure so there is no arrival-day dependency on a local connection",
      "Download an offline map of Greater Cairo and, separately, of Giza — they are not the same place and visitors mix them up",
      "Save your hotel address and your guide's contact details locally before you land",
      "Set the eSIM as the default data line as soon as you arrive, before you need to navigate anywhere",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "Cairo's characteristic connectivity problem is congestion rather than loss of service: busy areas and peak hours are slow, and a phone that appears not to work may simply be waiting. The practical response is patience and a move to a quieter spot, not a reinstall.",
    breakFixes: [
      "Everything is slow in a busy area: congestion; retry, or move a few hundred metres",
      "No data at all: check the default data line, then check whether the allowance is exhausted",
      "Weak inside a large building or museum: normal; step outside or find a window",
      "Install fails: do the installation on Wi-Fi before you rely on it in Cairo",
    ],
    specificsHeading: "Cairo-specific things worth knowing",
    specifics: [
      "The metro is the single best-value way to move across Greater Cairo and it runs reliably; planning the line before you enter is what makes it usable.",
      "Giza is a long journey from central Cairo, and visitors who assume it is adjacent lose hours; an offline map makes that decision obvious.",
      "Tahrir and the older central areas are dense and busy, which shows up as congestion at peak times rather than lost signal.",
      "Hotels and the larger museums generally have usable Wi-Fi, which is a good way to bank back allowance on a heavy day.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "If you are on a short organised trip with a driver and a fixed itinerary, you may barely need data and a small plan is fine. The eSIM becomes essential the moment you are navigating Cairo yourself, which is what most visitors end up doing within a day or two.",
    faq: [
      {
        question: "Do I really need an eSIM in Cairo?",
        answer:
          "If you will be moving around the city on your own, yes — Cairo is large and hard to navigate without data. With a fixed itinerary and a driver, a small plan will do.",
      },
      {
        question: "How much data does a week in Cairo use?",
        answer:
          "More than most comparable trips, because distances are long and the map apps are in constant use. If you are doing day trips or working remotely, size the plan up rather than down.",
      },
      {
        question: "Is the connection reliable in Cairo?",
        answer:
          "It works, but it is slower in busy areas and at peak times. The problem is congestion rather than loss of coverage, and it usually improves if you retry or move.",
      },
    ],
    metaTitle: "eSIM in Cairo: Data Needs, Long Distances and Transit Apps",
    metaDescription:
      "How much data a Cairo trip really needs, why transit eats the allowance, and why installing an eSIM before arrival matters more here.",
  },
  {
    slug: "rio-de-janeiro",
    name: "Rio de Janeiro",
    intro:
      "Rio is a city where connectivity shapes the itinerary more than it does most places, because the distances between the beaches, the centre and the viewpoints are real and the public transport is not always the obvious answer. Having data is not about Instagram here; it is about knowing which neighbourhood to be in, when to get back, and which beach is worth the trip.",
    dataHeading: "What a Rio trip actually costs you in data",
    dataIntro:
      "Rio's data profile is unusual in a good way: long outdoor days mean you are using the phone less for navigation and more for decisions. The map and transit apps do the heavy lifting early in the day, and the rest is photography, which in Rio is not a small number.",
    headers: ["What you do", "Roughly", "Rio-specific note"],
    rows: [
      ["Beach and neighbourhood navigation", "200–400 MB a day", "Long distances between Copacabana, Ipanema, Lapa and the centre"],
      ["Photography and upload", "400 MB–1.5 GB a day", "A city that rewards constant photographing; compress before upload"],
      ["Safety and situational awareness", "Varies", "Keeping maps available matters more here than on most trips"],
      ["Video", "1–3 GB", "Mostly consumed on hotel Wi-Fi in the evening"],
    ],
    volumeAdvice:
      "A week in Rio fits a mid-range allowance, but photo upload is the item most likely to push you over — the light is strong and the instinct to photograph is strong. Compress before uploading, and treat hotel Wi-Fi as the place for anything heavy. Size the plan up if you are combining the trip with remote work.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Before you fly. Rio is a city where knowing where you are and how long a journey takes has genuine practical value, and the beach-and-neighbourhood rhythm of the day means you will be making those calls repeatedly rather than once.",
    buySteps: [
      "Buy and install the plan before departure, so arrival day is not spent in a shop queue",
      "Download offline maps of Copacabana, Ipanema, Lapa and Centro for the areas you are actually staying in",
      "Save your accommodation address locally in Portuguese as well as English, which is genuinely useful here",
      "Set the eSIM as the default data line after landing, before you leave the accommodation",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "Rio's characteristic issue is a connection that works well and then degrades in specific heavy areas, and the second-order effect is battery: a phone hunting for signal in a busy spot drains faster, which matters over a long day out. Connectivity problems here are rarely about coverage being absent.",
    breakFixes: [
      "Slow in a busy beach area: congestion; move away from the immediate crowd and retry",
      "Phone getting hot and the connection stuttering: signal hunting drains the battery, which degrades performance; step to a quieter spot",
      "No data at all: check the default data line, then check whether the allowance is exhausted",
      "Weak on a hillside or inside: normal; the network has line-of-sight problems in the city's terrain",
    ],
    specificsHeading: "Rio-specific things worth knowing",
    specifics: [
      "The distances between the main beach neighbourhoods are short on a map and long in traffic; knowing which stretch you are staying on saves a lot of transit.",
      "Keeping your phone charged and available through the day matters more than the raw data allowance does.",
      "The hills and the surrounding terrain genuinely affect coverage, so signal quality varies between neighbourhoods rather than being uniform across the city.",
      "Hot months shift the entire day towards evening, which also moves when the busiest areas are.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "On a short, tightly organised trip with a guide or driver and most time on a beach near where you are staying, a small plan is enough. The eSIM matters once you are moving between neighbourhoods independently, which is the normal case after the first couple of days.",
    faq: [
      {
        question: "Is eSIM coverage in Rio reliable?",
        answer:
          "Mostly, yes. The problems tend to be congestion in busy beach areas and terrain-related variation between neighbourhoods, rather than a lack of coverage.",
      },
      {
        question: "How much data does a week in Rio use?",
        answer:
          "A mid-range allowance covers it, but photography in Rio adds up quickly. Compress images before uploading and use hotel Wi-Fi for anything heavy.",
      },
      {
        question: "Do I need an eSIM in Rio or is roaming fine?",
        answer:
          "Where your roaming plan is expensive, the eSIM is the standard answer. It is worth it particularly if you will be moving between neighbourhoods on your own rather than being driven around.",
      },
    ],
    metaTitle: "eSIM in Rio de Janeiro: Data Needs, Distances and Beach Days",
    metaDescription:
      "How much data a Rio trip needs, how far the beaches really are from each other, and when to install an eSIM before flying to Brazil.",
  },
  {
    slug: "miami",
    name: "Miami",
    intro:
      "Miami is a city where a working data plan is about logistics: the beach is a bus ride, not a walk, and the neighbourhoods that matter to you are spread across a wide area. Add a genuinely enormous food and nightlife scene, and a lot of phone use in the sun, and the practical case for sorting connectivity before you land is straightforward.",
    dataHeading: "What a Miami trip actually costs you in data",
    dataIntro:
      "Miami's data profile is dominated by maps and ride-hailing, because almost nothing here is within easy walking distance of anything else. Photography is the other significant consumer, and a city with this much light and colour generates a lot of it before you have even left the hotel.",
    headers: ["What you do", "Roughly", "Miami-specific note"],
    rows: [
      ["Ride-hailing and driving navigation", "400–700 MB a day", "Distances are genuinely spread out; the app is in constant use"],
      ["Beach and neighbourhood maps", "200–300 MB a day", "South Beach, Brickell, Wynwood and Coconut Grove are not adjacent"],
      ["Photography and upload", "300 MB–1 GB a day", "Strong light, high upload habit; compress before sending"],
      ["Video and calls", "1–3 GB", "Relevant if you are working from the trip"],
    ],
    volumeAdvice:
      "A week in Miami fits a mid-range allowance, with the two pressure points being full-resolution photo upload and any remote work. If the trip is partly working, size the plan up deliberately — running out in a city where you need a car to get anywhere is genuinely inconvenient.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Before you fly, mainly because the arrival moment in Miami is often a long transfer from the airport, and having your map and ride-hailing working from the moment you get into the car removes a whole layer of friction from a day that is otherwise all transit.",
    buySteps: [
      "Buy the plan before departure; it costs the same and removes an arrival-day errand",
      "Install at home on Wi-Fi so a device that refuses the profile is caught before you fly",
      "Download an offline map of the neighbourhoods you are actually staying around, not all of Miami",
      "Set the eSIM as the default data line before you land so ride-hailing works from the airport",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "Miami's typical connectivity complaint is a phone that struggles in a hot car, in a crowded beach area, or in a large indoor space. All three are ordinary and none of them mean the eSIM is broken. Battery and heat are a bigger factor to keep an eye on than signal quality.",
    breakFixes: [
      "Sluggish on a hot beach day: the phone is thermally throttling, not the network failing; get it out of direct sun and let it cool",
      "Slow in a busy area: congestion; move and retry",
      "No data after a restart: the physical SIM has usually taken the default role back; switch it",
      "Install will not start: perform the installation on Wi-Fi, not on mobile data",
    ],
    specificsHeading: "Miami-specific things worth knowing",
    specifics: [
      "The main neighbourhoods are genuinely far apart, so the map and ride-hailing apps are doing real work rather than decoration.",
      "Heat and sun are a bigger practical factor than coverage — a phone that has been in direct sun will perform worse, and a beach day is exactly that.",
      "Hotel and resort Wi-Fi is usually good, which is the natural place to upload photos and take video calls.",
      "If you are combining the trip with a cruise, the days at sea are a natural point to make sure your plan's terms actually cover a ship — check this rather than assuming.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "If you are staying in one area — South Beach only, say — and treating the trip as a beach holiday, a modest plan is plenty. The eSIM earns its keep when you are moving between neighbourhoods, going out at night, or combining the trip with work.",
    faq: [
      {
        question: "Do I need an eSIM in Miami?",
        answer:
          "It depends on how mobile you are. If you are on one beach neighbourhood for a week, Wi-Fi and a small plan will do. If you are moving around the city or working from the trip, it is the sensible choice.",
      },
      {
        question: "How much data do I need for a week in Miami?",
        answer:
          "A mid-range allowance covers ordinary use. Photo upload and video calls are what push people over, so compress images and take calls on Wi-Fi where you can.",
      },
      {
        question: "Does my phone get hot and slow the connection?",
        answer:
          "That is usually the phone, not the eSIM. Direct sun and a hot car will slow a modern phone noticeably, and the performance recovers when it cools down.",
      },
    ],
    metaTitle: "eSIM in Miami: Data Needs, Distances and Heat",
    metaDescription:
      "How much data a Miami trip needs, why the neighbourhoods are further apart than they look, and when to install an eSIM before flying.",
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    intro:
      "Los Angeles is the city where having data is about one decision above all others: the car. Public transport exists and is improving, but the distances involved mean that most days include driving, and a phone that loses its connection in a canyon on the way to the coast is a genuinely different experience from one that keeps it. Sorting the eSIM before arrival is worth more here than in almost any other city on this list.",
    dataHeading: "What a Los Angeles trip actually costs you in data",
    dataIntro:
      "Los Angeles consumes more data than a comparable city, and the reason is not tourism — it is the road. Navigation with live traffic, toll and closure information, and repeated re-routing on a multi-hour drive is a far heavier data load than walking a European old town. Add photography, which in this city is never far away, and the allowance matters.",
    headers: ["What you do", "Roughly", "Los Angeles-specific note"],
    rows: [
      ["Driving navigation with live traffic", "500 MB–1.5 GB a day", "The single largest data consumer on most itineraries here"],
      ["Photography and upload", "400 MB–1.5 GB a day", "Compress before uploading; full-resolution is very heavy"],
      ["Neighbourhood maps and transit", "200–400 MB a day", "Useful, but much less so if you are driving"],
      ["Video and streaming", "1–3 GB", "Absorbed by hotel and house Wi-Fi, which is usually good"],
    ],
    volumeAdvice:
      "A week in Los Angeles is where sizing the plan up is most justified, because navigation genuinely eats allowance. If you are driving between neighbourhoods, renting a car, or doing day trips, a generous plan is the right call. Compress photographs before uploading them — that is the other half of the equation.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "As early as you can manage, and installed before you land. The specific reason is car rental: the process involves an airport shuttle, a counter and a vehicle handover, and having working data for maps and navigation makes the whole thing noticeably less stressful than doing it with a dead phone.",
    buySteps: [
      "Buy the plan before departure and install it at home on Wi-Fi",
      "Download offline maps of the neighbourhoods you are staying in and of any day-trip destination you are driving to",
      "Save your accommodation address locally, including the cross streets, which is genuinely useful for meeting a car or a driver",
      "Set the eSIM as the default data line before you land, so navigation works from the airport",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "Los Angeles has a specific and well-known failure mode: the signal drops in the hills and canyons on the routes between the basin and the coast. It is geography rather than network capacity, and it is the one place on this list where the drop is predictable enough to plan around.",
    breakFixes: [
      "Signal drops on a canyon or hill road: expected; the connection returns in the valleys. Download maps beforehand for this reason",
      "Navigation dies mid-drive: keep an offline map specifically for the drive, not just the city",
      "Slow in a dense area or event: congestion; retry or wait",
      "No data at all: check the default data line, then whether the allowance is exhausted",
    ],
    specificsHeading: "Los Angeles-specific things worth knowing",
    specifics: [
      "Signal is genuinely patchy on the hill and canyon routes, particularly between the basin and the coast — download maps before you drive.",
      "Traffic is the real experience of the city, and live traffic data is the feature that makes an eSIM plan feel worth having here.",
      "Walkability is neighbourhood-specific: some areas are excellent on foot, others are not, and the difference is large.",
      "Public transport has expanded considerably and is genuinely usable, which is worth knowing before assuming a car is unavoidable.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "If you are staying in one walkable neighbourhood, have a car, and rely on the hotel or rental Wi-Fi, you may barely need it. The eSIM is worth it precisely when you are navigating without a car or driving somewhere the navigation needs to keep working.",
    faq: [
      {
        question: "Is mobile data essential in Los Angeles?",
        answer:
          "If you are driving without a built-in system, effectively yes. Live traffic and route recalculation are the feature people miss most when they travel without data here.",
      },
      {
        question: "How much data do I need for a week in Los Angeles?",
        answer:
          "More than most comparable trips. Navigation with live traffic is the biggest cost, so a generous plan is justified, and compressing photo uploads is worth the effort.",
      },
      {
        question: "Why does my signal drop on the drive between LA and the coast?",
        answer:
          "The hills and canyons physically block the signal. It is a terrain problem rather than a network one, and the fix is to have the route downloaded before you set off.",
      },
    ],
    metaTitle: "eSIM in Los Angeles: Data Needs, Driving and Canyon Signal Loss",
    metaDescription:
      "How much data an LA trip really needs, why driving eats the allowance, and how to handle the signal drop between LA and the coast.",
  },
  {
    slug: "bali",
    name: "Bali",
    intro:
      "Bali is the trip where the shape of the data plan matters more than its size, because the island is not one place. Ubud, the southern beaches, the east coast and the hills are different jobs, and a traveller who buys a plan suited to one of them discovers the mismatch at the worst moment. Sorting it before you fly is not about convenience here; it is about knowing what you are buying.",
    dataHeading: "What a Bali trip actually costs you in data",
    dataIntro:
      "Bali's data profile is defined by being spread out. Travellers who are based in one area use very little; travellers who move between the south, Ubud and the north use a lot, because every transfer is a route to plan and the distances are genuinely long. A scooter ride that looks short on a map takes considerably longer on the road.",
    headers: ["What you do", "Roughly", "Bali-specific note"],
    rows: [
      ["Navigation between areas", "300–700 MB a day", "The south, Ubud and the north are not adjacent, whatever the map suggests"],
      ["Scooter and ride-hailing navigation", "200–500 MB a day", "Roads are slow and winding; re-routing is frequent"],
      ["Photography and upload", "300 MB–1 GB a day", "A very photogenic island; compress before uploading"],
      ["Video", "1–3 GB", "Villa and café Wi-Fi is usually dependable"],
    ],
    volumeAdvice:
      "A week in Bali fits a mid-range allowance if you are based in one area, and needs a generous one if you are moving between them. The deciding question is not how long you are staying but how many times you change base. Check the plan's coverage terms for Indonesia as a whole rather than assuming one region's coverage applies island-wide.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Before you fly, and with more attention than most destinations. The reason is that a mistake here — the wrong plan for the wrong area, or a profile installed at the wrong moment — is harder to fix from the island than it would be in a city, because getting to a shop takes real time.",
    buySteps: [
      "Buy the plan before departure, and check what it actually covers across Indonesia rather than just 'Bali'",
      "Install the profile at home on Wi-Fi so a device-side problem does not become an island problem",
      "Download offline maps for the specific areas you are staying in — this matters more here than anywhere else",
      "Set the eSIM as the default data line after landing, before you start riding",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "Bali's characteristic issue is a plan that works perfectly in one area and is slow or absent in another, because coverage genuinely varies across the island and the terrain. The fix is knowing where you are in relation to where the network is strongest, and having offline maps for the gaps.",
    breakFixes: [
      "Works at the villa, slow at the beach: coverage varies by area on this island; move or use the villa Wi-Fi for heavy tasks",
      "Signal poor in the hills or the interior: terrain; download maps before you go",
      "No data at all: check the default data line, then whether the plan covers the area you are in",
      "Install will not start: do the installation on Wi-Fi before you rely on it",
    ],
    specificsHeading: "Bali-specific things worth knowing",
    specifics: [
      "Coverage genuinely varies across the island, so a plan that works in one area is not a guarantee in another — the single most important thing to understand here.",
      "Distances between the south, Ubud and the north are long, and a scooter journey that looks short takes much longer than the map implies.",
      "Villa, hotel and café Wi-Fi is generally dependable, which makes it a natural place to upload photographs and take calls.",
      "If you are changing base more than once, size the plan for the whole trip rather than the first few days.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "If you are staying in one area for the whole trip and not moving much — a villa week in the south, for example — the eSIM is a convenience rather than a necessity. It becomes important the moment you are travelling between areas, which is the normal Bali pattern after the first few days.",
    faq: [
      {
        question: "Does an eSIM work all over Bali?",
        answer:
          "It works, but coverage genuinely varies between areas, particularly between the interior, the south and the north. Check what the plan covers across Indonesia rather than assuming one area's coverage is representative.",
      },
      {
        question: "How much data do I need for a week in Bali?",
        answer:
          "A mid-range allowance if you stay in one area, more if you move between them. Navigation between areas is the main cost, and compressing photo uploads helps considerably.",
      },
      {
        question: "Do I need an eSIM in Bali or is a local SIM better?",
        answer:
          "An eSIM is the easiest option for a short trip. A local physical SIM can work out cheaper for a long stay, but it costs you time at a shop, which is the thing a short trip does not have.",
      },
    ],
    metaTitle: "eSIM in Bali: Coverage That Varies by Area and How to Plan",
    metaDescription:
      "Why Bali coverage differs so much between areas, how much data a week needs, and how to pick an eSIM before you fly to Indonesia.",
  },
  {
    slug: "athens",
    name: "Athens",
    intro:
      "Athens is a city where the centre is dense, walkable and easy to navigate, and the rest of Attica is a different problem entirely: a sprawling metro area where the distances defeat walking. Most visitors spend the first part of the trip in the compact old centre and the second part being driven around the wider city, and the connectivity needs of those two halves are not the same.",
    dataHeading: "What an Athens trip actually costs you in data",
    dataIntro:
      "Athens generates modest data demand if you stay in the centre, because the old city is small, walkable and heavily visited. The demand rises sharply on day trips, where you are navigating to a specific archaeological site or a beach on the other side of the metro area. Photo upload is the steady background consumer.",
    headers: ["What you do", "Roughly", "Athens-specific note"],
    rows: [
      ["Walking the centre and Plaka", "100–250 MB a day", "A compact, walkable area; light navigation"],
      ["Day trips and metro navigation", "300–600 MB a day", "The wider Attica area is genuinely large and hard to walk"],
      ["Photography and upload", "300 MB–1 GB a day", "Acropolis, rooftops and the Acropolis Museum; compress before upload"],
      ["Video", "1–3 GB", "Hotel and café Wi-Fi usually carries this"],
    ],
    volumeAdvice:
      "A week in Athens on a mid-range allowance is comfortable, with the caveat that several day trips will move you into the heavier end. If you are planning multiple excursions across Attica, or combining the trip with remote work, size the plan up rather than down.",
    buyHeading: "When to buy, and when to install",
    buyIntro:
      "Nothing about Athens is urgent, which makes it an easy trip to get wrong casually. Sorting it before departure is still the better version, mainly because the profile will be installed and verified before you are relying on it to find a bus stop in a language you do not read.",
    buySteps: [
      "Buy before departure and install at home on Wi-Fi",
      "Download an offline map of the Plaka, Monastiraki and Syntagma area — the core of what you will walk",
      "If you are planning day trips, download the route to each one before you go rather than at the bus stop",
      "Set the eSIM as the default data line after landing, before you start walking",
    ],
    breakHeading: "What breaks, and what to do about it",
    breakIntro:
      "Athens has no dramatic connectivity problem. What visitors hit instead is the ordinary one: a phone that has reverted to its physical SIM after a restart, or a plan that ran out during a week of heavy photo uploads. Both are quick to fix once you know what they are.",
    breakFixes: [
      "No data after a restart: the physical SIM has usually reclaimed the default data role; switch it back",
      "Data stopped working: check remaining allowance in the provider's app before assuming a network fault",
      "Slow near the Acropolis or a crowded site: congestion; retry shortly or move",
      "Install will not start: run the installation on Wi-Fi, not on mobile data",
    ],
    specificsHeading: "Athens-specific things worth knowing",
    specifics: [
      "The historic centre is compact and walkable, so connectivity demand there is genuinely low — this is a good city for a light plan if you stay central.",
      "The wider Attica area is large and the metro is the sensible way to cross it, which is where a working map earns its keep.",
      "The Acropolis and its surroundings get heavy visitor congestion, which shows up as slow speeds rather than lost signal.",
      "Hot months push the day towards evening and shade, which is also when much of the city's Wi-Fi becomes available.",
    ],
    wrongChoiceHeading: "When an eSIM is the wrong call",
    wrongChoice:
      "If you are staying in the centre, walking, and taking no day trips, a modest plan is entirely sufficient. The eSIM earns its keep once you start crossing the metro area or making excursions beyond it.",
    faq: [
      {
        question: "Do I need an eSIM in Athens?",
        answer:
          "Not for a central, walk-on-foot trip. It becomes the sensible option if you are taking day trips, moving around the wider metro area, or relying on the phone for navigation much of the day.",
      },
      {
        question: "How much data does a week in Athens use?",
        answer:
          "A mid-range allowance covers a typical week, with day trips and photo uploads being what push it up. Compress images before uploading if you are near your limit.",
      },
      {
        question: "Is the connection reliable in Athens?",
        answer:
          "Yes, in general. The problems that occur are usually congestion at busy sites, an exhausted allowance, or a phone that has reverted to its physical SIM — not a coverage failure.",
      },
    ],
    metaTitle: "eSIM in Athens: Data Needs, Day Trips and the Metro Area",
    metaDescription:
      "How much data an Athens trip needs, why day trips change the picture, and when to install an eSIM before flying to Greece.",
  },
];

/** Builds the block list for one city. Structure is shared; every word is not. */
function buildBlocks(s: EsimSpec): ContentBlock[] {
  return [
    { type: "p", text: s.intro },

    { type: "h2", text: s.dataHeading },
    { type: "p", text: s.dataIntro },
    { type: "table", headers: s.headers, rows: s.rows },
    { type: "p", text: s.volumeAdvice },

    { type: "h2", text: s.buyHeading },
    { type: "p", text: s.buyIntro },
    { type: "ol", items: s.buySteps },

    { type: "h2", text: s.breakHeading },
    { type: "p", text: s.breakIntro },
    { type: "ul", items: s.breakFixes },

    { type: "h2", text: s.specificsHeading },
    { type: "ul", items: s.specifics },

    { type: "h2", text: s.wrongChoiceHeading },
    { type: "p", text: s.wrongChoice },

    { type: "cta", label: `Compare eSIM plans for ${s.name}`, category: Cat.ESIM, destinationSlug: s.slug, placement: `esim-guide-${s.slug}` },

    { type: "faq", items: s.faq },
  ];
}

function countWords(s: EsimSpec): number {
  const parts: string[] = [s.intro, s.dataHeading, s.dataIntro, s.volumeAdvice, s.buyHeading, s.buyIntro, s.breakHeading, s.breakIntro, s.specificsHeading, s.wrongChoiceHeading, s.wrongChoice, ...s.headers, ...s.rows.flat(), ...s.buySteps, ...s.breakFixes, ...s.specifics, ...s.faq.map((f) => `${f.question} ${f.answer}`)];
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}

async function main() {
  console.log(`mode: ${APPLY ? "APPLY (writes body + meta only)" : "DRY RUN (no writes)"}\n`);

  if (!APPLY) {
    console.log("MANUAL FACTS a human must confirm before this goes live:");
    for (const f of MANUAL_FACTS) console.log(`  - ${f}`);
    console.log("");
  }

  let updated = 0;
  const missing: string[] = [];

  for (const spec of SPECS) {
    const dest = await prisma.destination.findUnique({ where: { slug: spec.slug } });
    if (!dest) {
      missing.push(spec.slug);
      console.log(`  ${`${spec.slug}-esim`.padEnd(26)} no destination "${spec.slug}" — skipped`);
      continue;
    }

    const slug = `${spec.slug}-esim`;
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (!existing) {
      missing.push(slug);
      console.log(`  ${slug.padEnd(26)} MISSING article — skipped`);
      continue;
    }

    const words = countWords(spec);
    const metaLen = spec.metaDescription.length;
    const warn = metaLen > 155 ? `  !! meta ${metaLen} chars (>155)` : "";

    console.log(
      `  ${slug.padEnd(26)} ${String(words).padStart(4)} words  meta ${String(metaLen).padStart(3)}  ${existing.status}${warn}`,
    );

    if (APPLY) {
      await prisma.article.update({
        where: { id: existing.id },
        data: {
          content: JSON.stringify(buildBlocks(spec)),
          metaTitle: spec.metaTitle,
          metaDescription: spec.metaDescription,
          excerpt: spec.metaDescription,
          // status / publishedAt / allowIndexing are deliberately NOT touched.
        },
      });
    }
    updated++;
  }

  console.log(`\narticles rewritten: ${updated} / ${SPECS.length}`);
  if (missing.length) console.log(`skipped: ${missing.join(", ")}`);
  console.log(`\nSlugs, titles, status and indexation are unchanged — this is an in-place body rewrite.`);
  if (!APPLY) console.log(`DRY RUN. Re-run with --apply to write.`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
