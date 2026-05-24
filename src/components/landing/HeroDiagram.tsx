/**
 * HeroDiagram — the landing page's animated centerpiece.
 *
 * A self-contained microservice topology that demonstrates the product's core
 * idea: not just *what* components exist, but *how data flows* between them.
 * Protocol-colored dots animate along each edge via GSAP's MotionPathPlugin —
 * the same technique the real editor uses (see `useEdgeAnimation`) — but kept
 * deliberately decoupled from the React Flow editor so this never pulls the
 * editor bundle into the landing chunk.
 *
 * The node cards intentionally mirror the real `ArchitectureNode`: a vertical
 * layout with a node-type-tinted icon chip on top, a bold display name, the
 * uppercase mono type label, a faint background tint, an accent glow, and the
 * four connection-handle dots. Edges + flow dots live in an SVG layer behind the
 * cards; both share the same 820×440 coordinate space, so percentage-positioned
 * cards line up with the SVG paths at any width.
 */
import { useEffect, useRef } from 'react';
import { Icon as IconifyIcon, loadIcons } from '@iconify/react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

// ── Coordinate space (matches the SVG viewBox) ───────────────────────────────
const W = 820;
const H = 440;
const NW = 150; // node width
const NH = 108; // node height (vertical layout, like the real node)

type Accent = 'violet' | 'purple' | 'blue' | 'emerald' | 'red' | 'amber';

interface DiagramNode {
  id: string;
  x: number;
  y: number;
  /** Display name (top, bold). */
  label: string;
  /** Node type — rendered uppercase/mono below the name, like the editor. */
  type: string;
  accent: Accent;
  /** Iconify icon id (full-color brand logo) — same source the editor uses. */
  logo: string;
}

const NODES: DiagramNode[] = [
  { id: 'client', x: 16, y: 186, label: 'Web App', type: 'Client', accent: 'violet', logo: 'logos:vue' },
  { id: 'gateway', x: 232, y: 186, label: 'API Gateway', type: 'Gateway', accent: 'purple', logo: 'logos:aws-api-gateway' },
  { id: 'auth', x: 452, y: 52, label: 'Auth Service', type: 'Service', accent: 'blue', logo: 'logos:nodejs-icon' },
  { id: 'orders', x: 452, y: 320, label: 'Orders Service', type: 'Service', accent: 'blue', logo: 'logos:go' },
  { id: 'db', x: 654, y: 52, label: 'PostgreSQL', type: 'Database', accent: 'emerald', logo: 'logos:postgresql' },
  { id: 'cache', x: 654, y: 186, label: 'Redis', type: 'Cache', accent: 'red', logo: 'logos:redis' },
  { id: 'queue', x: 654, y: 320, label: 'RabbitMQ', type: 'Queue', accent: 'amber', logo: 'logos:rabbitmq-icon' },
];

interface DiagramEdge {
  from: string;
  to: string;
  /** Flow-dot color, keyed to the protocol (see PROTOCOL_CONFIG). */
  color: string;
}

const EDGES: DiagramEdge[] = [
  { from: 'client', to: 'gateway', color: '#60a5fa' }, // HTTP
  { from: 'gateway', to: 'auth', color: '#60a5fa' }, // HTTP
  { from: 'gateway', to: 'orders', color: '#60a5fa' }, // HTTP
  { from: 'auth', to: 'db', color: '#34d399' }, // gRPC
  { from: 'auth', to: 'cache', color: '#60a5fa' }, // HTTP
  { from: 'orders', to: 'cache', color: '#60a5fa' }, // HTTP
  { from: 'orders', to: 'queue', color: '#fbbf24' }, // AMQP
];

// Per-accent hex (drives the card border, glow and tint) + node-type chip classes
// mirroring `NODE_TYPES_CONFIG`'s `bgClass`/`borderClass`.
const ACCENT: Record<Accent, { hex: string; chipBg: string; chipBorder: string }> = {
  violet: { hex: '#a78bfa', chipBg: 'bg-violet-500/10', chipBorder: 'border-violet-500/20' },
  purple: { hex: '#c084fc', chipBg: 'bg-purple-500/10', chipBorder: 'border-purple-500/20' },
  blue: { hex: '#60a5fa', chipBg: 'bg-blue-500/10', chipBorder: 'border-blue-500/20' },
  emerald: { hex: '#34d399', chipBg: 'bg-emerald-500/10', chipBorder: 'border-emerald-500/20' },
  red: { hex: '#f87171', chipBg: 'bg-red-500/10', chipBorder: 'border-red-500/20' },
  amber: { hex: '#fbbf24', chipBg: 'bg-amber-500/10', chipBorder: 'border-amber-500/20' },
};

