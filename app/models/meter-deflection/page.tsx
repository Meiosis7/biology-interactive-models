import { MeterDeflectionLab } from "../../../models/04-meter-deflection/MeterDeflectionLab";
import "../../../models/04-meter-deflection/meter-deflection.css";
import { ModelNav } from "../../../components/model-shell/ModelNav";
import "../../../components/model-shell/model-shell.css";

export default function MeterDeflectionPage() {
  return (
    <>
      <ModelNav currentSlug="meter-deflection" />
      <MeterDeflectionLab />
    </>
  );
}
