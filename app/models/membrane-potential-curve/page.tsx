import { MembraneCurveLab } from "../../../models/03-membrane-potential-curve/MembraneCurveLab";
import "../../../models/03-membrane-potential-curve/membrane-curve.css";
import { ModelNav } from "../../../components/model-shell/ModelNav";
import "../../../components/model-shell/model-shell.css";

export default function MembranePotentialCurvePage() {
  return (
    <>
      <ModelNav currentSlug="membrane-potential-curve" />
      <MembraneCurveLab />
    </>
  );
}
