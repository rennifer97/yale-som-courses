// Hand-drawn chibi tributes (original SVG, not official art): five Sailor Guardians
// who peek over the course cards, and the cats Luna and Artemis for the chat.

interface Guardian {
  name: string
  hair: string
  hairDark: string
  eyes: string
  gem: string
  style: 'odango' | 'bob' | 'long' | 'ponytail' | 'bow'
}

const GUARDIANS: Guardian[] = [
  { name: 'Sailor Moon', hair: '#ffd95a', hairDark: '#e9b83a', eyes: '#3b6fd8', gem: '#e8364f', style: 'odango' },
  { name: 'Sailor Mercury', hair: '#5a8fe0', hairDark: '#3a6cc0', eyes: '#2f5bb5', gem: '#4fb3ff', style: 'bob' },
  { name: 'Sailor Mars', hair: '#2a1f3d', hairDark: '#150f22', eyes: '#8b2fc9', gem: '#e8364f', style: 'long' },
  { name: 'Sailor Jupiter', hair: '#9a5a2e', hairDark: '#76411d', eyes: '#2e9a52', gem: '#3fbf6a', style: 'ponytail' },
  { name: 'Sailor Venus', hair: '#ffcf4a', hairDark: '#e6ad25', eyes: '#3b6fd8', gem: '#ff8c2a', style: 'bow' },
]

const SKIN = '#ffe3cf'

function Eye({ x, color }: { x: number; color: string }) {
  return (
    <g>
      <ellipse cx={x} cy="47" rx="5.2" ry="7" fill="#1d1b2e" />
      <ellipse cx={x} cy="48.5" rx="4.2" ry="5.4" fill={color} />
      <circle cx={x - 1.6} cy="44.5" r="1.9" fill="#fff" />
      <circle cx={x + 1.8} cy="50.5" r="0.9" fill="#fff" />
    </g>
  )
}

function GuardianHead({ g }: { g: Guardian }) {
  return (
    <svg viewBox="0 0 100 64" className="guardian-svg" aria-hidden>
      {/* hair behind the head */}
      {g.style === 'odango' && (
        <>
          <circle cx="22" cy="20" r="11" fill={g.hair} stroke={g.hairDark} strokeWidth="1.2" />
          <circle cx="78" cy="20" r="11" fill={g.hair} stroke={g.hairDark} strokeWidth="1.2" />
          <path d="M14 26 Q6 50 12 64 L22 64 Q18 46 24 30Z" fill={g.hair} />
          <path d="M86 26 Q94 50 88 64 L78 64 Q82 46 76 30Z" fill={g.hair} />
        </>
      )}
      {(g.style === 'long' || g.style === 'bow') && (
        <path d="M22 30 Q14 52 18 64 L82 64 Q86 52 78 30Z" fill={g.hair} />
      )}
      {g.style === 'ponytail' && (
        <path d="M66 14 Q92 6 90 34 Q88 50 80 58 Q84 36 70 24Z" fill={g.hair} stroke={g.hairDark} strokeWidth="1" />
      )}
      {g.style === 'bow' && (
        <g>
          <path d="M50 9 L34 0 L36 18Z" fill="#e8364f" />
          <path d="M50 9 L66 0 L64 18Z" fill="#e8364f" />
          <circle cx="50" cy="9" r="4" fill="#c92a42" />
        </g>
      )}

      {/* face */}
      <ellipse cx="50" cy="44" rx="23" ry="22" fill={SKIN} />
      <ellipse cx="34" cy="54" rx="4" ry="2.4" fill="#ffb3b8" opacity=".7" />
      <ellipse cx="66" cy="54" rx="4" ry="2.4" fill="#ffb3b8" opacity=".7" />

      {/* bangs */}
      {g.style === 'bob' ? (
        <path d="M26 46 Q24 18 50 17 Q76 18 74 46 Q70 32 62 30 Q56 36 50 30 Q44 36 38 30 Q30 32 26 46Z" fill={g.hair} stroke={g.hairDark} strokeWidth="1" />
      ) : (
        <path d="M27 40 Q26 18 50 17 Q74 18 73 40 L67 30 L61 38 L56 28 L50 36 L44 28 L39 38 L33 30Z" fill={g.hair} stroke={g.hairDark} strokeWidth="1" />
      )}

      {/* tiara */}
      <path d="M30 33 Q50 26 70 33" stroke="#f4c542" strokeWidth="2.4" fill="none" />
      <path d="M50 26 L46 32 L50 35 L54 32Z" fill="#f4c542" />
      <circle cx="50" cy="31.5" r="2" fill={g.gem} />

      <Eye x={41} color={g.eyes} />
      <Eye x={59} color={g.eyes} />
      <path d="M47 58 Q50 60.5 53 58" stroke="#c45a6a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// Rises from behind a card. `index` picks the Guardian so neighbours differ.
export function Peeker({ index }: { index: number }) {
  const g = GUARDIANS[index % GUARDIANS.length]
  const side = index % 3 === 0 ? 'left' : index % 3 === 1 ? 'right' : 'mid'
  return (
    <>
      <div className={`peeker peeker-${side}`} title={g.name}>
        <GuardianHead g={g} />
      </div>
      <div className={`peek-hands peeker-${side}`} aria-hidden>
        <span /><span />
      </div>
    </>
  )
}

export type CatName = 'luna' | 'artemis'

export const CAT_INFO: Record<CatName, { name: string }> = {
  luna: { name: 'Luna' },
  artemis: { name: 'Artemis' },
}

export function Cat({ who, size = 34 }: { who: CatName; size?: number }) {
  const luna = who === 'luna'
  const fur = luna ? '#2b2440' : '#f7f5fb'
  const line = luna ? '#18132a' : '#cfc9dc'
  const ear = luna ? '#5a3f6e' : '#f4c2d6'
  const iris = luna ? '#c23a5a' : '#4a7fd9'
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="cat" aria-label={CAT_INFO[who].name}>
      <path d="M10 30 L12 6 L28 20Z" fill={fur} stroke={line} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M54 30 L52 6 L36 20Z" fill={fur} stroke={line} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 24 L15 12 L24 20Z" fill={ear} />
      <path d="M50 24 L49 12 L40 20Z" fill={ear} />
      <ellipse cx="32" cy="38" rx="24" ry="21" fill={fur} stroke={line} strokeWidth="1.5" />
      {/* golden crescent moon on the forehead */}
      <path d="M35 16 A7 7 0 1 0 35 30 A9 9 0 0 1 35 16Z" fill="#f4c542" />
      <ellipse cx="23" cy="38" rx="4.6" ry="5.6" fill={iris} />
      <ellipse cx="41" cy="38" rx="4.6" ry="5.6" fill={iris} />
      <ellipse cx="23" cy="38" rx="1.6" ry="4.4" fill="#120d1c" />
      <ellipse cx="41" cy="38" rx="1.6" ry="4.4" fill="#120d1c" />
      <circle cx="21.5" cy="35.5" r="1.3" fill="#fff" />
      <circle cx="39.5" cy="35.5" r="1.3" fill="#fff" />
      <path d="M30 46 L34 46 L32 48.5Z" fill={luna ? '#d98aa8' : '#f29bb8'} />
      <path d="M28 51 Q32 54 32 49 Q32 54 36 51" stroke={line} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <g stroke={luna ? '#8c86a6' : '#b9b3c7'} strokeWidth="1" strokeLinecap="round">
        <path d="M18 47 L5 45" /><path d="M18 50 L6 52" />
        <path d="M46 47 L59 45" /><path d="M46 50 L58 52" />
      </g>
    </svg>
  )
}
