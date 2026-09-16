import Link from "next/link";

export function ResourceGuide({ slug }: { slug: string }) {
  if (slug === "travel-insurance") return <TravelInsuranceGuide />;
  if (slug === "visas") return <VisaGuide />;
  if (slug === "car-rental") return <CarRentalGuide />;
  return null;
}

function TravelInsuranceGuide() {
  return (
    <div className="prose-roamora">
      <h2>Why travel insurance is worth the ten minutes</h2>
      <p>
        Travel insurance is the least exciting purchase you will make for a trip, and the one you are most
        relieved to have when a flight is cancelled, a bag disappears or you need a doctor in a country where
        you do not speak the language. It is not a refund machine for changing your mind — it is protection
        against the expensive, unlikely events that turn a great trip into a financial disaster.
      </p>
      <p>
        The trick is choosing cover that matches how you actually travel. A weekend city break, a three-week
        backpacking route and a ski trip all need different policies. Below is how to read the jargon, what the
        cover really includes, and the small print that voids more claims than anything else.
      </p>

      <h2>What travel insurance actually covers</h2>
      <p>
        Most comprehensive policies bundle several distinct covers into one premium. Knowing which ones you
        need prevents you from overpaying for extras you will never use:
      </p>
      <ul>
        <li>
          <strong>Emergency medical treatment and evacuation</strong> — the core of any policy, and the reason
          to buy it even for a short trip.
        </li>
        <li>
          <strong>Trip cancellation and interruption</strong> — reimburses non-refundable costs if you cannot
          travel or must cut the trip short for a covered reason.
        </li>
        <li>
          <strong>Baggage and personal belongings</strong> — usually a modest limit with a per-item cap.
        </li>
        <li>
          <strong>Travel delay and missed connection</strong> — pays a fixed amount or covers extra
          accommodation after a long delay.
        </li>
        <li>
          <strong>Personal liability</strong> — covers you if you accidentally injure someone or damage
          property abroad.
        </li>
      </ul>
      <p>
        If you only care about one benefit, make it medical and evacuation. A serious injury or illness
        overseas can run into six figures, and evacuation without insurance is charged upfront.
      </p>

      <h2>The fine print that voids claims</h2>
      <p>
        Most declined claims come down to a handful of avoidable mistakes rather than bad luck. Before you buy,
        check that the policy does not exclude the things that matter for your trip:
      </p>
      <ul>
        <li>
          <strong>Pre-existing medical conditions.</strong> Undeclared conditions are the single most common
          reason claims are refused. Declare everything, even if it feels minor.
        </li>
        <li>
          <strong>Alcohol and drug exclusions.</strong> Many policies will not pay if an incident involves
          alcohol or non-prescription drugs.
        </li>
        <li>
          <strong>Unattended belongings.</strong> Leaving a bag on a beach chair or a camera in a hire car is
          usually excluded.
        </li>
        <li>
          <strong>Adventure activities.</strong> Skiing, diving, motorbiking and hiking at altitude are often
          add-ons, not standard cover.
        </li>
        <li>
          <strong>Known events.</strong> Buying a policy after a storm, strike or outbreak is named is too
          late — cover usually starts when you buy it, not when you fly.
        </li>
      </ul>

      <h2>Single trip, annual, or pay-as-you-go</h2>
      <p>
        If you take two or more trips a year, an annual multi-trip policy is usually cheaper than buying
        separate cover each time, and it covers spontaneous weekends away. Pay-as-you-go medical plans bill you
        monthly and are popular with long-term travellers who are already abroad, though the medical cover is
        often narrower than a fixed-term policy.
      </p>
      <p>
        Match the trip length and destination honestly. Most annual policies cap any single trip at a set
        number of days, and destinations such as the United States, Canada and Japan often need a higher
        medical limit because treatment there is expensive.
      </p>

      <h2>Check what you already have</h2>
      <p>
        Before buying a second policy, check whether you are already covered. Some credit cards include basic
        travel cover when you pay for the trip with the card, and many home or renter&rsquo;s policies include
        personal belongings and liability away from home. These rarely replace medical and evacuation cover,
        but they can remove the need to pay twice for luggage protection. If you are not sure how the pieces
        fit together, our <Link href="/travel-tips">travel tips</Link> library has a section on planning the
        financial side of a trip.
      </p>

      <h2>A five-minute policy checklist</h2>
      <ol>
        <li>Set your medical and evacuation limit higher than you think you need.</li>
        <li>Declare every pre-existing condition before you pay.</li>
        <li>Confirm the cancellation reasons that are actually covered.</li>
        <li>Add the sports or activities you have planned.</li>
        <li>Check the single-trip day limit on any annual policy.</li>
        <li>Save the emergency assistance number offline before you fly.</li>
      </ol>

      <h2>Where insurance fits in the trip budget</h2>
      <p>
        Insurance usually costs a small fraction of the trip total, so it should be one of the last things you
        cut, not the first. Build it into your numbers with our{' '}
        <Link href="/budget-calculator">travel budget calculator</Link>, then keep the whole plan in one place
        with the <Link href="/trip-planner">trip planner</Link>. If you are comparing providers, start from our
        verified <Link href="/resources/esim">travel resources</Link> and the editor-picked{' '}
        <Link href="/deals">deals</Link> page, and always read the policy wording before you rely on it.
      </p>
    </div>
  );
}

