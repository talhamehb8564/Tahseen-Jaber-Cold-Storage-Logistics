"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Orbit, Snowflake } from "lucide-react";

import { ProvenanceBadge } from "@/components/ui/provenance-badge";

const ColdChamber = dynamic(() => import("./cold-chamber"), {
  ssr: false,
  loading: () => <ChamberSkeleton />,
});

function ChamberSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-hull-line/70 bg-midnight/60 px-5 py-2.5 backdrop-blur-md">
        <span className="size-2 animate-pulse rounded-full bg-glow shadow-[0_0_12px_rgba(143,123,255,0.9)]" />
        <span className="font-mono text-[0.625rem] tracking-[0.22em] text-silver uppercase">
          Calibrating chamber…
        </span>
      </div>
    </div>
  );
}

/**
 * THREE CHAMBER SECTION — the illustrative 3D experience.
 * ---------------------------------------------------------------------------
 * The WebGL canvas only mounts while the section is near the viewport, and
 * never at all for reduced-motion visitors (§37) or browsers without WebGL —
 * they get an honest frost poster instead. The model is clearly labelled
 * illustrative (§40): it is a stylised chamber, not a facility feed.
 */
export function ThreeChamberSection() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(false);
  const [poster, setPoster] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPoster(true);
      return;
    }
    try {
      const probe = document.createElement("canvas");
      if (!(probe.getContext("webgl2") ?? probe.getContext("webgl"))) {
        setPoster(true);
      }
    } catch {
      setPoster(true);
    }
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || poster) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setNear(entry.isIntersecting);
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [poster]);

  return (
    <section id="chamber-3d" aria-labelledby="chamber-3d-title" className="relative z-10 py-24 sm:py-28">
      <div className="mx-auto w-full max-w-[86rem] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="tj-eyebrow">3D Experience</p>
            <h2
              id="chamber-3d-title"
              className="mt-4 font-display text-3xl font-bold uppercase tracking-tight text-frost sm:text-4xl lg:text-5xl"
            >
              Step inside{" "}
              <span className="tj-frost-text">the chamber</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-silver md:text-[0.9375rem]">
              An illustrative three-dimensional model of a racked cold chamber,
              rendered live in your browser — drag to orbit the aisle, or let it
              turn on its own.
            </p>
          </div>
          <ProvenanceBadge simulated compact />
        </div>

        <div
          ref={hostRef}
          className="glass-strong relative mt-12 h-[62vh] min-h-[420px] overflow-hidden rounded-3xl border border-hull-line/70"
        >
          {poster ? (
            <>
              <Image
                src="/assets/ice-crystal-macro.jpg"
                alt="Macro photograph of ice crystals glowing in azure and violet light."
                fill
                sizes="(min-width: 1024px) 86rem, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,7,29,0.9),transparent_60%)]"
              />
              <p className="absolute inset-x-0 bottom-0 p-6 text-center font-mono text-[0.625rem] tracking-[0.22em] text-silver uppercase">
                Static view — the interactive 3D chamber needs WebGL and motion enabled
              </p>
            </>
          ) : near ? (
            <ColdChamber />
          ) : (
            <ChamberSkeleton />
          )}

          {/* HUD chrome */}
          <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-2 sm:left-6 sm:top-6">
            <span className="glass flex items-center gap-2 rounded-full border border-hull-line/70 px-4 py-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-glow shadow-[0_0_10px_rgba(143,123,255,0.9)]" />
              <span className="font-mono text-[0.5625rem] tracking-[0.2em] text-silver uppercase">
                Auto-orbit active
              </span>
            </span>
            <span className="glass flex items-center gap-2 rounded-full border border-hull-line/70 px-4 py-1.5">
              <Orbit className="size-3 text-ice" aria-hidden />
              <span className="font-mono text-[0.5625rem] tracking-[0.2em] text-silver uppercase">
                Drag to look around
              </span>
            </span>
          </div>
          <div className="pointer-events-none absolute bottom-4 right-4 z-10 flex items-center gap-2 sm:bottom-6 sm:right-6">
            <Snowflake className="size-3 text-ice" aria-hidden />
            <span className="font-mono text-[0.5625rem] tracking-[0.2em] text-silver-dim uppercase">
              Illustrative model — not a live feed
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
