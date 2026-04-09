import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { SchemaType, ChangeProposal } from '../../lib/types';
import { SCHEMA_RELATIONSHIPS, COMPONENT_COLORS, HIERARCHY_LEVELS, getColorForTypeKey } from '../../lib/schema-relationships';

interface Props {
  schemaTypes: SchemaType[];
  proposals?: ChangeProposal[];
  selectedType: string | null;
  hoveredType: string | null;
  onSelectType: (typeKey: string) => void;
  onHoverType: (typeKey: string | null) => void;
}

const W = 1400;
const H = 1200;
const CX = W / 2;
const CY = 500;
const L1_RING = 310;
const L2_EXT = 180;
const L3_EXT = 150;

const L1_ORDER = [
  'datetime', 'conference-day', 'deadline',
  'budget', 'room-block',
  'company-info', 'policy-terms',
  'source',
  'stats', 'content',
  'misc', 'availability-check',
  'food-and-beverage', 'equipment',
  'venue', 'meeting-room',
];

function getNodeSize(level: number) {
  if (level === 0) return { w: 160, h: 56 };
  if (level >= 2) return { w: 136, h: 44 };
  return { w: 150, h: 48 };
}

function rectEdgeOffset(size: { w: number; h: number }, nx: number, ny: number) {
  const ax = Math.abs(nx);
  const ay = Math.abs(ny);
  if (ax < 0.001 && ay < 0.001) return 0;
  const tx = ax > 0.001 ? (size.w / 2) / ax : Infinity;
  const ty = ay > 0.001 ? (size.h / 2) / ay : Infinity;
  return Math.min(tx, ty);
}

const ORPHAN_ROW_Y = CY + L1_RING + 230;
const ORPHAN_COL_W = 180;
const ORPHAN_START_X = 140;
const ORPHANS_PER_ROW = 6;

function computePositions(types: SchemaType[]) {
  const keys = new Set(types.map(s => s.type_key));
  const pos: Record<string, { x: number; y: number }> = {};
  const ang: Record<string, number> = {};

  if (keys.has('event')) {
    pos.event = { x: CX, y: CY };
  }

  const l1 = L1_ORDER.filter(k => keys.has(k));
  l1.forEach((k, i) => {
    const a = (2 * Math.PI * i) / l1.length - Math.PI / 2;
    pos[k] = { x: CX + L1_RING * Math.cos(a), y: CY + L1_RING * Math.sin(a) };
    ang[k] = a;
  });

  types.filter(s => HIERARCHY_LEVELS[s.type_key] === 2).forEach(s => {
    const rel = SCHEMA_RELATIONSHIPS.find(r => r.to === s.type_key);
    if (rel && pos[rel.from]) {
      const a = ang[rel.from] ?? 0;
      pos[s.type_key] = {
        x: pos[rel.from].x + L2_EXT * Math.cos(a),
        y: pos[rel.from].y + L2_EXT * Math.sin(a),
      };
      ang[s.type_key] = a;
    }
  });

  types.filter(s => HIERARCHY_LEVELS[s.type_key] === 3).forEach(s => {
    const rel = SCHEMA_RELATIONSHIPS.find(r => r.to === s.type_key);
    if (rel && pos[rel.from]) {
      const a = ang[rel.from] ?? 0;
      pos[s.type_key] = {
        x: pos[rel.from].x + L3_EXT * Math.cos(a),
        y: pos[rel.from].y + L3_EXT * Math.sin(a),
      };
      ang[s.type_key] = a;
    }
  });

  const orphans = types.filter(s => !pos[s.type_key] && s.type_key !== '_meta');
  orphans.forEach((s, i) => {
    const col = i % ORPHANS_PER_ROW;
    const row = Math.floor(i / ORPHANS_PER_ROW);
    pos[s.type_key] = {
      x: ORPHAN_START_X + col * ORPHAN_COL_W,
      y: ORPHAN_ROW_Y + row * 100,
    };
  });

  return pos;
}

