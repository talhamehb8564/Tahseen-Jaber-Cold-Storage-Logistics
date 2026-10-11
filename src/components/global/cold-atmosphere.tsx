import { cn } from "@/lib/utilities/cn";

/**
 * COLD ATMOSPHERE (§09)
 * ---------------------------------------------------------------------------
 * The permanent background of the whole product: a deep navy environment, two
 * very slow mist layers, a faint technical grid, light spill from above and a
 * frost grain.
 *
 * Deliberately built from CSS only — no canvas, no particle system, no per-frame
 * JavaScript. §09 asks for subtlety and §35 asks for efficiency; a fixed,
 * compositor-animated gradient stack delivers both and costs nothing on the main
 * thread. Particle density is intentionally near zero.
 *
 * Motion is 44s / 78s. It should be felt as a change in the room, not seen as an
 * animation. `prefers-reduced-motion` removes it entirely via globals.css.
 */
export function ColdAtmosphere({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-midnight",
        className,
      )}
    >
      {/* --- Base depth: cold light from above, darkness below --------------- */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(140% 90% at 50% -12%, #12224a 0%, #0b132b 42%, #030712 78%)",
        }}
      />

      {/* --- Structural grid, masked so it dissolves toward the edges -------- */}
      <div
        className="tj-grid absolute inset-0 opacity-[0.55]"
        style={{
          maskImage:
            "radial-gradient(115% 80% at 50% 8%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.28) 45%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(115% 80% at 50% 8%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.28) 45%, transparent 78%)",
        }}
      />

      {/* --- Light rays from the facility roof ------------------------------- */}
      <div
        className="absolute -top-1/3 left-1/2 h-[85vh] w-[130vw] -translate-x-1/2 opacity-[0.16] blur-3xl"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 0%, transparent 0deg, rgba(72,202,228,0.5) 78deg, transparent 96deg, transparent 264deg, rgba(0,245,212,0.42) 282deg, transparent 300deg)",
        }}
      />

      {/* --- Mist layer 1: broad, extremely slow ----------------------------- */}
      <div className="absolute inset-x-[-30%] bottom-[-8%] h-[52vh] animate-mist-drift-slow opacity-[0.5]">
        <div
          className="h-full w-full blur-[70px]"
          style={{
            background:
              "radial-gradient(45% 60% at 22% 70%, rgba(72,202,228,0.16), transparent 70%)," +
              "radial-gradient(38% 55% at 62% 82%, rgba(0,245,212,0.13), transparent 72%)," +
              "radial-gradient(50% 60% at 88% 66%, rgba(148,163,184,0.10), transparent 70%)",
          }}
        />
      </div>

      {/* --- Mist layer 2: tighter, drifting the other way ------------------- */}
      <div className="absolute inset-x-[-25%] bottom-[6%] h-[36vh] animate-mist-drift opacity-[0.42]">
        <div
          className="h-full w-full blur-[54px]"
          style={{
            background:
              "radial-gradient(34% 70% at 34% 60%, rgba(234,252,255,0.10), transparent 72%)," +
              "radial-gradient(28% 60% at 74% 74%, rgba(72,202,228,0.11), transparent 74%)",
          }}
        />
      </div>

      {/* --- High-altitude frost haze ---------------------------------------- */}
      <div
        className="absolute inset-x-0 top-0 h-[38vh] animate-breathe opacity-40 blur-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(72,202,228,0.09), rgba(15,27,56,0.05) 55%, transparent)",
        }}
      />

      {/* --- Frost grain: breaks up banding on the gradients ------------------ */}
      <div className="frost-grain absolute inset-0 opacity-[0.22]" />

      {/* --- Vignette: focuses the eye toward the centre of the stage --------- */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 45%, transparent 42%, rgba(3,7,18,0.55) 82%, rgba(3,7,18,0.9) 100%)",
        }}
      />
    </div>
  );
}

/**
 * Localised cold pool — used inside sections that need their own atmosphere
 * (final CTA, hero, facility) without touching the global layer.
 */
export function ColdPool({
  className,
  intensity = 0.5,
  hue = "ice",
}: {
  className?: string;
  intensity?: number;
  hue?: "ice" | "cyan" | "frost" | "green";
}) {
  const colours = {
    ice: "72, 202, 228",
    cyan: "0, 245, 212",
    frost: "234, 252, 255",
    green: "34, 197, 94",
  } as const;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ opacity: intensity }}
    >
      <div
        className="absolute inset-0 blur-[90px]"
        style={{
          background: `radial-gradient(58% 52% at 50% 42%, rgba(${colours[hue]},0.16), transparent 72%)`,
        }}
      />
    </div>
  );
}
