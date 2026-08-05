import { MODEL_CATALOG } from "../../models/catalog";

export function ModelHub() {
  return (
    <main className="model-hub" aria-labelledby="model-hub-title">
      <header className="model-hub__header">
        <p className="model-hub__eyebrow">高中生物 · 选择性必修 1</p>
        <h1 id="model-hub-title">动态交互模型实验台</h1>
        <p className="model-hub__intro">
          从神经调节到免疫调节，按学习顺序进入六个可操作的生物过程模型。
        </p>
      </header>

      <aside className="model-hub__note" aria-label="教学示意说明">
        <span aria-hidden="true">◌</span>
        <p>教学时间、数量和过程均为示意，用于帮助理解教材中的因果关系。</p>
      </aside>

      <ol className="model-hub__grid" aria-label="模型学习路径">
        {MODEL_CATALOG.map((model) => (
          <li
            className="model-card"
            key={model.slug}
            style={{ borderColor: model.themeColor }}
          >
            <div className="model-card__topline">
              <span className="model-card__number">{String(model.order).padStart(2, "0")}</span>
              <span className="model-card__label">{model.shortLabel}</span>
            </div>
            <h2>{model.title}</h2>
            <p className="model-card__description">{model.description}</p>
            <ul className="model-card__points">
              {model.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <a className="model-card__link" href={model.href}>
              进入模型：{model.title}
              <span aria-hidden="true">→</span>
            </a>
          </li>
        ))}
      </ol>
    </main>
  );
}
