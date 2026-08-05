import { ActionPotentialLab } from "../../../components/action-potential/ActionPotentialLab";
import "../../../components/action-potential/action-potential.css";
import { ModelNav } from "../../../components/model-shell/ModelNav";
import "../../../components/model-shell/model-shell.css";

export default function ActionPotentialPage() {
  return (
    <>
      <ModelNav currentSlug="action-potential" />
      <ActionPotentialLab />
    </>
  );
}
