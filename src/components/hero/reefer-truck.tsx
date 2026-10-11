/**
 * REFRIGERATED TRUCK (§11 Scene 03, §43 SVG)
 * ---------------------------------------------------------------------------
 * Hand-built side elevation of a rigid refrigerated distribution truck.
 *
 * ORIENTATION IS DELIBERATE: the cab is drawn at the LEFT and the insulated box
 * at the RIGHT. The truck enters from the left moving right, which means it is
 * reversing — exactly how a vehicle backs onto a dock. The rear of the box
 * therefore arrives at the loading bay first, and cargo can travel the short
 * distance from the rear doors straight into the chamber. Reversing is signalled
 * by counter-rotating wheels (`[data-wheel]`) and a flashing amber beacon.
 *
 * Local coordinate system: origin at the ground line under the front bumper,
 * +x toward the rear of the vehicle, −y upward. Overall length 620 units.
 *
 * Everything is vector: it stays crisp at any DPR, costs ~9 KB, and needs no
 * image download — which is why §43 sends trucks to SVG rather than Three.js.
 */

interface ReeferTruckProps {
  /** Paint the livery. False renders an unbranded vehicle. */
  livery?: boolean;
}

export function ReeferTruck({ livery = true }: ReeferTruckProps) {
  return (
    <g>
      <defs>
        {/* Insulated box body — pale on top where roof light catches it. */}
        <linearGradient id="tj-box" x1="0" y1="-272" x2="0" y2="-100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DCE7F2" />
          <stop offset="14%" stopColor="#B7C6D6" />
          <stop offset="62%" stopColor="#8B9BAD" />
          <stop offset="100%" stopColor="#5C6B7E" />
        </linearGradient>

        {/* Cab paint — cooler and darker than the box, as on a real chassis. */}
        <linearGradient id="tj-cab" x1="0" y1="-268" x2="0" y2="-88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2E4661" />
          <stop offset="45%" stopColor="#1B2C42" />
          <stop offset="100%" stopColor="#0E1A2A" />
        </linearGradient>

        <linearGradient id="tj-glass" x1="0" y1="-258" x2="0" y2="-180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9FD8F2" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#3F6E8C" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#16293C" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id="tj-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E6EEF6" />
          <stop offset="48%" stopColor="#93A3B5" />
          <stop offset="100%" stopColor="#4A586A" />
        </linearGradient>

        <linearGradient id="tj-chassis" x1="0" y1="-102" x2="0" y2="-78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#33414F" />
          <stop offset="100%" stopColor="#121A24" />
        </linearGradient>

        <radialGradient id="tj-tyre" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#2A333E" />
          <stop offset="70%" stopColor="#151B23" />
          <stop offset="100%" stopColor="#0A0E14" />
        </radialGradient>

        <linearGradient id="tj-reefer" x1="0" y1="-266" x2="0" y2="-186" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CFDCE9" />
          <stop offset="100%" stopColor="#7C8DA0" />
        </linearGradient>

        {/* Headlamp cone, only visible once the bay lights come up. */}
        <linearGradient id="tj-lamp" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#eafcff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#eafcff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* --- Contact shadow ------------------------------------------------ */}
      <ellipse
        cx="300"
        cy="-4"
        rx="330"
        ry="13"
        fill="#03060D"
        opacity="0.62"
        style={{ filter: "blur(7px)" }}
      />

      {/* --- Chassis rail --------------------------------------------------- */}
      <rect x="-6" y="-102" width="632" height="22" rx="2" fill="url(#tj-chassis)" />
      <rect x="-6" y="-102" width="632" height="3" fill="#4A5A6C" opacity="0.55" />

      {/* --- Fuel tank + battery box under the cab -------------------------- */}
      <rect x="112" y="-96" width="66" height="34" rx="16" fill="url(#tj-chrome)" opacity="0.85" />
      <rect x="112" y="-96" width="66" height="34" rx="16" fill="none" stroke="#0B121B" strokeWidth="1.5" />
      <rect x="186" y="-92" width="30" height="24" rx="2" fill="#1B2531" stroke="#0B121B" strokeWidth="1.2" />

      {/* --- Side underride guard ------------------------------------------- */}
      <rect x="206" y="-84" width="238" height="10" rx="2" fill="#1A2430" />
      <g stroke="#33414F" strokeWidth="1.4" opacity="0.7">
        <path d="M230-84v10M286-84v10M342-84v10M398-84v10" />
      </g>

      {/* ======================= CAB (front, left) ========================= */}
      <g>
        {/* Air deflector / roof fairing */}
        <path
          d="M104-266 L176-266 L186-250 L186-196 L176-196 L176-252 L104-252 Z"
          fill="#162334"
          stroke="#0A1119"
          strokeWidth="1.2"
        />

        {/* Cab shell */}
        <path
          d="M2-168
             L2-104 L20-100 L188-100 L188-262
             L120-266
             L104-266
             L58-190
             L14-184
             Z"
          fill="url(#tj-cab)"
          stroke="#080E16"
          strokeWidth="1.6"
        />

        {/* Bonnet highlight */}
        <path d="M4-170 L56-192 L104-262 L118-262 L70-186 L16-164 Z" fill="#4C6A8C" opacity="0.22" />

        {/* Windshield */}
        <path
          d="M62-192 L108-260 L172-258 L172-196 L64-196 Z"
          fill="url(#tj-glass)"
          stroke="#0A1119"
          strokeWidth="1.4"
        />
        {/* Windshield reflection */}
        <path d="M74-198 L114-254 L132-254 L92-198 Z" fill="#E8F6FF" opacity="0.16" />

        {/* Door glass */}
        <path d="M120-250 L166-249 L166-206 L120-206 Z" fill="url(#tj-glass)" opacity="0.55" stroke="#0A1119" strokeWidth="1" />

        {/* Door seam + handle */}
        <path d="M114-256 L114-104" stroke="#080E16" strokeWidth="1.6" opacity="0.85" />
        <rect x="122" y="-186" width="18" height="5" rx="2.5" fill="url(#tj-chrome)" />

        {/* Grille */}
        <rect x="0" y="-166" width="14" height="56" rx="2" fill="#0E1721" stroke="#2C3B4C" strokeWidth="1" />
        <g stroke="#3A4C60" strokeWidth="1.3" opacity="0.9">
          <path d="M1-158h12M1-150h12M1-142h12M1-134h12M1-126h12M1-118h12" />
        </g>

        {/* Headlamp + lens */}
        <rect x="1" y="-176" width="22" height="12" rx="3" fill="#0F1A25" stroke="#33465A" strokeWidth="1" />
        <rect x="3" y="-174" width="17" height="8" rx="2" fill="#DCEBFA" opacity="0.9" data-lamp />
        <rect x="-40" y="-176" width="44" height="12" fill="url(#tj-lamp)" opacity="0.5" data-lamp-cone />

        {/* Front bumper */}
        <path d="M-8-108 L26-108 L26-84 L-4-84 Z" fill="#151E29" stroke="#080E16" strokeWidth="1.2" />
        <rect x="-6" y="-104" width="30" height="5" rx="2" fill="url(#tj-chrome)" opacity="0.7" />

        {/* Mirror */}
        <path d="M54-236 L36-244 L36-214 L54-220 Z" fill="#101A25" stroke="#2C3B4C" strokeWidth="1" />
        <path d="M54-232 L58-232" stroke="#2C3B4C" strokeWidth="2" />

        {/* Cab steps */}
        <g fill="#1A2430" stroke="#080E16" strokeWidth="1">
          <rect x="120" y="-96" width="46" height="7" rx="1.5" />
          <rect x="126" y="-84" width="40" height="7" rx="1.5" />
        </g>

        {/* Reversing beacon — flashes during the docking manoeuvre */}
        <g data-beacon>
          <rect x="132" y="-276" width="22" height="10" rx="4" fill="#1A2430" stroke="#0A1119" strokeWidth="1" />
          <rect x="135" y="-274" width="16" height="6" rx="3" fill="#F59E0B" opacity="0.35" data-beacon-lens />
        </g>
      </g>

      {/* ================ REFRIGERATION UNIT (nose) ======================== */}
      <g>
        <rect x="188" y="-268" width="42" height="88" rx="4" fill="url(#tj-reefer)" stroke="#0A1119" strokeWidth="1.6" />
        {/* Louvres */}
        <g stroke="#5F7183" strokeWidth="2" opacity="0.85">
          <path d="M193-258h32M193-250h32M193-242h32M193-234h32M193-226h32" />
        </g>
        {/* Control panel */}
        <rect x="192" y="-216" width="34" height="26" rx="2" fill="#0C141D" stroke="#33465A" strokeWidth="1" />
        <rect x="196" y="-212" width="26" height="10" rx="1" fill="#0B2431" />
        <text
          x="209"
          y="-204"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="8"
          fontWeight="600"
          fill="#00f5d4"
          data-reefer-readout
        >
          SET
        </text>
        <g fill="#22C55E" opacity="0.9" data-reefer-led>
          <circle cx="199" cy="-196" r="1.8" />
        </g>
        <g fill="#33465A">
          <circle cx="207" cy="-196" r="1.8" />
          <circle cx="215" cy="-196" r="1.8" />
        </g>
      </g>

      {/* ================== INSULATED BOX (rear, right) ==================== */}
      <g>
        {/* Main body */}
        <rect x="228" y="-272" width="392" height="172" rx="3" fill="url(#tj-box)" stroke="#0A1119" strokeWidth="1.8" />

        {/* Roof edge + top highlight */}
        <rect x="228" y="-272" width="392" height="7" rx="2" fill="#EDF4FB" opacity="0.75" />
        <rect x="228" y="-265" width="392" height="3" fill="#0A1119" opacity="0.18" />

        {/* Insulated panel seams — the signature reefer ribbing */}
        <g stroke="#7A8A9C" strokeWidth="1.1" opacity="0.42">
          {Array.from({ length: 8 }, (_, index) => (
            <path key={index} d={`M${268 + index * 46}-264 V-108`} />
          ))}
        </g>
        <g stroke="#F2F8FE" strokeWidth="0.9" opacity="0.3">
          {Array.from({ length: 8 }, (_, index) => (
            <path key={`h-${index}`} d={`M${270 + index * 46}-264 V-108`} />
          ))}
        </g>

        {/* Lower chassis skirt + rub rail */}
        <rect x="228" y="-118" width="392" height="18" fill="#6A7A8C" opacity="0.5" />
        <rect x="228" y="-120" width="392" height="4" fill="url(#tj-chrome)" opacity="0.6" />

        {/* Accent stripe (brand cyan) */}
        <rect x="228" y="-142" width="392" height="4" fill="#00f5d4" opacity="0.55" />

        {/* Rear door frame (right end — faces the dock) */}
        <rect x="588" y="-272" width="32" height="172" fill="#93A3B5" opacity="0.45" />
        <rect x="588" y="-272" width="32" height="172" fill="none" stroke="#0A1119" strokeWidth="1.6" />
        {/* Door split + locking bars */}
        <path d="M604-272 V-100" stroke="#0A1119" strokeWidth="1.6" />
        <g stroke="url(#tj-chrome)" strokeWidth="3.4" strokeLinecap="round">
          <path d="M594-262 V-110" />
          <path d="M614-262 V-110" />
        </g>
        <g fill="#4A586A">
          <rect x="590" y="-196" width="9" height="12" rx="1.5" />
          <rect x="610" y="-196" width="9" height="12" rx="1.5" />
        </g>
        {/* Hinges */}
        <g fill="#3E4C5C">
          <rect x="586" y="-256" width="6" height="16" rx="1" />
          <rect x="586" y="-166" width="6" height="16" rx="1" />
        </g>

        {/* Tail lamps + reversing lamp */}
        <g>
          <rect x="612" y="-136" width="10" height="20" rx="2" fill="#1A1216" stroke="#0A1119" strokeWidth="1" />
          <rect x="614" y="-134" width="6" height="7" rx="1" fill="#EF4444" opacity="0.55" data-taillamp />
          <rect x="614" y="-125" width="6" height="7" rx="1" fill="#F59E0B" opacity="0.4" data-reverselamp />
        </g>

        {/* Rear bumper + underride */}
        <rect x="618" y="-104" width="14" height="24" rx="2" fill="#151E29" stroke="#080E16" strokeWidth="1.2" />
        <rect x="600" y="-82" width="34" height="8" rx="2" fill="#1A2430" />

        {/* Mudflap */}
        <path d="M366-96 L392-96 L390-42 L368-42 Z" fill="#0D141C" opacity="0.9" />

        {/* --- Livery ------------------------------------------------------ */}
        {livery ? (
          <g>
            {/* Frost mark */}
            <g transform="translate(256,-224) scale(0.92)" opacity="0.95">
              <g stroke="#0B3B4C" strokeWidth="2.6" strokeLinecap="round">
                <path d="M0-20 V20" />
                <path d="M-17-10 L17 10" />
                <path d="M17-10 L-17 10" />
              </g>
              <circle cx="0" cy="0" r="3.4" fill="#0B3B4C" />
            </g>

            <text
              x="300"
              y="-206"
              fontFamily="'Archivo Variable', 'Archivo', sans-serif"
              fontSize="30"
              fontWeight="800"
              letterSpacing="1.4"
              fill="#0E1A26"
            >
              TAHSEEN JABER
            </text>
            <text
              x="301"
              y="-182"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="12.5"
              fontWeight="500"
              letterSpacing="4.2"
              fill="#20404F"
            >
              COLD STORAGE &amp; LOGISTICS
            </text>
            <text
              x="301"
              y="-156"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10"
              fontWeight="500"
              letterSpacing="2.6"
              fill="#3A4C5C"
            >
              UUAYRIJ INDUSTRIAL AREA · BAGHDAD
            </text>
          </g>
        ) : null}
      </g>

      {/* =========================== WHEELS ================================= */}
      {/* Each wheel is a group with data-wheel so the timeline can spin them
          (forward on arrival, reversed during the docking manoeuvre). */}
      <TruckWheel cx={95} r={38} />
      <TruckWheel cx={262} r={38} />
      <TruckWheel cx={344} r={38} />

      {/* Wheel arches drawn over the tyres */}
      <g fill="none" stroke="#0A1119" strokeWidth="3" opacity="0.75">
        <path d="M53-100 A42 42 0 0 1 137-100" />
        <path d="M220-100 A42 42 0 0 1 304-100" />
        <path d="M302-100 A42 42 0 0 1 386-100" />
      </g>
    </g>
  );
}

