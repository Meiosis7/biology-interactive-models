import type { ModeContent } from "./types";

export function ActionPotentialKnowledgeCard({
  content,
}: {
  content: ModeContent;
}) {
  return (
    <aside className="ap-knowledge" aria-label="当前模式知识卡">
      <p className="ap-kicker">当前模式</p>
      <h2>{content.title}</h2>
      <p>{content.summary}</p>
      <dl>
        {content.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
