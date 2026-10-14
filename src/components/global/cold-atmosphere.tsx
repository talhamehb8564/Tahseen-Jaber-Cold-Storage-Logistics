/**
 * ColdAtmosphere — the quiet light behind every route.
 * ---------------------------------------------------------------------------
 * Light theme: a white sky with the faintest cool gradient depth, a whisper
 * of copper warmth at the horizon and an almost-invisible vignette. It is the
 * "cold room seen in daylight" — nothing competes with the content on top of
 * it, but the page never reads as a flat white rectangle.
 *
 * Pure CSS (no JS): the drifting washes animate on long loops and are killed
 * entirely under prefers-reduced-motion by the global rule (§37).
 */

export function ColdAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-midnight"
    >
      {/* Sky: near-white with a cool falloff toward the floor. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(140% 90% at 50% -12%, #ffffff 0%, #fbfcfe 42%, #f5f7fa 78%)",
        }}
      />

      {/* A whisper of copper at the horizon — the warm edge of a cold room. */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(90% 55% at 50% 118%, rgba(182, 106, 60, 0.05), transparent 70%)",
        }}
      />

      {/* Two slow drifting washes — navy cool and copper warm, barely there. */}
      <div
        className="absolute -left-[12%] top-[-18%] h-[60vh] w-[55vw] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(15, 41, 77, 0.045), transparent 70%)",
          animation: "mist-drift 64s linear infinite",
        }}
      />
      <div
        className="absolute -right-[14%] top-[8%] h-[52vh] w-[48vw] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(182, 106, 60, 0.035), transparent 70%)",
          animation: "mist-drift 88s linear infinite reverse",
        }}
      />

      {/* Vignette — a hair of navy at the extreme edges only. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 45%, transparent 72%, rgba(15, 41, 77, 0.05) 100%)",
        }}
      />
    </div>
  );
}

/**
 * ColdPool — a localised atmospheric wash for hero/CTA bands.
 * Light theme: a cool navy breath from above with a hint of copper at the
 * base. `intensity` is 0–1; `hue` selects a cool ("ice"/"cyan") or warm
 * ("violet"/"copper") cast. Purely decorative, aria-hidden, CSS-only.
 */
export function ColdPool({
  intensity = 0.5,
  hue = "ice",
  className,
}: {
  intensity?: number;
  hue?: "ice" | "cyan" | "violet" | "copper";
  className?: string;
}) {
  const a = Math.min(1, Math.max(0, intensity));
  const warm = hue === "violet" || hue === "copper";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: warm
            ? `radial-gradient(85% 70% at 50% 30%, rgba(182, 106, 60, ${(0.1 * a).toFixed(3)}), transparent 70%)`
            : `radial-gradient(85% 70% at 50% 30%, rgba(15, 41, 77, ${(0.06 * a).toFixed(3)}), transparent 70%), radial-gradient(60% 50% at 50% 104%, rgba(182, 106, 60, ${(0.06 * a).toFixed(3)}), transparent 72%)`,
        }}
      />
    </div>
  );
}