function buildEdgePath(from: { x: number; y: number }, to: { x: number; y: number }, fLvl: number, tLvl: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return '';

  const nx = dx / dist;
  const ny = dy / dist;
  const fOff = rectEdgeOffset(getNodeSize(fLvl), nx, ny) + 6;
  const tOff = rectEdgeOffset(getNodeSize(tLvl), -nx, -ny) + 6;

  const x1 = from.x + nx * fOff;
  const y1 = from.y + ny * fOff;
  const x2 = to.x - nx * tOff;
  const y2 = to.y - ny * tOff;

  const px = -ny;
  const py = nx;
  const curve = dist * 0.06;
  const cpx = (x1 + x2) / 2 + px * curve;
  const cpy = (y1 + y2) / 2 + py * curve;

  return `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`;
}

export default function RelationshipMap({ schemaTypes, proposals = [], selectedType, hoveredType, onSelectType, onHoverType }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const positions = useMemo(() => computePositions(schemaTypes), [schemaTypes]);

  const fieldCounts = useMemo(() => {
    const c: Record<string, number> = {};
    schemaTypes.forEach(s => { c[s.type_key] = Object.keys(s.json_schema.properties || {}).length; });
    return c;
  }, [schemaTypes]);

  const dynamicEdges = useMemo(() => {
    const staticPairs = new Set(SCHEMA_RELATIONSHIPS.map(r => `${r.from}:${r.to}`));
    const edges: { from: string; to: string; label: string }[] = [];
    schemaTypes.forEach(s => {
      (s.parent_types || []).forEach(parentKey => {
        const key = `${parentKey}:${s.type_key}`;
        if (!staticPairs.has(key)) {
          edges.push({ from: parentKey, to: s.type_key, label: `contains ${s.display_name}` });
        }
      });
    });
    return edges;
  }, [schemaTypes]);

  const allEdges = useMemo(
    () => [...SCHEMA_RELATIONSHIPS, ...dynamicEdges],
    [dynamicEdges]
  );

  const highlighted = useMemo(() => {
    const t = hoveredType || selectedType;
    if (!t) return new Set<string>();
    const s = new Set<string>([t]);
    allEdges.forEach(r => {
      if (r.from === t) s.add(r.to);
      if (r.to === t) s.add(r.from);
    });
    return s;
  }, [selectedType, hoveredType, allEdges]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const ctm = svg.getScreenCTM()?.inverse();
      if (!ctm) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPt = pt.matrixTransform(ctm);
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      setCamera(prev => {
        const nz = Math.max(0.3, Math.min(4, prev.zoom * factor));
        const ratio = nz / prev.zoom;
        return {
          x: svgPt.x * (1 - ratio) + prev.x * ratio,
          y: svgPt.y * (1 - ratio) + prev.y * ratio,
          zoom: nz,
        };
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const handlePanStart = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragRef.current = { active: true, x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const handlePanMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return;
    const sdx = e.clientX - dragRef.current.x;
    const sdy = e.clientY - dragRef.current.y;
    const dx = ctm.a * sdx + ctm.c * sdy;
    const dy = ctm.b * sdx + ctm.d * sdy;
    setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
  }, []);

  const handlePanEnd = useCallback(() => {
    setIsDragging(false);
    dragRef.current.active = false;
  }, []);

  const zoomIn = useCallback(() => {
    setCamera(prev => {
      const nz = Math.min(4, prev.zoom * 1.3);
      const r = nz / prev.zoom;
      return { x: CX * (1 - r) + prev.x * r, y: CY * (1 - r) + prev.y * r, zoom: nz };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setCamera(prev => {
      const nz = Math.max(0.3, prev.zoom * 0.75);
      const r = nz / prev.zoom;
      return { x: CX * (1 - r) + prev.x * r, y: CY * (1 - r) + prev.y * r, zoom: nz };
    });
  }, []);

  const resetView = useCallback(() => setCamera({ x: 0, y: 0, zoom: 1 }), []);

  const hoveredSchema = schemaTypes.find(s => s.type_key === hoveredType);
  const hoveredConnections = useMemo(() => {
    if (!hoveredType) return [];
    return allEdges
      .filter(r => r.from === hoveredType || r.to === hoveredType)
      .map(r => ({
        label: r.label,
        targetName: schemaTypes.find(s => s.type_key === (r.from === hoveredType ? r.to : r.from))?.display_name || '',
      }));
  }, [hoveredType, schemaTypes, allEdges]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[600px] rounded-xl overflow-hidden select-none"
      style={{
        touchAction: 'none',
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(circle, #cbd5e1 0.8px, transparent 0.8px)',
        backgroundSize: '20px 20px',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
        {[
          { icon: ZoomIn, fn: zoomIn, title: 'Zoom in' },
          { icon: ZoomOut, fn: zoomOut, title: 'Zoom out' },
          { icon: Maximize2, fn: resetView, title: 'Reset view' },
        ].map(({ icon: Icon, fn, title }) => (
          <button key={title} onClick={fn} title={title}
            className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
            <Icon className="w-4 h-4 text-slate-600" />
          </button>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 z-10 px-2.5 py-1 bg-white/80 backdrop-blur-sm rounded-md text-xs text-slate-500 border border-slate-200 font-medium tabular-nums">
        {Math.round(camera.zoom * 100)}%
      </div>

      {hoveredSchema && !isDragging && (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-xl shadow-lg border border-slate-200 p-4 w-56 pointer-events-none">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getColorForTypeKey(hoveredType!) }} />
            <span className="text-sm font-semibold text-slate-900 truncate">{hoveredSchema.display_name}</span>
          </div>
          <p className="text-xs text-slate-500 mb-2 line-clamp-2 leading-relaxed">{hoveredSchema.description}</p>
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
            <span>{fieldCounts[hoveredType!] || 0} fields</span>
            <span className="text-slate-300">|</span>
            <span>Level {HIERARCHY_LEVELS[hoveredType!] ?? 0}</span>
          </div>
          {hoveredConnections.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-0.5">
              {hoveredConnections.map(c => (
                <p key={c.targetName} className="text-xs text-slate-500">
                  <span className="text-slate-400 italic">{c.label}</span>{' '}
                  <span className="font-medium">{c.targetName}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0.5 L7,3 L0,5.5" fill="none" stroke="#94a3b8" strokeWidth="1" />
          </marker>
          <marker id="arr-hl" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <path d="M0,0.5 L9,3.5 L0,6.5" fill="none" stroke="#0891b2" strokeWidth="1.2" />
          </marker>
          <filter id="nshadow" x="-8%" y="-6%" width="116%" height="128%">
            <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.06" />
          </filter>
          <filter id="nglow" x="-12%" y="-12%" width="124%" height="124%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#0891b2" floodOpacity="0.25" />
          </filter>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="transparent"
          onPointerDown={handlePanStart}
          onPointerMove={handlePanMove}
          onPointerUp={handlePanEnd}
        />

        <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.zoom})`}>
          {proposals
            .filter(p =>
              (p.change_type === 'add_relationship' || p.change_type === 'remove_relationship') &&
              !['implemented', 'rejected'].includes(p.status) &&
              p.proposed_value?.from && p.proposed_value?.to
            )
            .map(p => {
              const fromKey = p.proposed_value.from as string;
              const toKey = p.proposed_value.to as string;
              const from = positions[fromKey];
              const to = positions[toKey];
              if (!from || !to) return null;
              const fLvl = HIERARCHY_LEVELS[fromKey] ?? 1;
              const tLvl = HIERARCHY_LEVELS[toKey] ?? 1;
              const path = buildEdgePath(from, to, fLvl, tLvl);
              return (
                <g key={`proposed-${p.id}`}>
                  <path d={path} fill="none" stroke="#d97706" strokeWidth="2"
                    strokeDasharray="6 4" opacity={0.7}
                    className="pointer-events-none" />
                  <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 12}
                    textAnchor="middle" fontSize="8" fontWeight="500" fill="#d97706"
                    className="pointer-events-none">
                    proposed: {p.title}
                  </text>
                </g>
              );
            })}

          {allEdges.map(rel => {
            const from = positions[rel.from];
            const to = positions[rel.to];
            if (!from || !to) return null;
            const fLvl = HIERARCHY_LEVELS[rel.from] ?? 1;
            const tLvl = HIERARCHY_LEVELS[rel.to] ?? 1;
            const path = buildEdgePath(from, to, fLvl, tLvl);
            const key = `${rel.from}-${rel.to}`;
            const isActive = highlighted.has(rel.from) && highlighted.has(rel.to);
            const isDimmed = highlighted.size > 0 && !isActive;
            const isHovered = hoveredEdge === key;

            return (
              <g key={key}>
                <path d={path} fill="none" stroke="transparent" strokeWidth="14"
                  onMouseEnter={() => setHoveredEdge(key)}
                  onMouseLeave={() => setHoveredEdge(null)} />
                <path d={path} fill="none"
                  stroke={isActive ? '#0891b2' : '#cbd5e1'}
                  strokeWidth={isActive ? 2 : 1}
                  opacity={isDimmed ? 0.12 : isActive ? 1 : 0.5}
                  markerEnd={isActive ? 'url(#arr-hl)' : 'url(#arr)'}
                  className="transition-all duration-200 pointer-events-none" />
                {isHovered && (
                  <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 10}
                    textAnchor="middle" fontSize="9" fontWeight="500" fill="#0e7490"
                    className="pointer-events-none">
                    {rel.label}
                  </text>
                )}
              </g>
            );
          })}

          {schemaTypes.map(st => {
            const p = positions[st.type_key];
            if (!p) return null;
            const lvl = HIERARCHY_LEVELS[st.type_key] ?? 1;
            const { w, h } = getNodeSize(lvl);
            const color = getColorForTypeKey(st.type_key);
            const isSel = selectedType === st.type_key;
            const inPath = highlighted.size > 0 && highlighted.has(st.type_key);
            const dimmed = highlighted.size > 0 && !inPath;
            const fields = fieldCounts[st.type_key] || 0;
            const isRoot = lvl === 0;

            return (
              <g key={st.type_key}
                transform={`translate(${p.x - w / 2}, ${p.y - h / 2})`}
                onClick={() => onSelectType(st.type_key)}
                onMouseEnter={() => onHoverType(st.type_key)}
                onMouseLeave={() => onHoverType(null)}
                className="cursor-pointer"
                opacity={dimmed ? 0.1 : 1}
                filter={isSel ? 'url(#nglow)' : 'url(#nshadow)'}>

                <rect width={w} height={h} rx={isRoot ? 16 : 10}
                  fill={isSel ? color : 'white'}
                  stroke={isSel ? color : inPath ? color : '#e2e8f0'}
                  strokeWidth={isSel ? 2.5 : inPath ? 2 : 1}
                  className="transition-all duration-200" />

                {!isSel && (
                  <rect x="0" y={h * 0.2} width="3.5" height={h * 0.6} rx="1.75"
                    fill={color} opacity={inPath ? 1 : 0.5} />
                )}

                <text x={w / 2} y={h / 2 - (isRoot ? 3 : 4)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={isRoot ? 14 : 11} fontWeight={isRoot ? 700 : 600}
                  fill={isSel ? 'white' : '#1e293b'}
                  className="pointer-events-none">
                  {st.display_name}
                </text>

                <text x={w / 2} y={h / 2 + (isRoot ? 13 : 10)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="9" fill={isSel ? 'rgba(255,255,255,0.7)' : '#94a3b8'}
                  className="pointer-events-none">
                  {fields} field{fields !== 1 ? 's' : ''}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
