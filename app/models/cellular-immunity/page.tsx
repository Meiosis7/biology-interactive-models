import { CellularImmunityLab } from "../../../models/06-cellular-immunity/CellularImmunityLab";
import "../../../models/06-cellular-immunity/cellular-immunity.css";
import { ModelNav } from "../../../components/model-shell/ModelNav";
import "../../../components/model-shell/model-shell.css";

export default function CellularImmunityPage() {
  return (
    <>
      <ModelNav currentSlug="cellular-immunity" />
      <CellularImmunityLab />
    </>
  );
}
