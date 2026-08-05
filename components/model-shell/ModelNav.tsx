import Link from "next/link";
import { getAdjacentModels, MODEL_CATALOG } from "../../models/catalog";

interface ModelNavProps {
  currentSlug: string;
}

export function ModelNav({ currentSlug }: ModelNavProps) {
  const current = MODEL_CATALOG.find((model) => model.slug === currentSlug);
  const { previous, next } = getAdjacentModels(currentSlug);

  if (!current) {
    throw new Error(`Unknown model slug: ${currentSlug}`);
  }

  return (
    <nav className="model-nav" aria-label="模型导航">
      <div className="model-nav__content">
        <Link className="model-nav__home" href="/">
          全部模型
        </Link>
        <p className="model-nav__current">
          模型 {current.order} / {MODEL_CATALOG.length} · {current.title}
        </p>
        <div className="model-nav__links">
          <Link href={previous.href}>← 上一个：{previous.title}</Link>
          <Link href={next.href}>下一个：{next.title} →</Link>
        </div>
      </div>
    </nav>
  );
}
