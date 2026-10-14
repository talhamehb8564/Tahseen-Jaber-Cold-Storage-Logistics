"use client";

import { useCallback, useEffect, useRef } from "react";

import { registerGsap, type GsapTimeline } from "@/animations/gsap";
import { ReeferTruck } from "@/components/hero/reefer-truck";
import { temperatureShift } from "@/animations/variants";
import { useReducedMotion } from "@/hooks";

/**
 * HERO STAGE — "COLD CHAIN ARRIVAL" (§10, §11)
 * ---------------------------------------------------------------------------
 * The cinematic centrepiece. A single SVG stage holds the yard, the facility
 * facade, the loading bay, the chamber door, the mist and the truck; a GSAP
 * timeline drives the seven scenes in §11 and reports the active phase upward so
 * the HUD, typography and CTAs can enter at the right moment.
 *
 * GEOMETRY (viewBox 1600 × 900)
 *   yard ground line ........ y = 660
 *   dock / chamber floor .... y = 560   (the dock is raised above the yard)
 *   chamber doorway ......... x 1080–1400, y 250–560
 *   truck final position .... screen x 372–1000 (rear at x = 1000)
 *   so the doorway stays clear of the vehicle and the cold-light burst is fully
 *   visible — that reveal is the WOW moment and must never be occluded.
 *
 * WHY SVG AND NOT THREE.JS (§43, §35)
 *   A side-elevation industrial scene reads perfectly in 2D. SVG keeps the whole
 *   hero under ~40 KB with no runtime 3D cost, no extra dependency, crisp output
 *   at any DPR, and it stays legible to assistive tech via the labelled overlay.
 *   Three.js would add a large bundle and a WebGL context for no narrative gain.
 *
 * TEMPERATURE INTERACTION (§13)
 *   Dragging the controller writes CSS custom properties onto the stage root
 *   (--tj-frost / --tj-mist / --tj-light / --tj-wash). GSAP owns *opacity* of
 *   the reveal elements while temperature owns their *colour* and the density of
 *   separate overlay layers, so the two systems never fight over one property.
 */

export type HeroPhase =
  | "idle"
  | "darkness"
  | "atmosphere"
  | "arrival"
  | "docking"
  | "door"
  | "cargo"
  | "active";



interface HeroStageProps {
  temperature: number;
  phase: HeroPhase;
  onPhaseChange: (phase: HeroPhase) => void;
  /** Increments to request an immediate jump to the final state. */
  skipToken: number;
  /** True once the visitor has seen the sequence in this session. */
  alreadySeen: boolean;
  /**
   * False until the parent has read sessionStorage. The timeline is not built
   * until this flips, so "play" vs "already docked" is decided before the first
   * frame of animation — never restarted mid-sequence.
   */
  booted: boolean;
}

const SEEN_KEY = "tj-hero-sequence-seen";