function VisaGuide() {
  return (
    <div className="prose-roamora">
      <h2>Visa rules change — so verify, don&rsquo;t assume</h2>
      <p>
        Visa requirements are the part of trip planning most likely to change without warning. Fees rise,
        e-visa portals launch, waivers are suspended and processing times swing with demand. Anything you read
        on a blog, including this guide, is a starting point for the questions to ask — not the final answer.
        Always confirm the rules on the official government or embassy website for the country you are visiting
        before you book anything non-refundable.
      </p>

      <h2>The five questions that decide your visa</h2>
      <ol>
        <li>
          <strong>What is your nationality?</strong> The passport you hold, not where you live, determines the
          rules.
        </li>
        <li>
          <strong>Where are you going, exactly?</strong> A region like the Schengen Area counts as one zone for
          the visa, but the country you enter first can affect where you apply.
        </li>
        <li>
          <strong>How long are you staying?</strong> Tourist stays, long stays and anything involving paid work
          are usually treated completely differently.
        </li>
        <li>
          <strong>What is the purpose of the visit?</strong> Tourism, business meetings, study and volunteering
          often need different documents.
        </li>
        <li>
          <strong>Where are you entering from?</strong> Transit through a third country can require a transit
          visa of its own.
        </li>
      </ol>

      <h2>Passport validity and blank pages</h2>
      <p>
        A valid ticket is not enough if your passport is close to expiring. Many countries require at least six
        months of validity beyond your planned departure, and some ask for a blank page for the entry stamp.
        Check your passport first, because replacing it takes far longer than a visa. Renew early if you are
        anywhere near a six-month threshold.
      </p>

      <h2>Visa on arrival, e-visa and travel authorisations</h2>
      <p>
        &ldquo;Visa-free&rdquo; can mean two very different things. A visa on arrival is issued at the border
        and may still require an online pre-approval, a fee in local currency and proof of onward travel. An
        e-visa is applied for online in advance and is tied to a specific entry point and date. Travel
        authorisations such as an ESTA or eTA are not visas at all, but you still need one before boarding.
      </p>
      <p>
        Apply through the official portal, not a paid third-party site that looks official. If a site charges
        a large &ldquo;service fee&rdquo; for what should be a small government fee, you are almost certainly
        on the wrong page.
      </p>

      <h2>Common systems worth understanding</h2>
      <ul>
        <li>
          <strong>Schengen Area.</strong> Short stays are limited to 90 days within any 180-day period across
          the whole zone, not per country — keep a simple record of your entry and exit dates.
        </li>
        <li>
          <strong>United Kingdom.</strong> Many nationalities now need an electronic travel authorisation
          before arrival, even for short visits.
        </li>
        <li>
          <strong>United States.</strong> Visa Waiver Program travellers need an approved ESTA before boarding;
          everyone else needs a visa interview.
        </li>
        <li>
          <strong>Asia-Pacific.</strong> e-visas and visa-free windows vary widely and often require proof of
          accommodation and onward flights.
        </li>
      </ul>

      <h2>Transit, layovers and re-entry</h2>
      <p>
        A change of planes can trip you up. Some countries require a transit visa even if you never leave the
        airport, and a layover that crosses a border can count as a separate entry. Likewise, if a trip involves
        leaving and re-entering a country — say a side trip to a neighbouring island — make sure your visa
        allows multiple entries rather than a single one.
      </p>

      <h2>When to apply</h2>
      <p>
        Most countries will not accept an application more than a few months before travel, but they also
        cannot process one overnight. As a rule, apply as soon as the window opens: appointment slots for busy
        consulates can be booked out for weeks. Do not book unrefundable flights until the visa is confirmed,
        and if a booking is required for the application, use a refundable or hold option.
      </p>

      <h2>Your pre-trip visa checklist</h2>
      <ul>
        <li>Confirm the requirement on the official government site.</li>
        <li>Check passport validity and blank pages.</li>
        <li>Book any required appointment early.</li>
        <li>Prepare proof of funds, accommodation and onward travel.</li>
        <li>Print or save the visa and confirmation offline.</li>
        <li>Note the entry and exit rules if you plan to leave and return.</li>
      </ul>
      <p>
        Once the paperwork is settled, the fun part begins. Browse our{' '}
        <Link href="/destinations">destination guides</Link> to shortlist where to go, add{' '}
        <Link href="/resources/travel-insurance">travel insurance</Link> and a{' '}
        <Link href="/resources/esim">travel eSIM</Link> to the list, and build the whole plan in our{' '}
        <Link href="/trip-planner">trip planner</Link>.
      </p>
    </div>
  );
}