const nodeById = (id: string) => NODES.find((n) => n.id === id)!;

/** Smooth horizontal S-curve from a node's right edge to the next node's left edge. */
function edgePath(e: DiagramEdge): string {
  const s = nodeById(e.from);
  const t = nodeById(e.to);
  const sx = s.x + NW;
  const sy = s.y + NH / 2;
  const tx = t.x;
  const ty = t.y + NH / 2;
  const mx = (sx + tx) / 2;
  return `M ${sx},${sy} C ${mx},${sy} ${mx},${ty} ${tx},${ty}`;
}

const PATHS = EDGES.map(edgePath);

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A connection-handle dot, like the editor's React Flow handles. */
function Handle({ className }: { className: string }) {
  return (
    <span
      className={cn(
        'absolute h-2 w-2 rounded-full border-2 border-zinc-950 bg-zinc-700',
        className,
      )}
    />
  );
}

export function HeroDiagram({ className }: { className?: string }) {
  const scope = useRef<HTMLDivElement>(null);

  // Warm the Iconify cache for all brand logos up front so they appear together
  // rather than popping in one-by-one as each <Icon> mounts.
  useEffect(() => {
    loadIcons(NODES.map((n) => n.logo));
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion) return;

      // Subtle "current" along the dashed edge overlays.
      gsap.to('.hero-flow-line', { strokeDashoffset: -16, duration: 0.8, ease: 'none', repeat: -1 });

      // One traveling packet per edge, staggered so the whole graph feels alive.
      const packets = gsap.utils.toArray<SVGGElement>('.hero-packet');
      packets.forEach((g) => {
        const i = Number(g.dataset.edge);
        gsap.to(g, {
          motionPath: { path: PATHS[i], autoRotate: false },
          duration: 1.7 + (i % 3) * 0.35,
          ease: 'none',
          repeat: -1,
          delay: i * 0.28,
        });
      });
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className={cn('relative w-full aspect-[820/440] select-none', className)}
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(63,63,70,0.5) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
      aria-hidden="true"
    >
      {/* Edge + packet layer */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible">
        {EDGES.map((e, i) => (
          <g key={`${e.from}-${e.to}`}>
            {/* base line */}
            <path d={PATHS[i]} fill="none" stroke="#3f3f46" strokeWidth={1.5} />
            {/* animated dashed overlay */}
            <path
              className="hero-flow-line"
              d={PATHS[i]}
              fill="none"
              stroke={e.color}
              strokeWidth={1.5}
              strokeOpacity={0.5}
              strokeDasharray="2 6"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* traveling packets (a glow halo + bright core, moved together) */}
        {EDGES.map((e, i) => (
          <g className="hero-packet" data-edge={i} key={`packet-${e.from}-${e.to}`}>
            <circle r={6} fill={e.color} opacity={0.25} />
            <circle r={2.75} fill={e.color} />
          </g>
        ))}
      </svg>

      {/* Node cards — mirror the real ArchitectureNode layout */}
      {NODES.map((n) => {
        const a = ACCENT[n.accent];
        return (
          <div
            key={n.id}
            className="absolute"
            style={{
              left: `${(n.x / W) * 100}%`,
              top: `${(n.y / H) * 100}%`,
              width: `${(NW / W) * 100}%`,
              height: `${(NH / H) * 100}%`,
            }}
          >
            <div
              className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border bg-zinc-900/90 p-3 backdrop-blur-sm"
              style={{ borderColor: `${a.hex}66`, boxShadow: `0 0 28px -8px ${a.hex}99` }}
            >
              {/* faint background tint (like the node's backgroundColor overlay) */}
              <div
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{ backgroundColor: `${a.hex}1f` }}
              />

              {/* connection handles */}
              <Handle className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" />
              <Handle className="bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" />
              <Handle className="left-0 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              <Handle className="right-0 top-1/2 -translate-y-1/2 translate-x-1/2" />

              {/* icon chip (node-type tinted) */}
              <div className={cn('relative rounded-lg border p-2.5', a.chipBg, a.chipBorder)}>
                <IconifyIcon icon={n.logo} className="h-5 w-5" />
              </div>

              {/* name + type */}
              <div className="relative flex flex-col items-center text-center leading-none">
                <span className="text-xs font-semibold text-zinc-100">{n.label}</span>
                <span className="mt-1 font-mono text-[9px] uppercase tracking-tight text-zinc-500">
                  {n.type}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
