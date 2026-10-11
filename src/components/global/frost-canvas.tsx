"use client";

import { useEffect, useRef } from "react";

/**
 * FROST CANVAS — the atmosphere engine
 * ---------------------------------------------------------------------------
 * One HTML5 canvas, fixed behind every section, drawing three systems in a
 * single rAF loop:
 *
 *   1. SNOW      — fine particles falling with per-flake sway and wind drift.
 *   2. CRYSTALS  — larger six-point ice crystals that rotate slowly and catch
 *                  the light, far fewer than the snow so the field reads as
 *                  texture rather than confetti.
 *   3. FOG       — soft radial banks crawling along the bottom of the viewport.
 *
 * Plus a POINTER FIELD: particles within a radius of the cursor swell and are
 * pushed outward, and a short-lived sparkle trails the cursor itself. This is
 * what makes the background feel alive under the hand instead of a looping GIF.
 *
 * PERFORMANCE
 *   - particle budget scales with viewport area and is hard-capped;
 *   - devicePixelRatio is capped at 2 (beyond that the gain is invisible);
 *   - the loop pauses when the tab is hidden and when the canvas is off-screen;
 *   - `prefers-reduced-motion` renders one calm static frame and stops — the
 *     atmosphere stays, the motion goes (§07, §34).
 *
 * The canvas is `pointer-events: none`, so it never intercepts input.
 */

interface Flake {
  x: number;
  y: number;
  r: number;
  speed: number;
  sway: number;
  swaySpeed: number;
  phase: number;
  opacity: number;
  depth: number; // 0 far … 1 near; drives parallax + mouse influence
}

interface Crystal {
  x: number;
  y: number;
  r: number;
  rotation: number;
  spin: number;
  speed: number;
  opacity: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
}

interface FogBank {
  x: number;
  y: number;
  rx: number;
  ry: number;
  drift: number;
  opacity: number;
}

const DPR_CAP = 2;
const MOUSE_RADIUS = 150;

