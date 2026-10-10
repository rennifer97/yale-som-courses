// Original pastel "magical Tokyo" night scene: twinkling stars, crescent moon,
// drifting clouds, Tokyo Tower and two layers of lit-up buildings.

// Small seeded random so the skyline looks the same on every load.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

const W = 1440
const H = 320

interface Building { x: number; w: number; h: number; windows: { x: number; y: number }[] }

function skyline(seed: number, minH: number, maxH: number, windowChance: number): Building[] {
  const r = rng(seed)
  const out: Building[] = []
  let x = -10
  while (x < W) {
    const w = 34 + Math.round(r() * 60)
    const h = minH + Math.round(r() * (maxH - minH))
    const windows: { x: number; y: number }[] = []
    for (let wy = H - h + 12; wy < H - 14; wy += 16) {
      for (let wx = x + 8; wx < x + w - 10; wx += 13) {
        if (r() < windowChance) windows.push({ x: wx, y: wy })
      }
    }
    out.push({ x, w, h, windows })
    x += w + Math.round(r() * 6)
  }
  return out
}

const BACK = skyline(7, 70, 170, 0.18)
const FRONT = skyline(42, 30, 110, 0.32)
const STARS = (() => {
  const r = rng(99)
  return Array.from({ length: 70 }, () => ({
    x: r() * W, y: r() * 190, s: 0.6 + r() * 1.6, d: (r() * 4).toFixed(2), big: r() < 0.12,
  }))
})()

function Sparkle({ x, y, s }: { x: number; y: number; s: number }) {
  const k = s * 4
  return <path d={`M${x} ${y - k} Q${x} ${y} ${x + k} ${y} Q${x} ${y} ${x} ${y + k} Q${x} ${y} ${x - k} ${y} Q${x} ${y} ${x} ${y - k}Z`} />
}

export default function CityBackdrop({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      className={`city ${compact ? 'city-compact' : ''}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2d78" />
          <stop offset=".45" stopColor="#7a62c2" />
          <stop offset=".78" stopColor="#d993c8" />
          <stop offset="1" stopColor="#ffc9b8" />
        </linearGradient>
        <radialGradient id="moonGlow">
          <stop offset="0" stopColor="#fff6c8" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff6c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="towerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9fb5" />
          <stop offset="1" stopColor="#e46d93" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill="url(#sky)" />

      {/* stars */}
      <g fill="#fff">
        {STARS.map((st, i) =>
          st.big ? (
            <g key={i} className="twinkle" style={{ animationDelay: `${st.d}s` }}>
              <Sparkle x={st.x} y={st.y} s={st.s} />
            </g>
          ) : (
            <circle key={i} className="twinkle" style={{ animationDelay: `${st.d}s` }} cx={st.x} cy={st.y} r={st.s * 0.8} />
          ),
        )}
      </g>
      <path className="shooting-star" d="M0 0 L90 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" />

      {/* crescent moon */}
      <circle cx="1180" cy="70" r="70" fill="url(#moonGlow)" />
      <path d="M1192 34 A38 38 0 1 0 1192 106 A44 44 0 0 1 1192 34Z" fill="#fff3b8" />

      {/* clouds */}
      <g className="clouds" fill="#ffffff" opacity=".22">
        <ellipse cx="260" cy="120" rx="90" ry="16" />
        <ellipse cx="310" cy="110" rx="50" ry="14" />
        <ellipse cx="860" cy="150" rx="110" ry="15" />
        <ellipse cx="920" cy="141" rx="56" ry="13" />
      </g>

      {/* back skyline */}
      <g fill="#a98fd8" opacity=".85">
        {BACK.map((b, i) => <rect key={i} x={b.x} y={H - b.h} width={b.w} height={b.h} rx="2" />)}
      </g>
      <g fill="#ffe9a8" opacity=".55">
        {BACK.flatMap((b, i) => b.windows.map((w, j) => <rect key={`${i}-${j}`} x={w.x} y={w.y} width="5" height="7" rx="1" />))}
      </g>

      {/* Tokyo Tower */}
      <g transform="translate(1010 0)">
        <path d="M50 70 L58 70 L78 320 L30 320Z" fill="url(#towerGrad)" />
        <path d="M54 30 L54 70" stroke="#ff9fb5" strokeWidth="3" />
        <rect x="40" y="150" width="28" height="9" fill="#fff3f6" />
        <rect x="34" y="225" width="40" height="10" fill="#fff3f6" />
        <g stroke="#fff3f6" strokeWidth="1.2" opacity=".75">
          <path d="M46 110 L62 150 M62 110 L46 150 M42 170 L66 225 M66 170 L42 225 M38 245 L70 320 M70 245 L38 320" />
        </g>
        <circle cx="54" cy="30" r="3" fill="#fff" className="twinkle" />
      </g>

      {/* front skyline */}
      <g fill="#6f58ae">
        {FRONT.map((b, i) => <rect key={i} x={b.x} y={H - b.h} width={b.w} height={b.h} rx="2" />)}
      </g>
      <g fill="#fff3b0" opacity=".85">
        {FRONT.flatMap((b, i) => b.windows.map((w, j) => <rect key={`${i}-${j}`} x={w.x} y={w.y} width="5" height="7" rx="1" />))}
      </g>
    </svg>
  )
}
