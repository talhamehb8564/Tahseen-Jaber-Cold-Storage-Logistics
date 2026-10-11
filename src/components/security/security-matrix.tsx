"use client";

import { Camera, Fingerprint, Lock, ShieldCheck, ThermometerSnowflake } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ProvenanceBadge, ProvenanceNote } from "@/components/ui/provenance-badge";
import type { SecurityStatusView } from "@/lib/data/types";
import { useReducedMotion } from "@/hooks";
import { cn } from "@/lib/utilities/cn";

/**
 * SECURITY EXPERIENCE (§23)
 * ---------------------------------------------------------------------------
 * Camera matrix, credential scanner, door state, thermal sensing and the
 * monitoring summary — presented as a security console.
 *
 * §23 / §40 CONSTRAINT, APPLIED LITERALLY
 *   No camera system, access controller or thermal sensor is connected. So:
 *     - the camera tiles render an abstract wireframe schematic of each zone
 *       with scanlines, NOT anything that resembles real footage. A fake video
 *       feed would be the single easiest way to mislead a visitor here.
 *     - the credential scanner is an explicitly-labelled demonstration that
 *       grants nothing and records nothing.
 *     - the whole section carries the SIMULATION badge and a disclosure note.
 *   When real systems are integrated the provider returns `simulated: false` and
 *   the same layout renders live state without a redesign.
 */

type ScanPhase = "idle" | "reading" | "granted";

interface SecurityMatrixProps {
  status: SecurityStatusView;
  simulated: boolean;
}

export function SecurityMatrix({ status, simulated }: SecurityMatrixProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
      {/* ---------------- Camera matrix ---------------- */}
      <div className="tj-panel tj-corners rounded-[2px] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="tj-label tj-label-glow flex items-center gap-2">
              <Camera size={13} strokeWidth={1.7} aria-hidden />
              Camera matrix
            </p>
            <p className="tabular mt-2 font-mono text-lg font-medium text-frost">
              {status.camerasOnline}
              <span className="text-silver-dim"> / {status.camerasTotal}</span>
              <span className="ml-2 text-[0.625rem] tracking-[0.16em] text-silver-dim uppercase">
                reporting
              </span>
            </p>
          </div>
          <ProvenanceBadge simulated={simulated} />
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {status.cameras.map((camera) => (
            <CameraTile key={camera.id} camera={camera} simulated={simulated} />
          ))}
        </ul>

        <ProvenanceNote simulated={simulated} className="mt-5">
          Camera tiles are schematic placeholders. No surveillance system is
          connected, and nothing resembling recorded footage is shown.
        </ProvenanceNote>
      </div>

      {/* ---------------- Access + door + thermal ---------------- */}
      <div className="flex flex-col gap-6">
        <AccessScanner simulated={simulated} />
        <DoorAndThermal status={status} simulated={simulated} />
      </div>
    </div>
  );
}

/* ==========================================================================
   CAMERA TILE
   ========================================================================== */
