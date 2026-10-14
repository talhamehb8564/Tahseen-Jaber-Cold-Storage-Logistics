import type { Metadata } from "next";
import Image from "next/image";

import { HeroSpec, PageHero } from "@/components/layout/page-hero";
import { ProductVault } from "@/components/products/product-vault";
import { CatalogIcon } from "@/components/ui/catalog-icon";
import { Section } from "@/components/ui/section";
import { FinalCta } from "@/components/cta/final-cta";
import { ShowcaseCarousel } from "@/components/gallery/showcase-carousel";
import { productCategories } from "@/lib/catalog";
import { FALLBACK, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Temperature-controlled storage for produce, meat and poultry, seafood and pharmaceuticals — each held in conditions suited to it and recorded against its own batch reference.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "Products — Tahseen Jaber Cold Storage & Logistics",
    description:
      "Produce, meat and poultry, seafood and pharmaceuticals, each in conditions suited to it.",
    url: `${siteConfig.seo.url}/products`,
    type: "website",
  },
};

/**
 * /products (§19, §20)
 * ---------------------------------------------------------------------------
 * The interactive vault first, then the full detail for each category so a
 * visitor who arrives from search can read the whole picture without hovering
 * anything.
 *
 * §19 — pharmaceuticals carry the compliance guard verbatim from the catalog and
 * no medical-grade or regulatory claim is made anywhere on this page.
 * §45 — temperatures print the configured fallback, never an invented range.
 */
