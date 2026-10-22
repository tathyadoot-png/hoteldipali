import type { Metadata } from "next";

import { Botanical } from "@/components/decor/Botanical";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { Picture } from "@/components/media/Picture";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { CallLink } from "@/components/links/CallLink";
import { WhatsAppLink } from "@/components/links/WhatsAppLink";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { getMenu, getOutlet, getOutlets, type Outlet } from "@/content";

export const metadata: Metadata = {
  title: "Dining | Hotel Dipali, Sagar",
  description:
    "The Hotel Dipali table in Sagar — a multi-cuisine restaurant, poolside dining, Dipali Bakery and Sweets, and the Infinity Bar for the evening.",
};

export default async function DiningPage() {
  const outlets = await getOutlets();

  const restaurant = await getOutlet("restaurant");
  const bakery = await getOutlet("bakery");
  const sweets = await getOutlet("sweets");
  const poolside = await getOutlet("poolside-restaurant");
  const bar = await getOutlet("infinity-bar");

  // Menu preview is content-driven and only shown when the outlet declares a
  // menu. Every sample price has showOnSite:false, so no price is ever rendered.
  const menu = restaurant?.hasMenu ? await getMenu("restaurant") : null;
  const menuSections = menu?.sections.map((s) => s.name) ?? [];
  const signatures =
    menu?.sections.flatMap((s) => s.items.filter((i) => i.signature)).slice(0, 4) ?? [];

  const heroImage = restaurant?.images[0];

  return (
    <>
      {/* ───────────────────────── HERO (Light) ─────────────────────────
          Warm, sensory opening — the dining family as one experience. */}
      <section
        className="paper-grain bg-surface pt-10 pb-16 md:pb-20"
        aria-labelledby="dining-title"
      >
        <div className="container-site relative">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Dining" }]} />

          <div className="mt-10 grid items-center gap-x-12 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow">Restaurant · Bakery · Bar</p>
              <h1 id="dining-title" className="heading-page mt-5">
                The Dipali <em>table</em>
              </h1>
              <p className="body-lg mt-6 text-ink-muted">
                Five places to eat, drink and gather — a multi-cuisine restaurant,
                relaxed poolside plates, the bakery and sweets counters, and the Infinity
                Bar for the evening.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <a href="#enquire" className="btn-primary">
                  Ask about dining
                </a>
                <WhatsAppLink context="dining" className="btn-ghost" />
              </div>
            </div>

            {heroImage ? (
              <div className="img-hover lg:col-span-7">
                <Picture
                  image={heroImage}
                  ratio="3:2"
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  priority
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ──────────────────── THE MENU OF PLACES (surface-alt) ────────────────────
          Signature device: a menu-style contents list of the whole family, each
          row an anchor to that outlet's section below. */}
      <section className="bg-surface-alt py-16 md:py-20" aria-labelledby="dining-index">
        <div className="container-site">
          <ScrollReveal>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="dining-index" className="heading-2">
                The menu of places
              </h2>
              <p className="caption">Five ways to spend an hour at Dipali</p>
            </div>

            <ul className="mt-10 divide-y divide-line border-y border-line">
              {outlets.map((outlet) => (
                <li key={outlet.slug}>
                  <a
                    href={`#${outlet.slug}`}
                    className="group flex flex-col gap-1 py-5 md:flex-row md:items-baseline md:justify-between md:gap-8"
                  >
                    <span className="heading-3 group-hover:text-accent">{outlet.name}</span>
                    <span className="caption not-italic text-ink-muted">
                      {outlet.cuisine.join(" · ")}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* ──────────────────── DIPALI RESTAURANT (Light) ────────────────────
          The primary dining experience, with a content-driven menu preview. */}
      {restaurant ? (
        <section
          id="restaurant"
          className="scroll-mt-24 bg-surface py-16 md:py-20"
          aria-labelledby="dining-restaurant"
        >
          <div className="container-site">
            <ScrollReveal>
              <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  {restaurant.images[0] ? (
                    <div className="img-hover">
                      <Picture
                        image={restaurant.images[0]}
                        ratio="3:2"
                        sizes="(min-width: 1024px) 58vw, 100vw"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="lg:col-span-5">
                  <p className="eyebrow">The main table · {restaurant.cuisine.join(" · ")}</p>
                  <h2 id="dining-restaurant" className="heading-1 mt-4">
                    {restaurant.name}
                  </h2>
                  <p className="body-lg mt-5 text-ink-muted">{restaurant.summary}</p>

                  {menuSections.length > 0 ? (
                    <div className="mt-8">
                      <h3 className="eyebrow">On the menu</h3>
                      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                        {menuSections.map((name) => (
                          <li key={name} className="body text-ink-muted">
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {signatures.length > 0 ? (
                    <div className="mt-8">
                      <h3 className="eyebrow">A few signatures</h3>
                      <ul className="mt-4 divide-y divide-line border-y border-line">
                        {signatures.map((item) => (
                          <li key={item.name} className="py-3">
                            <p className="body font-medium">{item.name}</p>
                            {item.description ? (
                              <p className="body text-ink-muted">{item.description}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <a href="#enquire" className="link mt-7 inline-block">
                    Ask about dining
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      ) : null}

      {/* ──────────────────── THE COUNTERS: Bakery + Sweets (surface-alt) ──────────────────── */}
      {(bakery || sweets) ? (
        <section className="bg-surface-alt py-16 md:py-20" aria-labelledby="dining-counters">
          <div className="container-site">
            <ScrollReveal>
              <h2 id="dining-counters" className="heading-2">
                The Dipali counters
              </h2>
              <p className="body-lg mt-4 max-w-xl text-ink-muted">
                Two names from the Hotel Dipali family — for something to carry home or to
                mark an occasion.
              </p>

              <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2">
                {[bakery, sweets].filter((o): o is Outlet => Boolean(o)).map((outlet) => (
                  <div key={outlet.slug} id={outlet.slug} className="scroll-mt-24">
                    {outlet.images[0] ? (
                      <div className="img-hover">
                        <Picture
                          image={outlet.images[0]}
                          ratio="4:3"
                          sizes="(min-width: 768px) 44vw, 100vw"
                        />
                      </div>
                    ) : null}
                    <p className="eyebrow mt-5">{outlet.cuisine.join(" · ")}</p>
                    <h3 className="heading-2 mt-2">{outlet.name}</h3>
                    <p className="body mt-3 text-ink-muted">{outlet.summary}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      ) : null}

      {/* ──────────────────── BY THE WATER: Poolside (Light) ──────────────────── */}
      {poolside ? (
        <section
          id="poolside-restaurant"
          className="scroll-mt-24 bg-surface py-16 md:py-20"
          aria-labelledby="dining-poolside"
        >
          <div className="container-site">
            <ScrollReveal>
              <div className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <p className="eyebrow">By the water · {poolside.cuisine.join(" · ")}</p>
                  <h2 id="dining-poolside" className="heading-1 mt-4">
                    {poolside.name}
                  </h2>
                  <p className="body-lg mt-5 text-ink-muted">{poolside.summary}</p>
                  <Botanical variant="sprig" className="mt-7 h-12 text-highlight" />
                </div>
                {poolside.images[0] ? (
                  <div className="img-hover lg:col-span-7">
                    <Picture
                      image={poolside.images[0]}
                      ratio="3:2"
                      sizes="(min-width: 1024px) 58vw, 100vw"
                    />
                  </div>
                ) : null}
              </div>
            </ScrollReveal>
          </div>
        </section>
      ) : null}

      {/* ──────────────────── AFTER DARK: Infinity Bar (Peacock) ────────────────────
          The evening moment — the page darkens here. No invented drinks,
          brands, hours or age-policy claims. */}
      {bar ? (
        <section
          id="infinity-bar"
          data-theme="peacock"
          className="scroll-mt-24 bg-surface py-16 text-ink md:py-20"
          aria-labelledby="dining-bar"
        >
          <div className="container-site">
            <ScrollReveal>
              <div className="grid items-center gap-x-12 gap-y-10 lg:grid-cols-12">
                {bar.images[0] ? (
                  <div className="img-hover lg:col-span-7">
                    <Picture
                      image={bar.images[0]}
                      ratio="3:2"
                      sizes="(min-width: 1024px) 58vw, 100vw"
                    />
                  </div>
                ) : null}
                <div className="lg:col-span-5">
                  <p className="eyebrow">After dark · {bar.cuisine.join(" · ")}</p>
                  <h2 id="dining-bar" className="heading-1 mt-4">
                    {bar.name}
                  </h2>
                  <p className="body-lg mt-5 text-ink-muted">{bar.summary}</p>
                  <Botanical variant="vine" className="mt-7 w-36 text-highlight" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      ) : null}

      {/* ───────────────────── ENQUIRY (Peacock) ───────────────────── */}
      <section
        id="enquire"
        data-theme="peacock"
        className="paper-grain scroll-mt-24 bg-surface-alt py-16 text-ink md:py-20"
        aria-labelledby="dining-enquire"
      >
        <div className="container-site relative">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 id="dining-enquire" className="heading-1">
                Ask about <em>dining</em>
              </h2>
              <p className="body-lg mt-6 text-ink-muted">
                Planning a meal, a celebration cake or a gathering with us? Send a note
                and we will help you sort the details.
              </p>
              <div className="mt-8 flex flex-col items-start gap-3">
                <CallLink className="link" />
                <WhatsAppLink context="dining" className="link" />
              </div>
            </div>

            <div className="lg:col-span-7">
              <EnquiryForm
                enquiryTypes={["dining"]}
                defaultEnquiryType="dining"
                idPrefix="dining"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
