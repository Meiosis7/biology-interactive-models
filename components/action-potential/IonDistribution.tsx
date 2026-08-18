import type { CSSProperties } from "react";

type FreeIonSpecies = "sodium" | "potassium";
type FreeIonRegion = "outside-top" | "inside" | "outside-bottom";

interface FreeIonPoint {
  species: FreeIonSpecies;
  x: number;
  y: number;
}

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
  { species: "potassium", x: 14, y: 24 },
  { species: "potassium", x: 28, y: 72 },
  { species: "potassium", x: 42, y: 24 },
  { species: "potassium", x: 58, y: 72 },
  { species: "potassium", x: 72, y: 24 },
  { species: "potassium", x: 86, y: 72 },
  { species: "potassium", x: 7, y: 70 },
  { species: "potassium", x: 93, y: 28 },
  { species: "sodium", x: 21, y: 26 },
  { species: "sodium", x: 79, y: 70 },
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
      {REGIONS.map((region) => (
        <div
          key={region.id}
          className={`ap-free-ion-region ap-free-ion-region--${region.id}`}
          data-free-ion-region={region.id}
          role="img"
          aria-label={region.label}
        >
          {region.ions.map((ion, index) => (
            <i
              key={`${ion.species}-${index}`}
              className={`ap-free-ion ap-free-ion--${ion.species}`}
              data-free-ion-species={ion.species}
              style={
                {
                  "--free-ion-x": `${ion.x}%`,
                  "--free-ion-y": `${ion.y}%`,
                } as CSSProperties
              }
              aria-hidden="true"
            >
              {LABELS[ion.species]}
            </i>
          ))}
        </div>
      ))}
    </div>
  );
}