function CameraTile({
  camera,
  simulated,
}: {
  camera: SecurityStatusView["cameras"][number];
  simulated: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <li
      className={cn(
        "group relative overflow-hidden rounded-[2px] border transition-colors duration-500",
        camera.online
          ? "border-hull-line hover:border-glow/45"
          : "border-alert/40 hover:border-alert/70",
      )}
    >
      {/* Schematic "feed" — a wireframe ghost of the zone, never footage. */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#070F1A]">
        <svg viewBox="0 0 120 90" className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <pattern id={`cam-grid-${camera.id.replace(/\s/g, "")}`} width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M12 0 H0 V12" fill="none" stroke="#00f5d4" strokeWidth="0.4" opacity="0.22" />
            </pattern>
          </defs>
          <rect width="120" height="90" fill={`url(#cam-grid-${camera.id.replace(/\s/g, "")})`} />

          {/* Abstract zone wireframe */}
          <g
            fill="none"
            stroke={camera.online ? "#48cae4" : "#EF4444"}
            strokeWidth="0.9"
            opacity={camera.online ? 0.55 : 0.5}
          >
            <rect x="22" y="26" width="76" height="44" />
            <path d="M22 44 H98M60 26 V70" />
            <path d="M34 56 h14 v14 h-14 ZM72 34 h14 v12 h-14 Z" />
            <circle cx="60" cy="48" r="5" strokeDasharray="2 2" />
          </g>

          {/* Corner brackets, as on a real VMS tile */}
          <g stroke={camera.online ? "#00f5d4" : "#EF4444"} strokeWidth="1.2" opacity="0.7">
            <path d="M6 16 V6 H16M104 6 H114 V16M114 74 V84 H104M16 84 H6 V74" />
          </g>

          {/* Offline cross-hatch */}
          {!camera.online ? (
            <g stroke="#EF4444" strokeWidth="0.7" opacity="0.32">
              {Array.from({ length: 12 }, (_, index) => (
                <path key={index} d={`M${index * 14 - 20} 90 L${index * 14 + 20} 0`} />
              ))}
            </g>
          ) : null}
        </svg>

        {/* Scanlines — the "monitoring surface" cue */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(234,252,255,0.16) 0px, rgba(234,252,255,0.16) 1px, transparent 1px, transparent 3px)",
          }}
        />

        {/* Travelling sweep on healthy tiles */}
        {camera.online && !reduced ? (
          <div
            aria-hidden
            className="absolute inset-x-0 h-8 bg-[linear-gradient(to_bottom,transparent,rgba(0,245,212,0.16),transparent)]"
            style={{ animation: "scan-line 4.6s cubic-bezier(0.65,0,0.35,1) infinite" }}
          />
        ) : null}

        {/* REC indicator */}
        <span className="absolute top-1.5 right-2 flex items-center gap-1.5">
          <span
            className={cn(
              "size-1.5 rounded-full",
              camera.online ? "bg-alert" : "bg-silver-dim",
            )}
            aria-hidden
            style={
              camera.online && !reduced
                ? { animation: "status-pulse 2.4s cubic-bezier(0.22,1,0.36,1) infinite" }
                : undefined
            }
          />
          <span
            className={cn(
              "font-mono text-[0.4375rem] tracking-[0.14em] uppercase",
              camera.online ? "text-alert/90" : "text-silver-dim",
            )}
          >
            {camera.online ? "rec" : "no sig"}
          </span>
        </span>
      </div>

      {/* Tile footer */}
      <div className="flex items-center justify-between gap-2 border-t border-hull-line/70 bg-midnight/60 px-2.5 py-2">
        <span className="tabular font-mono text-[0.5625rem] tracking-[0.12em] text-frost">
          {camera.id}
        </span>
        <span
          className={cn(
            "font-mono text-[0.5rem] tracking-[0.14em] uppercase",
            camera.online ? "text-stable" : "text-alert",
          )}
        >
          {camera.online ? "online" : "offline"}
        </span>
      </div>
      <p className="sr-only">
        {camera.id} covering {camera.zone}: {camera.online ? "reporting" : "not reporting"}
        {simulated ? " (illustrative)" : ""}
      </p>
    </li>
  );
}

/* ==========================================================================
   ACCESS SCANNER — an explicitly labelled demonstration
   ========================================================================== */
