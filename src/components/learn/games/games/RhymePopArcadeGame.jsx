import RhymePopPresentation from "./rhymePopPresentation.jsx";

// The public wrapper remains stable; the original aim/fire/physical-collision
// mechanic now owns its authored festival composition and cue/session state.
export default function RhymePopArcadeGame(props) {
  return <RhymePopPresentation {...props} />;
}
