"use client";

import { useEffect, useRef } from "react";

/**
 * FROST CANVAS v2 — the storm engine.
 * ---------------------------------------------------------------------------
 * One fixed, full-screen canvas draws the weather in front of the aurora sky
 * and behind the glass content:
 *
 *   SNOWFALL   three depth bands of flakes (far → near). Near flakes are
 *              larger, faster, brighter and cast a faint glow.
 *   BREEZE     a layered wind field — two slow sines plus periodic gusts —
 *              pushes every layer sideways. Gusts arrive every 7–14 s and
 *              swing either direction, so the air never feels looped.
 *   STREAKS    when the wind rises past a threshold, thin azure streaks race
 *              across the frame: the visible "breeze" carrying the snow.
 *   CRYSTALS   six-armed ice crystals rotate slowly through the mid depth.
 *   FOG        wide fog banks breathe along the bottom of the viewport.
 *   POINTER    the cursor carves a repulsion field through the flakes.
 *   SCROLL     page scroll couples into the fall, so the storm moves with
 *              the world instead of floating over it.
 *
 * Budgets (§34): particle counts scale with viewport area, halved on small
 * screens, DPR capped at 2. Under `prefers-reduced-motion` (§37) the engine
 * draws a single static frame — calm air, no animation loop.
 */

type Flake = {
  x: number;
  y: number;
  z: number;
  r: number;
  vy: number;
  phase: number;
  sway: number;
  twinkle: number;
  violet: boolean;
};

type Streak = {
  x: number;
  y: number;
  len: number;
  alpha: number;
  speed: number;
};

type Crystal = {
  x: number;
  y: number;
  z: number;
  rot: number;
  vr: number;
  size: number;
};

type FogBank = {
  x: number;
  y: number;
  r: number;
  tint: 0 | 1;
  drift: number;
  alpha: number;
};