function AccessScanner({ simulated }: { simulated: boolean }) {
  const reduced = useReducedMotion();
  const [scanPhase, setScanPhase] = useState<ScanPhase>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const presentCredential = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];

    if (reduced) {
      setScanPhase("granted");
      return;
    }

    setScanPhase("reading");
    timers.current.push(window.setTimeout(() => setScanPhase("granted"), 1250));
    timers.current.push(window.setTimeout(() => setScanPhase("idle"), 4200));
  };

  return (
    <div className="tj-panel tj-corners rounded-[2px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="tj-label tj-label-glow flex items-center gap-2">
          <Fingerprint size={13} strokeWidth={1.7} aria-hidden />
          Access control
        </p>
        <ProvenanceBadge simulated={simulated} compact />
      </div>

      <div className="mt-5 flex items-center gap-5">
        {/* Scanner pad */}
        <div
          className={cn(
            "relative flex size-24 shrink-0 items-center justify-center rounded-[2px] border transition-all duration-500",
            scanPhase === "granted"
              ? "border-stable/60 bg-stable/10"
              : scanPhase === "reading"
                ? "border-glow/60 bg-glow/10"
                : "border-hull-line bg-midnight/60",
          )}
        >
          <Fingerprint
            size={40}
            strokeWidth={1.2}
            aria-hidden
            className={cn(
              "transition-colors duration-500",
              scanPhase === "granted"
                ? "text-stable"
                : scanPhase === "reading"
                  ? "text-glow"
                  : "text-silver-dim",
            )}
          />
          {scanPhase === "reading" && !reduced ? (
            <span
              aria-hidden
              className="absolute inset-x-2 h-6 bg-[linear-gradient(to_bottom,transparent,rgba(0,245,212,0.35),transparent)]"
              style={{ animation: "scan-line 1.25s cubic-bezier(0.65,0,0.35,1) infinite" }}
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-mono text-[0.6875rem] font-semibold tracking-[0.16em] uppercase transition-colors duration-300",
              scanPhase === "granted"
                ? "text-stable"
                : scanPhase === "reading"
                  ? "text-glow"
                  : "text-silver",
            )}
            aria-live="polite"
          >
            {scanPhase === "granted"
              ? "Access granted"
              : scanPhase === "reading"
                ? "Reading credential…"
                : "Awaiting credential"}
          </p>
          <p className="mt-1.5 text-[0.75rem] leading-relaxed text-silver-dim">
            Restricted zones require a credential at the door. Movement is recorded
            against a gate pass.
          </p>

          <button
            type="button"
            onClick={presentCredential}
            className={cn(
              "mt-3.5 inline-flex items-center gap-2 rounded-[2px] border px-3 py-1.5",
              "font-mono text-[0.5625rem] tracking-[0.16em] uppercase transition-all duration-300",
              "border-hull-line text-silver hover:border-glow/50 hover:text-glow",
            )}
          >
            <Lock size={11} strokeWidth={1.8} aria-hidden />
            Simulate credential
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   DOOR STATE + THERMAL SENSING
   ========================================================================== */
function DoorAndThermal({
  status,
  simulated,
}: {
  status: SecurityStatusView;
  simulated: boolean;
}) {
  return (
    <div className="tj-panel tj-corners rounded-[2px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="tj-label tj-label-glow flex items-center gap-2">
          <ShieldCheck size={13} strokeWidth={1.7} aria-hidden />
          Facility security
        </p>
        <ProvenanceBadge simulated={simulated} compact />
      </div>

      <dl className="mt-5 divide-y divide-hull-line/60 border-y border-hull-line/60">
        <SecurityRow
          label="Access"
          value={status.accessSecured ? "SECURED" : "OPEN"}
          tone={status.accessSecured ? "stable" : "alert"}
        />
        <SecurityRow
          label="Monitoring"
          value={status.monitoringActive ? "ACTIVE" : "INACTIVE"}
          tone={status.monitoringActive ? "stable" : "alert"}
          pulse={status.monitoringActive}
        />
        <SecurityRow
          label="Cameras online"
          value={`${status.camerasOnline}/${status.camerasTotal}`}
          tone={status.camerasOnline === status.camerasTotal ? "stable" : "caution"}
        />
        <SecurityRow
          label="Thermal sensing"
          value={simulated ? "ILLUSTRATIVE" : "CONNECTED"}
          tone={simulated ? "caution" : "stable"}
          icon={<ThermometerSnowflake size={13} strokeWidth={1.6} aria-hidden />}
        />
      </dl>

      {/* Door state */}
      <div className="mt-5 flex items-center gap-4">
        <svg viewBox="0 0 64 88" className="h-20 w-14 shrink-0" aria-hidden>
          <rect x="4" y="4" width="56" height="80" rx="2" fill="#101D2E" stroke="#2C4258" strokeWidth="1.6" />
          <rect x="10" y="10" width="44" height="30" rx="1" fill="#0A1421" stroke="#1c3157" strokeWidth="1" />
          <rect x="10" y="46" width="44" height="32" rx="1" fill="#0A1421" stroke="#1c3157" strokeWidth="1" />
          {/* Lock indicator */}
          <circle cx="50" cy="44" r="3.4" fill={status.accessSecured ? "#22C55E" : "#EF4444"} />
          <rect x="46" y="40" width="8" height="8" rx="1" fill="none" stroke="#2C4258" strokeWidth="1" />
          {/* Handle */}
          <rect x="14" y="42" width="10" height="3.4" rx="1.7" fill="#4A6478" />
        </svg>
        <div className="min-w-0">
          <p className="font-mono text-[0.625rem] tracking-[0.16em] text-frost uppercase">
            Security door
          </p>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-silver-dim">
            {status.accessSecured
              ? "Held closed and locked. Entry requires a credential and is logged."
              : "Not in the secured state."}
          </p>
        </div>
      </div>
    </div>
  );
}

function SecurityRow({
  label,
  value,
  tone,
  pulse = false,
  icon,
}: {
  label: string;
  value: string;
  tone: "stable" | "caution" | "alert" | "ice";
  pulse?: boolean;
  icon?: React.ReactNode;
}) {
  const tones = {
    stable: "text-stable",
    caution: "text-caution",
    alert: "text-alert",
    ice: "text-ice",
  } as const;

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="tj-label flex items-center gap-2">
        {icon ? <span className="text-silver-dim">{icon}</span> : null}
        {label}
      </dt>
      <dd className={cn("flex items-center gap-2 font-mono text-[0.6875rem] font-medium tracking-[0.14em] uppercase", tones[tone])}>
        {pulse ? (
          <span className={cn("size-1.5 rounded-full bg-current", pulse && "animate-status-pulse")} aria-hidden />
        ) : null}
        {value}
      </dd>
    </div>
  );
}
