"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { MoveRight } from "lucide-react";

import { getGsap } from "@/animations/gsap";

/**
 * HORIZONTAL GALLERY — "Inside the facility".
 * ---------------------------------------------------------------------------
 * On desktop the section pins to the viewport and the dock slides sideways as
 * you scroll vertically (GSAP ScrollTrigger, scrubbed), with each photograph
 * drifting against its own frame (containerAnimation parallax) for depth.
 *
 * On small screens (§34) and for reduced-motion visitors (§37) the same panel
 * row becomes a native, snap-pointed horizontal scroller — nothing is pinned,
 * nothing is hidden, and keyboard/touch behave exactly as the platform
 * expects.
 */

type Panel = {
  src: string;
  alt: string;
  index: string;
  title: string;
  line: string;
};

const PANELS: Panel[] = [
  {
    src: "/assets/facility-exterior-night.jpg",
    alt: "The facility exterior at night: a row of illuminated dock doors with refrigerated trucks backed in.",
    index: "01",
    title: "The Gate",
    line: "Dock row under indigo night",
  },
  {
    src: "/assets/dock-receiving-crew.jpg",
    alt: "Workers in freezer jackets guiding a pallet of sealed cartons into a lit dock doorway.",
    index: "02",
    title: "Receiving",
    line: "Pallets cross the threshold",
  },
  {
    src: "/assets/warehouse-hero-interior.jpg",
    alt: "Tall racking aisles inside the cold store, vapour hanging in the air.",
    index: "03",
    title: "The Chamber",
    line: "Aisles of held breath",
  },
  {
    src: "/assets/frozen-pallets-frost.jpg",
    alt: "Pallets of sealed frozen goods furred with frost inside the deep-freeze aisle.",
    index: "04",
    title: "Deep Freeze",
    line: "Frost-locked and waiting",
  },
  {
    src: "/assets/automated-racking.jpg",
    alt: "High-bay racking aisle lit in frost blue with floor-level fog.",
    index: "05",
    title: "High-Bay",
    line: "Racking to the ceiling",
  },
  {
    src: "/assets/control-room-ops.jpg",
    alt: "The monitoring control room, screens glowing with zone temperatures.",
    index: "06",
    title: "Watchtower",
    line: "Every zone, every degree",
  },
  {
    src: "/assets/truck-refrigerated-dock.jpg",
    alt: "A refrigerated trailer sealed against a dock bay, mist spilling from the doorway.",
    index: "07",
    title: "Dispatch",
    line: "Reefers at the bay doors",
  },
  {
    src: "/assets/reefer-truck-highway.jpg",
    alt: "A refrigerated truck running an empty highway at dusk, marker lights glowing.",
    index: "08",
    title: "The Road",
    line: "The cold chain in motion",
  },
];

export function HorizontalGallery() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const { gsap } = getGsap();
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressRef.current) {
              progressRef.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
            }
          },
        },
      });

      /* Each photograph drifts inside its own frame as it travels — the
         containerAnimation trick that gives pinned galleries their depth. */
      const drifts = Array.from(track.querySelectorAll<HTMLElement>("[data-panel-img]")).map(
        (img) => {
          const panel = img.closest("[data-panel]") as HTMLElement;
          return gsap.fromTo(
            img,
            { xPercent: -6 },
            {
              xPercent: 6,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                containerAnimation: tween,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            },
          );
        },
      );

      return () => {
        for (const drift of drifts) {
          drift.scrollTrigger?.kill();
          drift.kill();
        }
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="gallery" aria-labelledby="gallery-title" className="relative z-10">
      <div className="mx-auto flex w-full max-w-[86rem] flex-col justify-center gap-8 px-5 py-20 sm:px-8 md:h-[100svh] md:min-h-[620px] md:py-0 lg:px-12">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="tj-eyebrow">Inside the facility</p>
            <h2
              id="gallery-title"
              className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-frost sm:text-3xl lg:text-4xl"
            >
              Eight frames <span className="tj-frost-text">from the cold chain</span>
            </h2>
          </div>
          <p className="font-mono text-[0.5625rem] tracking-[0.18em] text-silver-dim uppercase">
            Keep scrolling — the dock slides sideways
          </p>
        </div>

        {/* track */}
        <div className="overflow-x-auto pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:motion-safe:overflow-visible md:motion-safe:pb-0">
          <div ref={trackRef} className="flex w-max items-stretch gap-5 md:gap-8">
            {/* intro card */}
            <div className="flex h-[52vh] min-h-[340px] w-[70vw] shrink-0 snap-center flex-col justify-between rounded-2xl border border-hull-line/60 bg-navy/30 p-6 backdrop-blur-sm md:h-[58vh] md:w-[32vw] md:p-9">
              <p className="font-mono text-[0.5625rem] tracking-[0.24em] text-ice uppercase">
                Facility gallery
              </p>
              <div>
                <p className="font-display text-2xl font-bold uppercase tracking-tight text-frost md:text-3xl">
                  From the gate
                  <br />
                  to the road
                </p>
                <p className="mt-4 max-w-xs text-[0.8125rem] leading-relaxed text-silver">
                  The same journey the cold chain timeline describes — here as
                  light, frost and steel.
                </p>
                <MoveRight className="mt-6 size-6 text-ice" aria-hidden />
              </div>
              <p className="font-mono text-[0.5rem] leading-relaxed tracking-[0.14em] text-silver-dim uppercase">
                Illustrative visuals — site photography to be confirmed
              </p>
            </div>

            {PANELS.map((panel) => (
              <figure
                key={panel.src}
                data-panel
                className="tj-panel-shine group relative h-[52vh] min-h-[340px] w-[78vw] shrink-0 snap-center overflow-hidden rounded-2xl border border-hull-line/60 md:h-[58vh] md:w-[52vw] lg:w-[42vw]"
              >
                <div className="absolute inset-0 overflow-hidden">
                  <Image
                    src={panel.src}
                    alt={panel.alt}
                    fill
                    sizes="(min-width: 1024px) 42vw, (min-width: 768px) 52vw, 78vw"
                    className="scale-[1.16] object-cover"
                    data-panel-img
                  />
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.88),transparent_55%)]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
                  <div>
                    <p className="font-mono text-[0.5625rem] tracking-[0.24em] text-ice uppercase">
                      {panel.index} / 08
                    </p>
                    <p className="mt-1.5 font-display text-lg font-bold uppercase tracking-tight text-frost md:text-xl">
                      {panel.title}
                    </p>
                    <p className="mt-1 text-[0.75rem] text-silver">{panel.line}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* progress rail (desktop, animated only) */}
        <div className="hidden h-px w-full bg-hull-line/60 md:motion-safe:block">
          <div
            ref={progressRef}
            className="h-full origin-left scale-x-0 bg-gradient-to-r from-ice to-glow"
          />
        </div>
      </div>
    </section>
  );
}
