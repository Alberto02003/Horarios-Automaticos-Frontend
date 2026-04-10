import { useMemo } from "react";

// SVG paw print path
const PAW_SVG = (
  <g>
    {/* Main pad */}
    <ellipse cx="12" cy="16" rx="5" ry="4.5" />
    {/* Toe pads */}
    <circle cx="5.5" cy="8" r="2.5" />
    <circle cx="18.5" cy="8" r="2.5" />
    <circle cx="9" cy="5" r="2.2" />
    <circle cx="15" cy="5" r="2.2" />
  </g>
);

import { PASTEL_COLORS } from "@/constants";


interface PawStep {
  x: number;
  y: number;
  rotation: number;
  color: string;
  delay: number;
  scale: number;
}

function generateCatPath(seed: number): PawStep[] {
  const steps: PawStep[] = [];
  // Simulate a cat walking in a winding path across the screen
  // Each "step" is a group of 4 paws (front-left, front-right, back-left, back-right)

  const rng = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 4973) * 49999;
    return x - Math.floor(x);
  };

  // Generate waypoints for the cat's path
  const waypoints: { x: number; y: number }[] = [];
  const numWaypoints = 12;
  for (let i = 0; i < numWaypoints; i++) {
    waypoints.push({
      x: (i / (numWaypoints - 1)) * 100,
      y: 15 + rng(i * 7) * 70, // between 15% and 85% of height
    });
  }

  // Interpolate between waypoints to create smooth path
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // 2 sets of 4 paws between each waypoint pair
    for (let s = 0; s < 2; s++) {
      const t = (s + 0.3) / 2.6;
      const cx = from.x + dx * t;
      const cy = from.y + dy * t;
      const colorIdx = (i * 2 + s) % PASTEL_COLORS.length;
      const stepDelay = (i * 2 + s) * 0.8;
      const pawSize = 0.6 + rng(i * 13 + s * 7) * 0.4;

      // Front-left paw
      steps.push({
        x: cx - 1.2 + Math.sin((angle * Math.PI) / 180) * 1.5,
        y: cy - 1.0 - Math.cos((angle * Math.PI) / 180) * 1.5,
        rotation: angle - 5 + rng(i * 3 + s) * 10,
        color: PASTEL_COLORS[colorIdx],
        delay: stepDelay,
        scale: pawSize,
      });
      // Front-right paw
      steps.push({
        x: cx + 1.2 - Math.sin((angle * Math.PI) / 180) * 1.5,
        y: cy + 1.0 + Math.cos((angle * Math.PI) / 180) * 1.5,
        rotation: angle + 5 - rng(i * 5 + s) * 10,
        color: PASTEL_COLORS[(colorIdx + 1) % PASTEL_COLORS.length],
        delay: stepDelay + 0.15,
        scale: pawSize,
      });
      // Back-left paw (slightly behind)
      steps.push({
        x: cx - 1.0 + Math.sin((angle * Math.PI) / 180) * 1.5 - dx * 0.04,
        y: cy - 0.8 - Math.cos((angle * Math.PI) / 180) * 1.5 - dy * 0.04,
        rotation: angle - 8 + rng(i * 9 + s) * 16,
        color: PASTEL_COLORS[(colorIdx + 2) % PASTEL_COLORS.length],
        delay: stepDelay + 0.3,
        scale: pawSize * 0.9,
      });
      // Back-right paw
      steps.push({
        x: cx + 1.0 - Math.sin((angle * Math.PI) / 180) * 1.5 - dx * 0.04,
        y: cy + 0.8 + Math.cos((angle * Math.PI) / 180) * 1.5 - dy * 0.04,
        rotation: angle + 8 - rng(i * 11 + s) * 16,
        color: PASTEL_COLORS[(colorIdx + 3) % PASTEL_COLORS.length],
        delay: stepDelay + 0.45,
        scale: pawSize * 0.9,
      });
    }
  }

  return steps;
}

export default function CatPaws() {
  const paths = useMemo(() => {
    // Generate 2 cat paths for more visual interest
    return [
      ...generateCatPath(42),
      ...generateCatPath(137).map((s) => ({ ...s, delay: s.delay + 10 })),
    ];
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {paths.map((step, i) => (
        <svg
          key={i}
          width="24"
          height="24"
          viewBox="0 0 24 22"
          className="absolute"
          style={{
            left: `${step.x}%`,
            top: `${step.y}%`,
            transform: `rotate(${step.rotation}deg) scale(${step.scale})`,
            fill: step.color,
            opacity: 0,
            animation: `pawAppear 3s ease-in-out ${step.delay}s infinite`,
          }}
        >
          {PAW_SVG}
        </svg>
      ))}
    </div>
  );
}
