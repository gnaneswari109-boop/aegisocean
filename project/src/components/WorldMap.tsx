import { useMemo, useRef, useState } from 'react';
import type { Anomaly } from '../types';
import { ANOMALY_TYPE_META } from '../types';
import { formatLat, formatLng } from '../data/demo';

const CONTINENT_PATHS = [
  'M 80 60 Q 100 50 130 55 L 160 60 Q 180 70 175 90 L 170 110 Q 160 130 140 135 L 110 130 Q 90 120 85 100 Z',
  'M 140 145 Q 155 140 165 150 L 170 170 Q 165 190 155 200 L 145 205 Q 135 195 138 175 Z',
  'M 250 65 Q 270 60 285 68 L 295 78 Q 290 88 275 90 L 255 85 Q 245 75 248 68 Z',
  'M 265 100 Q 285 95 300 105 L 310 125 Q 305 150 290 165 L 275 170 Q 260 160 258 140 L 260 115 Z',
  'M 300 60 Q 340 55 380 65 L 420 70 Q 440 80 435 95 L 420 105 Q 380 110 350 100 L 310 95 Q 295 85 300 70 Z',
  'M 380 160 Q 400 155 415 165 L 420 178 Q 410 188 395 185 L 382 178 Q 375 168 378 162 Z',
  'M 200 40 Q 215 35 225 42 L 228 55 Q 220 62 210 60 L 202 52 Z',
];

interface WorldMapProps {
  anomalies: Anomaly[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  fullSize?: boolean;
}

export function WorldMap({ anomalies, selectedId, onSelect, fullSize }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const projectPoint = (lat: number, lng: number): { x: number; y: number } => {
    const x = ((lng + 180) / 360) * 500;
    const y = ((90 - lat) / 180) * 250;
    return { x, y };
  };

  const markers = useMemo(
    () =>
      anomalies.map((a) => ({
        ...a,
        projected: projectPoint(a.coordinates.lat, a.coordinates.lng),
      })),
    [anomalies]
  );

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox="0 0 500 250"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.1))' }}
      >
        <defs>
          <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0f2645" />
            <stop offset="100%" stopColor="#060f1f" />
          </radialGradient>
          <pattern id="oceanGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(34,211,238,0.06)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width="500" height="250" fill="url(#oceanGrad)" />
        <rect width="500" height="250" fill="url(#oceanGrid)" />

        {/* Continents */}
        {CONTINENT_PATHS.map((d, i) => (
          <path key={i} d={d} fill="#16365a" stroke="#2e5f95" strokeWidth="0.5" opacity={0.7} />
        ))}

        {/* Graticule lines */}
        {[62.5, 125, 187.5].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="500" y2={y} stroke="rgba(34,211,238,0.04)" strokeWidth="0.5" />
        ))}
        {[125, 250, 375].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="250" stroke="rgba(34,211,238,0.04)" strokeWidth="0.5" />
        ))}

        {/* Survey area highlight (Bay of Bengal region) */}
        <ellipse
          cx="345"
          cy="120"
          rx={fullSize ? 40 : 28}
          ry={fullSize ? 28 : 18}
          fill="rgba(34,211,238,0.06)"
          stroke="rgba(34,211,238,0.3)"
          strokeWidth="0.5"
          strokeDasharray="3 2"
        />
        <text x="345" y={fullSize ? 108 : 110} fill="rgba(34,211,238,0.5)" fontSize="5" textAnchor="middle" fontFamily="monospace">
          SURVEY ZONE
        </text>

        {/* Anomaly markers */}
        {markers.map((m) => {
          const meta = ANOMALY_TYPE_META[m.type];
          const isSelected = selectedId === m.id;
          const isHovered = hoveredId === m.id;
          const r = isSelected ? 4 : isHovered ? 3.5 : 2.5;
          return (
            <g key={m.id}>
              {isSelected && (
                <circle cx={m.projected.x} cy={m.projected.y} r="8" fill="none" stroke={meta.color} strokeWidth="0.5" opacity="0.5">
                  <animate attributeName="r" from="4" to="12" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={m.projected.x}
                cy={m.projected.y}
                r={r}
                fill={meta.color}
                stroke={isSelected ? '#fff' : 'none'}
                strokeWidth={isSelected ? 1 : 0}
                opacity={isSelected ? 1 : 0.8}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(m.id)}
              />
              {(isSelected || isHovered) && (
                <text
                  x={m.projected.x + 6}
                  y={m.projected.y - 4}
                  fill={meta.color}
                  fontSize="5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {m.id}
                </text>
              )}
            </g>
          );
        })}

        {/* Compass */}
        <g transform="translate(470, 25)">
          <circle r="12" fill="rgba(10,26,51,0.8)" stroke="rgba(34,211,238,0.3)" strokeWidth="0.5" />
          <text y="-5" fill="rgba(34,211,238,0.6)" fontSize="5" textAnchor="middle" fontFamily="monospace">N</text>
          <line x1="0" y1="-8" x2="0" y2="8" stroke="rgba(34,211,238,0.4)" strokeWidth="0.5" />
          <line x1="-8" y1="0" x2="8" y2="0" stroke="rgba(34,211,238,0.2)" strokeWidth="0.5" />
        </g>

        {/* Demo coordinates label */}
        {fullSize && (
          <text x="250" y="240" fill="rgba(251,191,36,0.4)" fontSize="6" textAnchor="middle" fontFamily="monospace" letterSpacing="1">
            DEMO / SIMULATED COORDINATES
          </text>
        )}
      </svg>
    </div>
  );
}