export function HeroStage({
  temperature,
  phase,
  onPhaseChange,
  skipToken,
  alreadySeen,
  booted,
}: HeroStageProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<GsapTimeline | null>(null);
  const phaseRef = useRef<HeroPhase>(phase);
  const reduced = useReducedMotion();

  const look = temperatureShift(temperature);

  const emit = useCallback(
    (next: HeroPhase) => {
      if (phaseRef.current === next) return;
      phaseRef.current = next;
      onPhaseChange(next);
    },
    [onPhaseChange],
  );

  /* ---------------------------------------------------------------- build --- */
  useEffect(() => {
    // Wait until the parent knows whether to play the sequence or start docked.
    if (!booted) return;

    const gsap = registerGsap();
    const root = svgRef.current;
    if (!root) return;

    const select = (selector: string) => root.querySelector(selector);
    const selectAll = (selector: string): Element[] =>
      Array.from(root.querySelectorAll(selector));
    /** GSAP accepts Element[]; this narrows away the nulls type-safely. */
    const present = (...elements: (Element | null)[]): Element[] =>
      elements.filter((element): element is Element => element !== null);

    const truck = select("[data-truck]") as SVGGElement | null;
    const door = select("[data-door]") as SVGGElement | null;
    const chamberGlow = select("[data-chamber-glow]");
    const lightSpill = select("[data-light-spill]");
    const doorMist = select("[data-door-mist]");
    const floorMist = select("[data-floor-mist]");
    const bayLight = select("[data-bay-light]");
    const beaconLens = select("[data-beacon-lens]");
    const reverseLamp = select("[data-reverselamp]");
    const tailLamp = select("[data-taillamp]");
    const reeferLed = select("[data-reefer-led]");
    const ambient = select("[data-ambient]");
    const particles = select("[data-particles]");
    const hudLink = select("[data-hud-link]");
    const pallets = selectAll("[data-pallet]");
    const wheels = selectAll("[data-wheel]");

    // Mobile gets a shorter, simplified sequence (§34).
    const compact = window.matchMedia("(max-width: 767px)").matches;
    const k = reduced ? 0 : compact ? 0.72 : 1;

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => emit("active"),
    });
    timelineRef.current = tl;

    // Set every animated element to its opening state immediately, so there is
    // no flash of the finished scene before the timeline starts.
    gsap.set(present(chamberGlow, lightSpill, doorMist, bayLight, hudLink), {
      opacity: 0,
    });
    gsap.set(pallets, { opacity: 0, x: 0 });
    if (truck) gsap.set(truck, { x: -720 });
    if (floorMist) gsap.set(floorMist, { opacity: 0, x: -70 });
    if (ambient) gsap.set(ambient, { opacity: 0 });
    if (particles) gsap.set(particles, { opacity: 0 });

    /* ---- Scene 01 — DARKNESS ------------------------------------------ */
    tl.to(ambient, { opacity: 1, duration: 0.8 * k, ease: "power1.out" }, 0);
    tl.to(particles, { opacity: 0.85, duration: 1.4 * k, ease: "power1.out" }, 0.1 * k);
    tl.call(() => emit("darkness"), undefined, 0);

    /* ---- Scene 02 — ATMOSPHERE ---------------------------------------- */
    tl.to(
      floorMist,
      { opacity: 0.55, x: 0, duration: 1.5 * k, ease: "power1.inOut" },
      0.45 * k,
    );
    tl.call(() => emit("atmosphere"), undefined, 0.45 * k);

    /* ---- Scene 03 — TRUCK ARRIVAL ------------------------------------- */
    // The truck moves right with the cab at the left, i.e. reversing onto the
    // dock. Wheels therefore spin backwards and the beacon flashes.
    tl.call(() => emit("arrival"), undefined, 0.85 * k);
    tl.to(truck, { x: 380, duration: 2.9 * k, ease: "power2.inOut" }, 0.85 * k);
    tl.to(
      wheels,
      { rotation: -540, transformOrigin: "0px 0px", duration: 2.9 * k, ease: "power2.inOut" },
      0.85 * k,
    );
    tl.to(
      beaconLens,
      { opacity: 1, duration: 0.24 * k, repeat: 9, yoyo: true, ease: "power1.inOut" },
      0.85 * k,
    );
    tl.to(reverseLamp, { opacity: 0.95, duration: 0.3 * k }, 0.85 * k);

    /* ---- Scene 04 — DOCKING ------------------------------------------- */
    tl.call(() => emit("docking"), undefined, 3.35 * k);
    tl.to(bayLight, { opacity: 1, duration: 0.7 * k, ease: "power2.out" }, 3.3 * k);
    tl.to(reverseLamp, { opacity: 0.3, duration: 0.3 * k }, 3.6 * k);
    tl.to(beaconLens, { opacity: 0.35, duration: 0.4 * k }, 3.6 * k);
    tl.to(tailLamp, { opacity: 0.9, duration: 0.4 * k }, 3.4 * k);
    tl.to(reeferLed, { opacity: 1, duration: 0.5 * k }, 3.5 * k);

    /* ---- Scene 05 — COLD ROOM OPENS (the WOW moment) ------------------- */
    tl.call(() => emit("door"), undefined, 3.75 * k);
    tl.to(door, { y: -318, duration: 1.7 * k, ease: "power3.inOut" }, 3.8 * k);
    tl.to(chamberGlow, { opacity: 1, duration: 1.1 * k, ease: "power2.out" }, 3.95 * k);
    tl.to(lightSpill, { opacity: 1, duration: 1.6 * k, ease: "power2.out" }, 3.95 * k);
    tl.fromTo(
      doorMist,
      { opacity: 0, x: 60, scale: 0.88, transformOrigin: "80% 90%" },
      { opacity: 0.92, x: -170, scale: 1.3, duration: 2.8 * k, ease: "power1.out" },
      4.1 * k,
    );

    /* ---- Scene 06 — CARGO --------------------------------------------- */
    tl.call(() => emit("cargo"), undefined, 4.9 * k);
    // Each pallet travels to a different depth inside the chamber, read from its
    // own data attribute so the SVG stays the single source of truth for layout.
    tl.to(
      pallets,
      {
        opacity: 1,
        x: (_index, element) => Number((element as Element).getAttribute("data-travel") ?? 120),
        duration: 1.6 * k,
        ease: "power2.inOut",
        stagger: 0.17 * k,
      },
      4.95 * k,
    );
    tl.to(hudLink, { opacity: 1, duration: 1.0 * k, ease: "power1.out" }, 5.4 * k);

    /* ---- Scene 07 — FACILITY SYSTEM ACTIVATES -------------------------- */
    // onComplete raises the "active" phase, which brings in the HUD, the brand
    // reveal and the CTAs.

    // Returning visitors and reduced-motion users start at the finished state:
    // the facility is already open and docked, no waiting (§33, §35).
    if (reduced || alreadySeen) {
      tl.progress(1).pause();
      emit("active");
    } else {
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Private browsing — the sequence simply plays again next visit.
      }
    }

    return () => {
      tl.kill();
      timelineRef.current = null;
    };
    // `temperature` intentionally excluded: dragging the control must not
    // restart the cinematic. Temperature is applied through CSS variables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted, reduced, alreadySeen, emit]);

  /* ------------------------------------------------------------- skipping --- */
  useEffect(() => {
    if (skipToken === 0) return;
    const tl = timelineRef.current;
    if (!tl) return;
    tl.progress(1).pause();
    emit("active");
  }, [skipToken, emit]);

  /* ------------------------------------------------- temperature response --- */
  const stageStyle = {
    "--tj-frost": look.frost,
    "--tj-mist": look.mist,
    "--tj-light": look.light,
    "--tj-wash": look.wash,
    "--tj-hud": look.hudIntensity,
  } as React.CSSProperties;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 size-full"
      style={stageStyle}
      role="img"
      aria-label="A refrigerated truck reversing onto the loading bay of a temperature-controlled cold storage facility as the chamber door opens."
      focusable="false"
    >
      <defs>
        <linearGradient id="tj-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#08061b" />
          <stop offset="55%" stopColor="#09092a" />
          <stop offset="100%" stopColor="#0c0d2f" />
        </linearGradient>

        <linearGradient id="tj-facade" x1="0" y1="120" x2="0" y2="660" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#191b44" />
          <stop offset="48%" stopColor="#121236" />
          <stop offset="100%" stopColor="#090a22" />
        </linearGradient>

        <linearGradient id="tj-apron" x1="0" y1="660" x2="0" y2="900" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d0e2d" />
          <stop offset="100%" stopColor="#05050f" />
        </linearGradient>

        {/* The chamber interior — the cold light that bursts out. */}
        <radialGradient id="tj-chamber" cx="50%" cy="62%" r="72%">
          <stop offset="0%" stopColor="var(--tj-light)" stopOpacity="0.95" />
          <stop offset="38%" stopColor="var(--tj-light)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#050921" stopOpacity="0.92" />
        </radialGradient>

        <linearGradient id="tj-spill" x1="1" y1="0" x2="0" y2="0.35">
          <stop offset="0%" stopColor="var(--tj-light)" stopOpacity="0.42" />
          <stop offset="55%" stopColor="var(--tj-light)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--tj-light)" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="tj-door" x1="0" y1="250" x2="0" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2a2f59" />
          <stop offset="50%" stopColor="#1c1e43" />
          <stop offset="100%" stopColor="#12132f" />
        </linearGradient>

        <linearGradient id="tj-mast" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9f3ff" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#e9f3ff" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="tj-baylight" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="var(--tj-light)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--tj-light)" stopOpacity="0" />
        </linearGradient>

        {/* The doorway clip: the door retracts up into the header pocket. */}
        <clipPath id="tj-doorway-clip">
          <rect x="1080" y="250" width="320" height="310" />
        </clipPath>

        <filter id="tj-blur-lg" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <filter id="tj-blur-md" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id="tj-blur-sm" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* ================= SKY ================= */}
      <rect width="1600" height="900" fill="url(#tj-sky)" />
      <rect width="1600" height="900" fill="var(--tj-wash)" opacity="0.5" />

      {/* Ambient lift — Scene 01 brings the room up from darkness. */}
      <g data-ambient opacity={0}>
        <ellipse cx="800" cy="230" rx="820" ry="300" fill="#141741" opacity="0.55" filter="url(#tj-blur-lg)" />
      </g>

      {/* ============ DISTANT YARD / SKYLINE ============ */}
      <g opacity="0.85">
        <path
          d="M0 660 V502 h96 v-30 h58 v30 h74 V466 h44 v36 h92 V520 h60 V486 h40 v34 h84 V660 Z"
          fill="#090a22"
        />
        <path
          d="M0 660 V548 h120 v-22 h80 v22 h96 V534 h64 V660 Z"
          fill="#0b0d27"
          opacity="0.9"
        />
        {/* Distant yard lighting */}
        <g fill="#4cc2ff" opacity="0.35">
          <circle cx="118" cy="470" r="2.4" />
          <circle cx="272" cy="466" r="2.4" />
          <circle cx="410" cy="484" r="2.4" />
        </g>
      </g>

      {/* ============ LIGHT MASTS ============ */}
      <g>
        {[168, 1512].map((x) => (
          <g key={x}>
            <rect x={x - 3} y={300} width="6" height="360" fill="#14183e" />
            <rect x={x - 26} y={288} width="52" height="14" rx="3" fill="#1c214a" />
            <g fill="#cddbf9" opacity="0.75">
              <rect x={x - 20} y={292} width="12" height="6" rx="1.5" />
              <rect x={x + 8} y={292} width="12" height="6" rx="1.5" />
            </g>
            <path
              d={`M${x - 26} 302 L${x - 150} 660 L${x + 150} 660 L${x + 26} 302 Z`}
              fill="url(#tj-mast)"
              opacity="0.5"
            />
          </g>
        ))}
      </g>

      {/* ============ MAIN FACILITY FACADE ============ */}
      <g>
        <rect x="560" y="120" width="1040" height="540" fill="url(#tj-facade)" />

        {/* Parapet coping */}
        <rect x="552" y="112" width="1048" height="16" rx="2" fill="#20244e" />
        <rect x="552" y="112" width="1048" height="3" fill="#394071" opacity="0.8" />

        {/* Insulated wall panelling */}
        <g stroke="#0d0f2b" strokeWidth="1.6" opacity="0.85">
          {Array.from({ length: 16 }, (_, index) => (
            <path key={index} d={`M${600 + index * 64} 128 V660`} />
          ))}
        </g>
        <g stroke="#2c3163" strokeWidth="1" opacity="0.45">
          {Array.from({ length: 16 }, (_, index) => (
            <path key={`hl-${index}`} d={`M${602 + index * 64} 128 V660`} />
          ))}
        </g>
        <path d="M560 214 H1600" stroke="#0d0f2b" strokeWidth="2" opacity="0.8" />
        <path d="M560 216 H1600" stroke="#2c3163" strokeWidth="1" opacity="0.35" />

        {/* Ventilation louvres */}
        <g transform="translate(628,248)">
          <rect width="118" height="74" rx="2" fill="#0b0d27" stroke="#222650" strokeWidth="1.4" />
          <g stroke="#2a315b" strokeWidth="2.4" opacity="0.8">
            {Array.from({ length: 7 }, (_, index) => (
              <path key={index} d={`M8 ${12 + index * 9} h102`} />
            ))}
          </g>
        </g>

        {/* Wall-mounted brand sign (above the truck roofline, always legible) */}
        <g transform="translate(800,250)" opacity="0.92">
          <rect x="-8" y="-34" width="352" height="96" rx="3" fill="#0a0b23" opacity="0.55" />
          <g stroke="#4cc2ff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
            <path d="M14-14 V34" />
            <path d="M-4 4 L32 22" />
            <path d="M32 4 L-4 22" />
          </g>
          <circle cx="14" cy="10" r="3.4" fill="#4cc2ff" opacity="0.9" />
          <text
            x="56"
            y="8"
            fontFamily="'Archivo Variable', sans-serif"
            fontSize="34"
            fontWeight="800"
            letterSpacing="1.6"
            fill="#dbe2f8"
          >
            TAHSEEN JABER
          </text>
          <text
            x="58"
            y="34"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="12"
            fontWeight="500"
            letterSpacing="4"
            fill="#4cc2ff"
            opacity="0.8"
          >
            COLD STORAGE &amp; LOGISTICS
          </text>
        </g>

        {/* Dock canopy / header */}
        <rect x="1036" y="196" width="408" height="58" rx="3" fill="#191b44" stroke="#0b0d27" strokeWidth="1.6" />
        <rect x="1036" y="196" width="408" height="5" fill="#31386d" opacity="0.7" />
        <text
          x="1240"
          y="232"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="15"
          fontWeight="600"
          letterSpacing="6"
          fill="#8d99be"
        >
          LOADING BAY 01
        </text>

        {/* Canopy downlights */}
        <g fill="#cddbf9" opacity="0.55">
          {[1080, 1160, 1240, 1320, 1400].map((x) => (
            <rect key={x} x={x - 12} y="252" width="24" height="4" rx="2" />
          ))}
        </g>

        {/* Dock face below the opening */}
        <rect x="1040" y="560" width="560" height="100" fill="#0e0f2f" />
        <rect x="1040" y="560" width="560" height="4" fill="#292f5a" opacity="0.7" />

        {/* Dock bumpers */}
        <g fill="#0a0a16" stroke="#1c1e39" strokeWidth="1.4">
          <rect x="1058" y="452" width="22" height="104" rx="3" />
          <rect x="1058" y="330" width="22" height="104" rx="3" />
        </g>
      </g>

      {/* ============ CHAMBER INTERIOR (revealed by the door) ============ */}
      <g clipPath="url(#tj-doorway-clip)">
        {/* Dark chamber base */}
        <rect x="1080" y="250" width="320" height="310" fill="#060921" />

        {/* Cold glow */}
        <g data-chamber-glow opacity={0}>
          <rect x="1080" y="250" width="320" height="310" fill="url(#tj-chamber)" />

          {/* Racking silhouettes inside the chamber */}
          <g stroke="#081236" strokeWidth="5" opacity="0.85">
            <path d="M1112 292 V556M1176 292 V556M1240 292 V556M1304 292 V556M1368 292 V556" />
          </g>
          <g stroke="#0a163f" strokeWidth="4" opacity="0.8">
            <path d="M1104 356 H1376M1104 424 H1376M1104 492 H1376" />
          </g>
          {/* Stock on the beams */}
          <g fill="#10214e" opacity="0.75">
            <rect x="1118" y="330" width="52" height="26" rx="2" />
            <rect x="1182" y="326" width="52" height="30" rx="2" />
            <rect x="1246" y="332" width="52" height="24" rx="2" />
            <rect x="1118" y="398" width="52" height="26" rx="2" />
            <rect x="1246" y="396" width="52" height="28" rx="2" />
            <rect x="1310" y="400" width="52" height="24" rx="2" />
            <rect x="1182" y="466" width="52" height="26" rx="2" />
            <rect x="1310" y="464" width="52" height="28" rx="2" />
          </g>

          {/* Chamber strip lighting */}
          <g fill="#e8f2ff" opacity="0.85">
            <rect x="1104" y="268" width="86" height="5" rx="2.5" />
            <rect x="1210" y="268" width="86" height="5" rx="2.5" />
            <rect x="1316" y="268" width="60" height="5" rx="2.5" />
          </g>
          <g fill="var(--tj-light)" opacity="0.28" filter="url(#tj-blur-md)">
            <rect x="1096" y="262" width="100" height="18" rx="6" />
            <rect x="1202" y="262" width="100" height="18" rx="6" />
            <rect x="1308" y="262" width="76" height="18" rx="6" />
          </g>

          {/* Chamber floor */}
          <rect x="1080" y="548" width="320" height="12" fill="#0c1b46" opacity="0.9" />
        </g>

        {/* ---- Insulated door: retracts upward into the header pocket ---- */}
        <g data-door>
          <rect x="1080" y="250" width="320" height="310" fill="url(#tj-door)" />
          {/* Door panel seams */}
          <g stroke="#0b0d27" strokeWidth="2" opacity="0.9">
            {Array.from({ length: 6 }, (_, index) => (
              <path key={index} d={`M1080 ${292 + index * 46} H1400`} />
            ))}
          </g>
          <g stroke="#383f74" strokeWidth="1" opacity="0.5">
            {Array.from({ length: 6 }, (_, index) => (
              <path key={`dh-${index}`} d={`M1080 ${294 + index * 46} H1400`} />
            ))}
          </g>
          {/* Bottom seal */}
          <rect x="1080" y="548" width="320" height="12" fill="#090a1a" />
          <rect x="1080" y="548" width="320" height="2.5" fill="#F59E0B" opacity="0.55" />
          {/* Handle / latch */}
          <rect x="1362" y="404" width="26" height="9" rx="3" fill="#52567f" />
          <rect x="1368" y="386" width="7" height="46" rx="3" fill="#65698f" />
          {/* Frost build-up on the door face — responds to temperature */}
          <rect
            x="1080"
            y="250"
            width="320"
            height="310"
            fill="#dbe5fc"
            style={{ opacity: "calc(var(--tj-frost) * 0.10)" }}
          />
        </g>
      </g>

      {/* ============ COLD LIGHT SPILL ACROSS THE APRON ============ */}
      <g data-light-spill opacity={0} style={{ mixBlendMode: "screen" }}>
        <path
          d="M1084 556 L1400 556 L1400 300 L700 660 L300 700 Z"
          fill="url(#tj-spill)"
          filter="url(#tj-blur-lg)"
        />
        <path
          d="M1088 552 L1396 552 L1396 470 L860 664 Z"
          fill="var(--tj-light)"
          opacity="0.16"
          filter="url(#tj-blur-md)"
        />
      </g>

      {/* ============ BAY LIGHT (comes up on docking) ============ */}
      <g data-bay-light opacity={0}>
        <path d="M1052 254 L1428 254 L1500 660 L980 660 Z" fill="url(#tj-baylight)" opacity="0.5" filter="url(#tj-blur-md)" />
      </g>

      {/* ============ APRON / YARD GROUND ============ */}
      <rect x="0" y="660" width="1600" height="240" fill="url(#tj-apron)" />
      {/* Painted bay lines */}
      <g stroke="#F59E0B" strokeWidth="3" opacity="0.22">
        <path d="M986 664 L900 900" />
        <path d="M1436 664 L1540 900" />
      </g>
      <g stroke="#8f7bff" strokeWidth="2" opacity="0.14">
        <path d="M120 700 H1520" />
        <path d="M60 780 H1560" />
      </g>
      {/* Ground frost sheen */}
      <rect
        x="0"
        y="660"
        width="1600"
        height="240"
        fill="#dbe5fc"
        style={{ opacity: "calc(var(--tj-frost) * 0.05)" }}
      />

      {/* ============ DOCK LEVELLER ============ */}
      <g>
        <path d="M984 566 L1092 560 L1092 578 L984 584 Z" fill="#282d54" stroke="#0b0d27" strokeWidth="1.4" />
        <g stroke="#48507a" strokeWidth="1.4" opacity="0.7">
          {Array.from({ length: 7 }, (_, index) => (
            <path key={index} d={`M${994 + index * 14} 566 L${994 + index * 14} 582`} />
          ))}
        </g>
      </g>

      {/* ============ FLOOR MIST (Scene 02) ============ */}
      <g data-floor-mist opacity={0} transform="translate(-70,0)">
        <ellipse cx="620" cy="690" rx="620" ry="52" fill="#bdd4f9" opacity="0.16" filter="url(#tj-blur-lg)" />
        <ellipse cx="1080" cy="704" rx="440" ry="44" fill="#dbe5fc" opacity="0.14" filter="url(#tj-blur-lg)" />
      </g>

      {/* ============ THE TRUCK (Scene 03) ============ */}
      {/* The static ground-line translate stays on the OUTER group; GSAP only
          ever touches the inner `[data-truck]` x, so the two never conflict. */}
      <g transform="translate(0,660)">
        <g data-truck transform="translate(-720,0)">
          <ReeferTruck />
        </g>
      </g>

      {/* ============ CARGO PALLETS (Scene 06) ============ */}
      {/* Travel from the truck's rear doors into the chamber. */}
      <g>
        <CargoPallet x={1004} y={556} accent="#22C55E" label="PRODUCE" index={0} />
        <CargoPallet x={1004} y={556} accent="#4cc2ff" label="MEAT" index={1} />
        <CargoPallet x={1004} y={556} accent="#8f7bff" label="SEAFOOD" index={2} />
        <CargoPallet x={1004} y={556} accent="#e9f3ff" label="PHARMA" index={3} />
      </g>

      {/* ============ MIST POURING FROM THE CHAMBER (Scene 05) ============ */}
      <g data-door-mist opacity={0} style={{ mixBlendMode: "screen" }}>
        <ellipse cx="1200" cy="546" rx="230" ry="42" fill="#e4eeff" opacity="0.5" filter="url(#tj-blur-lg)" />
        <ellipse cx="1130" cy="576" rx="300" ry="46" fill="#bdd4f9" opacity="0.38" filter="url(#tj-blur-lg)" />
        <ellipse cx="1260" cy="606" rx="360" ry="40" fill="#dbe5fc" opacity="0.26" filter="url(#tj-blur-lg)" />
      </g>

      {/* ============ AMBIENT MIST DENSITY (temperature-driven) ============ */}
      <g style={{ opacity: "calc(var(--tj-mist) * 0.5)", mixBlendMode: "screen" }}>
        <ellipse cx="820" cy="640" rx="760" ry="70" fill="#cdddfc" opacity="0.18" filter="url(#tj-blur-lg)" />
        <ellipse cx="1180" cy="612" rx="420" ry="58" fill="#e8f2ff" opacity="0.16" filter="url(#tj-blur-lg)" />
      </g>

      {/* ============ HUD LINK LINE (Scene 06→07) ============ */}
      <g data-hud-link opacity={0}>
        <path
          d="M1240 300 L1240 176 L900 176"
          fill="none"
          stroke="var(--tj-light)"
          strokeWidth="1.4"
          opacity="0.55"
          strokeDasharray="5 5"
        />
        <circle cx="1240" cy="300" r="4" fill="var(--tj-light)" opacity="0.9" />
        <circle cx="1240" cy="300" r="10" fill="none" stroke="var(--tj-light)" strokeWidth="1" opacity="0.4" />
      </g>

      {/* ============ FROST PARTICLES (low density, §09) ============ */}
      <g data-particles className="tj-hero-particles" opacity={0}>
        {Array.from({ length: 26 }, (_, index) => {
          // Deterministic scatter so server and client markup match exactly.
          const seedA = (index * 97) % 1600;
          const seedB = 120 + ((index * 211) % 620);
          const radius = 0.9 + ((index * 13) % 20) / 14;
          return (
            <circle
              key={index}
              cx={seedA}
              cy={seedB}
              r={radius}
              fill="#e8f2ff"
              opacity={0.18 + ((index * 7) % 30) / 100}
              style={{ animationDelay: `${(index % 9) * 1.7}s` }}
              className="tj-particle"
            />
          );
        })}
      </g>

      {/* ============ FROST / CONDENSATION OVERLAY (temperature-driven) ============ */}
      <rect
        width="1600"
        height="900"
        fill="#e8f2ff"
        style={{ opacity: "calc(var(--tj-frost) * 0.045)", mixBlendMode: "screen" }}
        pointerEvents="none"
      />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   CARGO PALLET (§11 Scene 06)
   A stacked pallet with a category band. `index` sets the stagger offset so
   GSAP can drive them in sequence from a single selector.
   -------------------------------------------------------------------------- */