function CarRentalGuide() {
  return (
    <div className="prose-roamora">
      <h2>What you are actually paying for</h2>
      <p>
        A rental car quote is rarely the final price. The headline rate covers the car and basic use, while the
        expensive parts — insurance, fuel, extra drivers and one-way fees — are added at the desk. Understanding
        which charges are real and which are upsells is the fastest way to cut the cost of a road trip.
      </p>

      <h2>Collision damage waiver and the excess</h2>
      <p>
        The collision damage waiver (CDW) is not insurance; it is an agreement that caps your liability if the
        car is damaged or stolen. What matters is the excess — the amount deducted from your deposit when you
        make a claim. A policy with a &ldquo;full&rdquo; CDW can still leave you liable for a four-figure
        excess, which is exactly what rental desks sell extra cover to reduce.
      </p>
      <p>
        You have two ways to remove that risk: buy the excess cover at the desk, usually the most expensive
        option, or buy an independent excess policy before you travel, which reimburses the excess after a
        claim. Independent cover is almost always cheaper, but you pay the claim yourself first and reclaim it
        later, so keep every document.
      </p>

      <h2>The counter hard sell, decoded</h2>
      <p>
        The desk agent is trained to sell add-ons, and a few of them are genuinely useful while others are not.
        Before you accept anything, know what you already have:
      </p>
      <ul>
        <li>
          <strong>Excess reduction.</strong> Worth it only if you do not have independent cover and cannot
          absorb the excess.
        </li>
        <li>
          <strong>Personal accident insurance.</strong> Usually redundant if you already have travel insurance.
        </li>
        <li>
          <strong>Roadside assistance.</strong> Often included; check before paying again.
        </li>
        <li>
          <strong>Additional driver.</strong> Sometimes a real fee, sometimes free — ask rather than assume.
        </li>
        <li>
          <strong>Fuel and toll packages.</strong> Compare the per-litre price against a local filling station
          before you prepay.
        </li>
      </ul>

      <h2>Fuel policy, mileage and one-way fees</h2>
      <p>
        Full-to-full is the fairest fuel policy: collect full, return full, and keep the receipt. Anything else
        is effectively a fuel surcharge. Check the mileage allowance too — unlimited mileage is common in
        Europe and North America but not guaranteed, and per-kilometre charges add up fast. One-way rentals
        usually carry a drop-off fee, so price the return leg before choosing the cheapest-looking quote.
      </p>

      <h2>Drivers, ages and licences</h2>
      <p>
        The named driver must be the person who collects the car, and most companies charge for every extra
        driver. Drivers under 25 typically pay a young-driver surcharge, and some destinations impose a maximum
        age. Carry your licence and, where required, an International Driving Permit — an unofficial
        &ldquo;translation&rdquo; sold online is not a substitute. Check whether your home licence is accepted
        for the class of car you are hiring.
      </p>

      <h2>Cross-border travel, tolls and cities</h2>
      <p>
        Not every rental agreement allows you to cross a border, and those that do often charge a fee or restrict
        which countries are permitted. Tell the company your route in advance, or you may find the cover void if
        something happens abroad. If your trip includes toll roads or low-emission city zones, ask whether the
        car is registered for them — otherwise you risk a fine that arrives weeks after you get home.
      </p>

      <h2>Booking checklist</h2>
      <ol>
        <li>Compare the total price, not the daily rate.</li>
        <li>Confirm the excess and decide how to cover it.</li>
        <li>Check the fuel policy and mileage allowance.</li>
        <li>List every driver and check age limits.</li>
        <li>Confirm cross-border and toll rules for your route.</li>
        <li>Photograph the car inside and out before you drive away.</li>
        <li>Keep the return receipt and final inspection record.</li>
      </ol>
      <p>
        Once the car is sorted, make sure the rest of the trip is covered: pair this with{' '}
        <Link href="/resources/travel-insurance">travel insurance</Link>, pick up a{' '}
        <Link href="/resources/esim">travel eSIM</Link> for navigation, and browse our{' '}
        <Link href="/destinations">destination guides</Link> for scenic routes worth the drive. Our{' '}
        <Link href="/travel-gear">travel gear</Link> section has the practical kit — mounts, cables and coolers —
        that makes a road trip easier.
      </p>
    </div>
  );
}
