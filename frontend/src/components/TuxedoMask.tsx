// Original tribute (not official art): a side-profile silhouette of a masked gentleman
// in a top hat, back against the left edge of the screen, cape streaming toward the
// search bar in the wind. Only the mask, glove, cape lining and rose catch the light.

export default function TuxedoMask() {
  return (
    <svg className="tuxedo" viewBox="0 0 170 300" aria-label="Tuxedo Mask leaning on the screen edge" role="img">
      <defs>
        <linearGradient id="tuxBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#110c22" />
          <stop offset="1" stopColor="#2a2050" />
        </linearGradient>
        <linearGradient id="tuxLining" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9304a" />
          <stop offset="1" stopColor="#8e1834" />
        </linearGradient>
      </defs>

      {/* cape: pinned at the shoulders, streaming right in the wind */}
      <g className="tux-cape">
        <path d="M30 58 Q70 58 104 82 Q132 100 166 92 Q150 112 162 132 Q130 124 108 140 Q116 160 102 184 Q84 162 62 172 Q56 138 44 118 Z" fill="url(#tuxLining)" />
        <path d="M30 58 Q72 54 108 74 Q136 88 168 78 Q150 100 160 116 Q128 110 104 124 Q110 146 96 166 Q80 146 60 152 Q54 126 42 112 Z" fill="#110c22" />
      </g>

      <g fill="url(#tuxBody)">
        {/* top hat, profile, brim tipped forward */}
        <g transform="rotate(6 32 26)">
          <rect x="22" y="3" width="17" height="23" rx="1.5" />
          <path d="M16 26 Q31 22 47 27 Q31 29 16 26 Z" />
        </g>
        {/* head in profile, facing right: brow, nose, lips, chin */}
        <path d="M24 30 Q21 44 28 51 L35 51 Q38 50 38 47 L40 45 L39 43 L41 42 L40 40 L43 37 L40 34 Q39 28 32 27 Q26 27 24 30 Z" />
        <rect x="26" y="49" width="7" height="8" />
        {/* torso in profile: chest forward, back against the wall */}
        <path d="M22 58 Q32 53 41 58 L44 92 L40 132 L25 132 L21 94 Z" />
        {/* coat tail */}
        <path d="M24 126 L18 164 L28 156 L30 132 Z" />
        {/* legs: front leg angled out, back leg straight, shoes pointing right */}
        <path d="M27 130 L37 130 L44 210 L50 282 L43 283 L36 212 Z" />
        <path d="M30 130 L38 130 L36 212 L34 282 L27 283 L28 212 Z" />
        <path d="M43 280 Q55 279 60 285 L43 286 Z" />
        <path d="M27 280 Q38 279 43 285 L27 286 Z" />
        {/* arm: bent at the elbow, raising the rose toward his face */}
        <path d="M33 60 Q42 78 41 96 L48 80 Q46 74 39 60 Z" />
      </g>

      {/* the few highlights */}
      <path d="M32 33 L41.5 34 L40.5 36.6 L33 36.6 Z" fill="#fff" />
      <path d="M37 58 L41 58 L40 70 Z" fill="#f4f0fb" />
      <circle cx="48" cy="79" r="2.6" fill="#f4f0fb" />
      <path d="M48 78 Q51 70 54 64" stroke="#3f8a4a" strokeWidth="1" fill="none" />
      <circle cx="54.5" cy="63" r="3" fill="#d8264a" />
      <path d="M52.8 62.6 Q54.5 60.6 56.2 62.6" stroke="#9e1636" strokeWidth=".7" fill="none" />
      <rect x="22" y="20" width="17" height="2" fill="#c9304a" transform="rotate(6 32 26)" />

      {/* faint moonlight rim on the front of the figure */}
      <path d="M43 37 L40 40 M41 58 L44 92 L40 132" stroke="rgba(255,240,255,.28)" strokeWidth="1" fill="none" />
    </svg>
  )
}
