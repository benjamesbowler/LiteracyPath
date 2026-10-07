import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/nunito/800.css';
import CampaignActivity from '../../src/features/soundSeekers/rounded/CampaignActivity.jsx';
import { soundSeekersRoundedCssVariables } from '../../src/features/soundSeekers/visual/visualTokens.js';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { createCampaignPreviewProgress } from '../../src/features/soundSeekers/preview/campaignPreview.js';
import { startRoundedMission, currentCampaignCheckpoint } from '../../src/features/soundSeekers/rounded/campaignController.js';
import { recordTaught } from '../../src/features/soundSeekers/v3/engine/progress.js';
import { publicBeat } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { createCampaignBeatState, resolveCampaignAction } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import '../../src/features/soundSeekers/rounded/rounded-campaign.css';

// Synthetic rendering inventory only. No storage, audio exposure, teaching
// credit, campaign completion or hosted learner submission exists here.
function packFor(mission) {
  let progress = createCampaignPreviewProgress(mission.stageId);
  for (const earlier of CAMPAIGN_MISSIONS) {
    if (earlier.id === mission.id) break;
    if (earlier.stageId !== mission.stageId) continue;
    progress = recordTaught(progress, earlier.curriculum.targetIds || []);
    progress.campaign.completedMissions[earlier.id] = { at: 0, previewFixture: true };
  }
  return currentCampaignCheckpoint(startRoundedMission(progress, mission.id, { attemptId: `render:${mission.id}`, now: 1 })).challenges;
}
function Review() {
  const [missionId, setMission] = useState(CAMPAIGN_MISSIONS[0].id);
  const mission = CAMPAIGN_MISSIONS.find(item => item.id === missionId);
  const [pack, setPack] = useState(() => packFor(mission));
  const [index, setIndex] = useState(0);
  const beat = pack[index];
  const [state, setState] = useState(() => createCampaignBeatState(beat));
  const [feedback, setFeedback] = useState(null);
  function enter(id, judged = false) {
    const next = packFor(CAMPAIGN_MISSIONS.find(item => item.id === id));
    const cursor = judged ? next.findIndex(item => item.mechanic !== 'sound_signpost') : 0;
    setMission(id); setPack(next); setIndex(cursor); setState(createCampaignBeatState(next[cursor])); setFeedback(null);
  }
  return <main className="rc-game" style={soundSeekersRoundedCssVariables()} data-rendered-mission={missionId} data-errors={state.errors}>
    <header className="rc-header"><label htmlFor="mission">Synthetic mission</label><select id="mission" value={missionId} onChange={e => enter(e.target.value)}>
      {CAMPAIGN_MISSIONS.map(item => <option key={item.id} value={item.id}>{item.id}</option>)}
    </select><button onClick={() => enter(missionId, true)}>First decision</button></header>
    <section className="rc-activity"><CampaignActivity key={`${missionId}:${index}`} beat={publicBeat(beat)} state={state} feedback={feedback}
      residentId={mission.residentId} reducedMotion missionStep={{ index, total: pack.length }}
      onAction={action => { const result = resolveCampaignAction(beat, state, action); setState(result.state); setFeedback({ ...result.outcome, action }); }} /></section>
  </main>;
}
createRoot(document.getElementById('root')).render(<Review />);
