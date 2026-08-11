import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const scopedLabStyles = [
  ["components/action-potential/action-potential.css", ".lab-shell"],
  ["models/03-membrane-potential-curve/membrane-curve.css", ".membrane-shell"],
  ["models/04-meter-deflection/meter-deflection.css", ".meter-shell"],
  ["models/05-humoral-immunity/humoral-immunity.css", ".humoral-shell"],
  ["models/06-cellular-immunity/cellular-immunity.css", ".cellular-shell"],
] as const;

describe("interactive lab touch targets", () => {
  it.each(scopedLabStyles)(
    "keeps every %s button at least 44px high",
    (stylesheet, scope) => {
      const styles = readFileSync(stylesheet, "utf8");

      expect(styles).toMatch(
        new RegExp(
          `${scope.replace(".", "\\.")}\\s+button\\s*\\{[^}]*min-height:\\s*44px;`,
          "s",
        ),
      );
    },
  );

  it("keeps all five action-potential controls at least 44 by 44 CSS pixels", () => {
    const styles = readFileSync(
      "components/action-potential/action-potential.css",
      "utf8",
    );

    expect(styles).toMatch(
      /\.lab-shell\s+button\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s,
    );
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*\.ap-mode-nav\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
    );
  });

  it("keeps the meter hint-dismissal variant at 44px", () => {
    const styles = readFileSync(
      "models/04-meter-deflection/meter-deflection.css",
      "utf8",
    );

    expect(styles).toMatch(/\.meter-button\.small\s*\{[^}]*min-height:\s*44px;/s);
  });
});
