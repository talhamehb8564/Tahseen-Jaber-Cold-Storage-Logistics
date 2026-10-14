/**
 * AuroraSky — the living sky behind every route.
 * ---------------------------------------------------------------------------
 * Three slow luminous light fields (electric azure, aurora violet and a crown
 * blue rise from the horizon) drift behind the whole site. It is pure CSS:
 * no JavaScript, no canvas, no layout cost — and the global reduced-motion
 * rule (§37) freezes the drift completely for visitors who ask for calm.
 *
 * Sits behind ColdAtmosphere (-z-10) and the FrostCanvas snow (z-0), so the
 * storm reads as weather in front of a glowing sky rather than noise on glass.
 */

export function AuroraSky() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[15] overflow-hidden">
      <div className="aurora-blob aurora-blob--azure" />
      <div className="aurora-blob aurora-blob--violet" />
      <div className="aurora-blob aurora-blob--crown" />
    </div>
  );
}