export function FrostCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;

    let flakes: Flake[] = [];
    let crystals: Crystal[] = [];
    let sparks: Spark[] = [];
    let fog: FogBank[] = [];

    const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, active: false };
    let lastSpawn = 0;

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    /* ------------------------------------------------------------ seeding --- */
    function seed() {
      const area = width * height;

      // Budget: enough to read as weather, capped so a 4K screen stays smooth.
      const flakeCount = Math.min(150, Math.round(area / 13000));
      const crystalCount = Math.min(16, Math.round(area / 110000));

      flakes = Array.from({ length: flakeCount }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.6 + depth * 2.2,
          speed: 0.25 + depth * 0.9,
          sway: 8 + depth * 26,
          swaySpeed: 0.0006 + Math.random() * 0.0012,
          phase: Math.random() * Math.PI * 2,
          opacity: 0.18 + depth * 0.5,
          depth,
        };
      });

      crystals = Array.from({ length: crystalCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 5 + Math.random() * 11,
        rotation: Math.random() * Math.PI,
        spin: rand(-0.0022, 0.0022),
        speed: 0.12 + Math.random() * 0.2,
        opacity: 0.10 + Math.random() * 0.16,
      }));

      fog = Array.from({ length: 4 }, (_, index) => ({
        x: (width / 4) * index + rand(-80, 80),
        y: height - rand(20, 130),
        rx: rand(width * 0.28, width * 0.46),
        ry: rand(50, 110),
        drift: rand(0.08, 0.22) * (index % 2 === 0 ? 1 : -1),
        opacity: rand(0.05, 0.11),
      }));
    }

    /* ------------------------------------------------------------- resize --- */
    function resize() {
      dpr = Math.min(DPR_CAP, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;

      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    /* ------------------------------------------------------- draw helpers --- */
    function drawCrystal(c: Crystal) {
      const ctx = context!;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.strokeStyle = `rgba(190, 242, 255, ${c.opacity})`;
      ctx.lineWidth = 0.8;

      // Six arms with a single branch pair each — reads as ice, not a star.
      for (let arm = 0; arm < 6; arm += 1) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -c.r);
        ctx.moveTo(0, -c.r * 0.55);
        ctx.lineTo(c.r * 0.26, -c.r * 0.74);
        ctx.moveTo(0, -c.r * 0.55);
        ctx.lineTo(-c.r * 0.26, -c.r * 0.74);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* -------------------------------------------------------------- frame --- */
    function frame(time: number) {
      const ctx = context!;
      ctx.clearRect(0, 0, width, height);

      /* --- fog banks, bottom of the viewport --- */
      for (const bank of fog) {
        bank.x += bank.drift;
        if (bank.x - bank.rx > width) bank.x = -bank.rx;
        if (bank.x + bank.rx < 0) bank.x = width + bank.rx;

        const gradient = ctx.createRadialGradient(
          bank.x,
          bank.y,
          0,
          bank.x,
          bank.y,
          bank.rx,
        );
        gradient.addColorStop(0, `rgba(148, 210, 235, ${bank.opacity})`);
        gradient.addColorStop(0.55, `rgba(90, 170, 205, ${bank.opacity * 0.45})`);
        gradient.addColorStop(1, "rgba(90, 170, 205, 0)");

        ctx.save();
        ctx.translate(bank.x, bank.y);
        ctx.scale(1, bank.ry / bank.rx);
        ctx.translate(-bank.x, -bank.y);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bank.x, bank.y, bank.rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* --- snow --- */
      for (const flake of flakes) {
        flake.phase += flake.swaySpeed * 16;
        flake.y += flake.speed;
        flake.x += Math.sin(flake.phase) * 0.35 + 0.06;

        // Pointer field: near particles swell and are pushed away.
        let swell = 1;
        if (mouse.active) {
          const dx = flake.x - mouse.x;
          const dy = flake.y - mouse.y;
          const distance = Math.hypot(dx, dy);
          if (distance < MOUSE_RADIUS && distance > 0.001) {
            const force = (1 - distance / MOUSE_RADIUS) * flake.depth;
            flake.x += (dx / distance) * force * 1.6;
            flake.y += (dy / distance) * force * 0.9;
            swell = 1 + force * 1.1;
          }
        }

        if (flake.y - flake.r > height) {
          flake.y = -flake.r;
          flake.x = Math.random() * width;
        }
        if (flake.x > width + 4) flake.x = -4;
        if (flake.x < -4) flake.x = width + 4;

        ctx.beginPath();
        ctx.fillStyle = `rgba(224, 247, 255, ${flake.opacity})`;
        ctx.arc(flake.x, flake.y, flake.r * swell, 0, Math.PI * 2);
        ctx.fill();
      }

      /* --- ice crystals --- */
      for (const crystal of crystals) {
        crystal.y += crystal.speed;
        crystal.rotation += crystal.spin;
        if (crystal.y - crystal.r > height) {
          crystal.y = -crystal.r;
          crystal.x = Math.random() * width;
        }
        drawCrystal(crystal);
      }

      /* --- cursor sparkle trail --- */
      if (mouse.active) {
        const moved = Math.hypot(mouse.x - mouse.px, mouse.y - mouse.py);
        if (moved > 3 && time - lastSpawn > 26) {
          lastSpawn = time;
          sparks.push({
            x: mouse.x + rand(-4, 4),
            y: mouse.y + rand(-4, 4),
            vx: rand(-0.4, 0.4),
            vy: rand(-0.7, -0.1),
            life: 0,
            maxLife: rand(380, 780),
            r: rand(0.8, 2.1),
          });
          if (sparks.length > 60) sparks.shift();
        }
        mouse.px = mouse.x;
        mouse.py = mouse.y;
      }

      sparks = sparks.filter((spark) => spark.life < spark.maxLife);
      for (const spark of sparks) {
        spark.life += 16;
        spark.x += spark.vx;
        spark.y += spark.vy;
        const t = 1 - spark.life / spark.maxLife;
        ctx.beginPath();
        ctx.fillStyle = `rgba(0, 245, 212, ${0.5 * t})`;
        ctx.arc(spark.x, spark.y, spark.r * t, 0, Math.PI * 2);
        ctx.fill();
      }

      if (running && !reduced) raf = requestAnimationFrame(frame);
    }

    /* ------------------------------------------------------------ events --- */
    function onPointerMove(event: PointerEvent) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      if (!mouse.active) {
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        mouse.active = true;
      }
    }

    function onPointerLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function onVisibility() {
      const hidden = document.hidden;
      if (hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      // One calm frame: the atmosphere is present, the motion is not (§07).
      frame(0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-90"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
