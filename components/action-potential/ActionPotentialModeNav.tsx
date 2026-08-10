import { ACTION_POTENTIAL_MODES } from "./modeData";
import type { ActionPotentialMode } from "./types";

interface ActionPotentialModeNavProps {
  mode: ActionPotentialMode;
  onModeChange: (mode: ActionPotentialMode) => void;
}

export function ActionPotentialModeNav({
  mode,
  onModeChange,
}: ActionPotentialModeNavProps) {
  return (
    <nav className="ap-mode-nav" aria-label="动作电位三个模式">
      {ACTION_POTENTIAL_MODES.map((item, index) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={mode === item.id}
          onClick={() => onModeChange(item.id)}
        >
          <span aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
