import { useMemo } from 'react';
import type { Season } from '../types';

const COUNT: Record<Season, number> = { spring: 12, summer: 8, fall: 14, winter: 22 };

// Ekranın üstünden süzülen yapraklar, çiçek yaprakları, polen ya da kar
export function Particles({ season }: { season: Season }) {
  const items = useMemo(
    () =>
      Array.from({ length: COUNT[season] }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: -Math.random() * 20,
        duration: 12 + Math.random() * 14,
        scale: 0.6 + Math.random() * 0.8,
      })),
    [season],
  );

  return (
    <div className={`particles season-${season}`} aria-hidden>
      {items.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            scale: String(p.scale),
          }}
        />
      ))}
    </div>
  );
}