export default function ProductsPage() {
  return (
    <>
      <PageHero
        eyebrow="Products"
        title={
          <>
            Four categories,
            <br />
            <span className="tj-frost-text">held differently</span>
          </>
        }
        lede="Produce loses quality to warmth and to dry air. Protein needs sub-zero holding and survives freeze-thaw badly. Seafood is the least forgiving of all. Pharmaceuticals need a restricted, monitored, documented space. Each is handled to suit it rather than to a single rule."
        crumbs={[{ label: "Products", href: "/products" }]}
        aside={
          <HeroSpec
            title="Handled"
            items={productCategories.map((category) => ({
              label: category.name,
              value: FALLBACK.temperature,
            }))}
          />
        }
      />

      <ProductVault />

      {/* ---------------- The environments, up close ---------------- */}
      <Section
        id="environments"
        index="04"
        eyebrow="The environments"
        heading={
          <>
            Up close,
            <span className="tj-frost-text"> under cold light</span>
          </>
        }
        lede="The four held conditions as they read inside the chambers. Illustrative visuals — chamber assignment is always per client agreement."
        width="wide"
        rule
      >
        <ShowcaseCarousel
          label="Storage environments"
          slides={[
            {
              src: "/assets/produce-cold-room.jpg",
              alt: "Fresh produce crates stacked in a chilled room under azure strip lighting.",
              tag: "Chilled",
              title: "Produce",
              caption: "Crisp air, stable humidity, and a room that never warms up on the way in.",
            },
            {
              src: "/assets/sealed-frozen-cartons.jpg",
              alt: "Sealed frozen cartons stacked on a pallet, furred with frost.",
              tag: "Deep-frozen",
              title: "Meat & poultry",
              caption: "Sealed, sub-zero and unmoved — protein survives freeze-thaw badly, so it never thaws.",
            },
            {
              src: "/assets/seafood-frozen-storage.jpg",
              alt: "Sealed frozen seafood boxes with frost crystals on a cold store pallet.",
              tag: "Least forgiving",
              title: "Seafood",
              caption: "The category that sets the standard for every other one in the building.",
            },
            {
              src: "/assets/pharma-cold-room.jpg",
              alt: "A pharmaceutical cold room with stainless shelving and glowing temperature sensors.",
              tag: "Restricted",
              title: "Pharmaceuticals",
              caption: "A monitored, access-controlled space with a record for every movement.",
            },
          ]}
        />
      </Section>

      {/* ---------------- Full detail per category ---------------- */}
      <Section
        id="detail"
        index="05"
        eyebrow="Category detail"
        heading={
          <>
            What each one
            <span className="tj-frost-text"> needs</span>
          </>
        }
        lede="The handling characteristics that decide how a category is stored, and what is recorded against it."
        width="wide"
        rule
      >
        <div className="space-y-4">
          {productCategories.map((category, index) => (
            <article
              key={category.id}
              id={category.id}
              className="tj-panel tj-corners scroll-mt-32 overflow-hidden rounded-[2px]"
            >
              <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-12">
                {/* --- Identity --- */}
                <div>
                  <div className="flex items-start gap-4">
                    <span
                      className="flex size-12 shrink-0 items-center justify-center rounded-[2px] border"
                      style={{
                        borderColor: `${category.accent}55`,
                        backgroundColor: `${category.accent}12`,
                        color: category.accent,
                      }}
                    >
                      <CatalogIcon name={category.icon} size={22} strokeWidth={1.4} />
                    </span>
                    <div className="min-w-0">
                      <p className="tabular font-mono text-[0.5625rem] tracking-[0.2em] text-silver-dim uppercase">
                        {String(index + 1).padStart(2, "0")} / {productCategories.length}
                      </p>
                      <h3 className="mt-1.5 font-display text-xl font-bold tracking-[-0.015em] text-frost uppercase sm:text-2xl">
                        {category.name}
                      </h3>
                    </div>
                  </div>

                  <p
                    className="mt-5 font-mono text-[0.625rem] tracking-[0.18em] uppercase"
                    style={{ color: category.accent }}
                  >
                    {category.environment}
                  </p>

                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-silver">
                    {category.summary}
                  </p>

                  <dl className="mt-6 divide-y divide-hull-line/60 border-y border-hull-line/60">
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="tj-label">Temperature</dt>
                      <dd
                        className="font-mono text-[0.6875rem] tracking-[0.1em] uppercase"
                        style={{ color: category.accent }}
                      >
                        {category.temperatureLabel}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="tj-label">Recorded against</dt>
                      <dd className="font-mono text-[0.6875rem] tracking-[0.1em] text-frost uppercase">
                        Batch reference
                      </dd>
                    </div>
                  </dl>

                  {/* Illustrative chamber imagery (§45). */}
                  <figure className="relative mt-6 h-44 overflow-hidden rounded-[2px] border border-hull-line/60">
                    <Image
                      src={category.image}
                      alt={`${category.name} storage environment, illustrative.`}
                      fill
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      className="scale-[1.15] object-cover"
                      data-parallax="0.25"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.55),transparent_60%)]"
                    />
                    <figcaption className="absolute bottom-3 left-3 font-mono text-[0.5rem] tracking-[0.18em] text-silver uppercase">
                      Illustrative visual
                    </figcaption>
                  </figure>
                </div>

                {/* --- Handling --- */}
                <div>
                  <p className="tj-label">Handling characteristics</p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {category.handling.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 rounded-[2px] border border-hull-line/70 bg-midnight/40 p-3.5 text-[0.8125rem] leading-snug text-silver"
                      >
                        <span
                          aria-hidden
                          className="mt-[0.4rem] size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: category.accent }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* §19 — the compliance guard, verbatim. */}
                  {category.complianceNote ? (
                    <p className="mt-5 border-l-2 border-caution/45 bg-caution/[0.06] py-3 pl-4 pr-4 font-mono text-[0.5625rem] leading-relaxed tracking-[0.06em] text-caution/90 normal-case">
                      {category.complianceNote}
                    </p>
                  ) : null}

                  <p className="mt-5 font-mono text-[0.5625rem] leading-relaxed tracking-[0.08em] text-silver-dim/75 uppercase">
                    Conditions are configured per client agreement. Approved
                    temperature ranges for this facility are pending confirmation.
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