function TruckWheel({ cx, r }: { cx: number; r: number }) {
  // The static translate lives on the OUTER group; `[data-wheel]` marks the
  // INNER group so GSAP can spin it around (0,0) — the wheel centre — without
  // ever fighting the positioning transform.
  return (
    <g transform={`translate(${cx},-${r})`}>
      <g data-wheel>
      <circle r={r} fill="url(#tj-tyre)" />
      <circle r={r} fill="none" stroke="#05080D" strokeWidth="2" />
      {/* Tread blocks — make the rotation legible */}
      <g stroke="#39434F" strokeWidth="3" opacity="0.7">
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index * 30 * Math.PI) / 180;
          return (
            <path
              key={index}
              d={`M${Math.cos(angle) * (r - 7)} ${Math.sin(angle) * (r - 7)} L${Math.cos(angle) * (r - 1)} ${Math.sin(angle) * (r - 1)}`}
            />
          );
        })}
      </g>
      {/* Rim */}
      <circle r={r * 0.56} fill="#1C2531" stroke="#4A586A" strokeWidth="1.6" />
      <circle r={r * 0.5} fill="url(#tj-chrome)" opacity="0.5" />
      {/* Hub + studs */}
      <circle r={r * 0.19} fill="#2B3644" stroke="#5A6B7D" strokeWidth="1.2" />
      <g fill="#6E7F91">
        {Array.from({ length: 6 }, (_, index) => {
          const angle = (index * 60 * Math.PI) / 180;
          const radius = r * 0.34;
          return (
            <circle
              key={index}
              cx={Math.cos(angle) * radius}
              cy={Math.sin(angle) * radius}
              r={2.1}
            />
          );
        })}
      </g>
      </g>
    </g>
  );
}
