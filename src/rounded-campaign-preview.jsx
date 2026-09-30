/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.js';
import './index.css';
import SoundSeekersRoute from './features/soundSeekers/SoundSeekersRoute.jsx';
import { createCampaignPreviewProgress } from './features/soundSeekers/preview/campaignPreview.js';
import { campaignStorageKey } from './features/soundSeekers/v3/campaignStorage.js';
import { CAMPAIGN_STAGES } from './features/soundSeekers/v3/content/campaign.js';
import { localProgressStorageKeysForArea } from './utils/progressKeys.js';

const params = new URLSearchParams(location.search);
const stage = params.get('stage') || 'meadow-01';
const scope = `sound-seekers-preview:rounded:${(params.get('scope') || stage).replace(/[^a-z0-9:_-]/gi, '-').slice(0,96)}`;
const valid = CAMPAIGN_STAGES.some(item => item.id === stage);
if (valid && params.get('resume') !== '1') {
  for (const key of localProgressStorageKeysForArea('phonics_quest', scope)) localStorage.removeItem(key);
  localStorage.setItem(campaignStorageKey(scope), JSON.stringify(createCampaignPreviewProgress(stage)));
}
function Preview() {
  const [open, setOpen] = useState(true);
  if (!valid) return <main><h1>Unknown review stage</h1><p>No progress was changed.</p></main>;
  if (!open) return <main><h1>Sound Seekers is safely closed</h1><button onClick={() => setOpen(true)}>Return to your saved place</button></main>;
  return <SoundSeekersRoute progressScopeKey={scope} isSoundEnabled={params.get('sound') === '1'} ephemeral accessibilitySettings={{reducedMotion:params.get('motion') !== '1',simplifiedScene:params.get('simple') === '1'}} onExit={() => setOpen(false)} />;
}
createRoot(document.getElementById('root')).render(<Preview />);