function CargoPallet({
  x,
  y,
  accent,
  label,
  index,
}: {
  x: number;
  y: number;
  accent: string;
  label: string;
  index: number;
}) {
  // Each pallet ends at a different depth inside the chamber.
  const travel = [96, 150, 208, 268][index] ?? 120;

  // GSAP reads `x` as an ABSOLUTE value parsed from the existing transform, so
  // the static positioning lives on an outer group and `[data-pallet]` (the part
  // GSAP animates) starts at a clean 0,0. Otherwise every pallet would snap to
  // the left edge of the SVG.
  return (
    <g transform={`translate(${x},${y})`}>
      <g data-pallet data-travel={travel} opacity={0}>
      {/* Pallet base */}
      <g>
        <rect x="-26" y="-12" width="52" height="5" rx="1" fill="#3a3d5b" />
        <rect x="-26" y="-4" width="52" height="4" rx="1" fill="#2b2d48" />
        <g fill="#232441">
          <rect x="-24" y="-8" width="9" height="4" />
          <rect x="-4" y="-8" width="9" height="4" />
          <rect x="16" y="-8" width="9" height="4" />
        </g>
      </g>

      {/* Stacked cartons */}
      <g>
        <rect x="-24" y="-42" width="48" height="30" rx="2" fill="#8b94ae" stroke="#0b0d27" strokeWidth="1.2" />
        <rect x="-24" y="-42" width="48" height="4" fill="#b8bfd5" opacity="0.6" />
        <rect x="-20" y="-64" width="40" height="22" rx="2" fill="#7b849e" stroke="#0b0d27" strokeWidth="1.2" />
        <path d="M0-42 V-12" stroke="#0b0d27" strokeWidth="1" opacity="0.6" />
      </g>

      {/* Category band */}
      <rect x="-24" y="-34" width="48" height="6" fill={accent} opacity="0.85" />

      {/* Category tag */}
      <g transform="translate(0,-78)">
        <rect x="-30" y="-11" width="60" height="16" rx="2" fill="#06081f" opacity="0.85" stroke={accent} strokeWidth="0.9" strokeOpacity="0.5" />
        <text
          x="0"
          y="1"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="8"
          fontWeight="600"
          letterSpacing="1.4"
          fill={accent}
        >
          {label}
        </text>
      </g>
      </g>
    </g>
  );
}

/** Read the "seen" flag. Called from the server-safe hero wrapper. */
export function readSeenFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export { SEEN_KEY };
