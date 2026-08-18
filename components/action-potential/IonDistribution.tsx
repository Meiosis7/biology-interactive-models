import type { CSSProperties } from "react";

type FreeIonSpecies = "sodium" | "potassium";
type FreeIonRegion = "outside-top" | "inside" | "outside-bottom";

interface FreeIonPoint {
  species: FreeIonSpecies;
  x: number;
  y: number;
}

interface FreeIonMotionProfile {
  x: string;
  y: string;
  mobileX: string;
  mobileY: string;
  duration: string;
  delay: string;
}

const MOTION_PROFILES: readonly FreeIonMotionProfile[] = [
  { x: "3px", y: "1px", mobileX: "2px", mobileY: "1px", duration: "7.2s", delay: "-1.4s" },
  { x: "-2px", y: "3px", mobileX: "-1px", mobileY: "2px", duration: "8.1s", delay: "-3.7s" },
  { x: "2px", y: "-3px", mobileX: "1px", mobileY: "-2px", duration: "9.3s", delay: "-5.1s" },
  { x: "-3px", y: "-1px", mobileX: "-2px", mobileY: "-1px", duration: "10.4s", delay: "-2.2s" },
  { x: "1px", y: "3px", mobileX: "1px", mobileY: "2px", duration: "7.8s", delay: "-6s" },
  { x: "-1px", y: "-2px", mobileX: "-1px", mobileY: "-2px", duration: "10.8s", delay: "-4.4s" },
] as const;

const LABELS: Record<FreeIonSpecies, string> = {
  sodium: "Na⁺",
  potassium: "K⁺",
};

const OUTSIDE_POINTS: readonly FreeIonPoint[] = [
  { species: "sodium", x: 14, y: 24 },
  { species: "sodium", x: 28, y: 72 },
  { species: "sodium", x: 42, y: 22 },
  { species: "sodium", x: 58, y: 70 },
  { species: "sodium", x: 72, y: 24 },
  { species: "sodium", x: 86, y: 70 },
  { species: "potassium", x: 7, y: 78 },
  { species: "potassium", x: 93, y: 20 },
] as const;

const INSIDE_POINTS: readonly FreeIonPoint[] = [
  { species: "potassium", x: 14, y: 12 },
  { species: "potassium", x: 14, y: 38 },
  { species: "potassium", x: 43, y: 12 },
  { species: "potassium", x: 43, y: 38 },
  { species: "potassium", x: 57, y: 12 },
  { species: "potassium", x: 57, y: 38 },
  { species: "potassium", x: 86, y: 12 },
  { species: "potassium", x: 86, y: 38 },
  { species: "sodium", x: 71, y: 12 },
  { species: "sodium", x: 71, y: 38 },
] as const;

const REGIONS: ReadonlyArray<{
  id: FreeIonRegion;
  label: string;
  ions: readonly FreeIonPoint[];
}> = [
  { id: "outside-top", label: "上方膜外 Na⁺多、K⁺少", ions: OUTSIDE_POINTS },
  { id: "inside", label: "膜内 K⁺多、Na⁺少", ions: INSIDE_POINTS },
  { id: "outside-bottom", label: "下方膜外 Na⁺多、K⁺少", ions: OUTSIDE_POINTS },
];

export function IonDistribution() {
  return (
    <div className="ap-free-ion-distribution" data-testid="free-ion-distribution">
      {REGIONS.map((region, regionIndex) => (
        <div
          key={region.id}
          className={`ap-free-ion-region ap-free-ion-region--${region.id}`}
          data-free-ion-region={region.id}
          role="img"
          aria-label={region.label}
        >
          {region.ions.map((ion, index) => {
            const profileIndex = (regionIndex * 2 + index) % MOTION_PROFILES.length;
            const motion = MOTION_PROFILES[profileIndex];

            return (
              <i
                key={`${ion.species}-${index}`}
                className={`ap-free-ion ap-free-ion--${ion.species}`}
                data-free-ion-species={ion.species}
                data-motion-profile={profileIndex}
                style={
                  {
                    "--free-ion-x": `${ion.x}%`,
                    "--free-ion-y": `${ion.y}%`,
                    "--free-ion-drift-x": motion.x,
                    "--free-ion-drift-y": motion.y,
                    "--free-ion-mobile-drift-x": motion.mobileX,
                    "--free-ion-mobile-drift-y": motion.mobileY,
                    "--free-ion-drift-duration": motion.duration,
                    "--free-ion-drift-delay": motion.delay,
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                {LABELS[ion.species]}
              </i>
            );
          })}
        </div>
      ))}
    </div>
  );
}
