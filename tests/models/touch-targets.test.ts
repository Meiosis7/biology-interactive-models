import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const scopedLabStyles = [
  ["models/03-membrane-potential-curve/membrane-curve.css", ".membrane-shell"],
  ["models/04-meter-deflection/meter-deflection.css", ".meter-shell"],
  ["models/05-humoral-immunity/humoral-immunity.css", ".humoral-shell"],
  ["models/06-cellular-immunity/cellular-immunity.css", ".cellular-shell"],
] as const;

describe("interactive lab touch targets", () => {
  it.each(scopedLabStyles)("keeps every %s button at least 44px high", (stylesheet, scope) => {
    const styles = readFileSync(stylesheet, "utf8");

    expect(styles).toMatch(new RegExp(`${scope.replace(".", "\\.")}\\s+button\\s*\\{[^}]*min-height:\\s*44px;`, "s"));
  });

  it("keeps the meter hint-dismissal variant at 44px", () => {
    const styles = readFileSync("models/04-meter-deflection/meter-deflection.css", "utf8");

    expect(styles).toMatch(/\.meter-button\.small\s*\{[^}]*min-height:\s*44px;/s);
  });
});
