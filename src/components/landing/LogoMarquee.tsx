/**
 * LogoMarquee — an infinite, edge-faded strip of brand logos: "speaks your
 * whole stack". Logos sit desaturated (idle) and pop to full color on hover,
 * reusing the page's gray→color language. The track holds two copies of the
 * list so a -50% translate (see `.marquee-track` in index.css) loops seamlessly;
 * hovering pauses it. Inert under prefers-reduced-motion.
 */
import { Icon } from '@iconify/react';

const LOGOS = [
  'logos:react',
  'logos:vue',
  'logos:typescript-icon',
  'logos:nodejs-icon',
  'logos:go',
  'logos:python',
  'logos:graphql',
  'logos:postgresql',
  'logos:redis',
  'logos:mongodb-icon',
  'logos:rabbitmq-icon',
  'logos:nginx',
  'logos:docker-icon',
  'logos:kubernetes',
  'logos:aws',
  'logos:google-cloud',
];

export function LogoMarquee() {
  return (
    <div className="border-y border-zinc-900 bg-zinc-950 py-10">
      <p className="mb-7 text-center text-xs font-medium uppercase tracking-widest text-zinc-600">
        Speaks your whole stack
      </p>
      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track gap-12 px-6">
          {/* two copies for a seamless loop */}
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <Icon
              key={`${logo}-${i}`}
              icon={logo}
              aria-hidden="true"
              className="h-8 w-8 shrink-0 opacity-50 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
