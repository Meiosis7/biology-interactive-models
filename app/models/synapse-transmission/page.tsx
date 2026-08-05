import { SynapseLab } from "../../../models/02-synapse-transmission/SynapseLab";
import "../../../models/02-synapse-transmission/synapse.css";
import { ModelNav } from "../../../components/model-shell/ModelNav";
import "../../../components/model-shell/model-shell.css";

export default function SynapseTransmissionPage() {
  return (
    <>
      <ModelNav currentSlug="synapse-transmission" />
      <SynapseLab />
    </>
  );
}