export function FrostCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];
    let streaks: Streak[] = [];
    let crystals: Crystal[] = [];
    let banks: FogBank[] = [];

    const mouse = { x: -9999, y: -9999 };
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    /* ------------------------------------------------------------- build --- */
    function build() {
      flakes = [];
      streaks = [];
      crystals = [];
      banks = [];

      const mobile = width < 768;
      const budget = Math.min(
        mobile ? 110 : 240,
        Math.round((width * height) / (mobile ? 11000 : 6200)),
      );

      for (let i = 0; i < budget; i++) {
        const z = rand(0.25, 1);
        flakes.push({
          x: rand(-80, width + 80),
          y: rand(-height * 0.2, height * 1.05),
          z,
          r: 0.7 + z * 2.3,
          vy: 16 + z * 40,
          phase: rand(0, Math.PI * 2),
          sway: rand(6, 26),
          twinkle: Math.random() < 0.14 ? rand(2, 5) : 0,
          violet: Math.random() < 0.15,
        });
      }

      const streakCount = mobile ? 6 : 16;
      for (let i = 0; i < streakCount; i++) {
        streaks.push({
          x: rand(0, width),
          y: rand(0, height),
          len: rand(40, 150),
          alpha: rand(0.04, 0.13),
          speed: rand(260, 520),
        });
      }

      const crystalCount = mobile ? 2 : 5;
      for (let i = 0; i < crystalCount; i++) {
        crystals.push({
          x: rand(60, Math.max(120, width - 60)),
          y: rand(80, Math.max(160, height - 160)),
          z: rand(0.5, 1),
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.00045, 0.00045),
          size: rand(10, 26),
        });
      }

      for (let i = 0; i < 4; i++) {
        banks.push({
          x: rand(0, width),
          y: height - rand(30, 150),
          r: rand(width * 0.25, width * 0.55),
          tint: (i % 2) as 0 | 1,
          drift: rand(4, 14),
          alpha: rand(0.05, 0.1),
        });
      }
    }

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduceMotion) drawFrame(performance.now(), 0.35);
    }

    /* --------------------------------------------------------- wind field --- */
    let gustStart = -10000;
    let gustDuration = 2000;
    let gustPeak = 0;
    let nextGust = 4500;

    function windAt(now: number) {
      if (now > nextGust) {
        gustStart = now;
        gustDuration = rand(1800, 3400);
        gustPeak = rand(0.5, 1.15) * (Math.random() < 0.5 ? -1 : 1);
        nextGust = now + gustDuration + rand(6000, 12000);
      }
      let envelope = 0;
      if (now >= gustStart && now < gustStart + gustDuration) {
        const progress = (now - gustStart) / gustDuration;
        envelope = gustPeak * Math.sin(Math.PI * progress);
      }
      return (
        0.42 * Math.sin(now * 0.00013) +
        0.3 * Math.sin(now * 0.000047 + 1.7) +
        envelope
      );
    }

    /* ------------------------------------------------------------- paint --- */
    function drawFog(t: number) {
      for (const bank of banks) {
        const gradient = ctx!.createRadialGradient(bank.x, bank.y, 0, bank.x, bank.y, bank.r);
        const color = bank.tint ? "120, 150, 255" : "90, 130, 220";
        gradient.addColorStop(0, `rgba(${color}, ${bank.alpha})`);
        gradient.addColorStop(0.55, `rgba(${color}, ${bank.alpha * 0.4})`);
        gradient.addColorStop(1, "rgba(10, 16, 50, 0)");
        ctx!.fillStyle = gradient;
        ctx!.fillRect(bank.x - bank.r, bank.y - bank.r * 0.6, bank.r * 2, bank.r * 1.2);
        bank.x += Math.sin(t * 0.00006 + bank.tint * 2.1) * bank.drift * 0.016;
      }
    }

    function drawCrystal(c: Crystal) {
      const s = c.size;
      ctx!.save();
      ctx!.translate(c.x, c.y);
      ctx!.rotate(c.rot);
      ctx!.strokeStyle = `rgba(200, 225, 255, ${(0.14 + c.z * 0.16).toFixed(3)})`;
      ctx!.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        const ax = Math.cos(a) * s;
        const ay = Math.sin(a) * s;
        ctx!.beginPath();
        ctx!.moveTo(0, 0);
        ctx!.lineTo(ax, ay);
        const bx = Math.cos(a) * s * 0.55;
        const by = Math.sin(a) * s * 0.55;
        ctx!.moveTo(bx, by);
        ctx!.lineTo(bx + Math.cos(a + 0.6) * s * 0.28, by + Math.sin(a + 0.6) * s * 0.28);
        ctx!.moveTo(bx, by);
        ctx!.lineTo(bx + Math.cos(a - 0.6) * s * 0.28, by + Math.sin(a - 0.6) * s * 0.28);
        ctx!.stroke();
      }
      ctx!.restore();
    }

    function drawFrame(now: number, wind: number, dt = 0.016) {
      ctx!.clearRect(0, 0, width, height);
      const t = now;

      drawFog(t);

      /* flakes */
      for (const f of flakes) {
        const sway = Math.sin(t * 0.0011 + f.phase) * f.sway * (0.5 + Math.abs(wind));
        const vx = wind * (26 + 95 * f.z) + sway;
        f.x += vx * dt;
        f.y += f.vy * dt + scrollVelocity * 0.1 * f.z;

        /* pointer repulsion field */
        const dx = f.x - mouse.x;
        const dy = f.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22500 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const push = (150 - d) / 150;
          f.x += (dx / d) * push * 7;
          f.y += (dy / d) * push * 7;
        }

        if (f.y > height + 12) {
          f.y = -12;
          f.x = rand(-40, width + 40);
        } else if (f.y < -height * 0.35) {
          f.y = height + 10;
        }
        if (f.x > width + 60) f.x = -50;
        else if (f.x < -60) f.x = width + 50;

        let alpha = 0.25 + f.z * 0.6;
        if (f.twinkle) alpha *= 0.55 + 0.45 * Math.sin(t * 0.001 * f.twinkle + f.phase);

        if (f.z > 0.9) {
          ctx!.shadowColor = f.violet ? "rgba(170, 150, 255, 0.6)" : "rgba(140, 180, 255, 0.55)";
          ctx!.shadowBlur = 6;
        } else {
          ctx!.shadowBlur = 0;
        }
        ctx!.fillStyle = f.violet
          ? `rgba(226, 218, 255, ${alpha.toFixed(3)})`
          : `rgba(216, 235, 255, ${alpha.toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      /* crystals */
      for (const c of crystals) {
        c.rot += c.vr * 16;
        c.x += wind * 8 * c.z;
        if (c.x < -40) c.x = width + 40;
        else if (c.x > width + 40) c.x = -40;
        drawCrystal(c);
      }

      /* breeze streaks — only when the wind is actually blowing */
      const windAbs = Math.abs(wind);
      if (windAbs > 0.22) {
        ctx!.lineWidth = 1;
        for (const s of streaks) {
          const length = s.len * Math.min(1.6, windAbs);
          const alpha = s.alpha * Math.min(1, (windAbs - 0.22) / 0.6);
          ctx!.strokeStyle = `rgba(160, 200, 255, ${alpha.toFixed(3)})`;
          ctx!.beginPath();
          ctx!.moveTo(s.x, s.y);
          ctx!.lineTo(s.x - Math.sign(wind) * length, s.y + Math.sin(t * 0.002 + s.y * 0.01) * 3);
          ctx!.stroke();
          s.x += wind * s.speed * dt;
          if (s.x > width + 160) {
            s.x = -150;
            s.y = rand(0, height);
          } else if (s.x < -160) {
            s.x = width + 150;
            s.y = rand(0, height);
          }
        }
      }
    }

    /* -------------------------------------------------------------- loop --- */
    let raf = 0;
    let running = true;
    let lastFrame = performance.now();

    function frame(now: number) {
      if (!running) return;
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      drawFrame(now, windAt(now), dt);
      scrollVelocity *= 0.9;
      raf = requestAnimationFrame(frame);
    }

    const onPointer = (event: PointerEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };
    const onPointerOut = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onScroll = () => {
      const y = window.scrollY;
      scrollVelocity += (y - lastScrollY) * 0.35;
      scrollVelocity = Math.max(-60, Math.min(60, scrollVelocity));
      lastScrollY = y;
    };
    const onVisibility = () => {
      if (reduceMotion) return;
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        lastFrame = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerout", onPointerOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    if (!reduceMotion) {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("scroll", onScroll);
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
