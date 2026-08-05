import { HumoralImmunityLab } from "../../../models/05-humoral-immunity/HumoralImmunityLab";
import "../../../models/05-humoral-immunity/humoral-immunity.css";
import { ModelNav } from "../../../components/model-shell/ModelNav";
import "../../../components/model-shell/model-shell.css";

export default function HumoralImmunityPage() {
  return (
    <>
      <ModelNav currentSlug="humoral-immunity" />
      <HumoralImmunityLab />
    </>
  );
}
